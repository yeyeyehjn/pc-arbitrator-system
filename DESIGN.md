# DESIGN.md — PC仲裁员端办案系统 设计系统

> 本文件由 `/impeccable init` 生成，从现有代码中提取的设计系统快照。
> register: `product`（工具型产品 UI，设计服务于功能）。
> 所有新增 UI 必须遵循本文件的 token、组件与禁令；与现有规范冲突时以本文件为准，并同步更新本文件。

## 1. 色彩 Token

品牌色为深蓝 `#053d99`，通过 Element Plus CSS 变量在 `:root` 全局注入（见 `src/styles/element/index.scss`）。当前使用 HEX；后续若扩展色板优先迁移到 OKLCH，但不得改动已落地的品牌色相。

### 1.1 品牌色阶（Primary）

| Token | 值 | 用途 |
|-------|----|------|
| `--el-color-primary` | `#053d99` | 主品牌色：链接、选中态、主按钮、强调 |
| `--el-color-primary-dark-2` | `#04307a` | active 按压态 |
| `--el-color-primary-light-3` | `#3a6bb5` | hover 态 |
| `--el-color-primary-light-5` | `#6a96cd` | 次级强调 |
| `--el-color-primary-light-7` | `#9abde0` | 边框/弱化 |
| `--el-color-primary-light-8` | `#b5d0e8` | 背景 tint |
| `--el-color-primary-light-9` | `#d5e3f2` | 浅 tint 背景 |

### 1.2 文字色

| Token | 值 | 用途 |
|-------|----|------|
| `--el-text-color-primary` | `#00296b` | 主标题（与品牌色同域的深蓝） |
| `--el-text-color-regular` | `#303133` | 正文 |
| `--el-text-color-secondary` | `#606266` | 次要文字、菜单默认态 |
| `--el-text-color-placeholder` | `#a8abb2` | 占位文字、数量标注 |

### 1.3 背景 / 表面 / 边框

| Token | 值 | 用途 |
|-------|----|------|
| `--el-bg-color-page` | `#f7f7f7` | 页面灰底 |
| `--el-color-white` | `#ffffff` | 卡片/表格/筛选栏白底 |
| 浅色区块 | `#f2f5fa` | 选中态背景、菜单 is-active 背景 |
| 表头背景 | `#f8f8f9` | 表格表头灰底（强制 `!important`） |
| `--el-border-color` | `#dcdfe6` | 默认边框 |
| `--el-border-color-light` | `#e4e7ed` | 卡片边框、分割线 |
| `--el-border-color-lighter` | `#ebeef5` | 表格行底分隔线、卡片头底边 |

### 1.4 语义高亮色（状态）

| 色值 | 语义 |
|------|------|
| `#E6A23C` | 即将到期（审限 ≤ 15 天）— 黄 |
| `#F56C6C` | 已过期/已延期（审限 < 0）— 红 |
| `#faebeb`（或同域浅红 tint） | 已延期案件行背景 |
| `#fff7e6`（或同域浅黄 tint） | 重大案件金额高亮背景 |

## 2. 字体系统

系统默认中文字体栈，未引入自定义字体。字族数 = 1，靠字号 + 字重对比建立层级。

| Token | 字号 | 字重 | 用途 |
|-------|------|------|------|
| 大标题 | 16px | 600 / bold | 卡片标题、页面标题、菜单 is-active |
| 正文 | 14px | 400 / 500 | 正文、表格内容、筛选标签 |
| 辅助文字 | 12px | 400 / 500 | 数量标注、按钮文案、提示、tag |
| 标签 | 10px | 400 | 微标签（如「已中止」小 tag） |

**层级对比要求：** 相邻层级字号差 ≥ 2px，字重差 ≥ 100。不要用 13px/15px 这种中间值打乱节奏。

## 3. 布局与间距

### 3.1 全局骨架

- 顶部导航栏：`height: 60px`，白底，底部 1px 分割线，无阴影。
- 内容区：`max-width: 1440px`，`margin: 0 auto`，外层 `padding: 20px`。
- 页面灰底 `#f7f7f7`，内容卡片白底。

### 3.2 模块级布局

| 模块 | 布局 | 说明 |
|------|------|------|
| 首页 | 左右双栏 16:8（`el-row :gutter="20"`） | 左栏主业务流，右栏辅助工具 |
| 我的案件 | 上下三段式 | 统计看板 → 筛选 → 表格+分页 |
| 待办事项 | 左右双栏 200px + 自适应 | 左栏局部侧栏菜单，右栏子模块内容 |

### 3.3 间距刻度

统一使用 4 的倍数：`4 / 8 / 12 / 16 / 20 / 24`。

- 区块间垂直间距：`margin-bottom: 16px`（卡片之间、筛选栏与表格之间）。
- 卡片内边距：`padding: 20px`（`--el-card-padding`）。
- 筛选栏内边距：`padding: 24px 20px`。
- 表格区内边距：`padding: 24px 20px`。
- 筛选项横向间距：`gap: 12px`。
- 分页上间距：`margin-top: 16px`。

## 4. 全局组件类（复用优先）

定义在 `src/styles/element/index.scss`。**新模块必须复用这些类，禁止在组件内重复定义同类样式。**

### 4.1 `.filter-bar` — 筛选栏容器

```
.filter-bar
├── .filter-items          // flex-wrap, gap:12px, 支持 .collapsed 折叠
│   ├── .filter-item       // flex, align-items:center, gap:8px
│   │   ├── .filter-label  // 14px, 左对齐, width:56px, flex-shrink:0
│   │   └── el-input / el-select / el-date-editor  // width:180px
│   └── .flex-grow         // 占位撑开
└── .filter-actions        // flex, center, gap:4px, margin-top:16px
    └── .el-button         // font-size:12px（查询/重置）
```

- 折叠态：`.filter-items.collapsed { max-height: 40px; overflow: hidden; }`
- 控件宽度统一 180px；数值/下拉类可收窄到 120px。

### 4.2 `.table-section` / `.table-title` — 表格区

- `.table-section`：白底，`padding: 24px 20px`。
- `.table-title`：`display:flex; justify-content:space-between`；16px / 600 字重；`.title-count` 为 12px 弱化数量标注。

### 4.3 表格表头（全局强制）

```scss
.el-table__header-wrapper th.el-table__cell {
  background-color: #f8f8f9 !important;
  color: var(--el-text-color-regular) !important;
  font-weight: bold;
  border-bottom: none !important;   // 必须用 !important 覆盖 Element Plus 默认
}
.el-table .el-table__cell {
  border-bottom: var(--el-border-color-lighter) 1px solid;  // 仅行底分隔线
}
```

### 4.4 `.pagination-wrapper` / `.pagination-bar` — 分页

`display:flex; justify-content:flex-start; margin-top:16px`。`el-pagination` 用 `layout="total, prev, pager, next, sizes"` + `background` + `small`。

### 4.5 `.todos-sidebar` — 局部侧栏

200px 宽，白底，右侧 1px 分割线。`.sidebar-title` 50px 高 / 16px bold。菜单 is-active：主题色文字 + `#f2f5fa` 背景 + 左侧 3px 主题色竖条（局部侧栏内的 3px 竖条是已确立的品牌系统元素，**不是**被禁的卡片侧条 accent）。

### 4.6 卡片标题前缀竖条（首页品牌系统）

首页 `.dashboard-card .card-title::before`：3px × 16px 主题色竖条，2px 圆角。这是首页确立的品牌节奏，沿用即可；**不要**在新模块的每个卡片上滥用，仅在主信息卡片标题上使用。

### 4.6.1 「选中态」3px 竖条 — impeccable 侧条禁令的登记例外

impeccable 通用禁令禁止「`border-left`/`border-right` > 1px 作为卡片的彩色 accent」。本项目把 3px 左侧竖条重新定义为 **selection indicator（选中态指示器）**，与「卡片装饰性 accent」边界划清：

| 适用场景 | 元素 | 实现 |
|----------|------|------|
| 局部侧栏 is-active | `.todos-sidebar .el-menu-item.is-active::before` | 3px 主题色竖条 |
| 统计卡 active | `.stats-board .stat-card.active::before` | 3px 主题色竖条 |

**边界规则：**
- 3px 竖条**仅**用于表达「当前选中 / 当前激活」的语义状态，不用于装饰。
- 卡片在**未选中**态下不得出现竖条（仅 hover/边框/背景表达）。
- 不得把竖条泛化到「未选中的普通卡片」作为视觉装饰；那才是禁令所防的 AI reflex。
- 新增模块若需要「选中态」表达，优先复用此系统元素，保持全站一致。

此例外经 `/impeccable critique` 评审确认，作为有意决策登记。

## 5. 交互与状态

### 5.1 选中态

- 统计看板卡片选中：`#f2f5fa` 背景 + 左侧 3px 主题色高亮条 + 标题/数字主题色加粗。
- 菜单 is-active：主题色文字 + `#f2f5fa` 背景（+ 局部侧栏内 3px 竖条）。
- 顶部导航 is-active：主题色文字 + 底部 2px 主题色下划线。

### 5.2 悬浮态

- 卡片：`el-card shadow="hover"`；首页卡片 hover 阴影 `0 6px 20px rgba(5,61,153,0.08)`，`transition: box-shadow .25s, transform .25s`。
- 未选中统计卡片 hover：背景微调到 `#fafafa`，无阴影突变。
- 菜单项 hover：文字色变 `--el-color-primary-light-3`。

### 5.3 链接与按钮

- 案号链接：`el-link type="primary" :underline="false"`，可叠加高亮色（黄/红）。
- 操作链接（"查看全部"等）：`el-link type="primary" :underline="false"`。
- 查询/重置：`el-button`，12px 字号，置于 `.filter-actions`。
- 按钮文案：动词 + 对象（"查询" / "重置" / "全部已读" / "清除缓存"）。

### 5.4 标签 Tag

- 案件状态：`el-tag`，按状态色区分。
- 快捷筛选：`el-check-tag`，选中态主题色背景 `#053d99` + 白字。
- 「已中止」等微标签：10px 灰色小 tag。

## 6. 动效

- 过渡时长基准：`0.25s`，缓动 `ease`。
- 卡片 hover：`box-shadow` + `transform` 过渡。
- 表格/筛选切换：即时，不做入场动画（工作工具，不要让用户等动效）。
- 折叠/展开筛选：`max-height` 过渡。
- **`prefers-reduced-motion`**：后续若引入入场动画，必须提供降级（即时或交叉淡入）。当前无入场动画，暂无需处理。

## 7. 反模式禁令（本项目特定）

除 impeccable 通用禁令外，本项目额外禁止：

1. **时间线左侧色条**：禁用 `border-left` 色条做时间线，改用完整边框 + 圆角的卡片。
2. **表格竖向边框**：仅保留行底分隔线，不要给单元格加左右边框。
3. **组件内重复定义全局类样式**：`.filter-bar` / `.table-section` / `.pagination-bar` 等已在全局定义，组件内不得再写同类样式覆盖。
4. **表头边框**：不得移除 `border-bottom: none !important`，不得给表头加下边框。
5. **字体中间值**：不得使用 13px / 15px 等非刻度字号。
6. **多字族**：不得引入第二个字族；靠字号 + 字重建立层级。
7. **em dash**：文案中不使用「—」破折号，用逗号/冒号/句号/括号代替。
8. **每个卡片都加标题竖条**：3px 标题竖条是首页主信息卡片的品牌节奏，不要泛化到所有模块的所有卡片。

## 8. 空状态与边界

- 列表无数据：`CaseEmptyState` / `TodoEmptyState` 组件，图标 + 文案（如「暂无案件数据」）。
- 筛选无结果：`el-table` 的 `#empty` 插槽显示「暂无匹配数据」。
- 加载中：`el-table` 的 `v-loading`，品牌色 spinner。
- 占位页：居中文案 + 返回按钮（如案件详情页占位）。

## 9. 待补全的设计 token

当前项目的色彩用 HEX 表达。若后续 impeccable 引入新模块并需要更细的色板（如数据统计看板的多色图表），应：

1. 优先在 `:root` 新增 OKLCH 变量，品牌色 `#053d99` 作为锚点。
2. 图表色板围绕品牌色同域展开（同色相不同明度），避免引入无关色相。
3. 同步在本文件登记新 token。

## 10. 设计系统维护规则

- 新增/修改全局类 → 改 `src/styles/element/index.scss`，**不**在组件内复制。
- 新增 token → 同步登记到本文件对应表格。
- 新增模块 → 启动前用 `/impeccable shape` 规划，完成后用 `/impeccable critique` 评审，发布前用 `/impeccable polish` 精修。
- 评审/精修产出的问题清单作为本文件的迭代输入。
