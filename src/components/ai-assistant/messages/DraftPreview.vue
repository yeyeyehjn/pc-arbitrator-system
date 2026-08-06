<template>
  <div class="draft-preview">
    <div class="draft-header">
      <span class="draft-title">{{ payload.title }}</span>
      <span class="draft-meta">{{ payload.meta }}</span>
    </div>
    <div class="draft-content" v-html="payload.html"></div>
    <div class="draft-actions">
      <el-button text size="small" @click="copyContent">复制全文</el-button>
      <el-button type="primary" size="small" @click="handleFill">填入裁决书编辑器</el-button>
    </div>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'

const props = defineProps({
  payload: { type: Object, required: true },
})
const emit = defineEmits(['fill-editor'])

const copyContent = async () => {
  try {
    const temp = document.createElement('div')
    temp.innerHTML = props.payload.html
    await navigator.clipboard.writeText(temp.textContent || temp.innerText || '')
    ElMessage.success('已复制到剪贴板')
  } catch (e) {
    ElMessage.warning('复制失败，请手动选择文本复制')
  }
}

const handleFill = () => {
  emit('fill-editor', props.payload)
}
</script>

<style scoped lang="scss">
.draft-preview {
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  overflow: hidden;

  .draft-header {
    background: linear-gradient(135deg, #6b4fbb, #9254de);
    color: #fff;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .draft-title {
      font-size: 14px;
      font-weight: 600;
    }
    .draft-meta {
      font-size: 12px;
      opacity: 0.85;
    }
  }

  .draft-content {
    padding: 12px;
    max-height: 240px;
    overflow-y: auto;
    font-size: 14px;
    line-height: 1.8;
    color: var(--el-text-color-regular);

    :deep(h4) {
      font-size: 14px;
      margin: 0 0 8px;
    }
    :deep(p) {
      margin: 0 0 6px;
    }
    :deep(hr) {
      border: none;
      border-top: 1px solid var(--el-border-color-light);
      margin: 8px 0;
    }
  }

  .draft-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 8px 12px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
</style>
