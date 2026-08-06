import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { legalDb, caseDb, draftTemplates, guideDb } from '@/components/ai-assistant/aiMockData'
import { useCaseDetailStore } from '@/stores/caseDetail'

const STORAGE_KEY = 'ai_assistant_session'
let msgIdCounter = 0
const genMsgId = () => `msg-${Date.now()}-${++msgIdCounter}`

// 欢迎语
const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content: '您好！我是 AI 办案助手。我可以帮您检索法律法规、查找类似案例、草拟文书、解答操作问题。请直接输入您的问题，或使用下方快捷指令。',
  cards: [],
  timestamp: Date.now(),
  pending: false,
  contextCaseId: '',
}

export const useAiAssistantStore = defineStore('aiAssistant', () => {
  // ============ 状态 ============
  const visible = ref(false)
  const messages = ref([])
  const loading = ref(false)
  const contextCaseId = ref('')
  const contextSummary = ref(null) // { caseNo, reason, parties, claims, hearingDate, hearingLocation, id }

  // ============ 方法 ============
  const toggle = () => { visible.value = !visible.value }
  const open = () => { visible.value = true }
  const close = () => { visible.value = false }

  const newSession = () => {
    messages.value = [{ ...WELCOME_MESSAGE, id: 'welcome', timestamp: Date.now() }]
    persistSession()
  }

  const setContext = (caseId, summary) => {
    contextCaseId.value = caseId
    contextSummary.value = summary
  }

  const clearContext = () => {
    contextCaseId.value = ''
    contextSummary.value = null
  }

  // 意图路由：关键词匹配
  const routeIntent = (text) => {
    const t = text.toLowerCase()
    // 法律检索
    if (/法条|法律|法规|民法典|合同法|公司法/.test(t)) return 'legal'
    // 案例检索
    if (/案例|判例|类案|判决/.test(t)) return 'case'
    // 文书草拟
    if (/(草拟|生成|写).*(裁决书|笔录|延期|申请书)/.test(t) || /(裁决书|笔录|延期|申请书).*(草拟|生成|写)/.test(t)) return 'draft'
    // 操作指引
    if (/怎么|如何|步骤|操作|在哪|哪里|怎样/.test(t)) return 'guide'
    // 兜底
    return 'guide'
  }

  // 根据意图生成 Mock 响应
  const generateMockResponse = (intent, userText) => {
    const ctx = contextSummary.value

    switch (intent) {
      case 'legal': {
        const reason = ctx?.reason || ''
        const items = legalDb[reason] || legalDb._default
        const isFallback = !legalDb[reason]
        return {
          content: isFallback
            ? '未找到与当前案由精确匹配的法规，以下是与合同纠纷相关的通用法律法规：'
            : `根据案件案由「${reason}」，为您检索到 ${items.length} 条相关法律法规：`,
          cards: [{ type: 'legal', payload: { intro: '', items } }],
        }
      }
      case 'case': {
        const reason = ctx?.reason || ''
        const items = caseDb[reason] || caseDb._default
        return {
          content: `为您找到 ${items.length} 个类似案例：`,
          cards: [{ type: 'case', payload: { intro: '', items } }],
        }
      }
      case 'draft': {
        if (!ctx) {
          return {
            content: '请先进入一个案件详情页，我才能根据案件信息为您草拟文书。',
            cards: [],
          }
        }
        // 判断文书类型
        let docType = 'award'
        if (/笔录/.test(userText)) docType = 'record'
        else if (/延期/.test(userText)) docType = 'extension'
        const draft = draftTemplates[docType](ctx)
        return {
          content: `已根据案件「${ctx.caseNo}」的信息生成${draft.docType}初稿，您可以在下方预览，确认后填入编辑器。`,
          cards: [{ type: 'draft', payload: draft }],
        }
      }
      case 'guide':
      default: {
        // 尝试匹配具体 guide intent
        let guideKey = '_default'
        if (/延期|延长/.test(userText)) guideKey = 'extend'
        else if (/核阅|审核|裁决书/.test(userText)) guideKey = 'review'
        else if (/签名|签字|笔录/.test(userText)) guideKey = 'sign'
        const guide = guideDb[guideKey] || guideDb._default
        return {
          content: guide.intro,
          cards: [{ type: 'guide', payload: guide }],
        }
      }
    }
  }

  // 生成案件摘要响应
  const generateSummaryResponse = () => {
    const ctx = contextSummary.value
    if (!ctx) {
      return {
        content: '请先进入一个案件详情页，我才能生成案件摘要。',
        cards: [],
      }
    }
    return {
      content: `以下是案件「${ctx.caseNo}」的摘要信息：`,
      cards: [{
        type: 'summary',
        payload: {
          caseNo: ctx.caseNo,
          reason: ctx.reason,
          status: ctx.status || '审理中',
          amount: ctx.amount,
          parties: {
            applicants: (ctx.parties?.applicants || []).map(p => p.name),
            respondents: (ctx.parties?.respondents || []).map(p => p.name),
          },
          claimSummary: (ctx.claims || []).join('；'),
          progress: ctx.progress || '案件审理中',
        },
      }],
    }
  }

  // 发送队列：Promise 链串行调度，loading 期间可继续排队发送
  let sendChain = Promise.resolve()

  // 公开入口：入队执行
  const sendMessage = (text) => {
    const trimmed = text.trim()
    if (!trimmed) return
    sendChain = sendChain.then(() => doSendMessage(trimmed))
  }

  // 内部执行：发送消息主流程
  const doSendMessage = async (trimmed) => {
    // 1. 乐观插入 user msg
    const userMsg = {
      id: genMsgId(),
      role: 'user',
      content: trimmed,
      cards: [],
      timestamp: Date.now(),
      pending: false,
      contextCaseId: contextCaseId.value,
    }
    messages.value.push(userMsg)

    // 2. 插入 pending assistant msg
    const assistantMsg = {
      id: genMsgId(),
      role: 'assistant',
      content: '',
      cards: [],
      timestamp: Date.now(),
      pending: true,
      contextCaseId: contextCaseId.value,
    }
    messages.value.push(assistantMsg)
    loading.value = true

    try {
      // 3. 路由 + 生成 Mock 响应
      const intent = routeIntent(trimmed)
      const response = generateMockResponse(intent, trimmed)

      // 4. setTimeout 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400))

      // 5. 填充响应（通过 splice 替换强制触发响应式）
      const targetIndex = messages.value.findIndex(m => m.id === assistantMsg.id)
      if (targetIndex !== -1) {
        messages.value.splice(targetIndex, 1, {
          ...messages.value[targetIndex],
          content: response.content,
          cards: response.cards,
          pending: false,
        })
      }
    } catch (e) {
      // 兜底：即使生成/填充异常，也结束 pending 并给出提示，保证队列不卡死
      const targetIndex = messages.value.findIndex(m => m.id === assistantMsg.id)
      if (targetIndex !== -1) {
        messages.value.splice(targetIndex, 1, {
          ...messages.value[targetIndex],
          content: '抱歉，AI 助手暂时无法回复，请稍后重试。',
          cards: [],
          pending: false,
        })
      }
      console.error('[AiAssistant] 回复生成失败：', e)
    } finally {
      loading.value = false
    }

    // 6. 持久化
    persistSession()
  }

  // 快捷指令入口：入队执行
  const runQuickCommand = (cmd) => {
    sendChain = sendChain.then(() => doRunQuickCommand(cmd))
  }

  // 内部执行：快捷指令
  const doRunQuickCommand = async (cmd) => {
    // cmd: 'guide' | 'legal' | 'draft' | 'summary'
    const cmdTextMap = {
      guide: '操作指引',
      legal: '查法条',
      draft: '草拟裁决书',
      summary: '案件摘要',
    }
    const cmdText = cmdTextMap[cmd] || cmd

    // 插入 user msg
    messages.value.push({
      id: genMsgId(),
      role: 'user',
      content: cmdText,
      cards: [],
      timestamp: Date.now(),
      pending: false,
      contextCaseId: contextCaseId.value,
    })

    // 插入 pending assistant msg
    const assistantMsg = {
      id: genMsgId(),
      role: 'assistant',
      content: '',
      cards: [],
      timestamp: Date.now(),
      pending: true,
      contextCaseId: contextCaseId.value,
    }
    messages.value.push(assistantMsg)
    loading.value = true

    try {
      // 生成响应
      let response
      if (cmd === 'summary') {
        response = generateSummaryResponse()
      } else if (cmd === 'guide') {
        response = generateMockResponse('guide', '操作指引')
      } else if (cmd === 'legal') {
        response = generateMockResponse('legal', '法条')
      } else if (cmd === 'draft') {
        response = generateMockResponse('draft', '草拟裁决书')
      }

      await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400))

      // 通过 splice 替换强制触发响应式
      const targetIndex = messages.value.findIndex(m => m.id === assistantMsg.id)
      if (targetIndex !== -1) {
        messages.value.splice(targetIndex, 1, {
          ...messages.value[targetIndex],
          content: response.content,
          cards: response.cards,
          pending: false,
        })
      }
    } catch (e) {
      const targetIndex = messages.value.findIndex(m => m.id === assistantMsg.id)
      if (targetIndex !== -1) {
        messages.value.splice(targetIndex, 1, {
          ...messages.value[targetIndex],
          content: '抱歉，AI 助手暂时无法回复，请稍后重试。',
          cards: [],
          pending: false,
        })
      }
      console.error('[AiAssistant] 快捷指令响应失败：', e)
    } finally {
      loading.value = false
    }
    persistSession()
  }

  // 填入裁决书编辑器
  const fillIntoEditor = (draftPayload) => {
    const caseStore = useCaseDetailStore()
    if (!contextCaseId.value) {
      ElMessage.warning('请在案件详情页使用此功能')
      return false
    }
    const success = caseStore.saveAwardContent(draftPayload.html)
    if (success) {
      ElMessage.success('已填入裁决书编辑器')
    }
    return success
  }

  // localStorage 持久化
  const persistSession = () => {
    try {
      const data = messages.value.filter(m => m.id !== 'welcome')
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      // 静默失败
    }
  }

  const restoreSession = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        if (Array.isArray(data) && data.length > 0) {
          // 清理残留 pending 消息（上次会话中断时未完成的回复），避免界面永远停留在"AI 思考中"
          const cleaned = data
            .filter(m => m && !m.pending)
            .map(m => ({ ...m, pending: false }))
          messages.value = [{ ...WELCOME_MESSAGE, timestamp: Date.now() }, ...cleaned]
          return
        }
      }
    } catch (e) {
      // 静默降级
    }
    // 无历史或读取失败，初始化欢迎语
    messages.value = [{ ...WELCOME_MESSAGE, timestamp: Date.now() }]
  }

  return {
    // 状态
    visible,
    messages,
    loading,
    contextCaseId,
    contextSummary,
    // 方法
    toggle,
    open,
    close,
    newSession,
    setContext,
    clearContext,
    sendMessage,
    runQuickCommand,
    fillIntoEditor,
    restoreSession,
  }
})
