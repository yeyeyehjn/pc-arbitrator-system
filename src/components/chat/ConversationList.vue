<template>
  <div class="conversation-list">
    <!-- 空状态 -->
    <div v-if="conversations.length === 0" class="conv-empty">
      <el-icon :size="36" color="#c0c4cc"><ChatLineSquare /></el-icon>
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
      <!-- 头像 -->
      <div class="conv-avatar" :class="avatarClass(conv.type)">
        {{ avatarText(conv.type) }}
      </div>

      <!-- 主体 -->
      <div class="conv-body">
        <div class="conv-top-row">
          <span class="conv-title">{{ conv.caseNo }} {{ conv.title }}</span>
          <span v-if="conv.unreadCount > 0" class="conv-unread">{{ conv.unreadCount > 99 ? '99+' : conv.unreadCount }}</span>
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
}

.conv-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  gap: 8px;
}

.conv-item {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #fafafa;
  }

  &.is-active {
    background-color: #f2f5fa;
  }
}

.conv-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #fff;
  flex-shrink: 0;

  &.avatar-discussion {
    background-color: var(--el-color-primary);
  }
  &.avatar-evidence {
    background-color: #909399;
  }
  &.avatar-private {
    background-color: #74c080;
  }
}

.conv-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
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
}

.conv-unread {
  background-color: #f56c6c;
  color: #fff;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  flex-shrink: 0;
  line-height: 1.4;
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
