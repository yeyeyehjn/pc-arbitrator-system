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
      <div class="header-left">
        <div class="header-icon">
          <el-icon :size="18"><ChatLineRound /></el-icon>
        </div>
        <span class="drawer-title">案件消息</span>
      </div>
      <button class="drawer-close" @click="close" aria-label="关闭">
        <el-icon :size="18"><Close /></el-icon>
      </button>
    </div>
    <div class="chat-drawer-body">
      <ChatPanel mode="drawer" />
    </div>
  </el-drawer>
</template>

<script setup>
import { Close, ChatLineRound } from '@element-plus/icons-vue'
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
  width: 70% !important;
  border-radius: 16px 0 0 16px;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.1);
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
  padding: 14px 16px;
  background: #fff;
  border-bottom: 1px solid var(--el-border-color-lighter);

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .header-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #053d99 0%, #3a6bb5 100%);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .drawer-title {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: var(--el-text-color-regular);
  }
}

.drawer-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  transition: all 0.2s ease;

  &:hover {
    color: #053d99;
    background-color: rgba(5, 61, 153, 0.08);
  }

  &:active {
    transform: scale(0.95);
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
