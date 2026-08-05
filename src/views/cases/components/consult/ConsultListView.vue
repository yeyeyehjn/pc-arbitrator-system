<template>
  <div class="consult-list-view">
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-items">
        <div class="filter-item">
          <span class="filter-label">咨询标题</span>
          <el-input v-model="filters.title" placeholder="请输入" clearable />
        </div>
        <div class="filter-item">
          <span class="filter-label">咨询秘书</span>
          <el-input v-model="filters.secretary" placeholder="请输入" clearable />
        </div>
        <div class="filter-item">
          <span class="filter-label">咨询专业</span>
          <el-select v-model="filters.specialty" placeholder="全部" clearable>
            <el-option v-for="s in SPECIALTIES" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </div>
      </div>
      <div class="filter-actions">
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </div>

    <!-- 表格区 -->
    <div class="table-section">
      <div class="table-title">
        <span>咨询案件列表&nbsp;&nbsp;<span class="title-count">共 {{ consultStore.applicantList.length }} 条</span></span>
      </div>
      <el-table :data="pagedData" style="width: 100%" v-loading="consultStore.loading">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="title" label="咨询标题" min-width="240" show-overflow-tooltip />
        <el-table-column prop="secretary" label="咨询秘书" width="100" />
        <el-table-column label="咨询专业" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ getSpecialtyLabel(row.specialty) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="goDetail(row)">查看专家意见</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <CaseEmptyState text="暂无专家咨询记录" />
        </template>
      </el-table>

      <!-- 分页 -->
      <div v-if="consultStore.applicantList.length > 0" class="pagination-bar">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20]"
          :total="consultStore.applicantList.length"
          layout="total, prev, pager, next, sizes"
          background
          small
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConsultStore, SPECIALTIES, getSpecialtyLabel } from '@/stores/consult'
import CaseEmptyState from '../shared/CaseEmptyState.vue'

const router = useRouter()
const consultStore = useConsultStore()

const filters = ref({ title: '', secretary: '', specialty: '' })
const currentPage = ref(1)
const pageSize = ref(10)

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return consultStore.applicantList.slice(start, start + pageSize.value)
})

const handleSearch = () => {
  currentPage.value = 1
  consultStore.fetchApplicantList(filters.value)
}
const handleReset = () => {
  filters.value = { title: '', secretary: '', specialty: '' }
  currentPage.value = 1
  consultStore.fetchApplicantList()
}

const goDetail = (row) => {
  router.push(`/cases/consult/${row.id}`)
}

onMounted(() => {
  consultStore.fetchApplicantList()
})
</script>
