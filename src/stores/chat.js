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
