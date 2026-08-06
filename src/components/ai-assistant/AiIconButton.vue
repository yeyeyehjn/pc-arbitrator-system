<template>
  <el-tooltip content="AI 办案助手" placement="bottom" :show-after="300">
    <el-icon
      class="ai-icon-btn"
      :class="{ active: aiStore.visible }"
      :size="20"
      role="button"
      tabindex="0"
      aria-label="AI 办案助手"
      @click="aiStore.toggle()"
      @keydown.enter="aiStore.toggle()"
    >
      <ChatLineSquare />
    </el-icon>
  </el-tooltip>
</template>

<script setup>
import { ChatLineSquare } from '@element-plus/icons-vue'
import { useAiAssistantStore } from '@/stores/aiAssistant'

const aiStore = useAiAssistantStore()
</script>

<style scoped lang="scss">
.ai-icon-btn {
  cursor: pointer;
  color: var(--el-text-color-regular);
  transition: color 0.2s ease;

  &:hover,
  &:focus-visible {
    color: #053d99;
    outline: none;
  }

  &.active {
    color: #053d99;
  }
}

/* 移动端隐藏顶栏 AI 图标（随顶栏菜单一起隐藏） */
@media (max-width: 768px) {
  .ai-icon-btn {
    display: none;
  }
}
</style>
