# 案件讨论聊天室 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为仲裁员 PC 端实现案件专属聊天室，支持案件讨论/在线示证/私聊三类会话，双入口（案件详情 Tab + 全局悬浮球抽屉），mock 数据驱动。

**Architecture:** 统一 ChatPanel 组件双模式复用（embedded 嵌入详情页 / drawer 抽屉），单一 `stores/chat.js` 管理会话与消息，悬浮球全局挂载在 MainLayout。三类会话统一渲染，仅参与人范围不同。

**Tech Stack:** Vue 3 (Composition API, `<script setup>`) + Element Plus + Pinia + Vue Router。无测试框架，以 `npm run dev` + 浏览器手动验证。

## Global Constraints

- 设计系统遵循 `DESIGN.md`：品牌色 `#053d99`，字号 16/14/12/10px，间距 4 的倍数，移动端弹窗 `width: 92% !important`
- Store 用 Composition API 风格（`defineStore('name', () => { ... })`），与 `stores/auth.js`、`stores/todo.js` 一致
- 组件用 `<script setup>` + `defineProps` / `defineEmits`
- Mock 数据写在 store 内部，组件层不直接操作底层数据
- 不新增一级路由，不占用顶部导航菜单位
- el-drawer 通过 teleport 挂载到 body，scoped 样式需用非 scoped 块 + 类名限定（参见 MainLayout.vue 的 `.mobile-drawer` 模式）
- git commit 消息用英文，格式 `feat: ...` / `refactor: ...`

---

## File Structure

| 文件 | 类型 | 职责 |
|------|------|------|
| `src/stores/chat.js` | 新增 | 会话/消息/未读数 Pinia store + mock 数据 |
| `src/components/chat/MessageList.vue` | 新增 | 消息流渲染（气泡/附件/系统消息/空状态） |
| `src/components/chat/MessageInput.vue` | 新增 | 输入框 + 附件按钮 + 发送逻辑 |
| `src/components/chat/ConversationList.vue` | 新增 | 跨案件会话列表（抽屉模式用） |
| `src/components/chat/ChatPanel.vue` | 新增 | 聊天主体，双模式复用（embedded/drawer） |
| `src/components/chat/FloatingChatButton.vue` | 新增 | 全局悬浮球 + 未读徽标 |
| `src/components/chat/ChatDrawer.vue` | 新增 | el-drawer 抽屉壳，包裹 ChatPanel drawer 模式 |
| `src/views/cases/components/detail/DiscussionTab.vue` | 新增 | 案件详情"讨论"Tab，包裹 ChatPanel embedded 模式 |
| `src/layout/MainLayout.vue` | 修改 | 引入 FloatingChatButton + ChatDrawer |
| `src/views/cases/CaseDetailView.vue` | 修改 | el-tabs 新增"讨论"Tab |

---

### Task 1: Chat Store（数据层）

**Files:**
- Create: `src/stores/chat.js`

**Interfaces:**
- Produces: `useChatStore` — 后续所有组件依赖此 store

**说明：** 项目无测试框架，以 store 代码编写 + dev server 控制台无报错为验证标准。

- [ ] **Step 1: 创建 `src/stores/chat.js`，编写 store 完整代码**

```js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 当前仲裁员 ID（mock）
const CURRENT_USER_ID = 'me'

// Mock：案件参与成员
const caseMembers = {
  '1001': [
    { id: 'u-sec', name: '刘秘书', role: 'secretary', avatar: '刘' },
    { id: 'me', name: '我', role: 'arbitrator', avatar: '我' },
    { id: 'u-arb2', name: '李仲裁员', role: 'arbitrator', avatar: '李' },
    { id: 'u-app', name: '上海宏图贸易有限公司', role: 'party', avatar: '申' },
    { id: 'u-res', name: '上海远东物流有限公司', role: 'party', avatar: '被' },
  ],
  '1002': [
    { id: 'u-sec2', name: '陈秘书', role: 'secretary', avatar: '陈' },
    { id: 'me', name: '我', role: 'arbitrator', avatar: '我' },
    { id: 'u-arb3', name: '王仲裁员', role: 'arbitrator', avatar: '王' },
    { id: 'u-app2', name: '北京科瑞科技有限公司', role: 'party', avatar: '申' },
  ],
}

const caseNoMap = {
  '1001': '(2026)沪仲第1001号',
  '1002': '(2026)沪仲第1002号',
}

function buildMockConversations() {
  return [
    {
      id: 'c-disc-1001',
      caseId: '1001',
      caseNo: '(2026)沪仲第1001号',
      type: 'discussion',
      title: '案件讨论',
      participants: caseMembers['1001'],
      targetUserId: null,
      targetName: null,
      lastMessage: { content: '证据材料已上传，请查阅', senderId: 'u-sec', senderName: '刘秘书', time: '2026-08-05 10:30' },
      unreadCount: 2,
      updatedAt: '2026-08-05 10:30',
    },
    {
      id: 'c-evi-1001',
      caseId: '1001',
      caseNo: '(2026)沪仲第1001号',
      type: 'evidence',
      title: '在线示证',
      participants: caseMembers['1001'].filter((m) => m.role !== 'party'),
      targetUserId: null,
      targetName: null,
      lastMessage: { content: '[附件] 合同扫描件.pdf', senderId: 'u-sec', senderName: '刘秘书', time: '2026-08-05 09:15' },
      unreadCount: 0,
      updatedAt: '2026-08-05 09:15',
    },
    {
      id: 'c-disc-1002',
      caseId: '1002',
      caseNo: '(2026)沪仲第1002号',
      type: 'discussion',
      title: '案件讨论',
      participants: caseMembers['1002'],
      targetUserId: null,
      targetName: null,
      lastMessage: { content: '开庭时间已确认', senderId: 'u-sec2', senderName: '陈秘书', time: '2026-08-04 16:00' },
      unreadCount: 1,
      updatedAt: '2026-08-04 16:00',
    },
  ]
}

function buildMockMessages() {
  return {
    'c-disc-1001': [
      { id: 'm1', conversationId: 'c-disc-1001', senderId: 'u-sec', senderName: '刘秘书', senderRole: 'secretary', type: 'system', content: '案件讨论会话已创建', attachments: [], createdAt: '2026-08-05 09:00:00', isMine: false },
      { id: 'm2', conversationId: 'c-disc-1001', senderId: 'u-sec', senderName: '刘秘书', senderRole: 'secretary', type: 'text', content: '各位仲裁员好，本案证据材料已上传', attachments: [], createdAt: '2026-08-05 09:01:00', isMine: false },
      { id: 'm3', conversationId: 'c-disc-1001', senderId: 'me', senderName: '我', senderRole: 'arbitrator', type: 'text', content: '收到，我查阅一下', attachments: [], createdAt: '2026-08-05 09:05:00', isMine: true },
      { id: 'm4', conversationId: 'c-disc-1001', senderId: 'u-sec', senderName: '刘秘书', senderRole: 'secretary', type: 'file', content: '证据材料已上传', attachments: [{ name: '合同扫描件.pdf', url: '#mock', size: '2.3MB' }], createdAt: '2026-08-05 10:30:00', isMine: false },
    ],
    'c-evi-1001': [
      { id: 'm5', conversationId: 'c-evi-1001', senderId: 'u-sec', senderName: '刘秘书', senderRole: 'secretary', type: 'system', content: '在线示证会话已创建', attachments: [], createdAt: '2026-08-05 09:10:00', isMine: false },
      { id: 'm6', conversationId: 'c-evi-1001', senderId: 'u-sec', senderName: '刘秘书', senderRole: 'secretary', type: 'file', content: '上传证据材料', attachments: [{ name: '合同扫描件.pdf', url: '#mock', size: '2.3MB' }], createdAt: '2026-08-05 09:15:00', isMine: false },
    ],
    'c-disc-1002': [
      { id: 'm7', conversationId: 'c-disc-1002', senderId: 'u-sec2', senderName: '陈秘书', senderRole: 'secretary', type: 'system', content: '案件讨论会话已创建', attachments: [], createdAt: '2026-08-04 15:00:00', isMine: false },
      { id: 'm8', conversationId: 'c-disc-1002', senderId: 'u-sec2', senderName: '陈秘书', senderRole: 'secretary', type: 'text', content: '开庭时间已确认为8月20日下午2点', attachments: [], createdAt: '2026-08-04 16:00:00', isMine: false },
    ],
  }
}

export const useChatStore = defineStore('chat', () => {
  const conversations = ref(buildMockConversations())
  const messages = ref(buildMockMessages())
  const currentUserId = ref(CURRENT_USER_ID)

  // 全局未读总数
  const totalUnreadCount = computed(() =>
    conversations.value.reduce((sum, c) => sum + c.unreadCount, 0)
  )

  // 按案件获取会话
  const getConversationsByCase = (caseId) =>
    conversations.value.filter((c) => c.caseId === caseId)

  // 获取会话消息
  const getConversationMessages = (convId) =>
    messages.value[convId] || []

  // 发送消息
  const sendMessage = (conversationId, { type = 'text', content, attachments = [] }) => {
    const conv = conversations.value.find((c) => c.id === conversationId)
    if (!conv) return

    const now = new Date()
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const newMessage = {
      id: `m-${Date.now()}`,
      conversationId,
      senderId: currentUserId.value,
      senderName: '我',
      senderRole: 'arbitrator',
      type,
      content,
      attachments,
      createdAt: `${timeStr}:00`,
      isMine: true,
    }

    if (!messages.value[conversationId]) {
      messages.value[conversationId] = []
    }
    messages.value[conversationId].push(newMessage)

    // 更新会话的 lastMessage 和 updatedAt
    conv.lastMessage = {
      content: type === 'file' ? `[附件] ${attachments[0]?.name || ''}` : content,
      senderId: currentUserId.value,
      senderName: '我',
      time: timeStr,
    }
    conv.updatedAt = timeStr
  }

  // 标记会话已读
  const markAsRead = (conversationId) => {
    const conv = conversations.value.find((c) => c.id === conversationId)
    if (conv) {
      conv.unreadCount = 0
    }
  }

  // 发起私聊（创建或复用）
  const startPrivateChat = (caseId, targetUser) => {
    // 查找已有私聊会话
    const existing = conversations.value.find(
      (c) =>
        c.caseId === caseId &&
        c.type === 'private' &&
        c.targetUserId === targetUser.id
    )
    if (existing) return existing

    const caseNo = caseNoMap[caseId] || ''
    const newConv = {
      id: `c-priv-${caseId}-${targetUser.id}`,
      caseId,
      caseNo,
      type: 'private',
      title: `与${targetUser.name}`,
      participants: [
        { id: currentUserId.value, name: '我', role: 'arbitrator', avatar: '我' },
        targetUser,
      ],
      targetUserId: targetUser.id,
      targetName: targetUser.name,
      lastMessage: null,
      unreadCount: 0,
      updatedAt: null,
    }
    conversations.value.push(newConv)
    messages.value[newConv.id] = [
      {
        id: `m-sys-${Date.now()}`,
        conversationId: newConv.id,
        senderId: 'system',
        senderName: '',
        senderRole: 'system',
        type: 'system',
        content: `与${targetUser.name}的私聊已创建`,
        attachments: [],
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        isMine: false,
      },
    ]
    return newConv
  }

  // 获取案件内部成员（秘书+仲裁员，排除自己，排除当事人）
  const getInternalMembers = (caseId) => {
    const members = caseMembers[caseId] || []
    return members.filter(
      (m) => m.id !== currentUserId.value && m.role !== 'party'
    )
  }

  return {
    conversations,
    messages,
    currentUserId,
    totalUnreadCount,
    getConversationsByCase,
    getConversationMessages,
    sendMessage,
    markAsRead,
    startPrivateChat,
    getInternalMembers,
  }
})
```

- [ ] **Step 2: 验证 store 无语法错误**

Run: `npm run dev`
Expected: dev server 启动无报错（store 文件被引用前不会执行，但语法错误会导致 import 失败）

- [ ] **Step 3: Commit**

```bash
git add src/stores/chat.js
git commit -m "feat(chat): add chat store with mock data"
```

---

### Task 2: MessageList 组件（消息流渲染）

**Files:**
- Create: `src/components/chat/MessageList.vue`

**Interfaces:**
- Consumes: `useChatStore().getConversationMessages(convId)`
- Produces: `MessageList` 组件，props: `messages: Array`

- [ ] **Step 1: 创建 `src/components/chat/MessageList.vue`**

```vue
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
```

- [ ] **Step 2: 验证组件无语法错误**

Run: `npm run dev`
Expected: dev server 启动无报错

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/MessageList.vue
git commit -m "feat(chat): add MessageList component"
```

---

### Task 3: MessageInput 组件（输入区）

**Files:**
- Create: `src/components/chat/MessageInput.vue`

**Interfaces:**
- Produces: `MessageInput` 组件，emits: `send(payload)`，payload: `{ type: 'text'|'file', content: string, attachments: array }`

- [ ] **Step 1: 创建 `src/components/chat/MessageInput.vue`**

```vue
<template>
  <div class="message-input">
    <el-icon class="attach-btn" :size="18" @click="triggerFileInput"><Paperclip /></el-icon>
    <textarea
      ref="textareaRef"
      v-model="text"
      class="input-textarea"
      placeholder="输入消息..."
      rows="1"
      @keydown.enter="handleEnter"
      @keydown.shift.enter="handleShiftEnter"
      @input="autoResize"
    ></textarea>
    <el-button
      type="primary"
      size="small"
      :disabled="!text.trim()"
      @click="sendText"
    >发送</el-button>
    <input
      ref="fileInputRef"
      type="file"
      style="display: none"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Paperclip } from '@element-plus/icons-vue'

const emit = defineEmits(['send'])

const text = ref('')
const textareaRef = ref(null)
const fileInputRef = ref(null)

// 发送文本消息
const sendText = () => {
  const content = text.value.trim()
  if (!content) return
  if (content.length > 1000) {
    ElMessage.warning('消息不能超过1000字')
    return
  }
  emit('send', { type: 'text', content, attachments: [] })
  text.value = ''
  nextTick(() => autoResize())
}

// 回车发送
const handleEnter = (e) => {
  e.preventDefault()
  sendText()
}

// Shift+回车换行（默认行为，无需阻止）
const handleShiftEnter = () => {
  // 默认行为即可
}

// 附件选择
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  const sizeMB = (file.size / 1024 / 1024).toFixed(1)
  emit('send', {
    type: 'file',
    content: `上传了 ${file.name}`,
    attachments: [{ name: file.name, url: '#mock', size: `${sizeMB}MB` }],
  })
  // 重置 input 以便重复选择同一文件
  e.target.value = ''
}

// textarea 自适应高度
const autoResize = () => {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 100) + 'px'
}
</script>

<style scoped lang="scss">
.message-input {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  background-color: #fff;
}

.attach-btn {
  cursor: pointer;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
  padding: 4px;

  &:hover {
    color: var(--el-color-primary);
  }
}

.input-textarea {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
  font-family: inherit;
  background-color: #f2f5fa;
  border-radius: 4px;
  padding: 6px 10px;
  max-height: 100px;
  overflow-y: auto;

  &::placeholder {
    color: var(--el-text-color-placeholder);
  }
}
</style>
```

- [ ] **Step 2: 验证组件无语法错误**

Run: `npm run dev`
Expected: dev server 启动无报错

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/MessageInput.vue
git commit -m "feat(chat): add MessageInput component"
```

---

### Task 4: ConversationList 组件（会话列表）

**Files:**
- Create: `src/components/chat/ConversationList.vue`

**Interfaces:**
- Consumes: `useChatStore().conversations`
- Produces: `ConversationList` 组件，emits: `select(convId)`

- [ ] **Step 1: 创建 `src/components/chat/ConversationList.vue`**

```vue
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
```

- [ ] **Step 2: 验证组件无语法错误**

Run: `npm run dev`
Expected: dev server 启动无报错

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/ConversationList.vue
git commit -m "feat(chat): add ConversationList component"
```

---

### Task 5: ChatPanel 组件（双模式主体）

**Files:**
- Create: `src/components/chat/ChatPanel.vue`

**Interfaces:**
- Consumes: `useChatStore`, `MessageList`, `MessageInput`, `ConversationList`
- Produces: `ChatPanel` 组件，props: `mode` (`'embedded'|'drawer'`), `caseId`, `caseNo`

- [ ] **Step 1: 创建 `src/components/chat/ChatPanel.vue`**

```vue
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
  const conv = store.startPrivateChat(props.caseId, member)
  // startPrivateChat 返回完整会话对象，但 currentConversation 通过 store 计算
  // 私聊会话创建后会出现在 caseConversations 中，currentConversation 自动更新
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
```

- [ ] **Step 2: 验证组件无语法错误**

Run: `npm run dev`
Expected: dev server 启动无报错

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/ChatPanel.vue
git commit -m "feat(chat): add ChatPanel component with dual-mode"
```

---

### Task 6: FloatingChatButton + ChatDrawer（悬浮球与抽屉）

**Files:**
- Create: `src/components/chat/FloatingChatButton.vue`
- Create: `src/components/chat/ChatDrawer.vue`

**Interfaces:**
- Consumes: `useChatStore().totalUnreadCount`
- Produces: `FloatingChatButton` emits `click`；`ChatDrawer` props: `modelValue` (Boolean)

- [ ] **Step 1: 创建 `src/components/chat/FloatingChatButton.vue`**

```vue
<template>
  <div class="floating-chat-btn" @click="$emit('click')">
    <el-icon :size="24"><ChatDotRound /></el-icon>
    <span v-if="unreadCount > 0" class="unread-badge">
      {{ unreadCount > 99 ? '99+' : unreadCount }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ChatDotRound } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'

defineEmits(['click'])

const chatStore = useChatStore()
const unreadCount = computed(() => chatStore.totalUnreadCount)
</script>

<style scoped lang="scss">
.floating-chat-btn {
  position: fixed;
  bottom: 32px;
  right: 32px;
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
```

- [ ] **Step 2: 创建 `src/components/chat/ChatDrawer.vue`**

```vue
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
```

- [ ] **Step 3: 验证组件无语法错误**

Run: `npm run dev`
Expected: dev server 启动无报错

- [ ] **Step 4: Commit**

```bash
git add src/components/chat/FloatingChatButton.vue src/components/chat/ChatDrawer.vue
git commit -m "feat(chat): add FloatingChatButton and ChatDrawer"
```

---

### Task 7: DiscussionTab + CaseDetailView 集成（详情页 Tab）

**Files:**
- Create: `src/views/cases/components/detail/DiscussionTab.vue`
- Modify: `src/views/cases/CaseDetailView.vue`

**Interfaces:**
- Consumes: `ChatPanel mode="embedded"`，`useCaseDetailStore` (caseInfo.caseNo, caseInfo.id)

- [ ] **Step 1: 创建 `src/views/cases/components/detail/DiscussionTab.vue`**

```vue
<template>
  <div class="discussion-tab">
    <ChatPanel mode="embedded" :case-id="caseId" :case-no="caseNo" />
  </div>
</template>

<script setup>
import ChatPanel from '@/components/chat/ChatPanel.vue'

defineProps({
  caseId: {
    type: String,
    default: '',
  },
  caseNo: {
    type: String,
    default: '',
  },
})
</script>

<style scoped lang="scss">
.discussion-tab {
  height: 500px;
  display: flex;
  flex-direction: column;
}
</style>
```

- [ ] **Step 2: 修改 `src/views/cases/CaseDetailView.vue`，新增"讨论"Tab**

在 `el-tabs` 内，`ServiceTab` 之后新增一个 `el-tab-pane`：

找到这段代码：
```vue
        <el-tab-pane label="电子送达" name="service">
          <ServiceTab :services="store.services" />
        </el-tab-pane>
```

在其后面添加：
```vue
        <el-tab-pane label="讨论" name="discussion">
          <DiscussionTab :case-id="store.currentCaseId" :case-no="store.caseInfo.caseNo" />
        </el-tab-pane>
```

同时在 `<script setup>` 中添加 import：
```js
import DiscussionTab from './components/detail/DiscussionTab.vue'
```

（放在 `import ServiceTab` 那行之后）

- [ ] **Step 3: 验证 dev server 运行正常**

Run: `npm run dev`
Expected: dev server 启动无报错，打开案件详情页能看到"讨论"Tab

- [ ] **Step 4: Commit**

```bash
git add src/views/cases/components/detail/DiscussionTab.vue src/views/cases/CaseDetailView.vue
git commit -m "feat(chat): add DiscussionTab to case detail"
```

---

### Task 8: MainLayout 集成（全局悬浮球挂载）

**Files:**
- Modify: `src/layout/MainLayout.vue`

**Interfaces:**
- Consumes: `FloatingChatButton`, `ChatDrawer`

- [ ] **Step 1: 修改 `src/layout/MainLayout.vue`**

在 template 中，`</el-container>` 之后（移动端 el-drawer 之前）添加悬浮球和聊天抽屉：

找到 `</el-container>` 这行，在其后添加：
```vue
  <!-- 全局聊天悬浮球 -->
  <FloatingChatButton @click="chatDrawerVisible = true" />
  <!-- 聊天抽屉 -->
  <ChatDrawer v-model="chatDrawerVisible" />
```

在 `<script setup>` 中添加 import 和 ref：
```js
import FloatingChatButton from '../components/chat/FloatingChatButton.vue'
import ChatDrawer from '../components/chat/ChatDrawer.vue'
```

（放在 `import { useAuthStore }` 那行之后）

在 `const drawerVisible = ref(false)` 那行之后添加：
```js
const chatDrawerVisible = ref(false)
```

- [ ] **Step 2: 验证 dev server 运行正常**

Run: `npm run dev`
Expected: dev server 启动无报错，页面右下角出现悬浮球，点击弹出抽屉

- [ ] **Step 3: Commit**

```bash
git add src/layout/MainLayout.vue
git commit -m "feat(chat): mount FloatingChatButton and ChatDrawer in MainLayout"
```

---

### Task 9: 端到端验证与修复

**Files:**
- 可能修改上述任何文件中的 bug

- [ ] **Step 1: 启动 dev server 并全面验证**

Run: `npm run dev`

验证清单：
1. 任意页面右下角看到蓝色悬浮球，有未读红点（显示数字 3）
2. 点击悬浮球，右侧弹出 400px 抽屉
3. 抽屉左侧显示会话列表（3 条），第一条高亮且有未读红点
4. 点击不同会话，右侧消息区切换
5. 在消息区输入文字，回车发送，消息出现在右侧气泡（主题色底白字）
6. 点击附件按钮📎，选择文件，附件消息出现在列表
7. 输入框为空时发送按钮灰色不可点击
8. 关闭抽屉，悬浮球未读数字减少（已读会话清零）

- [ ] **Step 2: 验证案件详情页"讨论"Tab**

验证清单：
1. 进入案件详情页，看到顶部 Tab 多了"讨论"
2. 点击"讨论"Tab，显示会话切换标签（案件讨论/在线示证/私聊）
3. 标签下方显示参与方提示条（如"刘秘书 我 李仲裁员 上海宏图贸易有限公司 上海远东物流有限公司"，右侧"三方公开讨论"）
4. 切换到"在线示证"，参与方提示条更新（仅秘书+仲裁员，右侧"仅内部，不对外"）
5. 切换到"私聊"，显示内部成员列表（刘秘书、李仲裁员）
6. 点击某成员"发消息"，进入私聊会话，显示系统消息"与XX的私聊已创建"
7. 在私聊中发送消息，正常显示

- [ ] **Step 3: 修复发现的问题（如有）**

如有 bug，修复后重新验证。常见问题：
- store 方法未正确返回响应式数据 → 检查 ref/computed 使用
- 抽屉样式未生效 → 确认非 scoped 样式块 + 类名限定
- 消息未滚动到底部 → 检查 MessageList 的 watch + nextTick

- [ ] **Step 4: 最终提交（如有修复）**

```bash
git add -A
git commit -m "fix(chat): fix issues found in e2e verification"
```

---

## Self-Review

**Spec 覆盖检查：**
- [x] 仲裁员视角聊天室 UI 与交互 → Task 1-8
- [x] ChatPanel 双模式复用 → Task 5
- [x] 首页悬浮球 + 未读徽标 + 抽屉面板 → Task 6, 8
- [x] 案件详情页"讨论"Tab + 参与方提示条 → Task 5 (embedded), 7
- [x] 三类会话（讨论/示证/私聊）→ Task 1 (mock), 5 (切换)
- [x] Mock 数据驱动 → Task 1
- [x] 私聊仅内部成员 → Task 1 (getInternalMembers), 5 (成员列表)
- [x] 参与方提示条 → Task 5 (participants-bar)
- [x] 边界情况（空状态/空消息/附件）→ Task 2-4

**Placeholder 扫描：** 无 TODO/TBD/placeholder。

**类型一致性：** `sendMessage(convId, { type, content, attachments })` 在 store/ChatPanel/MessageInput 中签名一致；`startPrivateChat(caseId, targetUser)` 在 store/ChatPanel 中一致；`totalUnreadCount` 在 store/FloatingChatButton 中一致。
