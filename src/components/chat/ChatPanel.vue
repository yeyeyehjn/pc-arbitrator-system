<template>
  <div class="chat-panel" :class="`mode-${mode}`">
    <!-- ============ Drawer 模式：左侧会话列表 + 右侧消息区 ============ -->
    <template v-if="mode === 'drawer'">
      <div class="drawer-layout">
        <!-- 会话列表 -->
        <div class="drawer-conv-list">
          <ConversationList
            :conversations="store.conversations"
            :active-id="activeConvId"
            @select="selectConversation"
          />
        </div>

        <!-- 消息区 -->
        <div class="drawer-chat-area">
          <template v-if="activeConvId">
            <div class="chat-header">
              <span class="chat-title">{{ activeConversation?.caseNo }} {{ activeConversation?.title }}</span>
              <span class="chat-participants-hint">{{ participantsHint(activeConversation) }}</span>
            </div>
            <MessageList :messages="store.getConversationMessages(activeConvId)" />
            <MessageInput @send="handleSend" />
          </template>
          <div v-else class="no-conv-selected">
            <el-icon :size="40" color="#c0c4cc"><ChatDotRound /></el-icon>
            <p>选择一个会话开始聊天</p>
          </div>
        </div>
      </div>
    </template>

    <!-- ============ Embedded 模式：会话切换标签 + 参与方提示条 + 消息区 ============ -->
    <template v-else>
      <!-- 会话切换标签 -->
      <div class="conv-tabs">
        <button
          v-for="tab in convTabs"
          :key="tab.type"
          class="conv-tab"
          :class="{ 'is-active': activeConvType === tab.type }"
          @click="switchConvType(tab.type)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 参与方提示条 -->
      <div v-if="currentConversation" class="participants-bar">
        <span class="participants-label">参与方：</span>
        <span
          v-for="p in currentConversation.participants"
          :key="p.id"
          class="participant-tag"
        >{{ p.name }}</span>
        <span class="participants-hint">{{ participantsHint(currentConversation) }}</span>
      </div>

      <!-- 私聊模式：成员选择列表 -->
      <div v-if="activeConvType === 'private' && !currentConversation" class="private-member-list">
        <div class="private-hint">选择内部成员发起私聊</div>
        <div
          v-for="member in internalMembers"
          :key="member.id"
          class="private-member-item"
        >
          <div class="member-avatar" :class="avatarClass(member.role)">{{ member.avatar }}</div>
          <div class="member-info">
            <div class="member-name">{{ member.name }}</div>
            <div class="member-role">{{ roleLabel(member.role) }}</div>
          </div>
          <el-button type="primary" size="small" @click="startPrivateChat(member)">发消息</el-button>
        </div>
      </div>

      <!-- 消息区 -->
      <template v-if="currentConversation">
        <MessageList :messages="store.getConversationMessages(currentConversation.id)" />
        <MessageInput @send="handleSend" />
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ChatDotRound } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'
import MessageList from './MessageList.vue'
import MessageInput from './MessageInput.vue'
import ConversationList from './ConversationList.vue'

const props = defineProps({
  mode: {
    type: String,
    default: 'embedded',
    validator: (v) => ['embedded', 'drawer'].includes(v),
  },
  caseId: {
    type: String,
    default: '',
  },
  caseNo: {
    type: String,
    default: '',
  },
})

const store = useChatStore()

// ============ 抽屉模式 ============
const activeConvId = ref('')

const activeConversation = computed(() =>
  store.conversations.find((c) => c.id === activeConvId.value)
)

const selectConversation = (convId) => {
  activeConvId.value = convId
  store.markAsRead(convId)
}

// ============ Embedded 模式 ============
const activeConvType = ref('discussion')

const convTabs = [
  { type: 'discussion', label: '案件讨论' },
  { type: 'evidence', label: '在线示证' },
  { type: 'private', label: '私聊' },
]

// 当前案件的三类会话
const caseConversations = computed(() =>
  props.caseId ? store.getConversationsByCase(props.caseId) : []
)

// 当前选中类型的会话（私聊可能有多个，取第一个或空）
const currentConversation = computed(() => {
  const list = caseConversations.value.filter((c) => c.type === activeConvType.value)
  return list[0] || null
})

// 切换会话类型
const switchConvType = (type) => {
  activeConvType.value = type
}

// 内部成员列表（私聊用）
const internalMembers = computed(() =>
  props.caseId ? store.getInternalMembers(props.caseId) : []
)

// 发起私聊
const startPrivateChat = (member) => {
  store.startPrivateChat(props.caseId, member)
}

// ============ 共用方法 ============
const handleSend = (payload) => {
  const convId = props.mode === 'drawer' ? activeConvId.value : currentConversation.value?.id
  if (!convId) return
  store.sendMessage(convId, payload)
}

// 参与方提示文案
const participantsHint = (conv) => {
  if (!conv) return ''
  if (conv.type === 'discussion') return '三方公开讨论'
  if (conv.type === 'evidence') return '仅内部，不对外'
  if (conv.type === 'private') return '仅内部成员私聊'
  return ''
}

// 角色相关
const avatarClass = (role) => ({
  secretary: 'avatar-secretary',
  arbitrator: 'avatar-arbitrator',
  party: 'avatar-party',
}[role] || 'avatar-secretary')

const roleLabel = (role) => ({
  secretary: '秘书',
  arbitrator: '仲裁员',
  party: '当事人',
}[role] || '')

// 抽屉模式：默认选中第一个有未读的会话
watch(
  () => store.conversations,
  () => {
    if (props.mode === 'drawer' && !activeConvId.value && store.conversations.length > 0) {
      const firstUnread = store.conversations.find((c) => c.unreadCount > 0)
      activeConvId.value = firstUnread?.id || store.conversations[0].id
    }
  },
  { immediate: true },
)
</script>

<style scoped lang="scss">
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* ============ Drawer 模式 ============ */
.mode-drawer {
  .drawer-layout {
    display: flex;
    height: 100%;
  }

  .drawer-conv-list {
    width: 200px;
    border-right: 1px solid var(--el-border-color-lighter);
    flex-shrink: 0;
    overflow: hidden;
  }

  .drawer-chat-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
}

.chat-header {
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: space-between;
  align-items: center;

  .chat-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-regular);
  }

  .chat-participants-hint {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }
}

.no-conv-selected {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  gap: 8px;
}

/* ============ Embedded 模式 ============ */
.mode-embedded {
  .conv-tabs {
    display: flex;
    gap: 8px;
    padding: 10px 12px 0;
  }

  .conv-tab {
    padding: 4px 12px;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    background-color: #f2f5fa;
    color: var(--el-text-color-secondary);
    transition: all 0.2s ease;

    &.is-active {
      background-color: var(--el-color-primary);
      color: #fff;
    }
  }

  .participants-bar {
    margin: 8px 12px 0;
    padding: 6px 10px;
    background-color: #f8f8f9;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;

    .participants-label {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
    }

    .participant-tag {
      background-color: #e4e7ed;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 11px;
      color: var(--el-text-color-regular);
    }

    .participants-hint {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
      margin-left: auto;
    }
  }
}

/* ============ 私聊成员列表 ============ */
.private-member-list {
  padding: 12px;

  .private-hint {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 12px;
  }
}

.private-member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &:last-child {
    border-bottom: none;
  }
}

.member-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #fff;
  flex-shrink: 0;

  &.avatar-secretary {
    background-color: #909399;
  }
  &.avatar-arbitrator {
    background-color: var(--el-color-primary);
  }
}

.member-info {
  flex: 1;

  .member-name {
    font-size: 14px;
    color: var(--el-text-color-regular);
  }

  .member-role {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}
</style>
