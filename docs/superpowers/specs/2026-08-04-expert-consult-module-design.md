# PC仲裁员端重构 - 第八阶段设计规范（"专家咨询"模块）

## 1. 概述 (Overview)

本文档定义"PC仲裁员办案系统重构"第八阶段的设计规范，聚焦于 PRD 第七节 **"专家咨询"模块（P2 级次要模块）**。

依据 PRD 补充说明，本模块的两个子模块被拆分到不同父级，彼此独立、分属不同入口：

- **专家咨询案件**（我作为专家处理的咨询案件）→ 放入「待办事项」左侧菜单
- **申请专家咨询案件**（我在办案件中发起过专家咨询的案件）→ 放入「我的案件」左侧菜单

两者不再是同一一级模块下的两个 Tab，而是各自父级下的二级菜单项。

### 1.1 设计目标

- 两个子模块独立接入各自父级侧栏，不新建"专家咨询"一级模块
- 详情页承载咨询信息、专家意见、发表意见三个区块，采用单栏纵向堆叠布局
- 两个详情页复用同一套组件族，通过 `mode` prop 区分可操作 / 只读
- 回避/接受咨询采用统一弹窗内选方式（线上签名 / 上传文件），不跳页
- 全站样式与硬约束保持一致（section-card、div table、字号体系、空状态、分页）

### 1.2 范围说明

| 内容 | 状态 |
|------|------|
| 待办侧栏新增「专家咨询案件」菜单项 + badge | 本期实现 |
| 我的案件侧栏新增「申请专家咨询案件」菜单项 | 本期实现 |
| 移动端下拉选择器同步新增对应项 | 本期实现 |
| 专家咨询案件列表（筛选 + 表格 + 分页 + 状态联动操作） | 本期实现 |
| 申请专家咨询案件列表（筛选 + 表格 + 分页 + 查看专家意见） | 本期实现 |
| 详情页（咨询信息 / 专家回复意见 / 发表意见 + 操作） | 本期实现 |
| 回避/接受咨询签署弹窗（线上签名模拟 GDCA / 上传扫描件） | 本期实现 |
| 提交意见（文本 + 统一附件列表） | 本期实现 |
| 退出咨询（二次确认） | 本期实现 |
| Pinia Store + Mock 数据 | 本期实现 |
| 声明承诺书 docx 真实预览 | 后续迭代（本期文本摘要 Mock） |
| 后端接口对接 | 后续迭代 |

---

## 2. 信息架构 (Information Architecture)

### 2.1 入口位置

```
我的案件侧栏 (/cases)
├── 我的案件          /cases/list        （现有）
├── 数据统计          /cases/statistics  （现有）
└── 申请专家咨询案件  /cases/consult     ← 新增
    └── 查看专家意见  /cases/consult/:id ← 新页面（非弹窗/抽屉）

待办事项侧栏 (/todos)
├── 签名列表          /todos/signature   （现有）
├── 待办中心          /todos/center      （现有）
├── 裁决书核阅列表    /todos/review      （现有）
├── 智能约庭          /todos/scheduling  （现有，[建议]）
└── 专家咨询案件      /todos/consult     ← 新增
    └── 咨询详情页    /todos/consult/:id ← 新页面（非弹窗/抽屉）
```

### 2.2 设计原则

- 不新增顶部水平主菜单项，保持「首页 / 我的案件 / 待办事项 / 个人中心」四项不变
- 两个子模块通过侧栏二级菜单访问，符合其"分属不同业务场景"的本质
  - 专家咨询案件 = 待办任务（我需要处理别人发来的咨询）→ 待办侧
  - 申请专家咨询案件 = 案案关联查询（查看自己案件发起过的咨询结果）→ 我的案件侧
- 两个详情页内容板块几乎一致，复用同一套组件族，通过 `mode` prop 区分：
  - `mode="expert"`：我作为专家，可操作（待办侧）
  - `mode="applicant"`：我作为申请人，只读查看专家意见（我的案件侧）

---

## 3. 路由与文件结构 (Routing & File Structure)

### 3.1 路由配置

在 `src/router/index.js` 两个父路由的 children 中各新增 2 条：

```js
// /cases children 新增
{
  path: 'consult',
  name: 'CaseConsultList',
  component: () => import('../views/cases/components/consult/ConsultListView.vue'),
},
{
  path: 'consult/:id',
  name: 'CaseConsultDetail',
  component: () => import('../views/cases/components/consult/ConsultDetailView.vue'),
},

// /todos children 新增
{
  path: 'consult',
  name: 'TodoConsultList',
  component: () => import('../views/todos/components/consult/ConsultListView.vue'),
},
{
  path: 'consult/:id',
  name: 'TodoConsultDetail',
  component: () => import('../views/todos/components/consult/ConsultDetailView.vue'),
},
```

### 3.2 文件结构

```
src/
├── stores/
│   └── consult.js                              ← 新增：专家咨询 Pinia store
├── views/
│   ├── cases/
│   │   └── components/
│   │       ├── consult/
│   │       │   ├── ConsultListView.vue         ← 申请专家咨询案件列表（cases 侧）
│   │       │   └── ConsultDetailView.vue       ← 查看专家意见（只读，mode=applicant）
│   │       └── shared/
│   │           └── consult/                    ← 复用组件族
│   │               ├── ConsultInfo.vue         ← 区块1：咨询信息
│   │               ├── ConsultOpinion.vue      ← 区块2：专家回复意见
│   │               ├── ConsultEditor.vue       ← 区块3：发表意见编辑 + 操作（expert 模式）
│   │               └── SignCommitmentDialog.vue← 回避/接受咨询签署弹窗
│   └── todos/
│       └── components/
│           └── consult/
│               ├── ConsultListView.vue         ← 专家咨询案件列表（todos 侧）
│               └── ConsultDetailView.vue       ← 咨询详情页（可操作，mode=expert）
```

### 3.3 复用策略

- 两个 `ConsultDetailView.vue` 是薄包装组件，内部引用 `shared/consult/` 下的组件族（ConsultInfo / ConsultOpinion / ConsultEditor），通过 `mode` prop 区分
- 两个 `ConsultListView.vue` 结构相似但筛选项/操作列不同，各自独立实现（避免过度抽象）
- 签署弹窗 `SignCommitmentDialog.vue` 独立成组件，仅被 expert 模式的详情页调用

---

## 4. 专家咨询案件列表页（待办侧 `/todos/consult`）

### 4.1 页面布局

```
┌─ 筛选栏（.filter-bar）────────────────────────────────────┐
│ 咨询标题 [输入框]   咨询秘书 [输入框]   咨询专业 [下拉]     │
│ 处理状态 [下拉: 全部/待处理/已处理]        [查询] [重置]   │
└──────────────────────────────────────────────────────────┘
┌─ 表格区（div table 风格，背景 #F5F7FA）────────────────────┐
│ 表头：序号 │ 咨询标题 │ 咨询秘书 │ 咨询专业 │ 操作         │
│ 数据行…                                                    │
└─ 分页（.pagination-bar，默认 10/页，左对齐）──────────────┘
```

### 4.2 字段定义

| 列 | 字段 | 说明 |
|----|------|------|
| 序号 | index | 自动序号 |
| 咨询标题 | title | 点击可进入详情页（同操作按钮入口） |
| 咨询秘书 | secretary | 文本展示 |
| 咨询专业 | specialty | 标签 tag 展示（如"建设工程"） |
| 操作 | - | **按状态联动按钮**（见 4.4） |

### 4.3 状态标识（Tag 样式）

| 状态 | 标签 | 颜色 | el-tag type | 说明 |
|------|------|------|-------------|------|
| 待处理 | `pending` | 橙色 #e6a23c | `warning` | 含未签署声明承诺书的初始态 |
| 未回复意见 | `unreplied` | 绿色 #67c23a | `success` | 已接受咨询，待提交意见的中间态 |
| 已处理 | `processed` | 灰色 #909399 | `info` | 终态 |

### 4.4 操作列按钮联动规则

| 行状态 | 显示按钮 | 点击行为 |
|--------|----------|----------|
| 待处理 | 「回避/接受咨询」「退出咨询」 | 进入 `/todos/consult/:id` 详情页 |
| 未回复意见 | 「提交意见」「退出咨询」 | 进入详情页（默认滚动到意见编辑区） |
| 已处理 | 「查看」（灰色文字按钮） | 进入详情页只读查看历史咨询 |

### 4.5 筛选交互

- **咨询专业**下拉：全部 / 金融投资 / 线下会议 / 港澳法律 / 建设工程（PRD 枚举值）
- **处理状态**下拉：全部 / 待处理 / 已处理
  - "未回复意见"作为"待处理"的子状态，在"待处理"筛选下一并展示；不单独作为筛选项（保持筛选栏简洁）
- 点击「查询」重置分页到第 1 页；「重置」清空所有筛选项

---

## 5. 申请专家咨询案件列表页（我的案件侧 `/cases/consult`）

### 5.1 页面布局

结构与第 4 节一致（筛选栏 + 表格 + 分页），但筛选项和操作列不同。

### 5.2 与待办侧列表的关键差异

| 差异点 | 专家咨询案件（待办侧） | 申请专家咨询案件（我的案件侧） |
|--------|------------------------|--------------------------------|
| 视角 | 我作为**专家**处理别人发起的咨询 | 我作为**申请人**查看自己案件发起的咨询 |
| 筛选项 | 有"处理状态"筛选（待处理/已处理） | **无状态筛选**（这些都是我发起的，只有已回复结果） |
| 操作列 | 按状态联动（回避/接受/提交意见/退出） | **固定单一按钮**「查看专家意见」 |
| 点击行为 | 进入可操作的详情页 | 进入**只读**详情页（mode="applicant"） |
| 侧栏 badge | 有（待处理数） | **无**（非待办性质） |

### 5.3 字段定义

| 列 | 字段 | 说明 |
|----|------|------|
| 序号 | index | 自动序号 |
| 咨询标题 | title | - |
| 咨询秘书 | secretary | - |
| 咨询专业 | specialty | 标签 tag |
| 操作 | - | 「查看专家意见」→ 跳转 `/cases/consult/:id` |

### 5.4 筛选交互

- 咨询专业下拉同第 4.5 节（全部/金融投资/线下会议/港澳法律/建设工程）
- 无"处理状态"筛选项（这些案件都已走过咨询流程，状态不作为过滤维度）

---

## 6. 专家咨询详情页（核心）

详情页是整个模块的核心。两个入口（`/todos/consult/:id` 可操作、`/cases/consult/:id` 只读）**复用同一套组件族**，通过 `mode` prop 区分。

### 6.1 页面整体结构（单栏纵向堆叠）

```
┌─ 面包屑/返回栏 ──────────────────────────────────────────┐
│  ‹ 返回          专家咨询详情                              │
├─ 标题 + 状态栏（.section-card）──────────────────────────┤
│  关于XX建设工程纠纷的专家咨询          [待处理]            │
│  关联案件：案号2024-0456 · 咨询专业：建设工程              │
├─ 区块1：咨询信息（.section-card）────────────────────────┤
│  标题 / 咨询专业 / 咨询秘书 / 关联案件 / 争议焦点          │
│  案件审理报告（📄 查看.pdf）                                │
│  附件（📎 证据清单.pdf  📎 鉴定意见.pdf）                   │
├─ 区块2：专家回复意见（.section-card）────────────────────┤
│  · 有意见：展示意见内容 + 附件 + 提交时间                   │
│  · 无意见：空状态"暂无回复意见"                             │
├─ 区块3：发表意见 + 操作按钮（.section-card，仅 expert 模式）┤
│  [输入框，自动保存]  📎 上传附件                           │
│  [回避/接受咨询] [提交意见]              [退出咨询]         │
└──────────────────────────────────────────────────────────┘
```

### 6.2 mode 区分逻辑

| 区块 | `mode="expert"`（待办侧，我作为专家） | `mode="applicant"`（我的案件侧，我发起的） |
|------|---------------------------------------|---------------------------------------------|
| 咨询信息 | ✅ 展示 | ✅ 展示 |
| 专家回复意见 | ✅ 展示 | ✅ 展示（**这是申请人要看的"专家意见"**） |
| 发表意见编辑区 | ✅ 显示，可编辑 | ❌ **隐藏**（申请人不能写意见） |
| 操作按钮 | ✅ 按状态联动 | ❌ **隐藏**（只读） |

### 6.3 操作按钮显示规则（expert 模式）

| 详情页状态 | 操作区显示 |
|------------|------------|
| 待处理 | 「回避/接受咨询」+「退出咨询」 |
| 未回复意见 | 「提交意见」+「退出咨询」 |
| 已处理 | 无操作按钮（区块3整体隐藏，与 applicant 模式一致） |

### 6.4 「回避/接受咨询」签署弹窗（统一弹窗内选方式）

点击后弹出 el-dialog，弹窗内两步：

```
签署弹窗
├── 步骤1：选择确认方式
│   ├── ① 线上签名（GDCA）──┐
│   └── ② 上传扫描件 ────────┤
│                             ↓
├── 步骤2：子流程（按选择）
│   ├── ① 线上签名：
│   │   ├── 弹窗内展示声明承诺书文本摘要（Mock 占位）
│   │   ├── 模拟 GDCA 接口（点击"调起签名"→ 模拟 loading → 成功）
│   │   └── 选择"回避咨询"或"接受咨询" → 提交
│   └── ② 上传扫描件：
│       ├── 下载声明承诺书模板（<a download>）
│       ├── 上传扫描件（单文件，el-upload）
│       └── 选择"回避咨询"或"接受咨询" → 提交
└── 完成后：关闭弹窗 → 状态更新 → 详情页刷新
```

### 6.5 「提交意见」流程

- 入口：详情页底部「提交意见」按钮（未回复意见状态）
- 操作：在区块3输入框填写意见 → 可上传附件（统一附件列表，添加/删除）→ 点击「提交意见」→ 系统自动保存 → 状态更新为"已处理"
- 附件：单一列表，不区分类型（法律文书/证据材料混在一起，简化实现）
- 自动保存：输入过程中 debounce 自动保存草稿（Mock 仅前端状态）

### 6.6 「退出咨询」流程

- 入口：操作区的「退出咨询」按钮（红色文字按钮，右对齐）
- 流程：点击 → `ElMessageBox.confirm` 二次确认"确定退出本次咨询？" → 确认后状态更新为"已处理" → 返回列表页

### 6.7 声明承诺书预览

- 本期 Mock：弹窗内文本摘要（占位文本，不真实解析 docs/声明承诺书.docx）
- 文案示例："本人作为专家，郑重声明将独立、公正地出具咨询意见……（声明承诺书正文）"
- 后续迭代可接入 docx 转 HTML 预览

---

## 7. 数据模型与 Store (Data Model & Store)

### 7.1 数据模型

```js
// 咨询案件项（两个列表共用结构）
{
  id: string,                    // 唯一标识
  title: string,                 // 咨询标题
  secretary: string,             // 咨询秘书
  specialty: string,             // 咨询专业枚举：'finance'|'offline'|'hklaw'|'construction'
  status: string,                // 状态：'pending'|'unreplied'|'processed'
                                 //   pending=待处理, unreplied=未回复意见, processed=已处理
  // 详情字段（列表不展示，详情页读取）
  relatedCaseNo: string,         // 关联案件案号
  focus: string,                 // 争议焦点
  reportFile: { name, url },     // 案件审理报告附件
  attachments: [{ name, url }],  // 其他附件列表
  opinion: {                     // 专家回复意见（null 表示暂无）
    content: string,
    attachments: [{ name, url }],
    submittedAt: string,         // YYYY-MM-DD HH:mm
  } | null,
  createdAt: string,             // 创建时间（排序用）
}
```

### 7.2 枚举定义

```js
// 咨询专业枚举
const SPECIALTIES = [
  { value: 'finance',      label: '金融投资' },
  { value: 'offline',      label: '线下会议' },
  { value: 'hklaw',        label: '港澳法律' },
  { value: 'construction', label: '建设工程' },
]

// 状态枚举
const STATUS = [
  { value: 'pending',    label: '待处理',     tagType: 'warning' },  // 橙
  { value: 'unreplied',  label: '未回复意见', tagType: 'success' },  // 绿
  { value: 'processed',  label: '已处理',     tagType: 'info' },     // 灰
]
```

### 7.3 Store 结构

`src/stores/consult.js`，Pinia setup 风格，沿用现有 store 模式（参考 `todo.js`/`auxiliary.js`）。本期全部使用 Mock 数据。

```js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useConsultStore = defineStore('consult', () => {
  // 我作为专家处理的咨询案件（待办侧）
  const expertList = ref([])
  // 我发起专家咨询的案件（我的案件侧）
  const applicantList = ref([])
  const loading = ref(false)

  // 待办侧 badge 计数：待处理 + 未回复意见 数量
  const pendingCount = computed(() =>
    expertList.value.filter(i => i.status !== 'processed').length
  )

  async function fetchExpertList(filters) { /* mock 同步赋值 */ }
  async function fetchApplicantList(filters) { /* mock 同步赋值 */ }
  async function fetchDetail(id) { /* 返回单条详情 */ }

  // 操作方法（expert 侧）
  function submitSign(id, { method, decision }) {
    // method: 'online'|'upload', decision: 'accept'|'withdraw'
  }
  function submitOpinion(id, { content, attachments }) {
    // 提交意见 → 状态 processed
  }
  function exitConsult(id) {
    // 退出咨询 → 状态 processed
  }

  return {
    expertList, applicantList, loading, pendingCount,
    fetchExpertList, fetchApplicantList, fetchDetail,
    submitSign, submitOpinion, exitConsult,
  }
})
```

### 7.4 Mock 数据规模

- `expertList`：6-8 条，覆盖三种状态（pending/unreplied/processed）和四个专业
- `applicantList`：5-6 条，均有 `opinion`（已回复）

---

## 8. MainLayout 与侧栏集成 (Layout Integration)

### 8.1 CasesView.vue 侧栏改动

新增第三项（无 badge）：

```vue
<el-menu-item index="/cases/consult">
  <el-icon><ChatLineRound /></el-icon>
  <span>申请专家咨询案件</span>
</el-menu-item>
```

同步在移动端下拉选择器 `.mobile-nav-selector` 新增对应 `<el-option>`：

```vue
<el-option label="申请专家咨询案件" value="/cases/consult" />
```

### 8.2 TodosView.vue 侧栏改动

新增第五项（带 badge）：

```vue
<el-menu-item index="/todos/consult">
  <el-icon><ChatDotRound /></el-icon>
  <span>专家咨询案件</span>
  <el-badge
    v-if="consultStore.pendingCount > 0"
    :value="consultStore.pendingCount"
    class="menu-badge"
  />
</el-menu-item>
```

并在 TodosView 的 `onMounted` 中调用 `consultStore.fetchExpertList()` 拉取数据驱动 badge。

### 8.3 顶部水平主菜单

**不改动**。保持「首页 / 我的案件 / 待办事项 / 个人中心」四项不变，专家咨询子模块通过侧栏二级菜单访问。

### 8.4 图标选择

- 待办侧（专家咨询案件）：`ChatDotRound`（单点对话气泡，强待办感）
- 我的案件侧（申请专家咨询案件）：`ChatLineRound`（多线对话气泡，强查阅感）
- 两者同属 Chat 图标族，语义统一且有视觉区分

---

## 9. 样式约束 (Style Constraints)

遵循项目硬约束与工程约定：

| 约束项 | 落实方式 |
|--------|----------|
| 卡片容器 | 区块用 `.section-card`，不重定义组件级卡片样式 |
| 字号 | 标题 16px、正文 14px、辅助/筛选标签 12px；禁用 13px/15px |
| 表格 | div table 风格，背景 `#F5F7FA`，粗体表头，仅行底分隔线，无 `border` prop |
| 筛选栏 | 复用 `.filter-bar` + `.filter-item` + `.filter-label` + `.filter-actions` |
| 分页 | `.pagination-bar`，`justify-content: flex-start`，`margin-top: 16px` |
| 空状态 | 复用 `TodoEmptyState`（待办侧）/ `CaseEmptyState`（我的案件侧） |
| 操作按钮 | 文字按钮，主题色，右对齐；退出咨询用 danger 色 |
| 弹窗 | el-dialog，声明承诺书走文本摘要，签署模拟 GDCA loading |
| 二次确认 | 退出咨询用 `ElMessageBox.confirm` |
| 滚动锚点 | `.section-card` 已有 `scroll-margin-top: 100px` |
| 无障碍 | 操作图标按钮带 `aria-label`；状态 Tag 用 el-tag 默认 ARIA 支持 |

---

## 10. 验收标准 (Acceptance Criteria)

1. 待办事项侧栏显示「专家咨询案件」菜单项，待处理数 > 0 时显示红色 badge
2. 我的案件侧栏显示「申请专家咨询案件」菜单项，无 badge
3. 移动端下拉选择器同步显示两个新项
4. 顶部水平主菜单保持四项不变
5. 专家咨询案件列表（待办侧）显示筛选栏（含处理状态筛选）+ 表格 + 分页
6. 申请专家咨询案件列表（我的案件侧）显示筛选栏（无处理状态筛选）+ 表格 + 分页
7. 待办侧列表操作列按状态联动显示按钮（待处理/未回复意见/已处理）
8. 我的案件侧列表操作列固定显示「查看专家意见」按钮
9. 点击操作按钮进入对应详情页（非弹窗/抽屉）
10. 详情页采用单栏纵向堆叠，展示咨询信息、专家回复意见、发表意见（expert 模式）三个区块
11. applicant 模式详情页隐藏发表意见编辑区与操作按钮（只读）
12. 待处理状态点击「回避/接受咨询」弹出签署弹窗，可选线上签名或上传文件两种方式
13. 线上签名方式模拟 GDCA 接口（loading + 成功），展示声明承诺书文本摘要
14. 上传文件方式支持下载模板 + 单文件上传
15. 两种方式签署后均需选择"回避咨询"或"接受咨询"，提交后状态更新
16. 未回复意见状态点击「提交意见」可填写意见 + 上传统一附件列表，提交后状态更新为已处理
17. 点击「退出咨询」弹出二次确认，确认后状态更新为已处理并返回列表
18. 已处理状态详情页隐藏操作区（区块3整体隐藏）
19. 筛选、分页、空状态样式与全站一致
20. 未登录访问新路由被重定向到登录页
21. 全站样式扫描通过：无 13px/15px 字号、无禁用色值、无 `border` prop 表格

---

**说明**：本设计基于 PRD 第七节及用户补充说明（两个子模块分属不同父级侧栏）。声明承诺书 docx 真实预览、后端接口对接为后续迭代项。
