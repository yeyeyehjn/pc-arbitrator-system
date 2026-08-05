<template>
  <div class="todo-empty-state">
    <el-icon class="empty-icon"><component :is="icon" /></el-icon>
    <p class="empty-text">{{ text }}</p>
  </div>
</template>

<script setup>
import { FolderOpened } from '@element-plus/icons-vue'

defineProps({
  text: {
    type: String,
    default: '暂无待办事项',
  },
  icon: {
    type: [Object, String],
    default: () => FolderOpened,
  },
})
</script>

<style scoped lang="scss">
.todo-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;

  .empty-icon {
    font-size: 48px;
    color: var(--el-text-color-placeholder);
    margin-bottom: 12px;
  }

  .empty-text {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }
}
</style>
