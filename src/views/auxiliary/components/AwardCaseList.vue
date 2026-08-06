<template>
  <div class="award-list">
    <div class="filter-bar category-bar">
      <div class="filter-items">
        <el-check-tag
          v-for="cat in AWARD_CATEGORYS"
          :key="cat.value"
          :checked="currentCategory === cat.value"
          @change="selectCategory(cat.value)"
        >
          {{ cat.label }}
        </el-check-tag>
      </div>
    </div>

    <el-table :data="pagedList" style="width: 100%">
      <el-table-column prop="title" label="标题" min-width="280" show-overflow-tooltip />
      <el-table-column prop="caseReason" label="案由" min-width="160" show-overflow-tooltip />
      <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <span>{{ row.remark || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="分类" width="120">
        <template #default="{ row }">
          {{ categoryLabel(row.category) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" align="right">
        <template #default="{ row }">
          <template v-if="row.fileUrl">
            <el-link type="primary" :underline="false" @click="preview(row)">预览</el-link>
            <el-link type="primary" :underline="false" class="dl-link" @click="download(row)">下载</el-link>
          </template>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <template #empty>
        <CaseEmptyState text="暂无数据" />
      </template>
    </el-table>

    <div v-if="filteredList.length > 0" class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="filteredList.length"
        :page-sizes="[10, 20, 50]"
        layout="total, prev, pager, next, sizes"
        background
        small
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuxiliaryStore, AWARD_CATEGORYS } from '@/stores/auxiliary'
import CaseEmptyState from '@/views/cases/components/shared/CaseEmptyState.vue'

const store = useAuxiliaryStore()
const currentCategory = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)

const filteredList = computed(() => {
  if (currentCategory.value === 'all') return store.awardCases
  return store.awardCases.filter((item) => item.category === currentCategory.value)
})

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})

const selectCategory = (value) => {
  currentCategory.value = value
  currentPage.value = 1
}

const categoryLabel = (value) => {
  const hit = AWARD_CATEGORYS.find((c) => c.value === value)
  return hit ? hit.label : '—'
}

const preview = (row) => {
  if (!row.fileUrl) return
  window.open(row.fileUrl, '_blank')
}

const download = (row) => {
  if (!row.fileUrl) return
  const a = document.createElement('a')
  a.href = row.fileUrl
  a.download = row.fileName || ''
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
</script>

<style scoped lang="scss">
.award-list {
  .category-bar {
    margin-bottom: 16px;
    padding: 0;

    .filter-items {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    :deep(.el-check-tag) {
      height: 28px;
      line-height: 26px;
      padding: 0 14px;
      font-size: 12px;
      border-radius: 4px;
      border: 1px solid #dcdfe6;
      background-color: #ffffff;
      color: var(--el-text-color-regular);
      cursor: pointer;
      transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;

      &:hover {
        border-color: var(--el-color-primary-light-5);
        color: var(--el-color-primary-light-3);
      }
      &.is-checked {
        background-color: var(--el-color-primary);
        border-color: var(--el-color-primary);
        color: #ffffff;
      }
    }
  }

  :deep(.dl-link) {
    margin-left: 12px;
  }
}
</style>
