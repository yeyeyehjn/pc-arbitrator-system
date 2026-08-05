<template>
  <div class="profile-empty-state">
    <el-icon class="empty-icon"><component :is="icon" /></el-icon>
    <p class="empty-text">{{ text }}</p>
  </div>
</template>

<script setup>
import { FolderOpened } from '@element-plus/icons-vue'

defineProps({
  text: { type: String, default: '暂无数据' },
  icon: { type: [Object, Function], default: () => FolderOpened },
})
</script>

<style scoped lang="scss">
.profile-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;

  .empty-icon {
    font-size: 48px;
    color: var(--el-text-color-placeholder);
    margin-bottom: 12px;
  }

  .empty-text {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }
}
</style>
