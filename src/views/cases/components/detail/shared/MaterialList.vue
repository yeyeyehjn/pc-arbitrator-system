<template>
  <div class="material-list">
    <div v-if="materials.length === 0" class="empty-tip">暂无材料</div>
    <el-table v-else :data="materials" style="width: 100%">
      <el-table-column prop="name" label="名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="type" label="类型" min-width="100" />
      <el-table-column prop="submitDate" label="提交日期" min-width="120" />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handlePreview(row)">预览</el-button>
          <el-button type="primary" link size="small" @click="handleDownload(row)">下载</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 预览弹窗 -->
    <el-dialog v-model="previewVisible" :title="currentRow?.name || '材料预览'" width="60%" top="8vh">
      <div class="preview-content">
        <div v-if="currentRow?.fileType === 'image'" class="image-preview">
          <div class="preview-placeholder">[图片预览区] {{ currentRow?.name }}</div>
        </div>
        <div v-else-if="currentRow?.fileType === 'pdf'" class="pdf-preview">
          <div class="preview-placeholder">[PDF 预览区] {{ currentRow?.name }}</div>
        </div>
        <div v-else class="preview-placeholder">该文件类型暂不支持在线预览</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

defineProps({
  materials: {
    type: Array,
    default: () => [],
  },
})

const previewVisible = ref(false)
const currentRow = ref(null)

const handlePreview = (row) => {
  currentRow.value = row
  previewVisible.value = true
}

const handleDownload = (row) => {
  ElMessage.success(`《${row.name}》下载已开始`)
}
</script>

<style scoped lang="scss">
.material-list {
  .empty-tip {
    text-align: center;
    font-size: 14px;
    color: var(--el-text-color-secondary);
    padding: 24px 0;
  }

  .preview-content {
    min-height: 300px;

    .preview-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      background-color: #f5f7fa;
      border-radius: 4px;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
