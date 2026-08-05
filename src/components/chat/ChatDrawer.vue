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
  width: 420px !important;
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
  background: linear-gradient(135deg, #053d99 0%, #0a5cb8 100%);
  color: #fff;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%);
    pointer-events: none;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    position: relative;
    z-index: 1;
  }

  .header-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
  }

  .drawer-title {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.5px;
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
  color: #fff;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
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
