# PC仲裁员端重构 — AI 问答助手设计规范

## 1. 概述 (Overview)

本文档定义"PC仲裁员办案系统重构"中 PRD 第十章 `[新增] 智能化能力增强` 的 **AI 问答助手** 设计规范。

助手是一个**全局多轮对话型助理**，通过右下角悬浮球 + 顶栏图标两处入口唤起，展开右侧抽屉式对话面板，覆盖自然语言问答、智能法律检索、辅助文书草拟、上下文记忆四项能力。

### 1.1 设计目标

- 全站可达：任何页面都能唤起助手，不依赖特定路由
- 统一对话流：单一对话界面承载所有能力，通过快捷指令 + 关键词路由分发
- 案件感知：进入案件详情页时自动注入当前案件上下文，文书草拟带上案号/当事人等真实信息
- 与案件详情页现有的「AI 辅助工具卡片」(AIToolGrid) 互补：AIToolGrid 是案件级一次性结构化工具，助手是全局多轮对话，两者独立

### 1.2 范围说明

| 内容 | 状态 |
|------|------|
| 顶栏 AI 图标入口（与通知铃铛并列） | 本期实现 |
| 右下角悬浮球入口（带活动红点） | 本期实现 |
| 右侧抽屉式对话面板（rtl, 420px） | 本期实现 |
| 对话流 + 五种产物卡片（法条/案例/文书草拟/操作指引/案件摘要） | 本期实现 |
| 底部快捷指令（操作指引/查法条/草拟裁决书/案件摘要） | 本期实现 |
| 输入区（回车发送 / Shift+回车换行 + 快捷键提示） | 本期实现 |
| 案件上下文条（案件详情页自动注入） | 本期实现 |
| 上下文记忆（同会话期保留 + 进入案件注入） | 本期实现 |
| 意图路由（关键词匹配分发到四类能力） | 本期实现 |
| Pinia store + Mock 知识库（法条/案例/文书模板/操作指引） | 本期实现 |
| 会话历史 localStorage 持久化（最近 1 个会话） | 本期实现 [建议] |
| 真实 LLM 接入 | 后续迭代 |
| 北大法宝真实接口（运行时） | 后续迭代 |
| 多端会话同步 / 语音输入 / 文件上传给 AI | 后续迭代 |

### 1.3 定位说明

助手定位为"对话型/开放型问答"全局助理，与案件详情页「办案」Tab 内的 [AIToolGrid](../../../src/views/cases/components/detail/work/AIToolGrid.vue) 互补：

- **AIToolGrid**：案件级、一次性、结构化结果（点一下出一份清单/时间轴），保留不动
- **AI 助手**：全局、多轮、对话型，可被任意页面唤起，进入案件时带上下文

两者数据源独立，但助手「填入裁决书编辑器」时会复用 caseDetail store 的 `award.content`，形成闭环。

---

## 2. 信息架构 (Information Architecture)

### 2.1 入口位置

```
MainLayout.vue（全局，所有路由可见）
├── 顶栏 header-right
│   ├── 通知铃铛（现有）
│   └── AI 图标按钮 <AiIconButton>  ← 新增（与铃铛并列）
├── 右下角固定悬浮
│   └── <AiFloatingBall>           ← 新增（带活动红点）
└── 抽屉（teleport to body）
    └── <AiAssistantDrawer>        ← 新增（el-drawer rtl, 420px）
```

两处入口共用 aiAssistant store 的 `visible` 状态，点击任一处切换抽屉开合。

### 2.2 组件结构

```
src/components/ai-assistant/
├── AiAssistantDrawer.vue       # 抽屉容器（编排所有子组件）
├── AiFloatingBall.vue          # 右下角悬浮球
├── AiIconButton.vue            # 顶栏 AI 图标
├── ContextBar.vue              # 案件上下文条（仅案件详情页显示）
├── QuickCommands.vue           # 底部快捷指令 chips
└── messages/
    ├── MessageList.vue         # 对话流滚动列表
    ├── MessageBubble.vue       # 单条消息气泡（区分 ai/user，分发到下列卡片）
    ├── LegalCards.vue          # ① 法律法规卡片组
    ├── CaseCards.vue           # ② 司法案例卡片组
    ├── DraftPreview.vue        # ③ 文书草拟卡片（预览 + 复制/填入编辑器）
    ├── GuideSteps.vue          # ④ 操作指引步骤
    └── SummaryCard.vue         # ⑤ 案件摘要卡片（快捷指令"案件摘要"触发）

src/stores/aiAssistant.js        # 会话状态 + 意图路由 + Mock 响应
src/components/ai-assistant/aiMockData.js  # Mock 知识库（法条/案例/文书模板/指引）
```

### 2.3 设计原则

- 助手挂在 MainLayout，生命周期独立于案件详情页的 AIToolGrid
- 不新增顶部水平主菜单项，保持「首页 / 我的案件 / 待办事项 / 个人中心」四项不变
- 抽屉使用 el-drawer rtl 方向，与系统现有 drawer 风格一致（参考 AIToolDrawer、MobileNavDrawer）
- 全站样式遵循 DESIGN.md：品牌色 #053d99、section-card、字号体系、4 倍数间距

---

## 3. 对话面板布局 (Panel Layout)

抽屉 `el-drawer` 从右滑出，宽度 420px（移动端自适应为 100vw），纵向五段式：

```
┌─────────────────────────────────┐
│ ① 头部 (height: 56px)            │
│   AI 头像 + "AI 办案助手" + 在线状态 │
│   右侧：新会话 ⟲ · 历史 ◷ · 关闭 ✕ │
├─────────────────────────────────┤
│ ② 案件上下文条（条件渲染）         │
│   仅案件详情页显示                │
│   [当前案件] (2026)沪仲第1001号   │
│   · 买卖合同纠纷    切换 ✕       │
├─────────────────────────────────┤
│ ③ 对话流（flex: 1, 可滚动）       │
│   AI 欢迎语                     │
│   user / assistant 气泡交替       │
│   assistant 气泡内嵌产物卡片      │
│   pending 态：骨架/"AI 思考中…"   │
├─────────────────────────────────┤
│ ④ 快捷指令区                     │
│   [操作指引] [查法条]            │
│   [草拟裁决书] [案件摘要]         │
├─────────────────────────────────┤
│ ⑤ 输入区                        │
│   ┌─────────────────────┐ ┌──┐ │
│   │ 输入您的问题…        │ │➤ │ │
│   └─────────────────────┘ └──┘ │
│   Enter 发送  Shift+Enter 换行  │
│                    AI 助手仅供参考│
└─────────────────────────────────┘
```

### 3.1 头部

- 左：圆形渐变头像（品牌色 #053d99 → #3a6bb5）+ "AI 办案助手" 标题 + 绿色"● 在线"状态点
- 右：新会话按钮（⟲ 清空当前会话）、历史按钮（◷ 预留，本期仅图标）、关闭（✕）

### 3.2 案件上下文条（ContextBar）

- **显示条件**：当前路由在 `/cases/:id`（CaseDetail）且 caseDetail store 已加载案件
- 内容：浅蓝底（#d5e3f2）+ "当前案件" tag + 案号 · 案由 + 右侧"切换 ✕"（✕ 解除上下文绑定）
- 解除后：上下文条收起，文书草拟等能力回到"请先进入案件"提示态

### 3.3 对话流（MessageList）

- 气泡左右区分：user 右对齐（品牌色底白字），assistant 左对齐（白底灰边）
- assistant 气泡内可嵌套多张产物卡片（法条/案例/文书/指引/摘要）
- pending 态：assistant 气泡显示三点动画 + "AI 思考中…"
- 新消息自动滚动到底部

### 3.4 快捷指令（QuickCommands）

固定 4 个 chips（圆角胶囊，品牌色描边）：
- **操作指引** → 路由到 guide，返回系统能力总览
- **查法条** → 路由到 legal，基于当前案件案由检索（无上下文则用通用）
- **草拟裁决书** → 路由到 draft，需案件上下文
- **案件摘要** → 路由到 summary，返回当前案件信息摘要（需上下文）

点击 chip 等同于用户发送该指令文本，走统一流程。

### 3.5 输入区

- `el-input type="textarea"` 自适应高度，maxLength=2000
- 回车发送、Shift+回车换行（`@keydown` 判断）
- 发送按钮（品牌色圆形），空内容时 disabled
- 输入框下方提示行：左侧 `<kbd>Enter</kbd> 发送  <kbd>Shift</kbd>+<kbd>Enter</kbd> 换行`，右侧"AI 助手仅供参考"

---

## 4. 产物卡片设计 (Message Cards)

assistant 消息的 `cards` 数组每项有 `type` 字段，MessageBubble 按 type 分发渲染。

### 4.1 法律法规卡片（type: 'legal'）

```js
{
  type: 'legal',
  payload: {
    intro: '为您检索到 3 条相关法律法规：',
    items: [
      {
        name: '《民法典》第五百八十二条',
        snippet: '履行不符合约定的，应当按照当事人的约定承担违约责任……',
        relevance: '高',  // '高' | '中' | '低' → 红/橙/灰标签
        source: 'pkulaw',
      },
      // ...
    ]
  }
}
```

渲染：左 3px 品牌色竖条 + 浅蓝底卡片，标题 + 关联度 tag + 摘要 + "查看原文 ›"（外部链接，Mock 跳 pkulaw.com）。高关联卡片额外显示"引用到文书"操作。

### 4.2 司法案例卡片（type: 'case'）

```js
{
  type: 'case',
  payload: {
    intro: '找到 2 个类似案例：',
    items: [
      {
        caseNo: '(2024)沪仲第558号',
        reason: '买卖合同纠纷',
        tag: '类案',  // '类案' | '指导'
        amount: 280,  // 万元，可选
        hearingDate: '2024-08-12',
        focusLabel: '争议焦点',  // '争议焦点' | '裁判要旨'
        focus: '买受人收货后未在检验期内提出质量异议，是否丧失质量抗辩权',
        source: 'pkulaw',
      },
      // ...
    ]
  }
}
```

渲染：灰边框卡片，案号 + tag（类案绿/指导蓝）+ 裁决信息 + 焦点/要旨 + "查看判决书 ›"。

### 4.3 文书草拟卡片（type: 'draft'）

```js
{
  type: 'draft',
  payload: {
    docType: '裁决书',  // '裁决书' | '庭审笔录' | '延期申请书'
    title: '裁决书（初稿）',
    meta: '基于 (2026)沪仲第1001号',
    html: '<h4>上海仲裁委员会裁决书</h4><p>...</p>',  // 富文本预览内容
    caseContext: '1001',  // 关联案件 ID，用于"填入编辑器"
  }
}
```

渲染：蓝色头部（标题 + 案件来源）+ 只读富文本预览区（max-height 限制，可滚动）+ 底部操作按钮：
- "复制全文"（ghost 按钮，写入剪贴板）
- "填入裁决书编辑器"（primary 按钮，调 caseDetail store 写 `award.content`）

### 4.4 操作指引卡片（type: 'guide'）

```js
{
  type: 'guide',
  payload: {
    intro: '「发起延期审批」的操作步骤：',
    steps: [
      '进入 **我的案件**，点击目标案件的案号进入**案件详情页**',
      '切换到 **「办案」Tab**，找到「案件待办」区块',
      // ...
    ],
    tip: '审限到期前 15 天系统会黄色高亮提醒，建议尽早提交',  // 可选
  }
}
```

渲染：编号步骤列表（圆形品牌色序号）+ 步骤内 `**粗体**` 文本渲染为品牌色加粗 + 可选黄色注意事项提示条。

### 4.5 案件摘要卡片（type: 'summary'）

```js
{
  type: 'summary',
  payload: {
    caseNo: '(2026)沪仲第1001号',
    reason: '买卖合同纠纷',
    status: '审理中',
    amount: 3500,  // 万元
    parties: {
      applicants: ['上海宏图贸易有限公司', '李明'],
      respondents: ['上海远东物流有限公司'],
    },
    claimSummary: '责令被申请人支付货款 350 万元及违约金 35 万元',
    progress: '已组庭，待第一次开庭（2026-09-15）',
  }
}
```

渲染：信息卡片，案号/案由/状态顶栏 + 标的 + 当事人列表 + 请求摘要 + 当前进度。无操作按钮（纯展示）。仅在案件上下文存在时可用。

---

## 5. 数据流与意图路由 (Data Flow)

### 5.1 消息数据结构

```js
// src/stores/aiAssistant.js
{
  id: 'msg-001',               // 唯一 ID
  role: 'user' | 'assistant',  // 发送方
  content: '买卖合同纠纷引用什么法条',  // 文本内容
  cards: [],                   // 结构化产物卡片（仅 assistant 有，可为空）
  timestamp: 1785925020,
  pending: false,              // AI 思考中态
  contextCaseId: '1001',      // 这条回复关联的案件 ID
}
```

### 5.2 意图路由

用户发送文本 → `routeIntent(text)` 关键词匹配 → 返回能力类型：

| 命中关键词 | 路由到 | 返回卡片类型 |
|---|---|---|
| 法条/法律/法规/民法典/合同法 + 案由 | 法律检索 | `legal` |
| 案例/判例/类案/判决 | 案例检索 | `case` |
| 草拟/生成/写 + 裁决书/笔录/延期申请 | 文书草拟 | `draft` |
| 怎么/如何/步骤/操作/在哪 + 业务词 | 操作指引 | `guide` |
| （以上都不命中） | 默认 FAQ | `guide`（兜底：系统能力总览） |

快捷指令跳过路由，直接绑定固定能力。其中 `summary`（案件摘要）**仅**由快捷指令触发，不从自由文本路由进入——其数据直接从 caseDetail store 读取（caseInfo + parties + claims.claimList + hearings），无需在 aiMockData.js 中维护独立 Mock 库。

### 5.3 上下文记忆机制

```
进入案件详情页 (/cases/:id)
   ↓
caseDetail store 加载该案件（fetchCaseDetail）
   ↓
aiAssistant store 监听 caseDetail.currentCaseId 变化
   ↓ 自动设置 contextCaseId + contextSummary（案号/案由/当事人/请求事项）
助手回复时据此个性化：
  - 法律检索：基于案由匹配 legalDb
  - 文书草拟：draftTemplates 函数接收 ctx 动态拼装
  - 操作指引：引用该案件实际待办
```

离开案件详情页（路由变化且不在 `/cases/:id`）：清空 contextCaseId，ContextBar 隐藏。

### 5.4 响应时序

```
用户发送
  ↓ 乐观插入 user msg（立即显示）
  assistant msg 插入，pending=true（显示"AI 思考中…"骨架）
  ↓ setTimeout 600-1000ms（模拟网络延迟）
  pending=false，填充 cards（从 Mock 知识库取数）
```

### 5.5 会话历史持久化 [建议]

- `localStorage` key: `ai_assistant_session`，存储 `messages` 数组
- 抽屉重开时恢复最近 1 个会话
- "新会话"按钮清空当前会话并删除 localStorage 记录
- 仅浏览器环境、单用户场景，不做多端同步

---

## 6. Mock 知识库 (Mock Data)

集中在 `src/components/ai-assistant/aiMockData.js`，按能力分区：

### 6.1 法律法规（legalDb）

按案由检索，命中后返回法条数组，无匹配用 `_default`：

```js
export const legalDb = {
  '买卖合同纠纷': [
    { name: '《民法典》第五百八十二条', snippet: '...', relevance: '高', source: 'pkulaw' },
    { name: '《民法典》第五百八十三条', snippet: '...', relevance: '高', source: 'pkulaw' },
    { name: '《民法典》第六百一十五条', snippet: '...', relevance: '中', source: 'pkulaw' },
  ],
  '建设工程纠纷': [ /* ... */ ],
  '民间借贷纠纷': [ /* ... */ ],
  _default: [ /* 通用法条 3 条 */ ],
}
```

### 6.2 司法案例（caseDb）

结构同 legalDb，按案由分组，含 `_default` 兜底。

### 6.3 文书草拟（draftTemplates）

**函数形式**，接收案件上下文 `ctx` 动态拼装，体现"上下文记忆"：

```js
export const draftTemplates = {
  award: (ctx) => ({
    docType: '裁决书',
    title: '裁决书（初稿）',
    meta: `基于 ${ctx.caseNo}`,
    html: buildAwardHtml(ctx),  // 带 ctx.caseNo / 当事人 / 请求事项
    caseContext: ctx.id,
  }),
  record: (ctx) => ({ /* 庭审笔录 */ }),
  extension: (ctx) => ({ /* 延期申请书 */ }),
}
```

### 6.4 操作指引（guideDb）

按 intent 命中，含 `_default` 兜底：

```js
export const guideDb = {
  extend: { intro: '「发起延期审批」的操作步骤：', steps: [...], tip: '...' },
  review: { intro: '「裁决书核阅」的操作步骤：', steps: [...] },
  sign:   { intro: '「笔录签名」的操作步骤：', steps: [...] },
  _default: { intro: '我可以帮您：', steps: [系统能力总览], tip: undefined },
}
```

---

## 7. Pinia Store 设计 (State Management)

```js
// src/stores/aiAssistant.js
export const useAiAssistantStore = defineStore('aiAssistant', () => {
  // 状态
  const visible = ref(false)           // 抽屉开合
  const messages = ref([])             // 消息列表
  const loading = ref(false)           // AI 响应中
  const contextCaseId = ref('')        // 当前案件上下文 ID
  const contextSummary = ref(null)     // { caseNo, reason, applicants, respondents, claims }

  // 方法
  const toggle = () => { visible.value = !visible.value }
  const open = () => { visible.value = true }
  const close = () => { visible.value = false }
  const newSession = () => { messages.value = []; /* 清 localStorage */ }
  const setContext = (caseId, summary) => { ... }  // 由 caseDetail 变化触发
  const clearContext = () => { ... }
  const sendMessage = async (text) => {             // 发送消息主流程
    // 1. 乐观插入 user msg
    // 2. 插入 pending assistant msg
    // 3. routeIntent(text) → 选 mock 响应
    // 4. setTimeout 模拟延迟 → 填充 cards, pending=false
    // 5. 持久化到 localStorage
  }
  const runQuickCommand = (cmd) => { ... }          // 快捷指令入口
  const fillIntoEditor = (draftPayload) => { ... }  // 填入裁决书编辑器
  const routeIntent = (text) => { ... }             // 关键词路由
  const persistSession = () => { ... }              // localStorage 写入
  const restoreSession = () => { ... }              // localStorage 读取

  return { visible, messages, loading, contextCaseId, contextSummary,
           toggle, open, close, newSession, setContext, clearContext,
           sendMessage, runQuickCommand, fillIntoEditor }
})
```

### 7.1 案件上下文联动

在 `AiAssistantDrawer.vue` 的 `onMounted` / 路由 watch 中，读取 caseDetail store：

```js
watch(
  () => caseDetailStore.currentCaseId,
  (id) => {
    if (id && route.path.startsWith('/cases/')) {
      aiStore.setContext(id, {
        caseNo: caseDetailStore.caseInfo.caseNo,
        reason: caseDetailStore.caseInfo.caseReason,
        // ...
      })
    } else {
      aiStore.clearContext()
    }
  }
)
```

---

## 8. 边界状态与错误处理 (Edge Cases)

| 场景 | 处理 |
|------|------|
| 输入为空/纯空格 | 发送按钮 disabled，不发消息 |
| 意图未命中（无法理解） | 返回兜底 `guide`：列系统核心能力 + 建议使用快捷指令 |
| 法律检索无匹配案由 | 返回 `_default` 通用法条 + 文案"未找到精确匹配，以下是相关法规" |
| 文书草拟无案件上下文（非案件页） | 返回提示："请先进入一个案件详情页，我才能草拟文书" |
| 案件摘要无案件上下文（非案件页） | 返回提示："请先进入一个案件详情页，我才能生成案件摘要" |
| 「填入编辑器」但不在案件详情页 | ElMessage.warning("请在案件详情页使用此功能") + 引导跳转 |
| 「填入编辑器」在案件详情页 | 调 caseDetail store 写 `award.content` + ElMessage.success("已填入裁决书编辑器") |
| 消息超长 | 输入框 maxLength=2000，超出截断 |
| Mock 响应超时 | 8s 后 pending→false，返回错误气泡"请求失败，请重试" + 重试按钮 |
| 会话历史 localStorage 读取失败 | 静默降级，开启空新会话 |

---

## 9. 全局组件挂载 (Mounting)

在 `src/layout/MainLayout.vue` 末尾挂载三个组件：

```vue
<template>
  <el-container class="common-layout">
    <!-- 现有 header / main -->
  </el-container>
  <!-- 移动端抽屉（现有） -->
  <el-drawer ... />

  <!-- ★ 新增：AI 助手三件套 -->
  <AiIconButton />
  <AiFloatingBall />
  <AiAssistantDrawer />
</template>
```

- `AiIconButton`：渲染在顶栏 header-right 内（通知铃铛右侧），通过 teleport 或直接插入 DOM
- `AiFloatingBall`：`position: fixed; right: 24px; bottom: 24px; z-index: 2000`
- `AiAssistantDrawer`：el-drawer 通过 teleport 自动挂到 body

移动端（≤768px）：隐藏顶栏 AI 图标（随顶栏菜单一起隐藏），保留悬浮球；抽屉宽度变为 100vw。

---

## 10. 与现有模块的关系

### 10.1 与案件详情页 AIToolGrid 的关系

| 维度 | AIToolGrid（现有，保留） | AI 助手（新增） |
|------|------------------------|----------------|
| 作用域 | 案件详情页「办案」Tab | 全站 |
| 交互 | 点工具卡片 → 出一份结构化结果 | 多轮对话 |
| 数据源 | aiMockResults.js（固定结构） | aiMockData.js（按案由/上下文动态） |
| 入口 | 案件详情页内 | 悬浮球 + 顶栏图标 |

两者独立，不互相调用。但助手「填入编辑器」复用 caseDetail store 的 `award.content`，与 AIToolDrawer 的"复制到编辑器"形成一致闭环。

### 10.2 与首页 LegalSearch 的关系

首页 [LegalSearch](../../../src/views/home/components/LegalSearch.vue) 是独立的北大法宝检索框（现有，仅 console.log）。AI 助手的"查法条"是对话式检索，两者不合并：
- LegalSearch 保留为首页快捷工具
- AI 助手的法律检索在对话面板内，结果以卡片呈现

### 10.3 对 DESIGN.md 的遵循

- 品牌色 #053d99 用于：AI 头像渐变、user 气泡底色、法条卡片竖条、快捷指令描边、发送按钮
- 字号体系：标题 16px/600，正文 14px/400，辅助 12px，微标签 10px
- 间距：抽屉内 padding 16-20px，区块间 12-16px，4 倍数刻度
- 圆角：气泡 8px，卡片 4px，按钮 3px，胶囊 12px
- 空状态、loading 骨架遵循现有模式

---

## 11. 测试要点 (Testing)

- **意图路由**：各类关键词命中正确能力，未命中走兜底 `_default`
- **案件上下文注入**：进入/离开案件详情页，ContextBar 显示/隐藏；文书草拟带上案件信息
- **产物卡片渲染**：五种卡片类型（legal/case/draft/guide/summary）各自字段完整、操作按钮可点
- **填入编辑器闭环**：在案件详情页点「填入」，AwardEditor 内容更新
- **输入区**：回车发送、Shift+回车换行、空内容禁用发送、maxLength 截断
- **空状态/错误态**：新会话欢迎语、超时错误气泡、无匹配法条兜底
- **会话持久化**：刷新页面后会话恢复、"新会话"按钮清空
- **响应式**：移动端悬浮球可见、顶栏图标隐藏、抽屉全屏

---

## 12. 后续迭代方向（本期不做）

- 真实 LLM 接入（问答/文书/记忆接 OpenAI 或文心一言）
- 北大法宝运行时真实接口（开发期 MCP 不进运行时）
- 「知识同步更新」自动化（本期 Mock 数据手动维护）
- 多端会话同步、用户间共享
- 语音输入、文件上传给 AI 分析
- 历史会话管理（本期历史按钮仅占位）
