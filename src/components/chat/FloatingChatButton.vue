<template>
  <div class="floating-chat-btn" @click="$emit('click')">
    <el-icon :size="24"><ChatLineRound /></el-icon>
    <span v-if="unreadCount > 0" class="unread-badge">
      {{ unreadCount > 99 ? '99+' : unreadCount }}
    </span>
  </div>
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
  background-color: var(--el-color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(5, 61, 153, 0.3);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  z-index: 2000;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(5, 61, 153, 0.4);
  }
}

.unread-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: #f56c6c;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  line-height: 1.2;
  min-width: 18px;
  text-align: center;
  border: 2px solid #fff;
}
</style>
