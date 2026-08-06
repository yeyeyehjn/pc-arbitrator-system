<template>
  <div class="guide-steps">
    <div v-for="(step, idx) in payload.steps" :key="idx" class="guide-step">
      <span class="step-num">{{ idx + 1 }}</span>
      <span class="step-text" v-html="renderStep(step)"></span>
    </div>
    <div v-if="payload.tip" class="guide-tip">
      <el-icon><WarningFilled /></el-icon>
      <span>{{ payload.tip }}</span>
    </div>
  </div>
</template>

<script setup>
import { WarningFilled } from '@element-plus/icons-vue'

defineProps({
  payload: { type: Object, required: true },
})

// 先转义 HTML 再替换 **加粗** 标记，避免注入脚本
const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]))

const renderStep = (step) => {
  return escapeHtml(step).replace(/\*\*(.+?)\*\*/g, '<strong class="step-highlight">$1</strong>')
}
</script>

<style scoped lang="scss">
.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.guide-step {
  display: flex;
  align-items: flex-start;
  gap: 8px;

  .step-num {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: #6b4fbb;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1px;
  }

  .step-text {
    font-size: 14px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);

    :deep(.step-highlight) {
      color: #6b4fbb;
      font-weight: 600;
    }
  }
}

.guide-tip {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 12px;
  background-color: #fdf6ec;
  border-radius: 4px;
  font-size: 12px;
  color: #e6a23c;
  line-height: 1.5;

  .el-icon {
    flex-shrink: 0;
    margin-top: 1px;
  }
}
</style>
