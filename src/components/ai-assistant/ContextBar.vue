<template>
  <div v-if="aiStore.contextSummary" class="context-bar">
    <el-tag size="small" type="primary" effect="dark">当前案件</el-tag>
    <span class="context-info">
      {{ aiStore.contextSummary.caseNo }} · {{ aiStore.contextSummary.reason }}
    </span>
    <el-icon
      class="context-close"
      role="button"
      tabindex="0"
      aria-label="解除案件上下文"
      @click="aiStore.clearContext()"
      @keydown.enter="aiStore.clearContext()"
    >
      <Close />
    </el-icon>
  </div>
</template>

<script setup>
import { Close } from '@element-plus/icons-vue'
import { useAiAssistantStore } from '@/stores/aiAssistant'

const aiStore = useAiAssistantStore()
</script>

<style scoped lang="scss">
.context-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #d5e3f2;
  border-bottom: 1px solid #c6daf0;
  flex-shrink: 0;

  .context-info {
    flex: 1;
    font-size: 13px;
    color: #053d99;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .context-close {
    flex-shrink: 0;
    cursor: pointer;
    color: #053d99;
    opacity: 0.6;
    transition: opacity 0.2s ease;

    &:hover,
    &:focus-visible {
      opacity: 1;
      outline: none;
    }
  }
}
</style>
