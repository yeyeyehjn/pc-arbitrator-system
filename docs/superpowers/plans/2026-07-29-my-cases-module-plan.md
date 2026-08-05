# PC仲裁员端重构 - 第三阶段实施计划（"我的案件"模块）

> **关联设计文档**：`docs/superpowers/specs/2026-07-29-my-cases-module-design.md`

## 阶段 1: 路由配置与容器骨架 (Routing & Container)

- [ ] **扁平路由配置**：在 `src/router/index.js` 中添加路由：
  - `/cases` → `CasesView.vue`（单页容器）
  - `/cases/:id` → `CaseDetailView.vue`（案件详情页占位）
- [ ] **创建目录结构**：
  - `src/views/cases/` + `src/views/cases/components/` + `src/views/cases/components/shared/`
- [ ] **CasesView.vue 容器骨架**：
  - 整页灰底 `#f7f7f7`，内容区水平居中（无侧栏）
  - 上下三段式布局：统计看板 → 常规筛选 → 快捷筛选 → 表格 + 分页
  - 各区块之间 `margin-bottom: 16px`
  - 挂载时调用 `store.fetchStats()`
- [ ] **CaseDetailView.vue 占位页**：
  - 居中显示"案件详情页开发中"
  - 提供返回按钮（`router.back()` 或 `router.push('/cases')`）
- [ ] **MainLayout 联动**：确认顶部导航"我的案件"菜单项 `index="/cases"`，`resolveActiveMenu` 处理 `/cases/:id` 子路由高亮（沿用待办事项模块方案）

## 阶段 2: Pinia Store 与 Mock 数据 (State Management)

- [ ] **创建 `src/stores/case.js`**：
  - `stats`：`{ active: 12, closed: 34 }` 统计数字
  - `currentStatus`：`'active'`（当前查看状态，默认在办）
  - `activeList`：在办案件全量数据（Mock 8-12 条）
  - `closedList`：已结案件全量数据（Mock 15-20 条）
  - `filters`：9 项筛选状态对象（caseNo、applicant、respondent、caseReason、secretary、amountMin、amountMax、hearingDate、caseType、closedType）
  - `quickFilters`：`{ major: false, expiringSoon: false, expired: false }`
  - `currentPage`：1，`pageSize`：10
- [ ] **Mock 数据字段对齐设计文档**：
  - 基础字段：`id`、`caseNo`、`caseReason`、`applicant`、`respondent`、`amount`（万元）、`secretary`、`tribunal`、`caseStatus`
  - 审限字段：`groupDate`（组庭日期）、`hearingDate`（开庭日期）、`deadline`（截止日期）、`remainDays`（剩余天数）、`isSuspended`（是否中止）、`extensionCount`（延期次数）
  - 已结案件额外字段：`closedType`（ruling/mediation/withdraw）
  - `caseType`：solo（独任）/ chief（首席）/ side（边裁）
- [ ] **Mock 数据场景覆盖**：
  - 在办列表含：正常案件、即将到期（≤15天）案件、已过期（<0）案件、中止案件、延期 0 次案件、重大案件（标的 > 1 亿）
  - 已结列表含：裁决、调解、撤案三种结案类型
- [ ] **核心方法**（基于 Mock）：
  - `fetchStats()`：返回统计数字
  - `switchStatus(status)`：切换在办/已结 → 重置 filters + quickFilters + currentPage=1
  - `applyFilters()`：应用筛选（currentPage=1）
  - `resetFilters()`：清空 filters + quickFilters（保留 currentStatus）
  - `toggleQuickFilter(key)`：切换快捷芯片
- [ ] **计算属性**：
  - `getFilteredCases`：应用常规筛选 + 快捷芯片后的列表（AND 关系）
  - `getPagedCases`：分页后的列表
  - 快捷筛选判定逻辑：major（amount > 10000 万元）、expiringSoon（remainDays ≤ 15 且 > 0 且 !isSuspended）、expired（remainDays < 0）

## 阶段 3: 统计看板开发 (StatsBoard)

- [ ] **StatsBoard.vue 组件**：
  - props: `stats`（active/closed 数字）、`currentStatus`
  - emit: `switch-status`
- [ ] **卡片布局**：
  - 左右两张并排统计卡片，等分宽度（`display: flex; gap: 20px`）
  - 左卡片：「在办案件」标题 + 大号数字指标
  - 右卡片：「已结案件」标题 + 大号数字指标
- [ ] **卡片样式**（沿用首页 TodoStats 风格）：
  - 白底 `#FFFFFF`，1px 边框 `#E4E7ED`，4px 圆角
  - 内边距 `20px`，无阴影
  - 左侧线性图标 + 右侧文字与数字
- [ ] **选中态样式**：
  - 选中卡片：浅色背景 `#f2f5fa` + 左侧 3px 主题色高亮条 + 标题/数字主题色 `#053d99` 加粗
  - 未选中卡片：白底 + 默认文字色
  - 悬浮未选中卡片：背景微调为 `#fafafa`
- [ ] **交互**：点击卡片 → emit `switch-status` → 父组件调用 `store.switchStatus`

## 阶段 4: 常规筛选区开发 (CaseFilter)

- [ ] **CaseFilter.vue 组件**：
  - v-model: `filters` 对象
  - emit: `search`、`reset`
  - props: `currentStatus`（控制结案类型禁用态）
- [ ] **筛选区结构**：复用全局 `.filter-bar` / `.filter-item` / `.filter-label`（56px 宽，左对齐）
- [ ] **9 项筛选项实现**：
  - 案号、申请人、被申请人、案由、办案秘书：`el-input` + clearable，宽 180px
  - 标的区间（万元）：双 `el-input-number`（最小/最大），各 120px
  - 开庭日期：`el-date-picker`（单日期），宽 180px
  - 类型：`el-select`（全部/独任/首席/边裁），宽 120px
  - 结案类型：`el-select`（全部/裁决/调解/撤案），宽 120px
- [ ] **折叠行为**：
  - 默认折叠：首行显示 5 个高频筛选项 + 右侧"展开"按钮
  - 展开后：显示全部 9 项，按钮文案切换为"收起"
  - 通过 `.filter-items.collapsed` 类控制 `max-height`
- [ ] **操作按钮**：查询 / 重置（`.filter-actions`，`font-size: 12px`，居中）
- [ ] **结案类型禁用逻辑**：`disabled` 绑定 `currentStatus === 'active'`，在办视图下置灰
- [ ] **标的区间校验**：最小值 > 最大值时，点击查询触发 `ElMessage.warning` 提示，不执行查询

## 阶段 5: 快捷筛选开发 (QuickFilter)

- [ ] **QuickFilter.vue 组件**：
  - v-model: `quickFilters` 对象（major/expiringSoon/expired）
- [ ] **承载容器**：白底 `#FFFFFF`，1px 边框 `#E4E7ED`，4px 圆角，内边距 `12px 20px`
- [ ] **结构**：左侧标签「快捷筛选：」+ 右侧 3 个 toggle 芯片
- [ ] **3 个芯片实现**（`el-check-tag`，可叠加多选）：
  - `重大案件`（标的 > 1 亿元）
  - `即将延期`（审限剩余 ≤ 15 天）
  - `已延期`（审限已过期，剩余 < 0）
- [ ] **芯片样式**：未选中白底灰边框，选中主题色背景 `#053d99` + 白字
- [ ] **交互**：点击芯片 → 切换选中态 → 父组件触发筛选重算 + currentPage=1

## 阶段 6: 案件表格开发 (CaseTable)

- [ ] **CaseTable.vue 组件**：
  - props: `data`、`loading`、`currentStatus`
  - emit: `page-change`
- [ ] **表格区容器**：复用全局 `.table-section`
- [ ] **标题栏**（`.table-title`）：
  - 左侧：当前视图名称「在办案件」/「已结案件」+ 数量标注（`.title-count`）
  - 标题随统计看板选中态联动
- [ ] **表格字段实现**（`el-table`，`style="width: 100%"`）：
  - 案件编号：`el-link`，点击跳转 `/cases/:id`，含高亮逻辑
  - 申请人、被申请人、案由、仲裁庭：纯展示 + `show-overflow-tooltip`
  - 标的（万元）：右对齐，千分位格式化
  - 办案秘书、组庭日期、开庭日期：纯展示
  - 案件审限：复合展示
  - 案件状态：`el-tag`
- [ ] **案件审限列复合展示**：
  - 格式：`年/月/日（剩余 X 天）（是否中止）（延期 N 次）`
  - 剩余天数 ≤ 15 天：天数文字黄色 `#E6A23C`
  - 剩余天数 < 0：天数文字红色 `#F56C6C` + 显示"已延期"
  - 案件中止：显示"已中止"灰色 tag
  - 延期次数为 0：不显示括号
- [ ] **案号高亮逻辑（常驻，与筛选无关）**：
  - 通过单元格 `:class` 绑定
  - 审限剩余 ≤ 15 天且 > 0：案号黄色 `#E6A23C` + 加粗
  - 审限剩余 < 0：案号红色 `#F56C6C` + 加粗
  - 其余：默认主题色 `#053d99`
- [ ] **案号点击交互**：
  - `el-link type="primary" :underline="false" @click="goToCaseDetail(row)"`
  - `goToCaseDetail` → `router.push('/cases/' + row.id)`
- [ ] **分页**：复用全局 `.pagination-bar`
  - `el-pagination`：每页 5/10/20 条 + 页码跳转
  - `layout="total, prev, pager, next, sizes"`，`background` + `small`
- [ ] **空状态**：
  - 无数据：`CaseEmptyState` 组件，文案「暂无案件数据」
  - 筛选无结果：`el-table` 的 `#empty` 插槽，文案「暂无匹配数据」

## 阶段 7: 空状态组件 (CaseEmptyState)

- [ ] **shared/CaseEmptyState.vue 组件**：
  - props: `text`（默认"暂无案件数据"）、`icon`
  - 居中布局，灰色图标 + 文字
  - 样式参考待办事项模块的 `TodoEmptyState.vue`

## 阶段 8: 组装与联动 (Integration)

- [ ] **CasesView.vue 组装各子组件**：
  - `<StatsBoard>` + `<CaseFilter>` + `<QuickFilter>` + `<CaseTable>`
  - 绑定 store 状态与方法
- [ ] **数据流联调**：
  - 点击统计看板卡片 → `store.switchStatus` → 表格刷新 + 分页重置
  - 点击快捷芯片 → `store.toggleQuickFilter` → 表格刷新 + 分页重置
  - 点击查询 → `store.applyFilters` → 表格刷新 + 分页重置
  - 点击重置 → `store.resetFilters` → 清空筛选（保留 currentStatus）
  - 分页变化 → 更新 `currentPage` / `pageSize`
- [ ] **结案类型联动**：切换到在办视图时，结案类型 `el-select` 禁用置灰

## 阶段 9: 联调与自测 (Review & Polish)

- [ ] **Mock 数据渲染检查**：在办/已结列表字段无错位
- [ ] **状态切换测试**：点击在办/已结卡片 → 列表切换 + 筛选重置 + 分页重置
- [ ] **筛选功能测试**：
  - 9 项常规筛选项联动正常
  - 3 个快捷芯片可叠加 + 与常规筛选 AND 关系
  - 结案类型在在办视图下禁用
  - 标的区间最小 > 最大时查询提示
- [ ] **案号高亮测试**：
  - 即将到期（≤15天）案号黄色 + 加粗
  - 已过期（<0）案号红色 + 加粗
  - 高亮常驻，与快捷芯片选中无关
- [ ] **审限列复合展示测试**：
  - 正常案件、即将到期、已过期、中止案件、延期 0 次 各场景显示正确
- [ ] **案号跳转测试**：点击案号 → 跳转 `/cases/:id` 占位详情页
- [ ] **分页功能测试**：切换每页条数、页码跳转、分页超出范围回退
- [ ] **空状态检查**：无数据 + 筛选无结果
- [ ] **响应式检查**：1440px 及以下屏幕适配
- [ ] **设计规范验收**：
  - 无多余阴影
  - 表头灰色背景（全局 `!important` 生效）
  - 筛选标签 56px 宽左对齐
  - 筛选按钮 12px 字号
  - 分页 `justify-content: flex-start`
  - 统计看板选中态样式正确
