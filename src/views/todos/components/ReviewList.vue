<template>
  <div class="review-list">
    <!-- 工具栏 -->
    <div class="filter-bar">
      <div class="filter-items">
        <div class="filter-item">
          <span class="filter-label">关键字</span>
          <el-input v-model="filters.keyword" placeholder="案号/当事人" clearable :prefix-icon="Search" />
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
        <el-table-column prop="caseNo" label="案号" min-width="160">
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="goToCaseDetail(row)">{{ row.caseNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="caseReason" label="案由" min-width="140" show-overflow-tooltip />
        <el-table-column prop="applicant" label="申请人" min-width="140" show-overflow-tooltip />
        <el-table-column prop="respondent" label="被申请人" min-width="140" show-overflow-tooltip />
        <el-table-column prop="submitter" label="提交人" min-width="100" />
        <el-table-column prop="submitTime" label="提交时间" min-width="140" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openReviewDialog(row)">核阅</el-button>
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

    <!-- 核阅弹窗 -->
    <el-dialog
      v-model="reviewDialogVisible"
      title="裁决书核阅"
      width="80%"
      top="5vh"
      :close-on-click-modal="false"
    >
      <div class="review-content">
        <div class="doc-meta">
          <p><span class="label">案号：</span>{{ currentRow?.caseNo }}</p>
          <p><span class="label">案由：</span>{{ currentRow?.caseReason }}</p>
          <p><span class="label">申请人：</span>{{ currentRow?.applicant }}</p>
          <p><span class="label">被申请人：</span>{{ currentRow?.respondent }}</p>
          <p><span class="label">提交人：</span>{{ currentRow?.submitter }}</p>
        </div>
        <el-divider />
        <div class="doc-body">{{ currentRow?.awardContent }}</div>
      </div>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="warning" @click="handleReview('reject')">退回修改</el-button>
        <el-button type="primary" @click="handleReview('pass')">通过核阅</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useTodoStore } from '@/stores/todo'
import TodoEmptyState from './shared/TodoEmptyState.vue'

const todoStore = useTodoStore()
const { reviewList } = storeToRefs(todoStore)
const router = useRouter()

const filters = ref({ keyword: '' })
const currentPage = ref(1)
const pageSize = ref(5)

const reviewDialogVisible = ref(false)
const currentRow = ref(null)

const filteredData = computed(() => {
  const kw = filters.value.keyword.trim()
  if (!kw) return reviewList.value
  return reviewList.value.filter((item) =>
    item.caseNo.includes(kw) ||
    item.applicant.includes(kw) ||
    item.respondent.includes(kw)
  )
})

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const handleSearch = () => { currentPage.value = 1 }
const handleReset = () => { filters.value.keyword = ''; currentPage.value = 1 }

const openReviewDialog = (row) => {
  currentRow.value = row
  reviewDialogVisible.value = true
}

const handleReview = (action) => {
  todoStore.reviewAward(currentRow.value.id, action)
  ElMessage.success(action === 'pass' ? '已通过核阅' : '已退回修改')
  reviewDialogVisible.value = false
}

const goToCaseDetail = () => router.push('/cases')
</script>

<style scoped lang="scss">
.review-content {
  max-height: 65vh;
  overflow-y: auto;

  .doc-meta {
    p {
      margin: 8px 0;
      font-size: 14px;
      color: var(--el-text-color-regular);
      .label {
        color: var(--el-text-color-secondary);
        margin-right: 8px;
      }
    }
  }

  .doc-body {
    padding: 16px 24px;
    background-color: #f5f7fa;
    border-radius: 4px;
    font-size: 14px;
    line-height: 2;
    color: var(--el-text-color-primary);
    white-space: pre-wrap;
  }
}
</style>
