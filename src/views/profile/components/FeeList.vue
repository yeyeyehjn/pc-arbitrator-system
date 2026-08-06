<template>
  <div class="fee-list">
    <!-- 筛选区 -->
    <div class="filter-bar">
      <div class="filter-items">
        <div class="filter-item">
          <span class="filter-label">年份</span>
          <el-select v-model="filters.year" placeholder="全部" clearable>
            <el-option v-for="y in profileStore.getFeeYears" :key="y" :label="y + '年'" :value="y" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">案号</span>
          <el-input v-model="filters.caseNo" placeholder="请输入案号" clearable />
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
        <span>酬金单列表</span>
        <span class="title-count">共 {{ profileStore.getFilteredFees.length }} 条</span>
      </div>
      <el-table :data="profileStore.getPagedFees" style="width: 100%" v-loading="loading">
        <el-table-column label="案号" min-width="180">
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useProfileStore } from '@/stores/profile'
import ProfileEmptyState from './shared/ProfileEmptyState.vue'

const router = useRouter()
const profileStore = useProfileStore()

const loading = ref(false)
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
}
</style>
