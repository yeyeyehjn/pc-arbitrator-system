<template>
  <div class="extension-table">
    <!-- 筛选区 -->
    <div class="filter-bar">
      <div class="filter-items" :class="{ collapsed: isCollapsed }">
        <div class="filter-item">
          <span class="filter-label">案件编号</span>
          <el-input v-model="filters.caseNo" placeholder="案件编号" clearable :prefix-icon="Search" />
        </div>
        <div class="filter-item">
          <span class="filter-label">当事人</span>
          <el-input v-model="filters.party" placeholder="当事人" clearable />
        </div>
        <div class="filter-item">
          <span class="filter-label">经办秘书</span>
          <el-select v-model="filters.secretary" placeholder="经办秘书" clearable>
            <el-option v-for="s in secretaryOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </div>
        <div class="flex-grow"></div>
      </div>
      <div class="filter-actions">
        
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button link @click="isCollapsed = !isCollapsed">
          {{ isCollapsed ? '展开' : '收起' }}
          <el-icon class="toggle-icon"><ArrowDown v-if="isCollapsed" /><ArrowUp v-else /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 表格区域 -->
    <div class="table-section">
      <div class="table-title">
        <span>案件列表&nbsp;&nbsp;<span class="title-count">共 {{ filteredData.length }} 条</span></span>
        <el-button type="primary" plain :disabled="filteredData.length === 0" @click="handleBatchApprove">
          <el-icon><Check /></el-icon>
          一键同意
        </el-button>
      </div>
      <el-table
        :data="pagedData"
        style="width: 100%"
      >
        <el-table-column prop="caseNo" label="案号" min-width="160" fixed="left">
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="goToCaseDetail(row)">{{ row.caseNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="caseReason" label="案由" min-width="140" show-overflow-tooltip />
        <el-table-column prop="applicant" label="申请人" min-width="130" show-overflow-tooltip />
        <el-table-column prop="respondent" label="被申请人" min-width="130" show-overflow-tooltip />
        <el-table-column prop="amount" label="标的(元)" min-width="120" align="right">
          <template #default="{ row }">{{ formatAmount(row.amount) }}</template>
        </el-table-column>
        <el-table-column prop="secretary" label="经办秘书" min-width="100" />
        <el-table-column prop="tribunal" label="仲裁庭" min-width="180" show-overflow-tooltip />
        <el-table-column prop="groupDate" label="组庭日期" min-width="110" />
        <el-table-column label="案件期限" min-width="200">
          <template #default="{ row }">
            <div class="deadline-cell">
              <div>{{ row.deadline }}</div>
              <div class="deadline-meta">
                <span :class="['remain-days', getRemainClass(row)]">剩 {{ row.remainDays }} 天</span>
                <el-tag v-if="row.isSuspended" size="small" type="warning">已中止</el-tag>
                <el-tag v-if="row.extensionCount > 0" size="small" type="info">延期{{ row.extensionCount }}次</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="caseStatus" label="案件状态" min-width="100">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.caseStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submitTime" label="提交时间" min-width="140" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="$emit('approve', row)">审批</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <TodoEmptyState text="暂无延期办理事项" />
        </template>
      </el-table>

      <!-- 分页 -->
      <div v-if="filteredData.length > 0" class="pagination-bar">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20]"
          :total="filteredData.length"
          layout="total, prev, pager, next, sizes"
          background
          small
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Check, ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import TodoEmptyState from './TodoEmptyState.vue'

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['approve', 'batch-approve'])

const router = useRouter()
const filters = ref({ caseNo: '', party: '', secretary: '' })
const isCollapsed = ref(true)
const currentPage = ref(1)
const pageSize = ref(5)

const secretaryOptions = computed(() => Array.from(new Set(props.data.map((i) => i.secretary))))

const filteredData = computed(() => {
  return props.data.filter((item) => {
    if (filters.value.caseNo && !item.caseNo.includes(filters.value.caseNo)) return false
    if (filters.value.party && !item.applicant.includes(filters.value.party) && !item.respondent.includes(filters.value.party)) return false
    if (filters.value.secretary && item.secretary !== filters.value.secretary) return false
    return true
  })
})

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const handleSearch = () => { currentPage.value = 1 }
const handleReset = () => { filters.value = { caseNo: '', party: '', secretary: '' }; currentPage.value = 1 }

const handleBatchApprove = () => {
  emit('batch-approve', filteredData.value)
}

const formatAmount = (val) => (val || val === 0 ? val.toLocaleString('zh-CN') : '-')

const getRemainClass = (row) => {
  if (row.remainDays === '-' || typeof row.remainDays !== 'number') return ''
  if (row.remainDays <= 7) return 'danger'
  if (row.remainDays <= 30) return 'warning'
  return ''
}

const goToCaseDetail = () => router.push('/cases')
</script>

<style scoped lang="scss">
.extension-table {
  .deadline-cell {
    .deadline-meta {
      margin-top: 4px;
      display: flex;
      gap: 6px;
      align-items: center;
      flex-wrap: wrap;

      .remain-days {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        &.warning { color: var(--el-color-warning); font-weight: 600; }
        &.danger { color: var(--el-color-danger); font-weight: 600; }
      }
    }
  }
}
</style>
