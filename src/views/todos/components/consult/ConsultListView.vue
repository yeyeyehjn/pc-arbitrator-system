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
        <div class="filter-item">
          <span class="filter-label">处理状态</span>
          <el-select v-model="filters.status" placeholder="全部" clearable>
            <el-option label="待处理" value="pending" />
            <el-option label="已处理" value="processed" />
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
        <span>咨询案件列表&nbsp;&nbsp;<span class="title-count">共 {{ consultStore.expertList.length }} 条</span></span>
      </div>
      <el-table :data="pagedData" style="width: 100%" v-loading="consultStore.loading">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="title" label="咨询标题" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="goDetail(row)">{{ row.title }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="secretary" label="咨询秘书" width="100" />
        <el-table-column label="咨询专业" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ getSpecialtyLabel(row.specialty) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getStatusConfig(row.status).tagType" size="small">{{ getStatusConfig(row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button type="primary" link @click="goDetail(row)">回避/接受咨询</el-button>
              <el-button type="danger" link @click="confirmExit(row)">退出咨询</el-button>
            </template>
            <template v-else-if="row.status === 'unreplied'">
              <el-button type="primary" link @click="goDetail(row)">提交意见</el-button>
              <el-button type="danger" link @click="confirmExit(row)">退出咨询</el-button>
            </template>
            <template v-else>
              <el-button link class="view-btn" @click="goDetail(row)">查看</el-button>
            </template>
          </template>
        </el-table-column>
        <template #empty>
          <TodoEmptyState text="暂无专家咨询案件" />
        </template>
      </el-table>

      <!-- 分页 -->
      <div v-if="consultStore.expertList.length > 0" class="pagination-bar">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20]"
          :total="consultStore.expertList.length"
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
import { ElMessageBox, ElMessage } from 'element-plus'
import { useConsultStore, SPECIALTIES, getSpecialtyLabel, getStatusConfig } from '@/stores/consult'
import TodoEmptyState from '../shared/TodoEmptyState.vue'

const router = useRouter()
const consultStore = useConsultStore()

const filters = ref({ title: '', secretary: '', specialty: '', status: '' })
const currentPage = ref(1)
const pageSize = ref(10)

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return consultStore.expertList.slice(start, start + pageSize.value)
})

const handleSearch = () => {
  currentPage.value = 1
  consultStore.fetchExpertList(filters.value)
}
const handleReset = () => {
  filters.value = { title: '', secretary: '', specialty: '', status: '' }
  currentPage.value = 1
  consultStore.fetchExpertList()
}

const goDetail = (row) => {
  router.push(`/todos/consult/${row.id}`)
}

const confirmExit = async (row) => {
  await ElMessageBox.confirm('确定退出本次咨询？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
  consultStore.exitConsult(row.id)
  ElMessage.success('已退出咨询')
}

onMounted(() => {
  consultStore.fetchExpertList()
})
</script>

<style scoped lang="scss">
.consult-list-view {
  .view-btn {
    color: var(--el-text-color-secondary);
  }
}
</style>
