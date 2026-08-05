<template>
  <div class="conversation-list">
    <!-- 空状态 -->
    <div v-if="conversations.length === 0" class="conv-empty">
      <div class="empty-icon-wrap">
        <el-icon :size="28" color="#7ba8d4"><ChatLineSquare /></el-icon>
      </div>
      <p>暂无会话</p>
    </div>

    <!-- 会话列表 -->
    <div
      v-for="conv in sortedConversations"
      :key="conv.id"
      class="conv-item"
      :class="{ 'is-active': conv.id === activeId }"
      @click="$emit('select', conv.id)"
    >
      <!-- 选中指示器 -->
      <div class="active-indicator"></div>

      <!-- 头像 -->
      <div class="conv-avatar" :class="avatarClass(conv.type)">
        {{ avatarText(conv.type) }}
      </div>

      <!-- 主体 -->
      <div class="conv-body">
        <div class="conv-top-row">
          <span class="conv-title">{{ conv.caseNo }} {{ conv.title }}</span>
          <span v-if="conv.unreadCount > 0" class="conv-unread">
            {{ conv.unreadCount > 99 ? '99+' : conv.unreadCount }}
          </span>
        </div>
        <div class="conv-bottom-row">
          <span class="conv-last-msg">
            {{ conv.lastMessage ? `${conv.lastMessage.senderName}：${conv.lastMessage.content}` : '暂无消息' }}
          </span>
          <span class="conv-time">{{ conv.updatedAt || '' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ChatLineSquare } from '@element-plus/icons-vue'

const props = defineProps({
  conversations: {
    type: Array,
    default: () => [],
  },
  activeId: {
    type: String,
    default: '',
  },
})

defineEmits(['select'])

// 按 updatedAt 降序排序
const sortedConversations = computed(() => {
  return [...props.conversations].sort((a, b) => {
    if (!a.updatedAt) return 1
    if (!b.updatedAt) return -1
    return b.updatedAt.localeCompare(a.updatedAt)
  })
})

const avatarClass = (type) => ({
  discussion: 'avatar-discussion',
  evidence: 'avatar-evidence',
  private: 'avatar-private',
}[type] || 'avatar-discussion')

const avatarText = (type) => ({
  discussion: '讨',
  evidence: '证',
  private: '私',
}[type] || '聊')
</script>

<style scoped lang="scss">
.conversation-list {
  overflow-y: auto;
  height: 100%;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #b8d4ee;
    border-radius: 2px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

/* 空状态 */
.conv-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;

  .empty-icon-wrap {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f5faff 0%, #cfe2f7 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #b8d4ee;
  }

  p {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    margin: 0;
  }
}

/* 会话项 */
.conv-item {
  display: flex;
  gap: 10px;
  padding: 12px 14px 12px 16px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 56px;
    right: 12px;
    height: 1px;
    background: #f0f2f5;
  }

  &:last-child::after {
    display: none;
  }

  &:hover {
    background-color: #f5faff;

    .conv-avatar {
      transform: scale(1.05);
    }
  }

  &.is-active {
    background: linear-gradient(90deg, #ebf4fc 0%, #f5faff 100%);

    .active-indicator {
      opacity: 1;
      transform: scaleY(1);
    }

    .conv-title {
      color: #1565c0;
    }
  }
}

/* 选中指示器 */
.active-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 3px;
  height: 24px;
  background: linear-gradient(180deg, #1565c0 0%, #3a8bde 100%);
  border-radius: 0 2px 2px 0;
  opacity: 0;
  transition: all 0.25s ease;
}

/* 头像 */
.conv-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #fff;
  flex-shrink: 0;
  transition: transform 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);

  &.avatar-discussion {
    background: linear-gradient(135deg, #1565c0 0%, #3a8bde 100%);
  }
  &.avatar-evidence {
    background: linear-gradient(135deg, #8a8f99 0%, #6b7280 100%);
  }
  &.avatar-private {
    background: linear-gradient(135deg, #6bb07a 0%, #4a9d5e 100%);
  }
}

/* 主体 */
.conv-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
}

.conv-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.conv-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;
}

.conv-unread {
  background: linear-gradient(135deg, #f56c6c 0%, #e8494a 100%);
  color: #fff;
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 10px;
  flex-shrink: 0;
  line-height: 1.3;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(245, 108, 108, 0.35);
  animation: pulse-badge 2s ease-in-out infinite;
}

@keyframes pulse-badge {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

.conv-bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.conv-last-msg {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.conv-time {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
}
</style>
