# PC仲裁员端重构 - 第四阶段设计规范（"案件详情页"模块）

## 1. 概述 (Overview)

本文档定义"PC仲裁员办案系统重构"第四阶段的设计规范，聚焦于 **"案件详情页"模块（P0级核心模块，PRD 第五部分）**。该页面从"我的案件"列表点击案号进入，是承载单一案件全量信息与办理操作的主页面，也是仲裁员日常办案的核心工作台。

本设计沿用第一、二、三阶段确立的视觉基调与技术架构，与"我的案件"模块（列表入口）、"待办事项"模块（全局待办）形成业务闭环。

### 1.1 设计目标

- 以 **Tab 切换式**承载案件 9 大板块信息与办理操作，单屏聚焦一类内容，避免页面过长
- **"办案"作为首 Tab**，把高频办理操作（待办、文书工具、AI 工具、庭审排期）前置，契合仲裁员进入详情页的主要诉求
- 引入 **AI 辅助工具区**（5 项能力）与 **类 Word 协同编辑器**，提升办案智能化与文书处理效率
- 补充 **电子送达记录**板块（PRD 原文未覆盖但实际办案必需）
- 全量信息板块（当事人、请求答辩、证据等）采用左右对照、卡片分区，呼应法律文书习惯

### 1.2 范围说明

| 内容 | 状态 |
|------|------|
| 头部常驻区（案号/案由/状态/办案秘书 + 返回） | 本期实现 |
| Tab 1 办案（待办/文书工具/AI工具/庭审排期） | 本期实现 |
| Tab 2 案情及当事人材料（信息/当事人/请求答辩/证据/附件） | 本期实现 |
| Tab 3 仲裁文书（裁决书核阅含类Word编辑/文书签名） | 本期实现 |
| Tab 4 电子送达记录 | 本期实现 |
| 类 Word 协同编辑器 | 本期实现（开源方案集成） |
| AI 辅助工具 | 本期实现（预设 Mock 结果，不接真实 AI） |
| Pinia Store 扩展 + Mock 数据 | 本期实现 |
| 真实 AI 接口对接、真实协同编辑后端 | 后续迭代 |

---

## 2. 信息架构 (Information Architecture)

案件详情页为单页结构，采用 **头部常驻区 + 4 Tab** 布局：

```
案件详情页（/cases/:id）
├── ① 头部常驻区（案号 + 案由 + 状态 + 立案日期 + 办案秘书 + 返回按钮）
└── ② Tab 导航
    ├── Tab 1「办案」
    │   ├── 待办事项（本案待办列表，点击跳转对应办理区）
    │   ├── 文书辅助工具（结案文书模板 + 程序文书模板下载）
    │   ├── AI 辅助工具（5 卡片网格 → 抽屉展示结果）
    │   └── 庭审排期（开庭日期/类型/地点）
    ├── Tab 2「案情及当事人材料」
    │   ├── 基本信息
    │   ├── 当事人（申请人 ⇄ 被申请人 左右双栏对照）
    │   ├── 请求答辩（仲裁请求/答辩意见/反请求/反请求答辩）
    │   ├── 证据（申请人证据 + 被申请人证据）
    │   └── 其他附件
    ├── Tab 3「仲裁文书」
    │   ├── 裁决书核阅（上传/在线编辑/核阅记录）
    │   └── 文书签名（庭审笔录/结案文书签名）
    └── Tab 4「电子送达」
        └── 电子送达记录表格
```

**设计原则：**
- 头部常驻区不随 Tab 切换变化，保证案号与返回入口始终可达
- "办案"为首 Tab，进入详情页默认聚焦办理操作
- Tab 间相互独立，但"办案-待办"点击可跳转其他 Tab 的对应办理区（如裁决书核阅 → 跳 Tab 3）
- 重大案件（标的 ≥ 1 亿）案号前加黄色星标，沿用"我的案件"模块样式

---

## 3. 路由与文件结构 (Routing & File Structure)

### 3.1 路由配置

路由 `/cases/:id` 已在第三阶段配置（`src/router/index.js`），本期替换占位组件为完整实现，无需新增路由：

```
/cases/:id  →  CaseDetailView.vue（案件详情页，本期完整实现）
```

- 从"我的案件"表格点击案号 → `router.push('/cases/' + row.id)`
- 头部"返回"按钮 → `router.push('/cases')`（返回列表）
- Tab 切换不产生路由变化，仅组件内 `activeTab` ref 切换（`work` | `info` | `docs` | `service`）
- 顶部导航"我的案件"菜单项高亮由 MainLayout 的 `resolveActiveMenu` 已有逻辑处理（`/cases/*` 前缀匹配）

### 3.2 文件目录

```
src/views/cases/
  CaseDetailView.vue              # 详情页容器：头部 + Tab 导航 + 各 Tab 内容组装
  components/
    detail/                       # 详情页专属组件目录（与列表组件分离）
      DetailHeader.vue            # 头部常驻区（案号/案由/状态/办案秘书/返回）
      WorkTab.vue                 # Tab 1 办案（待办+文书工具+AI工具+庭审排期）
      InfoTab.vue                 # Tab 2 案情及当事人材料
      DocsTab.vue                 # Tab 3 仲裁文书（裁决书核阅+文书签名）
      ServiceTab.vue              # Tab 4 电子送达
      shared/
        PartyCompare.vue          # 当事人左右双栏对照（申请人与被申请人）
        MaterialList.vue          # 材料文件清单（复用于证据/附件/材料展示）
        AwardEditor.vue           # 类 Word 协同编辑器封装
        SignaturePanel.vue        # 文书签名面板（复用 SignaturePad）
      work/                       # 办案 Tab 子组件
        CaseTodoList.vue          # 本案待办列表
        TemplateDownload.vue      # 文书模板下载区
        AIToolGrid.vue            # AI 工具卡片网格
        AIToolDrawer.vue          # AI 工具结果抽屉
        HearingSchedule.vue       # 庭审排期
    shared/
      CaseEmptyState.vue          # 空状态组件（已有，复用）
src/stores/
  caseDetail.js                  # 新增：案件详情 Pinia store（详情数据、办理操作）
  case.js                        # 已有：案件列表 store（不动）
```

**目录结构说明：** 详情页组件较多，单独建立 `components/detail/` 目录与列表组件隔离；办案 Tab 内容复杂，再拆 `work/` 子目录。复用组件（当事人对照、材料清单、签名面板）放 `shared/`。

---

## 4. 整体布局 (Layout)

采用上下两段式布局，整页灰底 `#f7f7f7`，内容区水平居中（与"我的案件"列表页一致，无侧栏）：

```
┌─────────────────────────────────────────────────────────┐
│  ① 头部常驻区（DetailHeader）                            │  ← 白底卡片，固定常驻
│  ★ (2026)沪仲第1001号 | 买卖合同纠纷 | 审理中 | … | [返回] │
├─────────────────────────────────────────────────────────┤
│  ② Tab 导航（el-tabs）                                   │  ← 4 Tab，下边线高亮
│  [办案] [案情及当事人材料] [仲裁文书] [电子送达]            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ③ Tab 内容区（根据 activeTab 切换）                      │  ← 各 Tab 独立内容
│                                                         │
└─────────────────────────────────────────────────────────┘
```

各区块间距：头部与 Tab 之间 `margin-bottom: 16px`，Tab 内容区间块间距 `margin-bottom: 16px`，与全站卡片间距一致。

---

## 5. 头部常驻区详细设计 (DetailHeader)

### 5.1 结构

白底卡片（`#FFFFFF`、1px 边框 `#E4E7ED`、4px 圆角、`shadow="never"`、内边距 `16px 20px`），`display: flex; align-items: center; justify-content: space-between`。

**左侧（案件关键信息）：**
- 重大案件星标：黄色五角星 `★`（`#F7BA0A`，`font-size: 16px`）+ `el-tooltip`「重大案件（标的 ≥ 1 亿元）」，仅 `amount >= 10000` 时显示
- 案号：`font-size: 16px; font-weight: 600; color: #303133`（沿用全局大标题规范）
- 分隔符：竖线 `|`（`color: #DCDFE6; margin: 0 12px`）
- 案由：`font-size: 14px; color: #606266`
- 案件状态：`el-tag`（`size="small"`，状态色映射见下）
- 立案日期：`font-size: 12px; color: #909399`
- 办案秘书：`font-size: 12px; color: #909399`

**右侧（操作）：**
- 返回按钮：`el-button`（`plain`、`size="small"`、图标 `ArrowLeft`）→ `router.push('/cases')`

### 5.2 案件状态 Tag 色彩映射

| 状态 | Tag 类型 | 说明 |
|------|----------|------|
| 审理中 | `primary` | 主题色 |
| 已组庭 | `info` | 灰色 |
| 待开庭 | `warning` | 黄色 |
| 已开庭 | `success` | 绿色 |
| 已结案 | `success` | 绿色（深） |

### 5.3 数据来源

由 `caseDetail` store 的 `caseInfo` 提供，挂载时根据路由 `:id` 拉取（本期 Mock）。

---

## 6. Tab 1「办案」详细设计 (WorkTab)

作为首 Tab，是仲裁员进入详情页的默认视图。采用上下分区，4 个板块纵向排列，各为独立卡片：

```
┌─────────────────────────────────────────────┐
│  ▎待办事项（本案）                           │  ← 卡片1
│  [延期审批] 笔录签名请求 · 2026-07-28  …     │
├─────────────────────────────────────────────┤
│  ▎文书辅助工具                              │  ← 卡片2
│  [结案文书模板] 裁决书草稿 撤案决定书草稿 …   │
│  [程序文书模板] 延期裁决书呈批表 …           │
├─────────────────────────────────────────────┤
│  ▎AI 辅助工具                               │  ← 卡片3
│  ┌──────┐ ┌──────┐ ┌──────┐                │
│  │裁决书  │ │材料   │ │事实   │  （5卡片网格） │
│  │AI自查 │ │摘要   │ │梳理   │                │
│  └──────┘ └──────┘ └──────┘                │
├─────────────────────────────────────────────┤
│  ▎庭审排期                                   │  ← 卡片4
│  2026-09-15 14:00 | 开庭 | 第三庭室          │
└─────────────────────────────────────────────┘
```

### 6.1 待办事项（CaseTodoList.vue）

**定位：** 仅显示本案的待办，从全局待办模块数据中按 `caseId` 过滤。与全局待办模块（`/todos/*`）数据同源但视图隔离。

**结构：** 卡片内列表，每项一行，`display: flex; align-items: center; padding: 10px 0; border-bottom: 1px dashed #EBEEF5`。

**列表项内容：**
- 左侧：待办类型 `el-tag`（延期审批=warning、笔录签名=primary、裁决书核阅=success、文书签名=warning）
- 中间：待办标题（如"笔录签名请求"）+ 提交时间（`font-size: 12px; color: #909399`）
- 右侧：`el-button`（`link`、`type="primary"`）「去处理」→ 跳转对应办理区

**跳转逻辑：**
- 延期审批 → 暂无对应 Tab，提示"请在待办中心处理"（`ElMessage.info`）+ `router.push('/todos/center')`
- 笔录签名 / 文书签名 → `emit('switch-tab', 'docs')` 切换到 Tab 3
- 裁决书核阅 → `emit('switch-tab', 'docs')` 切换到 Tab 3

**空状态：** `CaseEmptyState` 组件，文案「本案暂无待办事项」。

### 6.2 文书辅助工具（TemplateDownload.vue）

**结构：** 卡片内分两组，每组一个子标题 + 模板链接列表。

**结案文书模板：**
| 模板名 | 说明 |
|--------|------|
| 裁决书草稿 | 仲裁裁决书模板 |
| 撤案决定书草稿 | 撤案决定书模板 |
| 调解决定书草稿 | 调解协议书模板 |

**程序文书模板：**
| 模板名 | 说明 |
|--------|------|
| 延期裁决书呈批表 | 审限延期审批表 |
| 延期结案申请书 | 延期结案申请模板 |

**交互：** 每个模板为 `el-link`（`type="primary" :underline="false"`）+ 下载图标 `Download`，点击触发 Mock 下载（`ElMessage.success('模板下载已开始')`）。

### 6.3 AI 辅助工具（AIToolGrid.vue + AIToolDrawer.vue）

**网格区（AIToolGrid.vue）：** 5 个卡片，`display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px`。

| 卡片 | 图标 | 说明 |
|------|------|------|
| 裁决书AI辅助自查 | `MagicStick` | 对裁决书草稿进行合规性、逻辑性自查 |
| 案件材料摘要 | `Document` | 自动汇总案件材料要点 |
| 案件事实梳理 | `Connection` | 梳理案件事实脉络 |
| 争议焦点归纳 | `Aim` | 提炼双方争议焦点 |
| 高频法条与规则库 | `Reading` | 推荐相关法条与仲裁规则 |

**卡片样式：** 白底 `#FFFFFF`、1px 边框 `#E4E7ED`、4px 圆角、内边距 `16px`、`text-align: center`、`cursor: pointer`、hover 时边框变主题色 `#053d99` + 轻微阴影。

**交互：** 点击卡片 → 打开右侧抽屉（`el-drawer` `direction="rtl"` `size="40%"`）→ 展示该工具的 Mock 结果。

**抽屉结果（AIToolDrawer.vue）：**
- 抽屉标题：工具名称
- 内容区：根据工具类型展示预设 Mock 结果（Markdown 渲染或结构化列表）
  - 裁决书自查：检查项列表（合规/逻辑/格式）+ 通过/警告状态
  - 材料摘要：要点列表
  - 事实梳理：时间轴或段落
  - 争议焦点：编号列表
  - 法条规则库：法条列表（法条名 + 条文 + 关联度）
- 底部：「复制到裁决书编辑器」按钮（`el-button type="primary"`）→ `emit('copy-to-editor', content)` → 切换到 Tab 3 并写入编辑器（Mock：`ElMessage.success('已复制，请到仲裁文书 Tab 粘贴')`）

### 6.4 庭审排期（HearingSchedule.vue）

**结构：** 卡片内表格或信息行展示本案庭审安排。

**字段：**
| 字段 | 说明 |
|------|------|
| 开庭日期 | 如 `2026-09-15 14:00` |
| 类型 | 如 `第一次开庭` / `第二次开庭` |
| 开庭地点 | 如 `第三庭室 · 上海市XX路XX号` |

**多庭审情况：** 若案件有多次开庭记录，以时间轴或列表展示，最近一次高亮。

**空状态：** 「本案暂未排期」。

---

## 7. Tab 2「案情及当事人材料」详细设计 (InfoTab)

5 个信息板块纵向卡片排列，各板块独立卡片，标题栏左侧 3px 主题色高亮条（沿用"我的案件"统计看板选中态风格）。

### 7.1 基本信息

**结构：** 卡片内 `el-descriptions`（`:column="3"` `border`），展示案件元数据。

**字段：** 案号、案由、案件状态、立案日期、办案秘书、仲裁庭、组庭日期、开庭日期、审限。

**审限展示（复用"我的案件"列表的复合格式）：**
```
2026/09/15（剩余 62 天）（未中止）（延期 1 次）
```
- 剩余天数 ≤ 15 天：黄色 `#E6A23C`
- 剩余天数 < 0：红色 `#F56C6C` + "已延期"
- 中止：灰色 `el-tag`「已中止」
- 延期次数为 0：不显示括号

### 7.2 当事人（PartyCompare.vue）

**结构：** 左右双栏对照，`display: flex; gap: 20px`，左右各占 50%。

**左侧「申请人」、右侧「被申请人」**，结构对称：

```
┌─────────────────────┐ ┌─────────────────────┐
│  申请人              │ │  被申请人            │
│  ─────────────────  │ │  ─────────────────  │
│  姓名/名称：上海宏图  │ │  姓名/名称：远东物流  │
│  联系方式：138****   │ │  联系方式：139****   │
│  地址：…             │ │  地址：…             │
│  ─────────────────  │ │  ─────────────────  │
│  代理人              │ │  代理人              │
│  姓名：张律师         │ │  姓名：李律师         │
│  律所：XX律所         │ │  律所：YY律所         │
│  联系方式：…         │ │  联系方式：…         │
└─────────────────────┘ └─────────────────────┘
```

**样式：** 左右各为白底子卡片（1px 边框 `#E4E7ED`、4px 圆角、内边距 `16px`），标题 `font-size: 14px; font-weight: 600; color: #053d99`，字段标签 `font-size: 12px; color: #909399` 宽 80px 左对齐，字段值 `font-size: 13px; color: #303133`。

**代理人多个：** 若当事人有多个代理人，以列表纵向排列，每个代理人独立子区块。

### 7.3 请求答辩

**结构：** 卡片内 4 个子区块纵向排列，每区块标题 + 内容。

| 子区块 | 来源方 | 说明 |
|--------|--------|------|
| 仲裁请求 | 申请人 | 申请人提出的仲裁请求 |
| 答辩意见 | 被申请人 | 被申请人对仲裁请求的答辩 |
| 反请求 | 被申请人 | 被申请人提出的反请求 |
| 反请求答辩 | 申请人 | 申请人对反请求的答辩 |

**样式：** 每子区块标题 `font-size: 13px; font-weight: 600; color: #303133` + 左侧 2px 主题色竖条，内容 `font-size: 13px; color: #606266; line-height: 1.8`，多段文本以段落分隔。

### 7.4 证据（MaterialList.vue 复用）

**结构：** 申请人证据 + 被申请人证据两个子区块，各含文件清单。

**清单字段：** 证据名称、证据类型、提交日期、操作（预览/下载）。

**交互：** 预览 → `el-dialog` 展示文件预览（图片/PDF，Mock）；下载 → Mock 下载提示。

### 7.5 其他附件

**结构：** 复用 `MaterialList.vue`，展示其他与案件相关的补充材料，字段同证据（名称/类型/日期/操作）。

---

## 8. Tab 3「仲裁文书」详细设计 (DocsTab)

两个板块纵向排列：裁决书核阅 + 文书签名。

### 8.1 裁决书核阅

**结构：** 卡片，内含操作栏 + 编辑器/记录区。

**操作栏（顶部）：**
- 「上传裁决书」按钮（`el-button` `type="primary" plain` + `Upload` 图标）→ `el-upload`（Mock 上传，成功后填入编辑器）
- 「在线编辑」按钮（`el-button` `type="primary"` + `Edit` 图标）→ 打开 `AwardEditor.vue` 全屏弹窗
- 「查看核阅记录」按钮（`el-button` `link` + `Clock` 图标）→ 展开核阅记录抽屉

**裁决书预览区（默认）：** 未上传时显示空状态「暂无裁决书，请上传或在线编辑」；已上传时显示裁决书摘要（标题 + 前几段正文 + 「查看完整」链接）。

**在线编辑器（AwardEditor.vue）：**

| 项目 | 规范 |
|------|------|
| 组件形态 | 全屏 `el-dialog`（`fullscreen`）或独立路由（本期用 dialog） |
| 编辑器选型 | 开源方案：**wangEditor 5**（轻量、中文友好、支持富文本基础排版）作为本期默认；若需更强 Word 兼容（修订痕迹/页眉页脚），后续迭代切换 OnlyOffice |
| 功能范围 | 标题/正文、加粗/斜体/下划线、有序/无序列表、对齐、字体字号、表格、撤销重做 |
| 数据流 | 编辑器内容双向绑定 store 的 `awardContent`（HTML 字符串）；保存时 Mock `ElMessage.success('裁决书已保存')` |
| 协同 | 本期单端编辑，协同能力（多人同时编辑/修订痕迹）后续迭代接入协同后端 |

**核阅记录抽屉：**
- `el-drawer` `direction="rtl"` `size="40%"`
- 列表展示历次核阅记录：核阅人、核阅时间、核阅结果（通过/退回）、备注
- 空状态「暂无核阅记录」

### 8.2 文书签名（SignaturePanel.vue）

**结构：** 卡片，内含两个子区：庭审笔录签名 + 结案文书签名。

**庭审笔录：**
- 列表展示本案庭审笔录（笔录标题、庭审日期、提交时间、签名状态）
- 操作「查看笔录」→ `el-dialog` 预览笔录内容
- 操作「签名」→ 打开签名弹窗（复用 `SignaturePad.vue`，全屏签名模式，沿用待办事项模块的签名交互）

**结案文书：**
- 列表展示本案结案文书（文书标题、文书类型、提交时间、签名状态）
- 操作「预览」→ `el-dialog` 预览文书
- 操作「签名」→ 打开签名弹窗（复用 `SignaturePad.vue`）

**签名完成：** Mock `ElMessage.success('签名成功')` + 更新签名状态为「已签名」。

---

## 9. Tab 4「电子送达」详细设计 (ServiceTab)

### 9.1 结构

卡片内 `el-table` 展示电子送达记录。

### 9.2 表格字段

| 列名 | 字段 | 宽度 | 说明 |
|------|------|------|------|
| 送达类型 | `serviceType` | min-width 120 | 立案送达 / 组庭送达 / 开庭送达 / 裁决送达 等 |
| 送达地址 | `address` | min-width 180 | 手机号 138****1234 / 邮箱 xxx@xx.com |
| 送达方式 | `method` | min-width 100 | 短信 / Email |
| 送达情况 | `status` | min-width 100 | `el-tag`：已送达(success) / 待送达(warning) / 送达失败(danger) |
| 读取情况 | `readStatus` | min-width 120 | 已读(2026-07-28 10:30) / 未读 |
| 送达时间 | `serviceTime` | min-width 140 | 送达操作时间 |

### 9.3 空状态

`CaseEmptyState` 组件，文案「本案暂无电子送达记录」。

---

## 10. 组件职责与数据流 (Component Architecture & Data Flow)

### 10.1 组件职责

| 组件 | 职责 | 对外接口 |
|------|------|----------|
| `CaseDetailView.vue` | 详情页容器，组装头部 + Tab 导航 + 各 Tab；挂载时拉取案件详情 | 无 |
| `DetailHeader.vue` | 头部常驻区，展示案号/案由/状态等 + 返回 | props: `caseInfo`；emit: `back` |
| `WorkTab.vue` | Tab 1 容器，组装待办/文书工具/AI工具/庭审排期 | props: `caseId`；emit: `switch-tab` |
| `InfoTab.vue` | Tab 2 容器，组装基本信息/当事人/请求答辩/证据/附件 | props: `caseInfo` |
| `DocsTab.vue` | Tab 3 容器，组装裁决书核阅/文书签名 | props: `caseId` |
| `ServiceTab.vue` | Tab 4 容器，展示电子送达记录 | props: `caseId` |
| `shared/PartyCompare.vue` | 当事人左右双栏对照 | props: `applicant`, `respondent` |
| `shared/MaterialList.vue` | 材料文件清单 | props: `title`, `materials` |
| `shared/AwardEditor.vue` | 类 Word 编辑器封装 | v-model: `content`；emit: `save` |
| `shared/SignaturePanel.vue` | 文书签名面板（复用 SignaturePad） | props: `docType`, `docList` |
| `work/CaseTodoList.vue` | 本案待办列表 | props: `caseId`；emit: `switch-tab` |
| `work/TemplateDownload.vue` | 文书模板下载区 | props: `caseId` |
| `work/AIToolGrid.vue` | AI 工具卡片网格 | emit: `open-tool` |
| `work/AIToolDrawer.vue` | AI 工具结果抽屉 | props: `toolKey`, `visible`；emit: `copy-to-editor` |
| `work/HearingSchedule.vue` | 庭审排期 | props: `caseId` |

### 10.2 Pinia Store（`stores/caseDetail.js`，新增）

集中管理单一案件的详情数据与办理操作状态：

```js
// 核心状态
{
  // 当前案件 ID（来自路由）
  currentCaseId: '',

  // 案件基本信息（头部 + Tab2 基本信息）
  caseInfo: {
    id, caseNo, caseReason, caseStatus, filingDate, secretary,
    tribunal, groupDate, hearingDate, deadline, remainDays,
    isSuspended, extensionCount, amount,  // amount 用于判断重大案件星标
  },

  // 当事人（Tab2）
  parties: {
    applicant: { name, contact, address, agents: [{ name, firm, contact }] },
    respondent: { name, contact, address, agents: [{ name, firm, contact }] },
  },

  // 请求答辩（Tab2）
  claims: {
    arbitrationClaims: '',     // 仲裁请求
    defenseOpinion: '',        // 答辩意见
    counterClaim: '',          // 反请求
    counterDefense: '',        // 反请求答辩
  },

  // 证据与附件（Tab2）
  evidence: { applicant: [...], respondent: [...] },
  attachments: [...],

  // 本案待办（Tab1）
  caseTodos: [...],

  // 庭审排期（Tab1）
  hearings: [...],

  // 裁决书（Tab3）
  award: {
    content: '',               // 编辑器内容（HTML）
    records: [...],            // 核阅记录
  },

  // 文书签名（Tab3）
  docs: {
    records: [...],            // 庭审笔录列表
    awards: [...],             // 结案文书列表
  },

  // 电子送达（Tab4）
  services: [...],

  // UI 状态
  activeTab: 'work',           // 'work' | 'info' | 'docs' | 'service'
  loading: false,
}

// 核心方法
fetchCaseDetail(caseId)         // 拉取案件全量详情（Mock，一次性填充上述状态）
switchTab(tab)                  // 切换 Tab（支持跨组件跳转，如待办→docs）
saveAwardContent(html)          // 保存裁决书编辑器内容（Mock）
signDoc(docId, signatureData)   // 文书签名（Mock）
downloadTemplate(templateName)  // 下载文书模板（Mock）
runAITool(toolKey)              // 运行 AI 工具，返回 Mock 结果
```

### 10.3 数据流

```
CaseDetailView 挂载（路由 :id）
  → store.fetchCaseDetail(caseId)
  → 填充 caseInfo / parties / claims / evidence / caseTodos / hearings / award / docs / services
  → DetailHeader 渲染（案号/案由/状态/星标）
  → 默认 Tab「办案」渲染

点击头部「返回」
  → router.push('/cases')

点击 Tab 导航
  → store.switchTab(tabKey)
  → 对应 Tab 组件渲染

Tab1 待办「去处理」
  → store.switchTab('docs')  // 跨 Tab 跳转
  → Tab3 渲染，可定位到对应子区（如裁决书核阅）

Tab1 AI 工具卡片点击
  → AIToolDrawer 打开
  → store.runAITool(toolKey) 返回 Mock 结果
  → 抽屉展示结果
  → 「复制到编辑器」→ store.switchTab('docs') + 提示粘贴

Tab3 裁决书「在线编辑」
  → AwardEditor 全屏 dialog 打开
  → 编辑器内容双向绑定 store.award.content
  → 保存 → store.saveAwardContent(html) → ElMessage.success

Tab3 文书签名
  → SignaturePad 签名
  → store.signDoc(docId, signatureData) → 更新签名状态
```

**当前阶段使用 Mock 数据：** 所有 store 方法返回本地静态/模拟数据。数据模型字段需覆盖上述所有状态。后续对接真实 API 时，只需替换 store 方法内部实现，组件层无需改动。

---

## 11. 视觉规范 (Visual Consistency)

沿用第一、二、三阶段确立的设计约束，确保全站一致性。

| 项目 | 规范 |
|------|------|
| 页面背景 | 灰底 `#f7f7f7` |
| 卡片容器 | 白底 `#FFFFFF`、1px 边框 `#E4E7ED`、4px 圆角、`shadow="never"` |
| 头部案号 | `font-size: 16px; font-weight: 600; color: #303133`（大标题） |
| 卡片板块标题 | `font-size: 14px; font-weight: 600; color: #303133` + 左侧 3px 主题色高亮条 |
| 字段标签 | `font-size: 12px; color: #909399` |
| 字段值 | `font-size: 13px; color: #303133`（正文 14px 规范的详情页变体，适配信息密度） |
| Tab 导航 | `el-tabs`，选中态下边线主题色 `#053d99`，`font-size: 14px` |
| 表格表头 | 灰色背景 `#F5F7FA`（全局样式已强制 `!important`） |
| 重大案件星标 | 黄色 `#F7BA0A`，`font-size: 16px` + `el-tooltip` |
| 高亮色 | 即将到期黄 `#E6A23C`、已过期红 `#F56C6C`、通过绿 `#67C23A` |
| 操作按钮 | `el-button` link 类型为主题色，主要操作用 `type="primary"` |
| 品牌色 | Primary `#053d99`、Dark `#00296b`、浅色区块 `#f2f5fa` |
| 分隔符 | 竖线 `|` 用 `color: #DCDFE6; margin: 0 12px` |

---

## 12. 边界情况处理 (Edge Cases)

| 场景 | 处理方式 |
|------|----------|
| 案件 ID 不存在 | `CaseEmptyState` 组件「案件不存在或已归档」+ 返回按钮 |
| 详情加载中 | 全页 `v-loading` 指令，品牌色 spinner |
| 待办列表为空 | `CaseEmptyState`「本案暂无待办事项」 |
| 无庭审排期 | `CaseEmptyState`「本案暂未排期」 |
| 无证据/附件 | `MaterialList` 内「暂无材料」 |
| 裁决书未上传 | 预览区空状态「暂无裁决书，请上传或在线编辑」 |
| 无核阅记录 | 抽屉空状态「暂无核阅记录」 |
| 无电子送达记录 | `CaseEmptyState`「本案暂无电子送达记录」 |
| AI 工具结果生成中 | 抽屉内 `v-loading` + 「AI 分析中…」文案（Mock 延时 800ms） |
| 编辑器内容为空保存 | `ElMessage.warning('裁决书内容不能为空')`，不执行保存 |
| 签名已完成再次签名 | `ElMessage.info('该文书已签名')`，禁用签名按钮 |
| 模板下载（Mock） | `ElMessage.success('模板下载已开始')` |
| 重大案件星标 | `amount >= 10000`（万元，即 1 亿元）时显示 |
| Tab 跨组件跳转 | 通过 store.switchTab + emit 传递，CaseDetailView 监听统一处理 |

---

## 13. 技术选型说明 (Technology Choices)

### 13.1 类 Word 协同编辑器

**本期选型：wangEditor 5**
- 理由：轻量（约 200KB）、中文文档完善、Vue 3 支持良好、满足裁决书基础排版需求（标题/正文/列表/表格/字体字号）
- 集成方式：`@wangeditor/editor` + `@wangeditor/editor-for-vue`，封装为 `AwardEditor.vue`
- 限制：不支持修订痕迹、页眉页脚、协同编辑；这些能力后续迭代切换 OnlyOffice 或 WPS WebOffice SDK

**后续迭代方向：**
- OnlyOffice Document Server：支持协同编辑、修订痕迹、Word 格式兼容，但需自建服务端
- WPS WebOffice SDK：托管服务，集成简单，但有商业授权成本

### 13.2 AI 辅助工具

**本期：预设 Mock 结果**
- 5 项工具各自预定义结果数据（JSON/Markdown），点击后延时 800ms 返回，模拟 AI 分析过程
- 结果数据存于 `caseDetail` store 或独立 `mock/aiResults.js` 文件

**后续迭代：**
- 接入真实 AI 接口（如豆包/通义/自建模型），store.runAITool 改为异步 API 调用
- 增加流式输出（SSE）展示，提升交互真实感

### 13.3 文件预览

**本期：Mock 预览**
- 图片：`el-image` 展示 Mock 图片
- PDF：`el-dialog` 内嵌 `<iframe>` 或提示「PDF 预览能力建设中」
- 其他：提示文件名 + 下载按钮

---

## 14. 后续规划 (Next Steps)

完成本模块开发与数据 mock 后，下一阶段可推进：
- **个人中心模块**（PRD 第六部分）：个人信息、工作单位、简历、酬金单、银行账号、聘书
- **数据统计看板**（PRD 第九部分）：多维度可视化分析
- **AI 能力真实对接**：替换 Mock 为真实 AI 接口
- **协同编辑后端**：接入 OnlyOffice 或自建协同服务
- **移动端适配**（PRD 第十一部分）：响应式或独立 H5
