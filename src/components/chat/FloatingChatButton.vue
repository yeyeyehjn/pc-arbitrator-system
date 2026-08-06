<template>
  <el-tooltip content="案件讨论" placement="left" :show-after="300">
    <div class="floating-chat-btn" :class="{ 'has-unread': unreadCount > 0 }" @click="$emit('click')">
      <div class="pulse-ring" v-if="unreadCount > 0"></div>
      <el-icon :size="24"><ChatLineRound /></el-icon>
      <span v-if="unreadCount > 0" class="unread-badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </div>
  </el-tooltip>
</template>

<script setup>
import { computed } from 'vue'
import { ChatLineRound } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'

defineEmits(['click'])

const chatStore = useChatStore()
const unreadCount = computed(() => chatStore.totalUnreadCount)
</script>

<style scoped lang="scss">
.floating-chat-btn {
  position: fixed;
  bottom: 96px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #053d99 0%, #3a6bb5 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(5, 61, 153, 0.35);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2000;

  &:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 8px 24px rgba(21, 101, 192, 0.4);
  }

  &:active {
    transform: translateY(0) scale(1.02);
  }
}

/* 脉冲扩散环 */
.pulse-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid var(--el-color-primary);
  animation: pulse-ring 2s ease-out infinite;
  pointer-events: none;
}

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pulse-ring {
    animation: none;
  }
  .floating-chat-btn {
    transition: none;
  }
}

/* 未读徽标 */
.unread-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: linear-gradient(135deg, #f56c6c 0%, #e8494a 100%);
  color: #fff;
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 10px;
  line-height: 1.2;
  text-align: center;
  border: 2px solid #fff;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(245, 108, 108, 0.4);
}

@media (max-width: 768px) {
  .floating-chat-btn {
    right: 16px;
    bottom: 80px;
    width: 48px;
    height: 48px;
  }
}
</style>
