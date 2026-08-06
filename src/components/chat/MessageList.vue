<template>
  <div class="message-list" ref="listRef">
    <!-- 空状态 -->
    <div v-if="messages.length === 0" class="message-empty">
      <div class="empty-icon-wrap">
        <el-icon :size="32" color="var(--el-text-color-placeholder)"><ChatDotRound /></el-icon>
      </div>
      <p>暂无消息，发送第一条消息开始讨论</p>
    </div>

    <!-- 消息列表 -->
    <template v-else>
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="message-item"
        :class="{ 'is-mine': msg.isMine, 'is-system': msg.type === 'system' }"
      >
        <!-- 系统消息：居中药丸 + 装饰线 -->
        <div v-if="msg.type === 'system'" class="system-message">
          <span class="system-line"></span>
          <span class="system-text">{{ msg.content }}</span>
          <span class="system-line"></span>
        </div>

        <!-- 普通消息：气泡 -->
        <template v-else>
          <!-- 头像 -->
          <div class="message-avatar" :class="avatarClass(msg.senderRole)">
            {{ msg.senderName.charAt(0) }}
          </div>

          <div class="message-body">
            <!-- 发送者名称 + 角色 -->
            <div class="message-sender">
              <span class="sender-name">{{ msg.isMine ? '我' : msg.senderName }}</span>
              <span class="sender-role" :class="avatarClass(msg.senderRole)">{{ roleLabel(msg.senderRole) }}</span>
            </div>

            <!-- 气泡内容 -->
            <div class="message-bubble">
              <!-- 文本消息 -->
              <span v-if="msg.type === 'text'" class="message-text">{{ msg.content }}</span>

              <!-- 附件消息 -->
              <div v-else-if="msg.type === 'file'" class="message-attachment">
                <div class="attachment-icon">
                  <el-icon :size="20"><Document /></el-icon>
                </div>
                <div class="attachment-info">
                  <div class="attachment-name">{{ msg.attachments[0]?.name }}</div>
                  <div class="attachment-size">{{ msg.attachments[0]?.size }}</div>
                </div>
                <el-icon class="attachment-download" :size="16"><Download /></el-icon>
              </div>
            </div>

            <!-- 时间戳 -->
            <div class="message-time">{{ formatTime(msg.createdAt) }}</div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { ChatDotRound, Document, Download } from '@element-plus/icons-vue'

const props = defineProps({
  messages: {
    type: Array,
    default: () => [],
  },
})

const listRef = ref(null)

// 新消息时自动滚动到底部
watch(
  () => props.messages.length,
  () => {
    nextTick(() => {
      if (listRef.value) {
        listRef.value.scrollTop = listRef.value.scrollHeight
      }
    })
  }
)

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return timeStr.substring(5, 16).replace('-', '/').replace(' ', ' ')
}

// 角色头像样式类
const avatarClass = (role) => {
  const map = { secretary: 'avatar-secretary', arbitrator: 'avatar-arbitrator', party: 'avatar-party' }
  return map[role] || 'avatar-secretary'
}

// 角色标签
const roleLabel = (role) => {
  const map = { secretary: '秘书', arbitrator: '仲裁员', party: '当事人' }
  return map[role] || ''
}
</script>

<style scoped lang="scss">
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
  min-height: 200px;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color);
    border-radius: 2px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

/* 空状态 */
.message-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  gap: 12px;

  .empty-icon-wrap {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #f5f7fa;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--el-border-color-light);
  }

  p {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    margin: 0;
  }
}

/* 消息项 */
.message-item {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;

  &.is-mine {
    flex-direction: row-reverse;

    .message-body {
      align-items: flex-end;
    }

    .message-sender {
      flex-direction: row-reverse;
    }

    .message-bubble {
      background: linear-gradient(135deg, #053d99 0%, #3a6bb5 100%);
      color: #fff;
      border-radius: 12px 4px 12px 12px;
      box-shadow: 0 2px 8px rgba(5, 61, 153, 0.2);
    }

    .message-time {
      text-align: right;
    }
  }

  &.is-system {
    justify-content: center;
    margin-bottom: 20px;

    .system-message {
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 80%;

      .system-line {
        flex: 1;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--el-border-color), transparent);
        min-width: 20px;
      }

      .system-text {
        font-size: 12px;
        color: var(--el-text-color-placeholder);
        background: #f5f7fa;
        padding: 3px 14px;
        border-radius: 12px;
        white-space: nowrap;
        border: 1px solid var(--el-border-color-light);
      }
    }
  }
}

/* 头像 */
.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
  color: #fff;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);

  &.avatar-secretary {
    background: linear-gradient(135deg, #8a8f99 0%, #6b7280 100%);
  }
  &.avatar-arbitrator {
    background: linear-gradient(135deg, #053d99 0%, #3a6bb5 100%);
  }
  &.avatar-party {
    background: linear-gradient(135deg, #6bb07a 0%, #4a9d5e 100%);
  }
}

/* 消息体 */
.message-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 68%;
}

.message-sender {
  display: flex;
  align-items: center;
  gap: 6px;

  .sender-name {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    font-weight: 500;
  }

  .sender-role {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 3px;
    color: #fff;

    &.avatar-secretary {
      background-color: var(--el-text-color-secondary);
    }
    &.avatar-arbitrator {
      background-color: #053d99;
    }
    &.avatar-party {
      background-color: #74c080;
    }
  }
}

/* 气泡 */
.message-bubble {
  background-color: #f4f6fa;
  padding: 9px 14px;
  border-radius: 4px 12px 12px 12px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
  border: 1px solid var(--el-border-color-extra-light);
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
}

/* 时间戳 */
.message-time {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  padding: 0 4px;
}

/* 附件 */
.message-attachment {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;

  .attachment-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .message-item:not(.is-mine) & .attachment-icon {
    background: #f5f7fa;
    color: #053d99;
  }

  .attachment-info {
    flex: 1;
    min-width: 0;
  }

  .attachment-name {
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .attachment-size {
    font-size: 10px;
    opacity: 0.7;
    margin-top: 2px;
  }

  .attachment-download {
    cursor: pointer;
    flex-shrink: 0;
    opacity: 0.7;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 1;
    }
  }
}
</style>
