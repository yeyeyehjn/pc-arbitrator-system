# PC仲裁员端重构 - 第三阶段设计规范（"我的案件"模块）

## 1. 概述 (Overview)

本文档定义"PC仲裁员办案系统重构"第三阶段的设计规范，聚焦于 **"我的案件"模块（P0级核心模块）**。该模块承担仲裁员个人承办案件的分类查询与进入详情办理的入口职责，是仲裁员日常办案的主入口。

本设计沿用第一、二阶段确立的视觉基调与技术架构，与首页开庭情况、待办事项模块形成业务闭环。

### 1.1 设计目标

- 聚焦仲裁员个人承办案件的分类查询（在办/已结），提供清晰的案件列表浏览与筛选能力
- 顶部统计看板作为状态切换器，点击切换在办/已结案件视图
- 支持多维度筛选（9 项常规筛选 + 3 项快捷筛选），快捷筛选可叠加，常驻案号高亮提示
- 点击案号进入案件详情页（本期仅占位，详情页后续单独设计）

### 1.2 范围说明

| 内容 | 状态 |
|------|------|
| 顶部统计看板（在办/已结切换） | 本期实现 |
| 快捷筛选（重大案件/即将延期/已延期） | 本期实现 |
| 常规筛选区（9 项，折叠式） | 本期实现 |
| 案件数据表格 + 案号高亮 + 分页 | 本期实现 |
| 案件详情页（`/cases/:id`） | 本期仅占位路由，详情页后续单独设计 |
| Pinia Store + Mock 数据 | 本期实现 |

---

## 2. 信息架构 (Information Architecture)

"我的案件"模块为单页结构，采用上下三段式布局：

```
我的案件（/cases）
├── ① 统计看板（在办案件 / 已结案件，点击切换状态）
├── ② 常规筛选区（9 项，折叠式）
├── ③ 快捷筛选（重大案件 / 即将延期 / 已延期，可叠加）
└── ④ 表格区 + ⑤ 分页
```

**设计原则：**
- 统计看板作为状态切换器，点击切换在办/已结视图，不产生路由变化
- 快捷筛选为高频"业务视角"过滤，独立成行，与常规筛选 AND 叠加
- 案号高亮（黄/红）常驻显示，与快捷筛选是否选中无关

---

## 3. 路由与文件结构 (Routing & File Structure)

### 3.1 路由配置

采用扁平路由，在办/已结状态切换不产生路由变化：

```
/cases                    → CasesView.vue（单页容器）
  /cases/:id              → CaseDetailView.vue（案件详情页占位，本期不实现详情）
```

- 单一扁平路由 `/cases`，在办/已结状态切换仅组件内 `currentStatus` ref 切换（`active` | `closed`）
- 点击表格中案号 → `router.push('/cases/' + row.id)`，跳转到占位详情页
- 顶部导航"我的案件"菜单项 `index="/cases"`，由 MainLayout 的 `resolveActiveMenu` 处理子路由高亮（沿用待办事项模块的既有方案）

### 3.2 文件目录

```
src/views/cases/
  CasesView.vue              # 单页容器：统计看板 + 快捷筛选 + 常规筛选 + 表格 + 分页
  CaseDetailView.vue         # 案件详情页占位（本期）
  components/
    StatsBoard.vue           # 顶部统计看板（在办/已结卡片）
    QuickFilter.vue          # 快捷筛选芯片组（重大案件/即将延期/已延期）
    CaseTable.vue            # 案件数据表格（含案号高亮逻辑）
    CaseFilter.vue           # 常规折叠筛选区（9 项筛选项）
    shared/
      CaseEmptyState.vue     # 空状态组件
src/stores/
  case.js                   # Pinia store（案件列表、筛选、统计）
```

**目录结构说明：** 与 `views/todos/` 不同，本模块为单页（无子路由），因此 `CasesView.vue` 直接承担容器职责，各区块拆为同级子组件而非路由子页。

---

## 4. 整体布局 (Layout)

采用上下三段式布局，整页灰底 `#f7f7f7`，内容区水平居中（无侧栏，区别于待办事项的左右双栏）：

```
┌─────────────────────────────────────────────┐
│  ① 统计看板（StatsBoard）                    │  ← 固定，不随筛选变化
├─────────────────────────────────────────────┤
│  ② 常规筛选区（CaseFilter，折叠式）           │  ← 9 项，默认折叠
├─────────────────────────────────────────────┤
│  ③ 快捷筛选（QuickFilter）                  │  ← 可叠加 toggle
├─────────────────────────────────────────────┤
│  ④ 表格区（CaseTable）                       │  ← 含案号高亮
│  ⑤ 分页（pagination-bar）                    │
└─────────────────────────────────────────────┘
```

各区块间距：区块之间 `margin-bottom: 16px`，与首页/待办事项模块的卡片间距保持一致。

---

## 5. 各区块详细设计

### 5.1 统计看板（StatsBoard.vue）

**结构：** 左右两张并排统计卡片，等分宽度（`display: flex; gap: 20px`）

**卡片内容：**
- 左卡片：「在办案件」标题 + 大号数字指标（如 `12`）
- 右卡片：「已结案件」标题 + 大号数字指标（如 `34`）

**卡片样式（沿用首页 TodoStats 风格）：**
- 白底 `#FFFFFF`，1px 边框 `#E4E7ED`，4px 圆角
- 内边距 `20px`，无阴影（`shadow="never"`）
- 左侧线性图标 + 右侧文字与数字

**选中态（核心交互）：**
- 当前查看状态对应的卡片：浅色背景 `#f2f5fa` + 左侧 3px 主题色高亮条 + 标题/数字主题色 `#053d99` 加粗
- 未选中卡片：白底 + 默认文字色
- 鼠标悬浮未选中卡片：背景微调为 `#fafafa`（无阴影突变）

**交互：** 点击卡片 → 切换 `currentStatus`（active/closed）→ 触发表格数据刷新 + 重置分页到第 1 页

**数据来源：** 由 `stores/case.js` 的 `stats` computed 提供，挂载时拉取一次（不随筛选变化）

### 5.2 常规筛选区（CaseFilter.vue）

折叠式 `.filter-bar`，复用全局样式规范。9 项筛选项如下：

| 分组 | 筛选项 | 控件类型 | 宽度 |
|------|--------|----------|------|
| 文本 | 案号 | `el-input` + clearable | 180px |
| 文本 | 申请人 | `el-input` + clearable | 180px |
| 文本 | 被申请人 | `el-input` + clearable | 180px |
| 文本 | 案由 | `el-input` + clearable | 180px |
| 文本 | 办案秘书 | `el-input` + clearable | 180px |
| 数值 | 标的区间（万元） | 双 `el-input-number`（最小/最大） | 各 120px |
| 日期 | 开庭日期 | `el-date-picker`（单日期） | 180px |
| 下拉 | 类型 | `el-select`（全部/独任/首席/边裁） | 120px |
| 下拉 | 结案类型 | `el-select`（全部/裁决/调解/撤案） | 120px |

**折叠行为：**
- 默认折叠：首行显示 5 个高频筛选项（案号、申请人、被申请人、案由、办案秘书）+ 右侧"展开"按钮
- 展开后：显示全部 9 项，按钮文案切换为"收起"
- 折叠/展开通过 `.filter-items.collapsed` 类控制 `max-height`（沿用全局 `.filter-bar` 已有的 `collapsed` 样式）

**操作按钮：** 查询 / 重置（位于 `.filter-actions`，`font-size: 12px`，居中布局）
- 查询：应用所有筛选条件（含快捷芯片）→ 重置分页到第 1 页
- 重置：清空常规筛选 + 快捷芯片 + 重置分页（状态切换不清空，保留当前在办/已结视图）

**结案类型筛选项：** 仅在"已结案件"视图下可用；在办视图下禁用并置灰（在办案件无结案类型）

### 5.3 快捷筛选（QuickFilter.vue）

独立一行，位于常规筛选区与表格之间，白底卡片承载。

**承载容器：** 白底 `#FFFFFF`，1px 边框 `#E4E7ED`，4px 圆角，内边距 `12px 20px`，`margin-bottom: 16px`

**结构：** 左侧标签「快捷筛选：」+ 右侧 3 个 toggle 芯片，`display: flex; gap: 12px; align-items: center`

**3 个芯片（可叠加多选，互不排斥）：**
- `重大案件`（标的 > 1 亿元）
- `即将延期`（审限剩余 ≤ 15 天）
- `已延期`（审限已过期，剩余 < 0）

**芯片样式：** 使用 `el-check-tag`，未选中态白底灰边框，选中态主题色背景 `#053d99` + 白字

**交互：**
- 点击芯片 → 切换该筛选的选中态 → 与常规筛选条件叠加生效（AND 关系）→ 重置分页到第 1 页
- 3 个芯片可同时选中，也可全部不选

**与案号高亮的关系：** 案号高亮（黄/红）始终常驻显示，与快捷芯片是否选中**无关**。快捷芯片仅控制"是否过滤显示对应案件"，高亮是视觉提示而非筛选条件。

**筛选叠加逻辑：** 常规筛选条件与快捷芯片之间为 AND 关系。例如选中"重大案件"芯片 + 输入案号"2026"，则筛选出案号包含"2026"且标的 > 1 亿的案件。

### 5.4 表格区（CaseTable.vue）

复用全局 `.table-section` 容器，内含标题栏 + `el-table` + 分页。

**标题栏（`.table-title`）：**
- 左侧：当前视图名称「在办案件」/「已结案件」+ 数量标注（如「共 12 条」，`title-count` 样式）
- 标题随统计看板选中态联动变化

**表格：** `el-table`，`style="width: 100%"`，表头灰底 `#F5F7FA`（全局样式已强制），行底分隔线

**表格字段（依据 PRD 第三节列表字段）：**

| 列名 | 字段 | 宽度 | 交互 |
|------|------|------|------|
| 案件编号 | `caseNo` | min-width 160 | **点击跳转** `/cases/:id`；**高亮显示**（见下） |
| 申请人 | `applicant` | min-width 140 | 纯展示，`show-overflow-tooltip` |
| 被申请人 | `respondent` | min-width 140 | 纯展示，`show-overflow-tooltip` |
| 案由 | `caseReason` | min-width 140 | 纯展示，`show-overflow-tooltip` |
| 标的（万元） | `amount` | min-width 120 | 纯展示，右对齐，千分位格式化 |
| 办案秘书 | `secretary` | min-width 100 | 纯展示 |
| 仲裁庭 | `tribunal` | min-width 180 | 纯展示，`show-overflow-tooltip` |
| 组庭日期 | `groupDate` | min-width 120 | 纯展示 |
| 开庭日期 | `hearingDate` | min-width 140 | 纯展示 |
| 案件审限 | `deadline` | min-width 220 | **复合展示**：`年/月/日（剩余天数倒计时）（是否中止）（延期次数）` |
| 案件状态 | `caseStatus` | min-width 100 | `el-tag` 标签展示 |

**案件审限列复合展示格式：**
```
2026/09/15（剩余 62 天）（未中止）（延期 1 次）
```
- 剩余天数 ≤ 15 天：天数文字黄色 `#E6A23C`
- 剩余天数 < 0（已过期）：天数文字红色 `#F56C6C`，并显示"已延期"字样
- 案件中止：显示"已中止"灰色 tag
- 延期次数为 0：不显示括号

**案号高亮逻辑（常驻，与筛选无关）：**
- 通过 `el-table` 的 `:row-class-name` 或单元格 `:class` 绑定
- 审限剩余 ≤ 15 天且 > 0：案号文字黄色 `#E6A23C` + 加粗
- 审限剩余 < 0（已过期）：案号文字红色 `#F56C6C` + 加粗
- 其余：默认主题色 `#053d99`（`el-link type="primary"`）
- 高亮始终生效，即使未选中"即将延期"/"已延期"快捷芯片

**案号点击交互：**
- `el-link type="primary" :underline="false" @click="goToCaseDetail(row)"`
- `goToCaseDetail` → `router.push('/cases/' + row.id)`
- 本期跳转到占位详情页（`CaseDetailView.vue` 仅显示"案件详情页开发中"占位）

### 5.5 分页（pagination-bar）

复用全局 `.pagination-bar` 样式：
- `display: flex; justify-content: flex-start; margin-top: 16px`
- `el-pagination`：支持每页 5/10/20 条 + 页码跳转
- `layout="total, prev, pager, next, sizes"`，`background` + `small`
- 分页超出范围时自动回到最后一页

---

## 6. 组件职责与数据流 (Component Architecture & Data Flow)

### 6.1 组件职责

| 组件 | 职责 | 对外接口 |
|------|------|----------|
| `CasesView.vue` | 单页容器，组装统计看板 + 快捷筛选 + 常规筛选 + 表格；挂载时拉取 stats | 无 |
| `StatsBoard.vue` | 在办/已结统计卡片，点击切换状态 | emit: `switch-status` |
| `QuickFilter.vue` | 3 个可叠加快捷芯片 | v-model: `quickFilters` 对象 |
| `CaseFilter.vue` | 9 项折叠筛选 + 查询/重置按钮 | v-model: `filters` 对象；emit: `search`, `reset` |
| `CaseTable.vue` | 案件表格 + 案号高亮 + 分页 | props: `data`, `loading`, `currentStatus`；emit: `page-change` |
| `shared/CaseEmptyState.vue` | 空状态组件 | props: `text`, `icon` |

### 6.2 Pinia Store（`stores/case.js`）

集中管理案件列表、统计、筛选状态，使统计看板与表格数据同源：

```js
// 核心状态
{
  // 统计（不随筛选变化）
  stats: { active: 12, closed: 34 },

  // 当前查看状态
  currentStatus: 'active',          // 'active' | 'closed'

  // 原始数据（全量）
  activeList: [...],                // 在办案件全量
  closedList: [...],                // 已结案件全量

  // 筛选状态
  filters: {
    caseNo: '', applicant: '', respondent: '',
    caseReason: '', secretary: '',
    amountMin: null, amountMax: null,
    hearingDate: null,
    caseType: '',                    // '' | 'solo' | 'chief' | 'side'
    closedType: '',                 // '' | 'ruling' | 'mediation' | 'withdraw'
  },
  quickFilters: {
    major: false,                   // 重大案件（标的 > 1亿）
    expiringSoon: false,            // 即将延期（≤ 15 天）
    expired: false,                 // 已延期（< 0）
  },

  // 分页
  currentPage: 1,
  pageSize: 10,
}

// 核心方法
fetchStats()                              // 拉取统计数字（挂载时调用一次）
switchStatus(status)                      // 切换在办/已结 → 重置筛选 + 分页
applyFilters()                            // 应用筛选（查询按钮）
resetFilters()                            // 重置筛选（保留 currentStatus）
toggleQuickFilter(key)                    // 切换快捷芯片
getFilteredCases()                        // computed：应用筛选 + 快捷芯片后的列表
getPagedCases()                           // computed：分页后的列表
```

### 6.3 数据流

```
CasesView 挂载
  → store.fetchStats()
  → 统计看板渲染（在办/已结数字）

点击统计看板卡片
  → store.switchStatus('active' | 'closed')
  → 重置 filters + quickFilters + currentPage=1
  → getFilteredCases 重算 → 表格刷新

点击快捷芯片
  → store.toggleQuickFilter('major' | 'expiringSoon' | 'expired')
  → currentPage=1
  → getFilteredCases 重算（与常规筛选 AND 叠加）

点击查询按钮
  → store.applyFilters()（实际只需 currentPage=1 触发重算）
  → getFilteredCases 重算

点击重置按钮
  → store.resetFilters()
  → 清空 filters + quickFilters + currentPage=1
  → currentStatus 保留（不重置在办/已结视图）
  → getFilteredCases 重算

点击案号
  → router.push('/cases/' + row.id)
  → 占位详情页渲染
```

**当前阶段使用 Mock 数据：** 所有 store 方法返回本地静态/模拟数据。数据模型字段需包含 `groupDate`、`hearingDate`、`deadline`（截止日期）、`remainDays`（剩余天数，computed 或预计算）、`isSuspended`、`extensionCount`、`closedType`（已结案件才有）等。后续对接真实 API 时，只需替换 store 方法内部实现，组件层无需改动。

---

## 7. 视觉规范 (Visual Consistency)

沿用第一、二阶段首页与待办事项模块确立的设计约束，确保全站一致性。

| 项目 | 规范 |
|------|------|
| 页面背景 | 灰底 `#f7f7f7` |
| 卡片容器 | 白底 `#FFFFFF`、1px 边框 `#E4E7ED`、4px 圆角、`shadow="never"` |
| 表格表头 | 灰色背景 `#F5F7FA`（全局样式已强制 `!important`） |
| 筛选栏 | 复用全局 `.filter-bar` / `.filter-item` / `.filter-label`（56px 宽，左对齐） |
| 筛选按钮 | `font-size: 12px`，位于 `.filter-actions` |
| 快捷芯片 | `el-check-tag`，选中态主题色背景 `#053d99` + 白字 |
| 统计看板选中态 | 浅色背景 `#f2f5fa` + 左侧 3px 主题色高亮条 |
| 表格区 | 复用全局 `.table-section` / `.table-title` / `.title-count` |
| 分页 | 复用全局 `.pagination-bar`（flex, justify-content: flex-start, margin-top: 16px） |
| 操作按钮 | `el-button` link 类型，主题色，无背景填充 |
| 品牌色 | Primary `#053d99`、Dark `#00296b`、浅色区块 `#f2f5fa` |
| 高亮色 | 即将到期黄 `#E6A23C`、已过期红 `#F56C6C` |

---

## 8. 边界情况处理 (Edge Cases)

| 场景 | 处理方式 |
|------|----------|
| 列表无数据 | `CaseEmptyState` 组件：图标 + 「暂无案件数据」文案 |
| 筛选无结果 | 表格内显示「暂无匹配数据」空状态（`el-table` 的 `#empty` 插槽） |
| 加载中 | `el-table` 的 `v-loading` 指令，品牌色 spinner |
| 在办视图下选择结案类型 | 结案类型 `el-select` 禁用并置灰，`disabled` 绑定 `currentStatus === 'active'` |
| 标的区间输入校验 | 最小值 > 最大值时，点击查询按钮触发 `ElMessage.warning` 提示"标的区间最小值不能大于最大值"，不执行查询 |
| 分页超出范围 | 自动回到最后一页（`el-pagination` 默认行为） |
| 案号高亮与筛选关系 | 高亮常驻，与快捷芯片是否选中无关 |
| 延期次数为 0 | 审限列不显示「延期 0 次」括号 |
| 案件中止 | 审限列显示「已中止」灰色小 tag，天数仍显示但不计入即将/已延期高亮 |
| 占位详情页 | `CaseDetailView.vue` 居中显示「案件详情页开发中」+ 返回按钮 |

---

## 9. 后续规划 (Next Steps)

完成本模块开发与数据 mock 后，下一阶段将推进"案件详情页"（PRD 第五部分）的复杂业务流设计，承载案件全量信息与办理操作（基本信息、当事人、请求答辩、材料、文书签名、裁决书核阅、文书智能生成等）。
