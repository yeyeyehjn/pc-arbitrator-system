<template>
  <div class="case-empty-state">
    <div class="empty-icon-wrap">
      <el-icon class="empty-icon"><Document /></el-icon>
    </div>
    <span class="empty-text">{{ text }}</span>
    <div v-if="$slots.default" class="empty-action">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { Document } from '@element-plus/icons-vue'

defineProps({
  text: {
    type: String,
    default: '暂无案件数据',
  },
})
</script>

<style scoped lang="scss">
.case-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;

  .empty-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-color: #f5f7fa;
    margin-bottom: 16px;
  }

  .empty-icon {
    font-size: 32px;
    color: #a8abb2;
  }

  .empty-text {
    font-size: 14px;
    color: #767a82;
  }

  .empty-action {
    margin-top: 16px;
  }
}
</style>
