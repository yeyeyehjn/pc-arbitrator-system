<template>
  <el-drawer
    :model-value="modelValue"
    direction="rtl"
    :show-close="false"
    :with-header="false"
    class="chat-drawer"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="chat-drawer-header">
      <span class="drawer-title">消息</span>
      <el-icon class="drawer-close" @click="close"><Close /></el-icon>
    </div>
    <div class="chat-drawer-body">
      <ChatPanel mode="drawer" />
    </div>
  </el-drawer>
</template>

<script setup>
import { Close } from '@element-plus/icons-vue'
import ChatPanel from './ChatPanel.vue'

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const close = () => {
  emit('update:modelValue', false)
}
</script>

<!-- 非 scoped：el-drawer 通过 teleport 挂载到 body，scoped 样式无法命中 -->
<style lang="scss">
.chat-drawer.el-drawer:not(.is-fullscreen) {
  width: 400px !important;
}

.chat-drawer .el-drawer__body {
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--el-color-primary);
  color: #fff;

  .drawer-title {
    font-size: 16px;
    font-weight: 600;
  }

  .drawer-close {
    cursor: pointer;
    font-size: 18px;
    color: #fff;

    &:hover {
      opacity: 0.8;
    }
  }
}

.chat-drawer-body {
  flex: 1;
  overflow: hidden;
}

/* 移动端 */
@media (max-width: 768px) {
  .chat-drawer.el-drawer:not(.is-fullscreen) {
    width: 92% !important;
  }
}
</style>
