<template>
  <div class="fee-list">
    <!-- 筛选区 -->
    <div class="filter-bar">
      <div class="filter-items">
        <div class="filter-item">
          <span class="filter-label">案件年份</span>
          <el-select v-model="filters.year" placeholder="全部" clearable>
            <el-option v-for="y in profileStore.getFeeYears" :key="y" :label="y + '年'" :value="y" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">案件编号</span>
          <el-input v-model="filters.caseNo" placeholder="请输入案件编号" clearable />
        </div>
        <div class="filter-item">
          <span class="filter-label">发放状态</span>
          <el-select v-model="filters.status" placeholder="全部" clearable>
            <el-option label="已发" value="已发" />
            <el-option label="未发" value="未发" />
          </el-select>
        </div>
        
      </div>
      <div class="filter-actions">
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </div>

    <!-- 表格区 -->
    <div class="table-section">
      <div class="table-title">
        <div class="title-left">
          <span>酬金单列表</span>
          <span class="title-count">共 {{ profileStore.getFilteredFees.length }} 条</span>
        </div>
        <el-link
          class="rule-entry"
          type="primary"
          :underline="false"
          aria-label="查看仲裁员报酬管理规则"
          @click="ruleDialogVisible = true"
        >
          <el-icon class="rule-entry-icon"><InfoFilled /></el-icon>
          <span>报酬管理规则</span>
        </el-link>
      </div>
      <el-table :data="profileStore.getPagedFees" style="width: 100%" v-loading="loading">
        <el-table-column label="案件编号" min-width="180">
          <template #default="{ row }">
            <el-link type="primary" class="case-no-link" @click="handleJumpCase(row)" aria-label="跳转案件详情">{{ row.caseNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="caseName" label="案件名称" min-width="200" show-overflow-tooltip />
        <el-table-column label="酬金金额（元）" min-width="140" align="right">
          <template #default="{ row }">
            <span class="amount-text">{{ formatAmount(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="结算状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '已结' ? 'success' : 'warning'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发放日期" width="140" >
          <template #default="{ row }">
            {{ row.payDate || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="secretary" label="办案秘书" width="120" />
        
        <template #empty>
          <ProfileEmptyState text="暂无酬金记录" />
        </template>
      </el-table>
      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20]"
          :total="profileStore.getFilteredFees.length"
          layout="total, prev, pager, next, sizes"
          background
          size="small"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <!-- 报酬管理规则弹窗 -->
    <el-dialog
      v-model="ruleDialogVisible"
      title="仲裁员报酬管理规则"
      width="600px"
      append-to-body
    >
      <div class="rule-content">
        <p class="rule-intro">依据《广州仲裁委员会仲裁员报酬管理规则》，综合仲裁员的履职情况、办案效率、办案质量等因数，仲裁员报酬按照以下规则计算：</p>
        <ol class="rule-list">
          <li>在规定二分之一审限内提前结案的，基础值上浮10%；</li>
          <li>开庭后调解结案的，基础值上浮10%；</li>
          <li>独任仲裁员无正当理由不制作裁决书的(金融案除外)，基础值下降20%；</li>
          <li>仲裁员因自身原因未能在审限内结案的，延期1个月的，基础值下降2%，延期2个月的，基础值下降4%，延期3个月的，基础值下降6%。以此类推，下降幅度以20%为限。延期时间累计超过6个月及以上的，仲裁员报酬在基础值下降以外，应当同时停止该仲裁员案件的指派。</li>
          <li>仲裁员距离开庭日、合议日不足3个工作日无故修改开庭、合议的的时间，或无故缺席的，基础值下降5%；无正当理由超3个工作日不发表合议意见的，基础值下降5%。无故超2个工作日不签发裁决书的，基础值下降5%。</li>
          <li>开庭时出现未着正装、迟到、打电话、中途离场等违反仲裁员职业操守行为或违反仲裁员视频庭审行为规范的行为，基础值下降20%。</li>
        </ol>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import { useProfileStore } from '@/stores/profile'
import ProfileEmptyState from './shared/ProfileEmptyState.vue'

const router = useRouter()
const profileStore = useProfileStore()

const loading = ref(false)
// 报酬管理规则弹窗可见性
const ruleDialogVisible = ref(false)
const filters = reactive({
  caseNo: '',
  status: '',
  year: '',
})

const currentPage = ref(profileStore.fee.currentPage)
const pageSize = ref(profileStore.fee.pageSize)

onMounted(async () => {
  loading.value = true
  await profileStore.fetchFeeList()
  // 同步本地筛选条件到 store
  Object.assign(profileStore.fee.filters, filters)
  loading.value = false
})

const handleQuery = () => {
  profileStore.applyFeeFilters({ ...filters })
  currentPage.value = 1
}

const handleReset = () => {
  filters.caseNo = ''
  filters.status = ''
  filters.year = ''
  profileStore.resetFeeFilters()
  currentPage.value = 1
}

const handlePageChange = (page) => {
  profileStore.setFeePage(page)
}

const handleSizeChange = (size) => {
  profileStore.setFeePageSize(size)
  pageSize.value = size
}

const handleJumpCase = (row) => {
  router.push('/cases/' + row.caseId)
}

const handleViewDetail = () => {
  ElMessage.info('明细查看功能开发中')
}

const formatAmount = (amount) => {
  if (amount === null || amount === undefined) return '-'
  return Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
</script>

<style scoped lang="scss">
.fee-list {
  .amount-text {
    font-variant-numeric: tabular-nums;
  }

  :deep(.case-no-link) {
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }

  // 表格标题区：左侧标题组 + 右侧操作入口（右对齐由全局 .table-title 统一处理）
  .table-title {
    .title-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .rule-entry {
      font-size: 12px;
      font-weight: 400;
      display: inline-flex;
      align-items: center;
      gap: 4px;

      .rule-entry-icon {
        font-size: 14px;
      }
    }
  }

  // 报酬管理规则弹窗内容
  .rule-content {
    font-size: 14px;
    color: var(--el-text-color-regular);
    line-height: 1.8;

    .rule-intro {
      margin: 0 0 12px;
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }

    .rule-list {
      margin: 0;
      padding-left: 20px;

      li {
        margin-bottom: 8px;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}
</style>
