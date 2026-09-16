<template>
  <div class="review-list">
    <!-- 工具栏 -->
    <div class="filter-bar">
      <div class="filter-items">
        <div class="filter-item">
          <span class="filter-label">案件年份</span>
          <el-select v-model="filters.caseYear" placeholder="全部" clearable>
            <el-option v-for="y in yearOptions" :key="y" :label="y" :value="y" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">案件编号</span>
          <el-input v-model="filters.caseNo" placeholder="请输入案件编号" clearable />
        </div>
        <div class="filter-item">
          <span class="filter-label">当事人</span>
          <el-input v-model="filters.party" placeholder="申请人/被申请人" clearable />
        </div>
        <div class="filter-item">
          <span class="filter-label">经办秘书</span>
          <el-select v-model="filters.secretary" placeholder="全部" clearable>
            <el-option v-for="s in secretaryOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">结案类型</span>
          <el-select v-model="filters.closingType" placeholder="全部" clearable>
            <el-option label="裁决" value="裁决" />
            <el-option label="调解" value="调解" />
            <el-option label="撤回" value="撤回" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">核阅状态</span>
          <el-select v-model="filters.reviewStatus">
            <el-option label="待核阅" value="待核阅" />
            <el-option label="已核阅" value="已核阅" />
          </el-select>
        </div>
      </div>
      <div class="filter-actions">
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </div>

    <!-- 表格区域 -->
    <div class="table-section">
      <div class="table-title"><span>案件列表&nbsp;&nbsp;<span class="title-count">共 {{ filteredData.length }} 条</span></span></div>
      <el-table
        :data="pagedData"
        style="width: 100%"
      >
        <el-table-column prop="caseNo" label="案件编号" min-width="160">
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="goToCaseDetail(row)">{{ row.caseNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="caseReason" label="案由" min-width="140" show-overflow-tooltip />
        <el-table-column prop="applicant" label="申请人" min-width="140" show-overflow-tooltip />
        <el-table-column prop="respondent" label="被申请人" min-width="140" show-overflow-tooltip />
        <el-table-column prop="secretary" label="经办秘书" min-width="90" />
        <el-table-column prop="closingType" label="结案类型" min-width="80" />
        <el-table-column prop="submitTime" label="提交时间" min-width="130" />
        <el-table-column prop="reviewStatus" label="核阅状态" min-width="90">
          <template #default="{ row }">
            <el-tag :type="row.reviewStatus === '待核阅' ? 'warning' : 'success'" size="small">
              {{ row.reviewStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="goToCaseDetail(row)">
              {{ row.reviewStatus === '待核阅' ? '核阅' : '查看' }}
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <TodoEmptyState text="暂无裁决书核阅事项" />
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
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useTodoStore } from '@/stores/todo'
import TodoEmptyState from './shared/TodoEmptyState.vue'

const todoStore = useTodoStore()
const { reviewList } = storeToRefs(todoStore)
const router = useRouter()

const defaultFilters = () => ({
  caseYear: '',
  caseNo: '',
  party: '',
  secretary: '',
  closingType: '',
  reviewStatus: '待核阅',
})
const filters = ref(defaultFilters())
const currentPage = ref(1)
const pageSize = ref(5)

// 年份选项：从数据中提取（倒序，最新在前）
const yearOptions = computed(() => [...new Set(reviewList.value.map((item) => item.caseYear))].sort().reverse())

// 经办秘书选项：从数据中提取
const secretaryOptions = computed(() => [...new Set(reviewList.value.map((item) => item.secretary))])

const filteredData = computed(() => {
  const { caseYear, caseNo, party, secretary, closingType, reviewStatus } = filters.value
  const noKw = caseNo.trim()
  const partyKw = party.trim()
  return reviewList.value.filter((item) =>
    (!caseYear || item.caseYear === caseYear) &&
    (!noKw || item.caseNo.includes(noKw)) &&
    (!partyKw || item.applicant.includes(partyKw) || item.respondent.includes(partyKw)) &&
    (!secretary || item.secretary === secretary) &&
    (!closingType || item.closingType === closingType) &&
    item.reviewStatus === reviewStatus
  )
})

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const handleSearch = () => { currentPage.value = 1 }
const handleReset = () => {
  filters.value = defaultFilters()
  currentPage.value = 1
}

// 核阅/查看均进入案件详情页-仲裁文书 Tab
const goToCaseDetail = (row) => {
  router.push({ path: `/cases/${row.caseId}`, query: { tab: 'docs' } })
}
</script>
