<template>
  <div class="message-list" ref="listRef">
    <!-- 空状态 -->
    <div v-if="messages.length === 0" class="message-empty">
      <el-icon :size="40" color="#c0c4cc"><ChatDotRound /></el-icon>
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
        <!-- 系统消息：居中 -->
        <div v-if="msg.type === 'system'" class="system-message">
          {{ msg.content }}
        </div>

        <!-- 普通消息：气泡 -->
        <template v-else>
          <!-- 头像 -->
          <div class="message-avatar" :class="avatarClass(msg.senderRole)">
            {{ msg.senderName.charAt(0) }}
          </div>

          <div class="message-body">
            <!-- 发送者名称 -->
            <div class="message-sender">
              {{ msg.isMine ? '我' : msg.senderName }}
              <span class="sender-role">{{ roleLabel(msg.senderRole) }}</span>
            </div>

            <!-- 气泡内容 -->
            <div class="message-bubble">
              <!-- 文本消息 -->
              <span v-if="msg.type === 'text'" class="message-text">{{ msg.content }}</span>

              <!-- 附件消息 -->
              <div v-else-if="msg.type === 'file'" class="message-attachment">
                <el-icon :size="20"><Document /></el-icon>
                <div class="attachment-info">
                  <div class="attachment-name">{{ msg.attachments[0]?.name }}</div>
                  <div class="attachment-size">{{ msg.attachments[0]?.size }}</div>
                </div>
                <el-icon class="attachment-download" :size="16"><Download /></el-icon>
              </div>
            </div>
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
  padding: 12px;
  min-height: 200px;
}

.message-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  gap: 8px;
}

.message-item {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;

  &.is-mine {
    flex-direction: row-reverse;

    .message-body {
      align-items: flex-end;
    }

    .message-sender {
      flex-direction: row-reverse;
    }

    .message-bubble {
      background-color: var(--el-color-primary);
      color: #fff;
    }
  }

  &.is-system {
    justify-content: center;

    .system-message {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      background-color: #f8f8f9;
      padding: 4px 12px;
      border-radius: 4px;
    }
  }
}

.message-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
  color: #fff;

  &.avatar-secretary {
    background-color: #909399;
  }
  &.avatar-arbitrator {
    background-color: var(--el-color-primary);
  }
  &.avatar-party {
    background-color: #74c080;
  }
}

.message-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 70%;
}

.message-sender {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);

  .sender-role {
    font-size: 10px;
    color: var(--el-text-color-placeholder);
  }
}

.message-bubble {
  background-color: #f2f5fa;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.message-attachment {
  display: flex;
  align-items: center;
  gap: 8px;

  .attachment-info {
    flex: 1;
    min-width: 0;
  }

  .attachment-name {
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .attachment-size {
    font-size: 10px;
    opacity: 0.7;
  }

  .attachment-download {
    cursor: pointer;
    flex-shrink: 0;
  }
}
</style>
