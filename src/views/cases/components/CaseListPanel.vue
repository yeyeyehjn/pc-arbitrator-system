<template>
  <div class="case-list-panel">
    <!-- ① 统计看板 -->
    <StatsBoard
      :stats="store.stats"
      :current-status="store.currentStatus"
      :active-sub-stats="store.activeSubStats"
      :closed-sub-stats="store.closedSubStats"
      @switch-status="handleSwitchStatus"
    />

    <!-- ② 常规筛选区 -->
    <CaseFilter
      :filters="store.filters"
      :current-status="store.currentStatus"
      :quick-filters="store.quickFilters"
      @search="handleSearch"
      @reset="handleReset"
      @toggle-quick-filter="store.toggleQuickFilter"
    />

    <!-- ④ 表格区 + ⑤ 分页 -->
    <CaseTable
      :data="store.pagedCases"
      :loading="loading"
      :current-status="store.currentStatus"
      :total="store.filteredCases.length"
      :has-active-filters="store.hasActiveFilters"
      :current-page="store.currentPage"
      :page-size="store.pageSize"
      @update:current-page="store.currentPage = $event"
      @update:page-size="store.pageSize = $event"
      @reset-filters="handleReset"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCaseStore } from '@/stores/case'
import StatsBoard from './StatsBoard.vue'
import CaseFilter from './CaseFilter.vue'
import CaseTable from './CaseTable.vue'

const route = useRoute()
const store = useCaseStore()
const loading = ref(false)

const handleSwitchStatus = (status) => {
  store.switchStatus(status)
}

const handleSearch = () => {
  store.applyFilters()
}

const handleReset = () => {
  store.resetFilters()
}

// 应用 URL query 参数到筛选条件（来自统计看板跳转）
const applyQueryFilters = () => {
  const { role, status, closedType, cause, startDate, endDate } = route.query
  if (!role && !status && !closedType && !cause && !startDate && !endDate) return

  // 重置筛选条件（避免叠加）
  store.resetFilters()

  // 角色筛选（独任/首席/边裁）—— store 字段为 caseType，值为 solo/chief/side
  if (role && ['sole', 'chief', 'side'].includes(role)) {
    // 注意：Mock 数据中独任是 'solo'，但 URL 参数用 'sole'，这里做映射
    const roleMap = { sole: 'solo', chief: 'chief', side: 'side' }
    store.filters.caseType = roleMap[role] || role
  }

  // 状态筛选（在办/已延期）
  if (status === 'ongoing') {
    store.currentStatus = 'active'
  } else if (status === 'overdue') {
    store.currentStatus = 'active'
    store.quickFilters.expired = true
  }

  // 结案类型筛选 —— store 字段为 closedType，值为 ruling/mediation/withdraw
  if (closedType && ['all', 'arbitration', 'mediation', 'withdrawal'].includes(closedType)) {
    store.currentStatus = 'closed'
    const typeMap = { arbitration: 'ruling', mediation: 'mediation', withdrawal: 'withdraw' }
    if (closedType !== 'all' && typeMap[closedType]) {
      store.filters.closedType = typeMap[closedType]
    }
  }

  // 案由筛选
  if (cause) {
    store.filters.caseReason = decodeURIComponent(cause)
  }

  store.applyFilters()
}

onMounted(() => {
  store.fetchStats()
  applyQueryFilters()
})

// 监听 query 变化（同页跳转）
watch(() => route.query, applyQueryFilters, { deep: true })
</script>

<style scoped lang="scss">
.case-list-panel {
  padding-bottom: 20px;
}
</style>
