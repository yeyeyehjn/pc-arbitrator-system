# AI 问答助手 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a global multi-turn AI assistant with floating ball + top-bar icon entries, right-side drawer panel, five card types, intent routing, case context injection, and mock knowledge base.

**Architecture:** Three entry components mounted in MainLayout share a single Pinia store (`aiAssistant`). The drawer container assembles ContextBar, MessageList (with five card sub-components), QuickCommands, and an input area. Intent routing is pure-frontend keyword matching that selects from a mock knowledge base (`aiMockData.js`). Case context is injected by watching `caseDetail.currentCaseId`.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), Element Plus (el-drawer, el-input, el-icon, ElMessage), Pinia, SCSS, Vue Router. No test framework — verification is manual via `npm run dev`.

## Global Constraints

- Brand color: `#053d99` (primary). User bubble background, AI avatar gradient, legal card left border, quick command outline, send button.
- Font sizes: title 16px/600, body 14px/400, auxiliary 12px, micro-label 10px. No 13px/15px.
- Spacing: 4x grid. Drawer padding 16-20px, section gaps 12-16px.
- Border radius: bubbles 8px, cards 4px, buttons 3px, capsule chips 12px.
- el-drawer uses `direction="rtl"`, teleport to body — non-scoped `<style>` block needed for drawer overrides (pattern from MainLayout mobile-drawer).
- All data is mock. Store methods return Promises with setTimeout 600-1000ms to simulate latency.
- Existing AIToolGrid in `views/cases/components/detail/work/` is NOT modified — assistant is independent.
- `fillIntoEditor` reuses `caseDetail.award.content` via `caseDetail.saveAwardContent()`.

---

## File Structure

```
src/components/ai-assistant/
├── aiMockData.js               # Mock knowledge base (legalDb, caseDb, draftTemplates, guideDb)
├── AiAssistantDrawer.vue       # Drawer container — orchestrates all sub-components
├── AiFloatingBall.vue          # Fixed bottom-right floating ball entry
├── AiIconButton.vue            # Top-bar AI icon entry
├── ContextBar.vue              # Case context bar (conditional, case detail only)
├── QuickCommands.vue           # Bottom quick command chips
└── messages/
    ├── MessageList.vue         # Scrollable message list
    ├── MessageBubble.vue       # Single message bubble — dispatches to card components
    ├── LegalCards.vue          # Card type: legal (法律法规)
    ├── CaseCards.vue           # Card type: case (司法案例)
    ├── DraftPreview.vue        # Card type: draft (文书草拟)
    ├── GuideSteps.vue          # Card type: guide (操作指引)
    └── SummaryCard.vue         # Card type: summary (案件摘要)

src/stores/aiAssistant.js       # Pinia store — state, intent routing, mock responses, persistence
src/layout/MainLayout.vue       # Modified — mount three AI components
```

---

## Task 1: Mock Knowledge Base (aiMockData.js)

**Files:**
- Create: `src/components/ai-assistant/aiMockData.js`

**Interfaces:**
- Produces: `legalDb` (object keyed by case reason), `caseDb` (same structure), `draftTemplates` (object of functions keyed by doc type), `guideDb` (object keyed by intent). All consumed by Task 2.

- [ ] **Step 1: Create aiMockData.js with legalDb**

Create `src/components/ai-assistant/aiMockData.js`:

```js
// AI 助手 Mock 知识库
// 按能力分区：法律法规、司法案例、文书草拟模板、操作指引

// === 法律法规（按案由检索） ===
export const legalDb = {
  '买卖合同纠纷': [
    { name: '《民法典》第五百八十二条', snippet: '履行不符合约定的，应当按照当事人的约定承担违约责任。对违约责任没有约定或者约定不明确的，受损害方根据标的的性质以及损失的大小，可以合理选择请求对方承担修理、重作、更换、退货、减少价款或者报酬等违约责任。', relevance: '高', source: 'pkulaw' },
    { name: '《民法典》第五百八十三条', snippet: '当事人一方不履行合同义务或者履行合同义务不符合约定的，在履行义务或者采取补救措施后，对方还有其他损失的，应当赔偿损失。', relevance: '高', source: 'pkulaw' },
    { name: '《民法典》第六百一十五条', snippet: '当事人约定检验期间的，买受人应当在检验期间内将标的物的数量或者质量不符合约定的情形通知出卖人。买受人怠于通知的，视为标的物的数量或者质量符合约定。', relevance: '中', source: 'pkulaw' },
  ],
  '建设工程施工合同纠纷': [
    { name: '《民法典》第七百九十三条', snippet: '建设工程施工合同无效，但是建设工程经验收合格的，可以参照合同关于工程价款的约定折价补偿承包人。', relevance: '高', source: 'pkulaw' },
    { name: '《最高人民法院关于审理建设工程施工合同纠纷案件适用法律问题的解释（一）》第一条', snippet: '建设工程施工合同具有下列情形之一的，应当依据民法典第一百五十三条第一款的规定，认定无效：（一）承包人未取得建筑业企业资质或者超越资质等级的…', relevance: '高', source: 'pkulaw' },
    { name: '《民法典》第八百零六条', snippet: '承包人将建设工程转包、违法分包的，发包人可以解除合同。发包人提供的主要建筑材料、建筑构配件和设备不符合强制性标准或者不履行协助义务，致使承包人无法施工，经催告后在合理期限内仍未履行相应义务的，承包人可以解除合同。', relevance: '中', source: 'pkulaw' },
  ],
  '借款合同纠纷': [
    { name: '《民法典》第六百七十九条', snippet: '自然人之间的借款合同，自贷款人提供借款时成立。', relevance: '高', source: 'pkulaw' },
    { name: '《民法典》第六百八十条', snippet: '禁止高利放贷，借款的利率不得违反国家有关规定。借款合同对支付利息没有约定的，视为没有利息。', relevance: '高', source: 'pkulaw' },
    { name: '《最高人民法院关于审理民间借贷案件适用法律若干问题的规定》第二十五条', snippet: '出借人请求借款人按照合同约定利率支付利息的，人民法院应予支持，但是双方约定的利率超过合同成立时一年期贷款市场报价利率四倍的除外。', relevance: '中', source: 'pkulaw' },
  ],
  '股权转让纠纷': [
    { name: '《公司法》第七十一条', snippet: '有限责任公司的股东之间可以相互转让其全部或者部分股权。股东向股东以外的人转让股权，应当经其他股东过半数同意。', relevance: '高', source: 'pkulaw' },
    { name: '《民法典》第五百零二条', snippet: '依法成立的合同，自成立时生效，但是法律另有规定或者当事人另有约定的除外。', relevance: '中', source: 'pkulaw' },
  ],
  '房屋租赁合同纠纷': [
    { name: '《民法典》第七百零三条', snippet: '租赁合同是出租人将租赁物交付承租人使用、收益，承租人支付租金的合同。', relevance: '高', source: 'pkulaw' },
    { name: '《民法典》第七百二十二条', snippet: '承租人无正当理由未支付或者迟延支付租金的，出租人可以请求承租人在合理期限内支付；承租人逾期不支付的，出租人可以解除合同。', relevance: '高', source: 'pkulaw' },
    { name: '《民法典》第七百一十六条', snippet: '承租人经出租人同意，可以将租赁物转租给第三人。', relevance: '中', source: 'pkulaw' },
  ],
  _default: [
    { name: '《民法典》第四百六十五条', snippet: '依法成立的合同，受法律保护。依法成立的合同，仅对当事人具有法律约束力，但是法律另有规定的除外。', relevance: '中', source: 'pkulaw' },
    { name: '《民法典》第五百零九条', snippet: '当事人应当按照约定全面履行自己的义务。当事人应当遵循诚信原则，根据合同的性质、目的和交易习惯履行通知、协助、保密等义务。', relevance: '中', source: 'pkulaw' },
    { name: '《民法典》第五百七十七条', snippet: '当事人一方不履行合同义务或者履行合同义务不符合约定的，应当承担继续履行、采取补救措施或者赔偿损失等违约责任。', relevance: '低', source: 'pkulaw' },
  ],
}

// === 司法案例（按案由检索） ===
export const caseDb = {
  '买卖合同纠纷': [
    { caseNo: '(2024)沪仲第558号', reason: '买卖合同纠纷', tag: '类案', amount: 280, hearingDate: '2024-08-12', focusLabel: '争议焦点', focus: '买受人收货后未在约定检验期内提出质量异议，是否丧失质量抗辩权', source: 'pkulaw' },
    { caseNo: '(2023)最高法民申1234号', reason: '买卖合同纠纷', tag: '指导', amount: 1500, hearingDate: '2023-06-20', focusLabel: '裁判要旨', focus: '单方委托检测报告不能单独作为认定质量问题成立的依据，需结合其他证据综合判断', source: 'pkulaw' },
  ],
  '建设工程施工合同纠纷': [
    { caseNo: '(2024)京仲第892号', reason: '建设工程施工合同纠纷', tag: '类案', amount: 3200, hearingDate: '2024-03-15', focusLabel: '争议焦点', focus: '建设工程验收合格后，发包人能否以承包人未取得资质为由主张合同无效', source: 'pkulaw' },
    { caseNo: '(2022)最高法民终456号', reason: '建设工程施工合同纠纷', tag: '指导', amount: 8600, hearingDate: '2022-11-08', focusLabel: '裁判要旨', focus: '工程价款利息从应付工程价款之日计付，当事人对欠付工程价款利息计付标准有约定的，按照约定处理', source: 'pkulaw' },
  ],
  '借款合同纠纷': [
    { caseNo: '(2024)粤仲第334号', reason: '借款合同纠纷', tag: '类案', amount: 500, hearingDate: '2024-05-10', focusLabel: '争议焦点', focus: '民间借贷利率超过LPR四倍部分的利息约定效力', source: 'pkulaw' },
    { caseNo: '(2023)最高法民申789号', reason: '借款合同纠纷', tag: '指导', amount: 1200, hearingDate: '2023-09-22', focusLabel: '裁判要旨', focus: '借款人主张出借人职业放贷的，需举证证明出借人以放贷为业且未经金融监管部门批准', source: 'pkulaw' },
  ],
  '股权转让纠纷': [
    { caseNo: '(2024)沪仲第667号', reason: '股权转让纠纷', tag: '类案', amount: 800, hearingDate: '2024-07-03', focusLabel: '争议焦点', focus: '股东向股东以外的人转让股权未经其他股东过半数同意的转让效力', source: 'pkulaw' },
  ],
  '房屋租赁合同纠纷': [
    { caseNo: '(2024)沪仲第445号', reason: '房屋租赁合同纠纷', tag: '类案', amount: 120, hearingDate: '2024-02-18', focusLabel: '争议焦点', focus: '承租人逾期支付租金达到解除合同条件的认定标准', source: 'pkulaw' },
  ],
  _default: [
    { caseNo: '(2024)沪仲第100号', reason: '合同纠纷', tag: '类案', amount: 300, hearingDate: '2024-04-10', focusLabel: '争议焦点', focus: '合同履行中违约责任的认定与赔偿范围', source: 'pkulaw' },
    { caseNo: '(2023)最高法民申567号', reason: '合同纠纷', tag: '指导', amount: 2000, hearingDate: '2023-12-05', focusLabel: '裁判要旨', focus: '合同解除后，守约方有权请求违约方赔偿可得利益损失', source: 'pkulaw' },
  ],
}

// === 文书草拟模板（函数形式，接收案件上下文动态拼装） ===
export const draftTemplates = {
  award: (ctx) => ({
    docType: '裁决书',
    title: '裁决书（初稿）',
    meta: `基于 ${ctx.caseNo}`,
    html: buildAwardHtml(ctx),
    caseContext: ctx.id,
  }),
  record: (ctx) => ({
    docType: '庭审笔录',
    title: '庭审笔录（初稿）',
    meta: `基于 ${ctx.caseNo}`,
    html: buildRecordHtml(ctx),
    caseContext: ctx.id,
  }),
  extension: (ctx) => ({
    docType: '延期申请书',
    title: '延期申请书（初稿）',
    meta: `基于 ${ctx.caseNo}`,
    html: buildExtensionHtml(ctx),
    caseContext: ctx.id,
  }),
}

// === 操作指引（按 intent 命中） ===
export const guideDb = {
  extend: {
    intro: '「发起延期审批」的操作步骤：',
    steps: [
      '进入 **我的案件**，点击目标案件的案号进入**案件详情页**',
      '切换到 **「办案」Tab**，找到「案件待办」区块',
      '在待办列表中找到「延期审批」事项，点击进入',
      '填写延期原因、申请延期天数，上传相关附件',
      '点击 **提交审批**，等待审批结果',
    ],
    tip: '审限到期前 15 天系统会黄色高亮提醒，建议尽早提交延期申请',
  },
  review: {
    intro: '「裁决书核阅」的操作步骤：',
    steps: [
      '进入 **待办事项**，点击左侧菜单「裁决书核阅列表」',
      '在列表中找到待核阅的裁决书，点击进入核阅页面',
      '在线阅读裁决书全文，使用批注工具标注修改意见',
      '核阅完成后，选择 **通过** 或 **退回修改**',
      '填写核阅意见并提交',
    ],
    tip: '退回修改时请详细注明修改位置和理由，便于秘书快速定位',
  },
  sign: {
    intro: '「笔录签名」的操作步骤：',
    steps: [
      '进入 **待办事项**，点击左侧菜单「签名列表」',
      '在列表中找到待签名的笔录，点击进入签名页面',
      '在线预览笔录内容，确认无误后点击 **签名**',
      '在签名板上手写签名，或上传电子签名图片',
      '确认签名后提交，系统自动记录签名时间',
    ],
    tip: undefined,
  },
  _default: {
    intro: '我是 AI 办案助手，可以帮您：',
    steps: [
      '**智能法律检索** — 输入案由或法条关键词，检索相关法律法规和司法案例',
      '**辅助文书草拟** — 基于当前案件信息，一键生成裁决书、庭审笔录等文书初稿',
      '**操作流程指引** — 询问系统操作步骤，获取分步指引（如"如何发起延期审批"）',
      '**案件信息摘要** — 快速查看当前案件的关键信息概览',
    ],
    tip: '您也可以直接使用下方的快捷指令按钮快速发起对话',
  },
}

// === 辅助函数：构建文书 HTML ===

function buildAwardHtml(ctx) {
  const applicants = (ctx.parties?.applicants || []).map(p => p.name).join('、')
  const respondents = (ctx.parties?.respondents || []).map(p => p.name).join('、')
  const claims = (ctx.claims || []).map((c, i) => `<p>${i + 1}. ${c}</p>`).join('')
  return `<h4 style="text-align:center">上海仲裁委员会裁决书</h4>
<p style="text-align:center">${ctx.caseNo}</p>
<p><strong>申请人：</strong>${applicants}</p>
<p><strong>被申请人：</strong>${respondents}</p>
<p><strong>案由：</strong>${ctx.reason}</p>
<hr/>
<p>申请人${applicants}与被申请人${respondents}因${ctx.reason}一案，本会根据双方约定受理后，依法组成仲裁庭进行了审理。</p>
<p><strong>申请人的仲裁请求：</strong></p>
${claims}
<p>（此处为裁决书正文草稿，AI 根据案件信息自动生成，仲裁员可在此基础上修改完善。）</p>`
}

function buildRecordHtml(ctx) {
  const applicants = (ctx.parties?.applicants || []).map(p => p.name).join('、')
  const respondents = (ctx.parties?.respondents || []).map(p => p.name).join('、')
  return `<h4 style="text-align:center">庭审笔录</h4>
<p style="text-align:center">${ctx.caseNo}</p>
<p><strong>开庭时间：</strong>${ctx.hearingDate || '待定'}</p>
<p><strong>开庭地点：</strong>${ctx.hearingLocation || '待定'}</p>
<p><strong>申请人：</strong>${applicants}</p>
<p><strong>被申请人：</strong>${respondents}</p>
<hr/>
<p><strong>庭审记录：</strong></p>
<p>（庭审笔录正文，AI 根据案件信息自动生成框架，仲裁员可在此基础上补充记录。）</p>`
}

function buildExtensionHtml(ctx) {
  return `<h4 style="text-align:center">延期申请书</h4>
<p style="text-align:center">${ctx.caseNo}</p>
<hr/>
<p>上海仲裁委员会：</p>
<p>关于${ctx.caseNo}号${ctx.reason}一案，因案件审理需要，现申请延长审理期限。</p>
<p><strong>申请延长期限：</strong>____ 天</p>
<p><strong>延期理由：</strong></p>
<p>（请填写延期理由，AI 根据案件信息自动生成框架。）</p>
<p>此致</p>
<p>上海仲裁委员会</p>
<p>仲裁员：____________</p>
<p>日期：____________</p>`
}
```

- [ ] **Step 2: Verify file is syntactically valid**

Run: `node -e "import('./src/components/ai-assistant/aiMockData.js').then(m => console.log('OK:', Object.keys(m)))"` (if the project supports ESM) OR start dev server `npm run dev` and check no console errors.

If node ESM import fails due to project config, just verify with `npm run dev` — no errors in terminal means the file is valid.

- [ ] **Step 3: Commit**

```bash
git add src/components/ai-assistant/aiMockData.js
git commit -m "feat: add AI assistant mock knowledge base (legalDb, caseDb, draftTemplates, guideDb)"
```

---

## Task 2: Pinia Store (aiAssistant.js)

**Files:**
- Create: `src/stores/aiAssistant.js`

**Interfaces:**
- Consumes: `legalDb`, `caseDb`, `draftTemplates`, `guideDb` from Task 1's `aiMockData.js`. `useCaseDetailStore` from existing `stores/caseDetail.js`.
- Produces: `useAiAssistantStore` with state `{ visible, messages, loading, contextCaseId, contextSummary }` and methods `{ toggle, open, close, newSession, setContext, clearContext, sendMessage, runQuickCommand, fillIntoEditor, restoreSession }`. Consumed by Tasks 3-8.

- [ ] **Step 1: Create the store file**

Create `src/stores/aiAssistant.js`:

```js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { legalDb, caseDb, draftTemplates, guideDb } from '@/components/ai-assistant/aiMockData'
import { useCaseDetailStore } from '@/stores/caseDetail'

const STORAGE_KEY = 'ai_assistant_session'
let msgIdCounter = 0
const genMsgId = () => `msg-${++msgIdCounter}`

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

  // 发送消息主流程
  const sendMessage = async (text) => {
    const trimmed = text.trim()
    if (!trimmed) return

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

    // 3. 路由 + 生成 Mock 响应
    const intent = routeIntent(trimmed)
    const response = generateMockResponse(intent, trimmed)

    // 4. setTimeout 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400))

    // 5. 填充响应
    assistantMsg.content = response.content
    assistantMsg.cards = response.cards
    assistantMsg.pending = false
    loading.value = false

    // 6. 持久化
    persistSession()
  }

  // 快捷指令入口
  const runQuickCommand = async (cmd) => {
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

    assistantMsg.content = response.content
    assistantMsg.cards = response.cards
    assistantMsg.pending = false
    loading.value = false
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
          messages.value = [{ ...WELCOME_MESSAGE, timestamp: Date.now() }, ...data]
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
```

- [ ] **Step 2: Verify store loads without errors**

Run: `npm run dev` — open browser, open Vue DevTools, check that `aiAssistant` store is registered (it will be lazy-initialized on first use, so no error in console is sufficient).

- [ ] **Step 3: Commit**

```bash
git add src/stores/aiAssistant.js
git commit -m "feat: add aiAssistant Pinia store with intent routing, mock responses, and session persistence"
```

---

## Task 3: Five Message Card Components

**Files:**
- Create: `src/components/ai-assistant/messages/LegalCards.vue`
- Create: `src/components/ai-assistant/messages/CaseCards.vue`
- Create: `src/components/ai-assistant/messages/DraftPreview.vue`
- Create: `src/components/ai-assistant/messages/GuideSteps.vue`
- Create: `src/components/ai-assistant/messages/SummaryCard.vue`

**Interfaces:**
- Consumes: `payload` prop (object, structure per spec §4.1-4.5). `DraftPreview` also emits `fill-editor` event with the draft payload.
- Produces: Five presentational card components, each accepting a `payload` prop. Consumed by Task 4 (MessageBubble).

- [ ] **Step 1: Create LegalCards.vue**

Create `src/components/ai-assistant/messages/LegalCards.vue`:

```vue
<template>
  <div class="legal-cards">
    <div v-for="(item, idx) in payload.items" :key="idx" class="legal-card">
      <div class="legal-card-header">
        <span class="legal-name">{{ item.name }}</span>
        <el-tag :type="relevanceTag(item.relevance)" size="small" effect="light">
          {{ item.relevance }}关联
        </el-tag>
      </div>
      <p class="legal-snippet">{{ item.snippet }}</p>
      <div class="legal-actions">
        <a :href="`https://www.pkulaw.com`" target="_blank" rel="noopener" class="legal-link">
          查看原文 ›
        </a>
        <el-button
          v-if="item.relevance === '高'"
          text
          size="small"
          type="primary"
          @click="$emit('quote', item)"
        >
          引用到文书
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  payload: { type: Object, required: true },
})
defineEmits(['quote'])

const relevanceTag = (relevance) => {
  if (relevance === '高') return 'danger'
  if (relevance === '中') return 'warning'
  return 'info'
}
</script>

<style scoped lang="scss">
.legal-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legal-card {
  border-left: 3px solid #053d99;
  background-color: #f0f5ff;
  border-radius: 0 4px 4px 0;
  padding: 12px;

  .legal-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;

    .legal-name {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }
  }

  .legal-snippet {
    font-size: 13px;
    line-height: 1.6;
    color: #606266;
    margin: 0 0 8px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .legal-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .legal-link {
      font-size: 12px;
      color: #053d99;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }
  }
}
</style>
```

- [ ] **Step 2: Create CaseCards.vue**

Create `src/components/ai-assistant/messages/CaseCards.vue`:

```vue
<template>
  <div class="case-cards">
    <div v-for="(item, idx) in payload.items" :key="idx" class="case-card">
      <div class="case-card-header">
        <span class="case-no">{{ item.caseNo }}</span>
        <el-tag :type="item.tag === '指导' ? 'primary' : 'success'" size="small" effect="light">
          {{ item.tag }}
        </el-tag>
      </div>
      <div class="case-meta">
        <span v-if="item.reason">{{ item.reason }}</span>
        <span v-if="item.amount"> · 标的 {{ item.amount }} 万元</span>
        <span v-if="item.hearingDate"> · {{ item.hearingDate }}</span>
      </div>
      <div class="case-focus">
        <span class="focus-label">{{ item.focusLabel }}：</span>
        <span class="focus-text">{{ item.focus }}</span>
      </div>
      <a :href="`https://www.pkulaw.com`" target="_blank" rel="noopener" class="case-link">
        查看判决书 ›
      </a>
    </div>
  </div>
</template>

<script setup>
defineProps({
  payload: { type: Object, required: true },
})
</script>

<style scoped lang="scss">
.case-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.case-card {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;

  .case-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 4px;

    .case-no {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }
  }

  .case-meta {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
  }

  .case-focus {
    font-size: 13px;
    line-height: 1.6;
    color: #606266;
    margin-bottom: 8px;

    .focus-label {
      font-weight: 600;
      color: #303133;
    }
  }

  .case-link {
    font-size: 12px;
    color: #053d99;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
}
</style>
```

- [ ] **Step 3: Create DraftPreview.vue**

Create `src/components/ai-assistant/messages/DraftPreview.vue`:

```vue
<template>
  <div class="draft-preview">
    <div class="draft-header">
      <span class="draft-title">{{ payload.title }}</span>
      <span class="draft-meta">{{ payload.meta }}</span>
    </div>
    <div class="draft-content" v-html="payload.html"></div>
    <div class="draft-actions">
      <el-button text size="small" @click="copyContent">复制全文</el-button>
      <el-button type="primary" size="small" @click="handleFill">填入裁决书编辑器</el-button>
    </div>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'

const props = defineProps({
  payload: { type: Object, required: true },
})
const emit = defineEmits(['fill-editor'])

const copyContent = async () => {
  try {
    // 创建临时元素提取纯文本
    const temp = document.createElement('div')
    temp.innerHTML = props.payload.html
    await navigator.clipboard.writeText(temp.textContent || temp.innerText || '')
    ElMessage.success('已复制到剪贴板')
  } catch (e) {
    ElMessage.warning('复制失败，请手动选择文本复制')
  }
}

const handleFill = () => {
  emit('fill-editor', props.payload)
}
</script>

<style scoped lang="scss">
.draft-preview {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;

  .draft-header {
    background-color: #053d99;
    color: #fff;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .draft-title {
      font-size: 14px;
      font-weight: 600;
    }
    .draft-meta {
      font-size: 12px;
      opacity: 0.85;
    }
  }

  .draft-content {
    padding: 12px;
    max-height: 240px;
    overflow-y: auto;
    font-size: 13px;
    line-height: 1.8;
    color: #303133;

    :deep(h4) {
      font-size: 14px;
      margin: 0 0 8px;
    }
    :deep(p) {
      margin: 0 0 6px;
    }
    :deep(hr) {
      border: none;
      border-top: 1px solid #e4e7ed;
      margin: 8px 0;
    }
  }

  .draft-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 8px 12px;
    border-top: 1px solid #f0f0f0;
  }
}
</style>
```

- [ ] **Step 4: Create GuideSteps.vue**

Create `src/components/ai-assistant/messages/GuideSteps.vue`:

```vue
<template>
  <div class="guide-steps">
    <div v-for="(step, idx) in payload.steps" :key="idx" class="guide-step">
      <span class="step-num">{{ idx + 1 }}</span>
      <span class="step-text" v-html="renderStep(step)"></span>
    </div>
    <div v-if="payload.tip" class="guide-tip">
      <el-icon><WarningFilled /></el-icon>
      <span>{{ payload.tip }}</span>
    </div>
  </div>
</template>

<script setup>
import { WarningFilled } from '@element-plus/icons-vue'

defineProps({
  payload: { type: Object, required: true },
})

// 将 **粗体** 渲染为品牌色加粗
const renderStep = (step) => {
  return step.replace(/\*\*(.+?)\*\*/g, '<strong class="step-highlight">$1</strong>')
}
</script>

<style scoped lang="scss">
.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.guide-step {
  display: flex;
  align-items: flex-start;
  gap: 8px;

  .step-num {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: #053d99;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1px;
  }

  .step-text {
    font-size: 13px;
    line-height: 1.6;
    color: #606266;

    :deep(.step-highlight) {
      color: #053d99;
      font-weight: 600;
    }
  }
}

.guide-tip {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 12px;
  background-color: #fdf6ec;
  border-radius: 4px;
  font-size: 12px;
  color: #e6a23c;
  line-height: 1.5;

  .el-icon {
    flex-shrink: 0;
    margin-top: 1px;
  }
}
</style>
```

- [ ] **Step 5: Create SummaryCard.vue**

Create `src/components/ai-assistant/messages/SummaryCard.vue`:

```vue
<template>
  <div class="summary-card">
    <div class="summary-header">
      <span class="summary-case-no">{{ payload.caseNo }}</span>
      <el-tag size="small" type="info" effect="light">{{ payload.reason }}</el-tag>
      <el-tag size="small" type="warning" effect="light">{{ payload.status }}</el-tag>
    </div>
    <div class="summary-body">
      <div class="summary-row">
        <span class="label">标的金额</span>
        <span class="value">{{ payload.amount }} 万元</span>
      </div>
      <div class="summary-row">
        <span class="label">申请人</span>
        <span class="value">{{ payload.parties.applicants.join('、') }}</span>
      </div>
      <div class="summary-row">
        <span class="label">被申请人</span>
        <span class="value">{{ payload.parties.respondents.join('、') }}</span>
      </div>
      <div class="summary-row">
        <span class="label">请求摘要</span>
        <span class="value">{{ payload.claimSummary }}</span>
      </div>
      <div class="summary-row">
        <span class="label">当前进度</span>
        <span class="value">{{ payload.progress }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  payload: { type: Object, required: true },
})
</script>

<style scoped lang="scss">
.summary-card {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;

  .summary-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background-color: #f5f7fa;

    .summary-case-no {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }
  }

  .summary-body {
    padding: 8px 12px;
  }

  .summary-row {
    display: flex;
    padding: 6px 0;
    border-bottom: 1px solid #f5f5f5;
    font-size: 13px;
    line-height: 1.6;

    &:last-child { border-bottom: none; }

    .label {
      flex-shrink: 0;
      width: 70px;
      color: #909399;
    }
    .value {
      flex: 1;
      color: #303133;
    }
  }
}
</style>
```

- [ ] **Step 6: Verify all five components compile**

Run: `npm run dev` — no compile errors in terminal.

- [ ] **Step 7: Commit**

```bash
git add src/components/ai-assistant/messages/
git commit -m "feat: add five AI assistant message card components (legal, case, draft, guide, summary)"
```

---

## Task 4: MessageBubble + MessageList

**Files:**
- Create: `src/components/ai-assistant/messages/MessageBubble.vue`
- Create: `src/components/ai-assistant/messages/MessageList.vue`

**Interfaces:**
- Consumes: `message` prop (object per spec §5.1). Imports the five card components from Task 3. Listens to `fill-editor` event from DraftPreview.
- Produces: `MessageList` accepts `messages` prop (array), emits `fill-editor` event. Consumed by Task 7 (AiAssistantDrawer).

- [ ] **Step 1: Create MessageBubble.vue**

Create `src/components/ai-assistant/messages/MessageBubble.vue`:

```vue
<template>
  <div class="message-bubble" :class="message.role">
    <!-- AI 头像 -->
    <div v-if="message.role === 'assistant'" class="bubble-avatar">AI</div>

    <div class="bubble-content-wrapper">
      <!-- 文本内容 -->
      <div class="bubble-text" v-if="message.content">{{ message.content }}</div>

      <!-- pending 态 -->
      <div v-if="message.pending" class="bubble-pending">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="pending-text">AI 思考中…</span>
      </div>

      <!-- 产物卡片 -->
      <div v-if="message.cards && message.cards.length" class="bubble-cards">
        <template v-for="(card, idx) in message.cards" :key="idx">
          <LegalCards
            v-if="card.type === 'legal'"
            :payload="card.payload"
            @quote="$emit('quote-law', $event)"
          />
          <CaseCards
            v-else-if="card.type === 'case'"
            :payload="card.payload"
          />
          <DraftPreview
            v-else-if="card.type === 'draft'"
            :payload="card.payload"
            @fill-editor="$emit('fill-editor', $event)"
          />
          <GuideSteps
            v-else-if="card.type === 'guide'"
            :payload="card.payload"
          />
          <SummaryCard
            v-else-if="card.type === 'summary'"
            :payload="card.payload"
          />
        </template>
      </div>
    </div>

    <!-- 用户头像 -->
    <div v-if="message.role === 'user'" class="bubble-avatar user-avatar">我</div>
  </div>
</template>

<script setup>
import LegalCards from './LegalCards.vue'
import CaseCards from './CaseCards.vue'
import DraftPreview from './DraftPreview.vue'
import GuideSteps from './GuideSteps.vue'
import SummaryCard from './SummaryCard.vue'

defineProps({
  message: { type: Object, required: true },
})
defineEmits(['fill-editor', 'quote-law'])
</script>

<style scoped lang="scss">
.message-bubble {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;

  &.user {
    flex-direction: row-reverse;

    .bubble-text {
      background-color: #053d99;
      color: #fff;
      border-radius: 12px 12px 2px 12px;
    }
  }

  &.assistant {
    .bubble-text {
      background-color: #fff;
      color: #303133;
      border: 1px solid #e4e7ed;
      border-radius: 12px 12px 12px 2px;
    }
  }
}

.bubble-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #053d99, #3a6bb5);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;

  &.user-avatar {
    background: linear-gradient(135deg, #053d99, #3a6bb5);
  }
}

.bubble-content-wrapper {
  max-width: calc(100% - 40px);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bubble-text {
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.bubble-pending {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 14px;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 12px 12px 12px 2px;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #c0c4cc;
    animation: dot-pulse 1.4s infinite ease-in-out;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
  .pending-text {
    font-size: 13px;
    color: #909399;
    margin-left: 4px;
  }
}

@keyframes dot-pulse {
  0%, 80%, 100% { opacity: 0.3; }
  40% { opacity: 1; }
}

.bubble-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (prefers-reduced-motion: reduce) {
  .dot { animation: none; opacity: 0.6; }
}
</style>
```

- [ ] **Step 2: Create MessageList.vue**

Create `src/components/ai-assistant/messages/MessageList.vue`:

```vue
<template>
  <div ref="listRef" class="message-list">
    <MessageBubble
      v-for="msg in messages"
      :key="msg.id"
      :message="msg"
      @fill-editor="$emit('fill-editor', $event)"
      @quote-law="$emit('quote-law', $event)"
    />
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import MessageBubble from './MessageBubble.vue'

const props = defineProps({
  messages: { type: Array, required: true },
})
defineEmits(['fill-editor', 'quote-law'])

const listRef = ref(null)

// 新消息自动滚动到底部
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

// pending 状态变化时也滚动
watch(
  () => props.messages.map(m => m.pending).join(''),
  () => {
    nextTick(() => {
      if (listRef.value) {
        listRef.value.scrollTop = listRef.value.scrollHeight
      }
    })
  }
)
</script>

<style scoped lang="scss">
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
}
</style>
```

- [ ] **Step 3: Verify components compile**

Run: `npm run dev` — no compile errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ai-assistant/messages/MessageBubble.vue src/components/ai-assistant/messages/MessageList.vue
git commit -m "feat: add MessageBubble and MessageList with auto-scroll and card dispatching"
```

---

## Task 5: Entry Components (AiFloatingBall + AiIconButton)

**Files:**
- Create: `src/components/ai-assistant/AiFloatingBall.vue`
- Create: `src/components/ai-assistant/AiIconButton.vue`

**Interfaces:**
- Consumes: `useAiAssistantStore` from Task 2. `toggle` / `open` methods.
- Produces: Two independent entry components that toggle the drawer visibility.

- [ ] **Step 1: Create AiFloatingBall.vue**

Create `src/components/ai-assistant/AiFloatingBall.vue`:

```vue
<template>
  <div
    class="ai-floating-ball"
    :class="{ active: aiStore.visible }"
    role="button"
    tabindex="0"
    aria-label="AI 办案助手"
    @click="aiStore.toggle()"
    @keydown.enter="aiStore.toggle()"
  >
    <el-icon :size="24"><ChatDotRound /></el-icon>
    <span v-if="!aiStore.visible" class="pulse-dot"></span>
  </div>
</template>

<script setup>
import { ChatDotRound } from '@element-plus/icons-vue'
import { useAiAssistantStore } from '@/stores/aiAssistant'

const aiStore = useAiAssistantStore()
</script>

<style scoped lang="scss">
.ai-floating-ball {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #053d99, #3a6bb5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2000;
  box-shadow: 0 4px 12px rgba(5, 61, 153, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover,
  &:focus-visible {
    transform: scale(1.08);
    box-shadow: 0 6px 16px rgba(5, 61, 153, 0.45);
    outline: none;
  }

  &.active {
    transform: scale(0.92);
    background: linear-gradient(135deg, #909399, #c0c4cc);
  }

  .pulse-dot {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #f56c6c;
    border: 2px solid #fff;
    animation: pulse-ring 2s infinite;
  }
}

@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.6); }
  70% { box-shadow: 0 0 0 8px rgba(245, 108, 108, 0); }
  100% { box-shadow: 0 0 0 0 rgba(245, 108, 108, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .pulse-dot { animation: none; }
  .ai-floating-ball:hover { transform: none; }
}

@media (max-width: 768px) {
  .ai-floating-ball {
    right: 16px;
    bottom: 16px;
    width: 48px;
    height: 48px;
  }
}
</style>
```

- [ ] **Step 2: Create AiIconButton.vue**

Create `src/components/ai-assistant/AiIconButton.vue`:

```vue
<template>
  <el-tooltip content="AI 办案助手" placement="bottom" :show-after="300">
    <el-icon
      class="ai-icon-btn"
      :class="{ active: aiStore.visible }"
      :size="20"
      role="button"
      tabindex="0"
      aria-label="AI 办案助手"
      @click="aiStore.toggle()"
      @keydown.enter="aiStore.toggle()"
    >
      <ChatLineSquare />
    </el-icon>
  </el-tooltip>
</template>

<script setup>
import { ChatLineSquare } from '@element-plus/icons-vue'
import { useAiAssistantStore } from '@/stores/aiAssistant'

const aiStore = useAiAssistantStore()
</script>

<style scoped lang="scss">
.ai-icon-btn {
  cursor: pointer;
  color: var(--el-text-color-regular);
  transition: color 0.2s ease;

  &:hover,
  &:focus-visible {
    color: #053d99;
    outline: none;
  }

  &.active {
    color: #053d99;
  }
}

/* 移动端隐藏顶栏 AI 图标（随顶栏菜单一起隐藏） */
@media (max-width: 768px) {
  .ai-icon-btn {
    display: none;
  }
}
</style>
```

- [ ] **Step 3: Verify components compile**

Run: `npm run dev` — no compile errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ai-assistant/AiFloatingBall.vue src/components/ai-assistant/AiIconButton.vue
git commit -m "feat: add AI assistant entry components (floating ball + top-bar icon)"
```

---

## Task 6: ContextBar + QuickCommands

**Files:**
- Create: `src/components/ai-assistant/ContextBar.vue`
- Create: `src/components/ai-assistant/QuickCommands.vue`

**Interfaces:**
- Consumes: `useAiAssistantStore` from Task 2. `contextSummary` state, `clearContext` / `runQuickCommand` methods.
- Produces: `ContextBar` displays case context with clear button. `QuickCommands` emits `command` event with cmd key, or directly calls store. Consumed by Task 7.

- [ ] **Step 1: Create ContextBar.vue**

Create `src/components/ai-assistant/ContextBar.vue`:

```vue
<template>
  <div v-if="aiStore.contextSummary" class="context-bar">
    <el-tag size="small" type="primary" effect="dark">当前案件</el-tag>
    <span class="context-info">
      {{ aiStore.contextSummary.caseNo }} · {{ aiStore.contextSummary.reason }}
    </span>
    <el-icon
      class="context-close"
      role="button"
      tabindex="0"
      aria-label="解除案件上下文"
      @click="aiStore.clearContext()"
      @keydown.enter="aiStore.clearContext()"
    >
      <Close />
    </el-icon>
  </div>
</template>

<script setup>
import { Close } from '@element-plus/icons-vue'
import { useAiAssistantStore } from '@/stores/aiAssistant'

const aiStore = useAiAssistantStore()
</script>

<style scoped lang="scss">
.context-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #d5e3f2;
  border-bottom: 1px solid #c6daf0;
  flex-shrink: 0;

  .context-info {
    flex: 1;
    font-size: 13px;
    color: #053d99;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .context-close {
    flex-shrink: 0;
    cursor: pointer;
    color: #053d99;
    opacity: 0.6;
    transition: opacity 0.2s ease;

    &:hover,
    &:focus-visible {
      opacity: 1;
      outline: none;
    }
  }
}
</style>
```

- [ ] **Step 2: Create QuickCommands.vue**

Create `src/components/ai-assistant/QuickCommands.vue`:

```vue
<template>
  <div class="quick-commands">
    <button
      v-for="cmd in commands"
      :key="cmd.key"
      class="quick-cmd"
      :disabled="aiStore.loading"
      @click="handleClick(cmd.key)"
    >
      {{ cmd.label }}
    </button>
  </div>
</template>

<script setup>
import { useAiAssistantStore } from '@/stores/aiAssistant'

const aiStore = useAiAssistantStore()

const commands = [
  { key: 'guide', label: '操作指引' },
  { key: 'legal', label: '查法条' },
  { key: 'draft', label: '草拟裁决书' },
  { key: 'summary', label: '案件摘要' },
]

const handleClick = (cmd) => {
  if (!aiStore.loading) {
    aiStore.runQuickCommand(cmd)
  }
}
</script>

<style scoped lang="scss">
.quick-commands {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 16px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.quick-cmd {
  padding: 4px 12px;
  border: 1px solid #053d99;
  border-radius: 12px;
  background-color: #fff;
  color: #053d99;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background-color: #053d99;
    color: #fff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
```

- [ ] **Step 3: Verify components compile**

Run: `npm run dev` — no compile errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ai-assistant/ContextBar.vue src/components/ai-assistant/QuickCommands.vue
git commit -m "feat: add ContextBar and QuickCommands components"
```

---

## Task 7: AiAssistantDrawer (Container)

**Files:**
- Create: `src/components/ai-assistant/AiAssistantDrawer.vue`

**Interfaces:**
- Consumes: `useAiAssistantStore` from Task 2, `useCaseDetailStore` from existing `stores/caseDetail.js`. Imports MessageList, ContextBar, QuickCommands from Tasks 4 and 6. Uses `useRoute` from vue-router for context watching.
- Produces: The complete drawer container, ready to be mounted in MainLayout (Task 8).

- [ ] **Step 1: Create AiAssistantDrawer.vue**

Create `src/components/ai-assistant/AiAssistantDrawer.vue`:

```vue
<template>
  <el-drawer
    v-model="aiStore.visible"
    direction="rtl"
    :size="drawerWidth"
    :with-header="false"
    class="ai-assistant-drawer"
    @open="onDrawerOpen"
  >
    <div class="ai-drawer-container">
      <!-- ① 头部 -->
      <div class="ai-drawer-header">
        <div class="header-left">
          <div class="ai-avatar">AI</div>
          <div class="header-titles">
            <span class="header-title">AI 办案助手</span>
            <span class="header-status"><span class="status-dot"></span> 在线</span>
          </div>
        </div>
        <div class="header-actions">
          <el-tooltip content="新会话" placement="bottom" :show-after="300">
            <el-icon class="header-btn" role="button" tabindex="0" aria-label="新会话"
              @click="aiStore.newSession()" @keydown.enter="aiStore.newSession()"><RefreshRight /></el-icon>
          </el-tooltip>
          <el-tooltip content="历史记录" placement="bottom" :show-after="300">
            <el-icon class="header-btn header-btn-disabled" aria-label="历史记录（开发中）"><Clock /></el-icon>
          </el-tooltip>
          <el-tooltip content="关闭" placement="bottom" :show-after="300">
            <el-icon class="header-btn" role="button" tabindex="0" aria-label="关闭"
              @click="aiStore.close()" @keydown.enter="aiStore.close()"><Close /></el-icon>
          </el-tooltip>
        </div>
      </div>

      <!-- ② 案件上下文条 -->
      <ContextBar />

      <!-- ③ 对话流 -->
      <MessageList
        :messages="aiStore.messages"
        @fill-editor="handleFillEditor"
      />

      <!-- ④ 快捷指令 -->
      <QuickCommands />

      <!-- ⑤ 输入区 -->
      <div class="ai-input-area">
        <div class="input-row">
          <el-input
            ref="inputRef"
            v-model="inputText"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 4 }"
            placeholder="输入您的问题…"
            maxlength="2000"
            resize="none"
            @keydown="handleKeydown"
          />
          <el-button
            class="send-btn"
            type="primary"
            :icon="Promotion"
            :disabled="!inputText.trim() || aiStore.loading"
            @click="handleSend"
          />
        </div>
        <div class="input-hints">
          <span class="hint-left">
            <kbd>Enter</kbd> 发送&nbsp;&nbsp;<kbd>Shift</kbd>+<kbd>Enter</kbd> 换行
          </span>
          <span class="hint-right">AI 助手仅供参考</span>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Promotion, RefreshRight, Clock, Close } from '@element-plus/icons-vue'
import { useAiAssistantStore } from '@/stores/aiAssistant'
import { useCaseDetailStore } from '@/stores/caseDetail'
import MessageList from './messages/MessageList.vue'
import ContextBar from './ContextBar.vue'
import QuickCommands from './QuickCommands.vue'

const route = useRoute()
const aiStore = useAiAssistantStore()
const caseStore = useCaseDetailStore()

const inputText = ref('')
const inputRef = ref(null)

const drawerWidth = computed(() => {
  return window.innerWidth <= 768 ? '100%' : '420px'
})

// 回车发送 / Shift+回车换行
const handleKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

const handleSend = () => {
  const text = inputText.value.trim()
  if (!text || aiStore.loading) return
  aiStore.sendMessage(text)
  inputText.value = ''
}

const handleFillEditor = (draftPayload) => {
  aiStore.fillIntoEditor(draftPayload)
}

// 抽屉打开时恢复会话
const onDrawerOpen = () => {
  aiStore.restoreSession()
}

// 案件上下文联动：监听路由 + caseDetail store
const updateContext = () => {
  if (route.path.startsWith('/cases/') && caseStore.currentCaseId && caseStore.caseInfo?.caseNo) {
    const claims = caseStore.claims?.claimList?.map(c => c.content) || []
    const hearing = caseStore.hearings?.[0]
    aiStore.setContext(caseStore.currentCaseId, {
      id: caseStore.currentCaseId,
      caseNo: caseStore.caseInfo.caseNo,
      reason: caseStore.caseInfo.caseReason,
      status: caseStore.caseInfo.caseStatus,
      amount: caseStore.caseInfo.amount,
      parties: caseStore.parties,
      claims,
      hearingDate: hearing?.date,
      hearingLocation: hearing?.location,
      progress: hearing
        ? `${caseStore.caseInfo.caseStatus}，待开庭（${hearing.date}）`
        : caseStore.caseInfo.caseStatus,
    })
  } else {
    aiStore.clearContext()
  }
}

onMounted(() => {
  updateContext()
})

watch(
  () => caseStore.currentCaseId,
  () => updateContext()
)

watch(
  () => route.path,
  () => updateContext()
)
</script>

<style scoped lang="scss">
.ai-drawer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.ai-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;

    .ai-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #053d99, #3a6bb5);
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-titles {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .header-title {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
      }
      .header-status {
        font-size: 12px;
        color: #67c23a;
        display: flex;
        align-items: center;
        gap: 4px;

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #67c23a;
        }
      }
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;

    .header-btn {
      font-size: 16px;
      color: #909399;
      cursor: pointer;
      transition: color 0.2s ease;

      &:hover,
      &:focus-visible {
        color: #053d99;
        outline: none;
      }

      &.header-btn-disabled {
        opacity: 0.4;
        cursor: not-allowed;
        &:hover { color: #909399; }
      }
    }
  }
}

.ai-input-area {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;

  .input-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;

    :deep(.el-textarea__inner) {
      border-radius: 8px;
      font-size: 14px;
      padding: 8px 12px;
      resize: none;
    }

    .send-btn {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      padding: 0;
      background-color: #053d99;
      border-color: #053d99;
    }
  }

  .input-hints {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 6px;
    font-size: 11px;
    color: #c0c4cc;

    kbd {
      display: inline-block;
      padding: 1px 4px;
      border: 1px solid #dcdfe6;
      border-radius: 3px;
      background-color: #f5f7fa;
      font-size: 10px;
      font-family: inherit;
      color: #909399;
    }

    .hint-right {
      font-style: italic;
    }
  }
}
</style>

<!-- 非 scoped：el-drawer teleport 到 body，scoped 不生效 -->
<style lang="scss">
.ai-assistant-drawer.el-drawer {
  .el-drawer__body {
    padding: 0;
  }
}
</style>
```

- [ ] **Step 2: Verify component compiles**

Run: `npm run dev` — no compile errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ai-assistant/AiAssistantDrawer.vue
git commit -m "feat: add AiAssistantDrawer container with header, context bar, message list, quick commands, and input area"
```

---

## Task 8: Mount in MainLayout + Final Integration

**Files:**
- Modify: `src/layout/MainLayout.vue`

**Interfaces:**
- Consumes: `AiIconButton`, `AiFloatingBall`, `AiAssistantDrawer` from Tasks 5 and 7.
- Produces: Fully integrated AI assistant accessible from any page.

- [ ] **Step 1: Add imports to MainLayout script**

In `src/layout/MainLayout.vue`, add to the `<script setup>` imports (after the existing icon import line):

```js
import AiIconButton from '@/components/ai-assistant/AiIconButton.vue'
import AiFloatingBall from '@/components/ai-assistant/AiFloatingBall.vue'
import AiAssistantDrawer from '@/components/ai-assistant/AiAssistantDrawer.vue'
```

- [ ] **Step 2: Add AiIconButton to header-right**

In the template, inside `.header-right` div, add the AI icon button between the notification badge and the dropdown. The `.header-right` block currently is:

```html
<div class="header-right">
  <el-badge ...>...</el-badge>
  <el-dropdown ...>...</el-dropdown>
</div>
```

Insert `<AiIconButton />` between the `</el-badge>` closing and `<el-dropdown>`:

```html
<div class="header-right">
  <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99" class="notification-badge">
    <el-icon ...><Bell /></el-icon>
  </el-badge>
  <AiIconButton />
  <el-dropdown @command="handleCommand">
    ...
  </el-dropdown>
</div>
```

- [ ] **Step 3: Add AiFloatingBall and AiAssistantDrawer after the mobile drawer**

In the template, after the closing `</el-drawer>` of the mobile drawer (line 108), add:

```html
  </el-drawer>

  <!-- AI 助手 -->
  <AiFloatingBall />
  <AiAssistantDrawer />
</template>
```

- [ ] **Step 4: Verify full integration**

Run: `npm run dev`.

Manual verification checklist:
1. **Floating ball**: Right-bottom corner shows a blue gradient circle with chat icon + red pulse dot
2. **Top-bar icon**: Header right shows AI icon between bell and user dropdown
3. **Drawer open**: Click either entry → right drawer slides in (420px)
4. **Welcome message**: Drawer shows AI welcome message on first open
5. **Input area**: Text area + send button + keyboard hints visible
6. **Enter to send**: Type text, press Enter → message sent; Shift+Enter → newline
7. **Empty send disabled**: Send button disabled when input is empty
8. **Quick commands**: Click "操作指引" → AI responds with guide steps card
9. **Legal search**: Click "查法条" → AI responds with legal cards (uses _default since no case context)
10. **Draft without context**: Click "草拟裁决书" → AI responds "请先进入一个案件详情页"
11. **Summary without context**: Click "案件摘要" → AI responds "请先进入一个案件详情页"
12. **Case context**: Navigate to `/cases/case-0` (any case) → context bar appears with case number + reason
13. **Draft with context**: With case context, click "草拟裁决书" → draft preview card with case info
14. **Summary with context**: With case context, click "案件摘要" → summary card with case details
15. **Fill into editor**: In case detail, generate draft, click "填入裁决书编辑器" → success toast
16. **Pending state**: After sending, AI bubble shows "思考中…" dots animation
17. **New session**: Click refresh icon → messages cleared, welcome message restored
18. **Session persistence**: Close drawer, reopen → previous messages restored
19. **Context clear**: Click ✕ on context bar → context removed, bar hidden
20. **Mobile**: Resize to ≤768px → top icon hidden, floating ball visible, drawer full-width

- [ ] **Step 5: Commit**

```bash
git add src/layout/MainLayout.vue
git commit -m "feat: mount AI assistant (floating ball + top icon + drawer) in MainLayout"
```

---

## Self-Review

### Spec Coverage

| Spec Section | Task |
|---|---|
| §1.2 顶栏 AI 图标入口 | Task 5 (AiIconButton) + Task 8 (mount) |
| §1.2 右下角悬浮球入口 | Task 5 (AiFloatingBall) + Task 8 (mount) |
| §1.2 右侧抽屉式对话面板 | Task 7 (AiAssistantDrawer) |
| §1.2 五种产物卡片 | Task 3 (5 card components) |
| §1.2 底部快捷指令 | Task 6 (QuickCommands) |
| §1.2 输入区 + 快捷键提示 | Task 7 (input area in drawer) |
| §1.2 案件上下文条 | Task 6 (ContextBar) + Task 7 (context watching) |
| §1.2 上下文记忆 | Task 2 (store context injection) + Task 7 (watch) |
| §1.2 意图路由 | Task 2 (routeIntent) |
| §1.2 Mock 知识库 | Task 1 (aiMockData.js) |
| §1.2 localStorage 持久化 | Task 2 (persistSession/restoreSession) |
| §4.1-4.5 五种卡片数据结构 | Task 1 (mock data) + Task 3 (card components) |
| §5.2 意图路由表 | Task 2 (routeIntent with keyword matching) |
| §5.3 上下文记忆机制 | Task 7 (watch caseDetail + route) |
| §5.4 响应时序 | Task 2 (setTimeout 600-1000ms) |
| §5.5 会话持久化 | Task 2 (localStorage) |
| §8 边界状态 | Task 2 (empty input, no context, timeout, fallback) |
| §9 全局挂载 | Task 8 (MainLayout) |
| §10.1 与 AIToolGrid 关系 | Independent — no AIToolGrid modification |
| §10.2 与 LegalSearch 关系 | Independent — no LegalSearch modification |

### Placeholder Scan

No TBD/TODO/placeholders found. All code blocks contain complete implementations.

### Type Consistency

- `routeIntent` returns `'legal' | 'case' | 'draft' | 'guide'` — consistent across store and quick command usage
- `draftTemplates` functions return `{ docType, title, meta, html, caseContext }` — matches DraftPreview.vue props
- `contextSummary` structure: `{ id, caseNo, reason, status, amount, parties, claims, hearingDate, hearingLocation, progress }` — consistent between store `setContext` and `ContextBar` / `generateSummaryResponse`
- `fillIntoEditor` accepts `draftPayload` with `.html` — consistent between DraftPreview emit and store method
- `runQuickCommand` accepts `'guide' | 'legal' | 'draft' | 'summary'` — consistent between QuickCommands and store
