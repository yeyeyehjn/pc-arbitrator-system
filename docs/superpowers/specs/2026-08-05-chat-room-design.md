# PC仲裁员端重构 — 案件讨论聊天室设计规范

## 1. 概述 (Overview)

本文档定义"PC仲裁员办案系统重构"中 **"案件讨论聊天室"模块** 的设计规范。该模块对应 PRD 第十一章 `[新增] 案件讨论聊天室`，为每个案件提供专属聊天室，支持多方协作沟通与证据交换。

### 1.1 设计目标

- 为仲裁员提供案件专属的多类型会话沟通能力（案件讨论 / 在线示证 / 私聊）
- 通过双入口（案件详情页 Tab + 首页悬浮球抽屉）覆盖"单案件深度办理"与"跨案件快速查看"两类场景
- 统一 ChatPanel 组件复用，避免重复代码，保证数据状态全局一致

### 1.2 范围说明

| 内容 | 状态 |
|------|------|
| 仲裁员视角的聊天室 UI 与交互（收发消息、查看成员、上传附件） | 本期实现 |
| ChatPanel 双模式复用（embedded 嵌入 / drawer 抽屉） | 本期实现 |
| 首页悬浮球 + 未读徽标 + 抽屉面板 | 本期实现 |
| 案件详情页"讨论"Tab + 参与方提示条 | 本期实现 |
| 三类会话（案件讨论 / 在线示证 / 私聊） | 本期实现 |
| Mock 数据驱动（无 WebSocket 实时推送） | 本期实现 |
| 当事人端聊天能力（属另一套系统） | 不在本期范围 |
| WebSocket 实时推送、已读未读、@提及、消息撤回、消息搜索 | 后续迭代 |
| 在线示证的专用大图预览 / 标注重点 / 证据编号排序 | 后续迭代 |

### 1.3 定位说明

本期聚焦"仲裁员 PC 端的聊天室界面与交互"，数据全部 mock。当事人端由另一套系统实现，仲裁员端能看到当事人发的消息（mock），但不能由本系统代当事人发出。实时推送、已读回执等高级能力留待后端能力就绪后迭代。

### 1.4 关键决策摘要

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 视角范围 | 仅仲裁员视角 | 本系统是仲裁员 PC 端，当事人端属另一系统 |
| 功能深度 | 基础聊天 + mock 数据 | 后端能力未确定，先落地 UI 与交互 |
| 入口位置 | 案件详情页 Tab + 首页悬浮球抽屉 | 兼顾深度办理与快速查看 |
| 悬浮形态 | 悬浮球 + 抽屉面板 | 不离开当前页面即可查看消息 |
| 在线示证 | 等同普通会话 | 参与人限仲裁员+秘书，后续再做专用界面 |
| 私聊范围 | 仅内部成员（秘书、其他仲裁员） | 合规要求，避免与当事人单方接触 |

---

## 2. 信息架构 (Information Architecture)

### 2.1 组件结构与入口

```
布局层 MainLayout.vue
├─ 首页 HomeView.vue（及其他页面）
│  └─ FloatingChatButton.vue（全局悬浮球，挂在 MainLayout）
│     └─ ChatDrawer.vue（el-drawer 抽屉壳）
│        └─ ChatPanel.vue mode="drawer"
│           ├─ ConversationList.vue（跨案件会话列表，可切换）
│           └─ MessageList.vue + MessageInput.vue
│
└─ 案件详情 CaseDetailView.vue
   └─ el-tabs 新增"讨论"Tab
      └─ DiscussionTab.vue（包裹 ChatPanel embedded）
         └─ ChatPanel.vue mode="embedded"
            ├─ 会话切换标签（本案件内：讨论/示证/私聊）
            ├─ 参与方提示条（显示当前会话的参与角色）
            └─ MessageList.vue + MessageInput.vue（同一套渲染逻辑）

数据层
stores/chat.js（单一 store，两入口共享）
├─ conversations[]                    // 按 caseId 组织的会话
├── messages { [convId]: [] }         // 按会话 ID 索引的消息数组
├─ currentUserId                      // 当前仲裁员 ID
├─ unreadCount (getter)               // 全局未读总数（悬浮球徽标用）
├─ getConversationsByCase(caseId)     // 获取某案件的所有会话
├─ getConversationMessages(convId)    // 获取某会话的消息列表
├─ sendMessage(convId, payload)       // 发送消息
├─ markAsRead(convId)                 // 标记会话已读
└─ startPrivateChat(caseId, targetUser) // 发起私聊
```

### 2.2 新增文件清单

| 文件 | 类型 | 职责 |
|------|------|------|
| `src/stores/chat.js` | 新增 | 会话/消息/未读数管理，Pinia store |
| `src/components/chat/ChatPanel.vue` | 新增 | 聊天主体组件，双模式复用 |
| `src/components/chat/FloatingChatButton.vue` | 新增 | 全局悬浮球 + 未读徽标 |
| `src/components/chat/ChatDrawer.vue` | 新增 | 抽屉壳（el-drawer 包裹 ChatPanel drawer 模式） |
| `src/components/chat/MessageList.vue` | 新增 | 消息流渲染（气泡/附件/系统消息） |
| `src/components/chat/MessageInput.vue` | 新增 | 输入框 + 附件上传 |
| `src/components/chat/ConversationList.vue` | 新增 | 会话列表（抽屉模式跨案件列表） |
| `src/views/cases/components/detail/DiscussionTab.vue` | 新增 | 案件详情"讨论"Tab（包裹 ChatPanel embedded） |

### 2.3 改动文件清单

| 文件 | 改动内容 |
|------|----------|
| `src/views/cases/CaseDetailView.vue` | el-tabs 新增"讨论"Tab，引入 DiscussionTab |
| `src/layout/MainLayout.vue` | 引入 FloatingChatButton，全局挂载 |
| `src/stores/caseDetail.js` | activeTab 增加 `'discussion'` 选项 |

### 2.4 关键架构决策

- **ChatPanel 双模式**：通过 `mode` prop 区分。`mode="embedded"` 隐藏跨案件会话列表（案件已锁定），显示本案件内三类会话横向标签切换 + 参与方提示条；`mode="drawer"` 显示跨案件会话列表（ConversationList），点击切换到消息区。
- **悬浮球全局挂载**：挂在 MainLayout 而非仅首页，这样切换页面也能看到未读提醒，与"首页右侧悬浮"诉求一致且更实用。
- **三类会话统一渲染**：案件讨论 / 在线示证 / 私聊都用同一套 MessageList，仅参与人范围不同，由 store 数据决定。
- **不新增一级路由**：聊天室不占用顶部导航菜单位，通过悬浮球和详情 Tab 进入。

---

## 3. 数据模型 (Data Model)

### 3.1 类型定义

```js
// ============ 会话 Conversation ============
{
  id: "c1",                              // 会话 ID
  caseId: "2026-001",                    // 所属案件 ID
  caseNo: "(2026)京仲字第001号",          // 案件编号（抽屉跨案件列表显示用）
  type: "discussion",                    // discussion(案件讨论) | evidence(在线示证) | private(私聊)
  title: "案件讨论",                      // 会话标题
  participants: [                        // 参与方列表（决定参与方提示条内容）
    { id: "u1", name: "张秘书", role: "secretary", avatar: "秘" },
    { id: "u2", name: "李仲裁员", role: "arbitrator", avatar: "李" },
    { id: "u3", name: "申请人A公司", role: "party", avatar: "申" }
  ],
  // 私聊会话额外字段
  targetUserId: "u2",                    // 仅 type=private，当前对谈对象 ID
  targetName: "李仲裁员",                 // 仅 type=private，当前对谈对象名称
  // 聚合字段
  lastMessage: {                         // 最后一条消息（会话列表排序与预览用）
    content: "证据材料已上传",
    senderId: "u1",
    senderName: "张秘书",
    time: "2026-08-05 10:30"
  },
  unreadCount: 2,                        // 未读消息数
  updatedAt: "2026-08-05 10:30"          // 最后更新时间
}

// ============ 消息 Message ============
{
  id: "m1",                              // 消息 ID
  conversationId: "c1",                  // 所属会话 ID
  senderId: "u1",                        // 发送者 ID
  senderName: "张秘书",                   // 发送者名称
  senderRole: "secretary",               // 发送者角色：secretary | arbitrator | party
  type: "text",                          // text(文本) | file(附件) | system(系统消息)
  content: "证据材料已上传",               // 消息内容（text/system 有值，file 为附件说明）
  attachments: [                         // 仅 type=file 时存在
    { name: "合同扫描件.pdf", url: "#mock", size: "2.3MB" }
  ],
  createdAt: "2026-08-05 10:30:00",      // 创建时间
  isMine: false                          // 渲染时计算：是否当前仲裁员发送（决定气泡左右）
}
```

### 3.2 Store API

```js
// stores/chat.js — Pinia store
state: {
  conversations: [],           // 所有会话
  messages: {},                // { [conversationId]: Message[] }
  currentUserId: 'me',         // 当前仲裁员 ID
}

getters: {
  totalUnreadCount,            // 全局未读总数（悬浮球徽标）
  getConversationsByCase: (caseId) => conversations.filter(c => c.caseId === caseId),
  getConversationMessages: (convId) => messages[convId] || [],
}

actions: {
  sendMessage(conversationId, { type, content, attachments }),
  markAsRead(conversationId),
  startPrivateChat(caseId, targetUser),   // 创建或复用私聊会话
}
```

### 3.3 Mock 数据示例

```js
// 案件 2026-001 的三类会话
conversations: [
  {
    id: "c-disc-001",
    caseId: "2026-001",
    caseNo: "(2026)京仲字第001号",
    type: "discussion",
    title: "案件讨论",
    participants: [
      { id: "u-sec", name: "张秘书", role: "secretary", avatar: "张" },
      { id: "me", name: "我", role: "arbitrator", avatar: "我" },
      { id: "u-arb2", name: "王仲裁员", role: "arbitrator", avatar: "王" },
      { id: "u-app", name: "申请人A公司", role: "party", avatar: "申" },
      { id: "u-res", name: "被申请人B公司", role: "party", avatar: "被" }
    ],
    unreadCount: 2,
    lastMessage: { content: "证据材料已上传，请查阅", senderId: "u-sec", senderName: "张秘书", time: "2026-08-05 10:30" },
    updatedAt: "2026-08-05 10:30"
  },
  {
    id: "c-evi-001",
    caseId: "2026-001",
    caseNo: "(2026)京仲字第001号",
    type: "evidence",
    title: "在线示证",
    participants: [
      { id: "u-sec", name: "张秘书", role: "secretary", avatar: "张" },
      { id: "me", name: "我", role: "arbitrator", avatar: "我" },
      { id: "u-arb2", name: "王仲裁员", role: "arbitrator", avatar: "王" }
    ],
    unreadCount: 0,
    lastMessage: { content: "[附件] 合同扫描件.pdf", senderId: "u-sec", senderName: "张秘书", time: "2026-08-05 09:15" },
    updatedAt: "2026-08-05 09:15"
  }
  // 私聊会话在仲裁员发起时动态创建
]

// 会话 c-disc-001 的消息
messages: {
  "c-disc-001": [
    { id: "m1", conversationId: "c-disc-001", senderId: "u-sec", senderName: "张秘书", senderRole: "secretary", type: "system", content: "案件讨论会话已创建", createdAt: "2026-08-05 09:00:00", isMine: false },
    { id: "m2", conversationId: "c-disc-001", senderId: "u-sec", senderName: "张秘书", senderRole: "secretary", type: "text", content: "各位仲裁员好，本案证据材料已上传", createdAt: "2026-08-05 09:01:00", isMine: false },
    { id: "m3", conversationId: "c-disc-001", senderId: "me", senderName: "我", senderRole: "arbitrator", type: "text", content: "收到，我查阅一下", createdAt: "2026-08-05 09:05:00", isMine: true },
    { id: "m4", conversationId: "c-disc-001", senderId: "u-sec", senderName: "张秘书", senderRole: "secretary", type: "file", content: "证据材料已上传", attachments: [{ name: "合同扫描件.pdf", url: "#mock", size: "2.3MB" }], createdAt: "2026-08-05 10:30:00", isMine: false }
  ]
}
```

---

## 4. 组件设计与交互细节 (Component Design & Interaction)

### 4.1 ChatPanel.vue — 双模式聊天主体

**Props：**

| Prop | 类型 | 说明 |
|------|------|------|
| `mode` | `'embedded' \| 'drawer'` | embedded：详情页内嵌，锁定案件；drawer：抽屉，跨案件 |
| `caseId` | `String` | embedded 模式必填，锁定当前案件 |
| `caseNo` | `String` | embedded 模式必填，显示案件编号 |

**内部结构（embedded 模式）：**
1. 会话切换标签（横向）：案件讨论 / 在线示证 / 私聊
2. 参与方提示条：显示当前会话的参与角色标签 + 右侧说明
3. MessageList：消息流区域
4. MessageInput：输入区

**内部结构（drawer 模式）：**
1. 左侧 ConversationList：跨案件会话列表（点击切换）
2. 右侧 MessageList + MessageInput
3. 未选中会话时右侧显示空状态"选择一个会话开始聊天"

### 4.2 参与方提示条

位于会话切换标签下方、消息区上方。浅灰底（`#f8f8f9`），圆角 4px。

| 会话类型 | 参与方标签 | 右侧说明文案 |
|----------|-----------|-------------|
| 案件讨论 | 秘书 · 仲裁员 · 当事人 | 三方公开讨论 |
| 在线示证 | 秘书 · 仲裁员 | 仅内部，不对外 |
| 私聊 | 当前对谈对象名称 | 仅内部成员私聊 |

### 4.3 FloatingChatButton.vue — 全局悬浮球

- 位置：固定右下角（`position: fixed; bottom: 32px; right: 32px`）
- 外观：56px 圆形，主题色底，白色消息图标
- 未读徽标：右上角红色圆点 + 数字（`unreadCount > 0` 时显示，`> 99` 显示 `99+`）
- 交互：点击打开 ChatDrawer
- hover：放大 1.05 + 阴影增强

### 4.4 ChatDrawer.vue — 抽屉壳

- el-drawer，从右侧滑出
- 宽度：PC 400px，移动端 92%（`width: 92% !important`）
- 头部：标题"消息" + 关闭按钮
- 内容：ChatPanel `mode="drawer"`

### 4.5 ConversationList.vue — 会话列表

每项含：
- 左侧圆形头像（图标按类型着色：讨论蓝 `#053d99` / 示证灰 `#e4e7ed` / 私聊绿 `#74C080`）
- 会话标题（案件编号 + 会话类型）+ 最后消息预览（单行省略）
- 右侧未读红点 + 时间
- 选中态：`#f2f5fa` 背景

### 4.6 MessageList.vue — 消息流

- 消息气泡：自己发的（右对齐，主题色 `#053d99` 底白字），他人发的（左对齐，`#f2f5fa` 浅灰底）
- 头像：气泡左侧（他人）/ 右侧（自己），28px 圆形
- 发送者名称：12px，角色色标注（秘书灰 / 仲裁员蓝 / 当事人绿）
- 系统消息：居中，12px 灰色文字，无气泡
- 附件消息：显示文件名 + 大小 + 下载图标
- 空状态："暂无消息，发送第一条消息开始讨论"
- 自动滚动到底部：新消息/切换会话时

### 4.7 MessageInput.vue — 输入区

- 附件按钮（📎 图标）+ 文本输入框 + 发送按钮
- 输入框：`textarea` 自适应高度，placeholder "输入消息..."
- 回车发送 / Shift+回车换行
- 空消息不可发送（发送按钮 disabled）
- 附件上传：本期 mock，点击选择文件后直接插入一条 `type=file` 消息
- 字数限制：1000 字（超出截断 + ElMessage 提示）

### 4.8 DiscussionTab.vue — 详情页"讨论"Tab

- 接收 `caseId` / `caseNo` props
- 内部包裹 ChatPanel `mode="embedded"`
- 私聊标签下：显示内部成员列表（秘书 + 其他仲裁员），点击成员调用 `startPrivateChat` 创建/进入私聊会话

### 4.9 视觉规范遵循

| 规范项 | 应用 |
|------|------|
| 消息气泡正文 | 14px / 400 |
| 发送者名称 | 12px |
| 会话切换标签 | 12px，选中态主题色底白字 |
| 参与方标签 | 11px，`#e4e7ed` 灰底 |
| 移动端抽屉 | el-drawer `width: 92% !important` + `margin: 5vh auto` |
| 悬浮球 | 主题色 `#053d99`，hover 放大 + 阴影 |
| 气泡圆角 | 4px（遵循全局间距刻度） |
| 消息区间距 | 上下 12px（卡片间距规范） |

---

## 5. 边界情况与错误处理 (Edge Cases & Error Handling)

### 5.1 数据边界

| 场景 | 处理 | 用户感知 |
|------|------|----------|
| 会话无消息 | MessageList 空状态 | "暂无消息，发送第一条消息开始讨论" + 图标 |
| 抽屉无任何会话 | ConversationList 空状态 | "暂无会话" + 图标 |
| 私聊会话不存在 | 调用 `startPrivateChat` 创建新会话 | 直接进入新会话，无需额外操作 |
| 附件名称超长 | 截断 + 省略号 | 文件名单行省略 |
| 消息内容超长 | 气泡 max-width 70%，内容自动换行 | 正常换行展示 |

### 5.2 交互边界

| 场景 | 处理 | 用户感知 |
|------|------|----------|
| 空消息发送 | 发送按钮 disabled | 按钮灰色不可点击 |
| 回车发送 | 回车触发发送，清空输入框 | 消息立即出现在列表 |
| Shift+回车 | 输入换行 | 输入框内换行 |
| 附件选择 | 点击📎选择文件后直接插入 file 消息 | 消息区出现附件消息条目 |
| 快速连续发送 | 发送后清空输入框，可立即继续输入 | 无防抖限制（mock 阶段） |
| 切换会话 | 立即加载该会话消息，标记已读 | 未读数清零，红点消失 |
| 抽屉切换案件会话 | 点击跨案件会话项，右侧切换到该会话消息区 | 消息区刷新 |

### 5.3 空状态与加载态

- **会话列表空状态**：图标 + "暂无会话"文案
- **消息列表空状态**：图标 + "暂无消息，发送第一条消息开始讨论"文案
- **抽屉未选中会话**：右侧"选择一个会话开始聊天"居中提示
- **加载态**：Mock 阶段同步填充，无加载态；对接 API 后 MessageList 用 `v-loading`，发送用按钮 loading

### 5.4 操作反馈规范

| 操作 | 成功反馈 | 失败反馈 |
|------|----------|----------|
| 发送文本消息 | 消息立即出现在列表，输入框清空 | — |
| 发送附件消息 | 附件消息出现在列表 | — |
| 标记会话已读 | 未读红点消失，悬浮球徽标数减少 | — |
| 发起私聊 | 直接进入私聊会话 | — |
| 消息超长 | 输入时截断 | ElMessage.warning "消息不能超过1000字" |

---

## 6. 私聊模块详细设计

### 6.1 私聊范围约束

仲裁员**仅可与内部成员（秘书、其他仲裁员）发起私聊**，不可对当事人发起私聊。此约束基于仲裁合规要求（避免与当事人单方接触）。

### 6.2 私聊发起流程（embedded 模式）

1. 点击"私聊"标签 → 显示内部成员列表（从案件 participants 中筛选 `role === 'secretary' || role === 'arbitrator'` 且非自己）
2. 每个成员项含头像 + 姓名 + 角色，右侧"发消息"按钮
3. 点击"发消息" → 调用 `store.startPrivateChat(caseId, targetUser)`
4. Store 检查是否已有该对象的私聊会话：有则复用，无则创建
5. 进入私聊会话消息区，参与方提示条显示对谈对象名称 + "仅内部成员私聊"

### 6.3 私聊会话数据

```js
{
  id: "c-priv-001",
  caseId: "2026-001",
  caseNo: "(2026)京仲字第001号",
  type: "private",
  title: "与王仲裁员",
  targetUserId: "u-arb2",
  targetName: "王仲裁员",
  participants: [
    { id: "me", name: "我", role: "arbitrator", avatar: "我" },
    { id: "u-arb2", name: "王仲裁员", role: "arbitrator", avatar: "王" }
  ],
  unreadCount: 0,
  lastMessage: { ... },
  updatedAt: "..."
}
```

---

## 7. 测试策略 (Testing Strategy)

### 7.1 测试范围

| 类型 | 重点 |
|------|------|
| 单元测试 — store 逻辑 | sendMessage 增加消息、markAsRead 清零未读、startPrivateChat 创建/复用会话、totalUnreadCount 计算 |
| 组件测试 — 交互 | 双模式渲染、会话切换、参与方提示条内容、私聊发起流程、发送按钮 disabled 逻辑 |
| 视觉回归 — 渲染 | 气泡左右对齐、附件消息展示、空状态、悬浮球徽标、移动端抽屉宽度 |

**测试工具**：Vitest（单元/组件测试）+ Vue Test Utils。

### 7.2 关键测试用例

| 用例 | 输入 | 预期 |
|------|------|------|
| 发送文本消息 | sendMessage(convId, {type:'text', content:'hello'}) | messages[convId] 增加 1 条，isMine=true，lastMessage 更新 |
| 标记已读 | markAsRead(convId) | conversation.unreadCount = 0，totalUnreadCount 减少 |
| 发起已有私聊 | startPrivateChat(caseId, existingUser) | 返回已有会话 ID，不创建新会话 |
| 发起新私聊 | startPrivateChat(caseId, newUser) | conversations 增加 1 条 private 会话 |
| 私聊成员过滤 | embedded 私聊标签 | 仅显示 secretary + arbitrator 角色，排除 party |
| 空消息不可发送 | 输入框为空 | 发送按钮 disabled |
| 参与方提示条 | 切换到示证会话 | 显示"秘书 · 仲裁员" + "仅内部，不对外" |

---

## 8. 后续迭代规划 (Future Iterations)

### 8.1 聊天室功能完整路线图

**阶段 1（本期）：基础聊天 + Mock 数据**
- 双入口（详情 Tab + 悬浮球抽屉）
- 三类会话（讨论/示证/私聊）
- 文本 + 附件消息
- Mock 数据驱动

**阶段 2（后续）：实时通信**
- WebSocket 实时推送
- 已读未读回执
- @提及功能
- 消息撤回
- 消息搜索

**阶段 3（远期）：专业能力增强**
- 在线示证专用界面（大图预览 / 标注重点 / 证据编号排序）
- 表情回复
- 消息引用
- 文件预览（PDF/图片在线预览）

### 8.2 本期与后续的衔接

本期 `stores/chat.js` 的方法封装完整，组件层不直接操作数据。后续对接 WebSocket 时，仅需在 store 内部替换 mock 为实时推送逻辑，组件层无需改动。

---

## 9. 风险与缓解 (Risks & Mitigation)

| 风险 | 影响 | 缓解 |
|------|------|------|
| ChatPanel 双模式复杂度 | 两种上下文可能导致组件臃肿 | 通过 props 严格区分，会话列表/标签切换按 mode 条件渲染，逻辑分离 |
| Mock 数据与真实 API 差异 | 后续对接需改 store 内部 | store 方法封装完整，组件层不直接操作数据，替换成本低 |
| 悬浮球遮挡内容 | 右下角悬浮球可能遮挡页面按钮 | 位置避开主操作区（bottom: 32px, right: 32px），z-index 设为 2000 |
| 移动端抽屉体验 | 小屏 400px 抽屉过宽 | 移动端 `width: 92% !important`，遵循项目移动端弹窗规范 |
| 消息列表性能 | 长会话消息过多 | 本期 mock 数据量小；后续对接 API 后做虚拟滚动 |

---

**说明：** 本设计规范聚焦案件讨论聊天室模块第一期（基础聊天 + mock 数据），对应 PRD 第十一章 `[新增] 案件讨论聊天室`。实时推送、已读回执、专用示证界面等高级能力留待后续迭代。
