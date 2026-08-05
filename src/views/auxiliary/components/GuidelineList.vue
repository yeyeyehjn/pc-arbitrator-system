<template>
  <div class="list-section">
    <el-table :data="pagedList" style="width: 100%">
      <el-table-column prop="title" label="标题" min-width="260" show-overflow-tooltip />
      <el-table-column prop="remark" label="备注" min-width="240" show-overflow-tooltip>
        <template #default="{ row }">
          <span>{{ row.remark || '—' }}</span>
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

    <div v-if="store.guidelines.length > 0" class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="store.guidelines.length"
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
import { useAuxiliaryStore } from '@/stores/auxiliary'
import CaseEmptyState from '@/views/cases/components/shared/CaseEmptyState.vue'

const store = useAuxiliaryStore()
const currentPage = ref(1)
const pageSize = ref(10)

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return store.guidelines.slice(start, start + pageSize.value)
})

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
.list-section {
  :deep(.dl-link) {
    margin-left: 12px;
  }
}
</style>
