# PC仲裁员端重构 - 第二阶段实施计划（待办事项模块）

> **关联设计文档**：`docs/superpowers/specs/2026-07-16-todos-module-design.md`

## 阶段 1: 路由配置与容器骨架 (Routing & Container)

- [ ] **嵌套路由配置**：在 `src/router/index.js` 中添加 `/todos` 父路由及 4 个子路由：
  - `/todos` → `TodosView.vue`，`redirect: '/todos/signature'`
  - `/todos/signature` → `SignatureList.vue`
  - `/todos/center` → `TodoCenter.vue`
  - `/todos/review` → `ReviewList.vue`
  - `/todos/scheduling` → `SchedulingView.vue`
- [ ] **创建目录结构**：`src/views/todos/` + `src/views/todos/components/` + `src/views/todos/components/shared/`
- [ ] **TodosView.vue 容器**：
  - 使用 `el-container` 实现左右双栏布局（左 200px 固定 + 右 flex）
  - 左栏：`el-menu`（垂直模式），4 个菜单项，每项含图标 + 名称 + `el-badge` 数量徽标
  - 菜单 `router` 模式与 URL 同步
  - 右栏：`<router-view />`
  - "智能约庭"菜单项追加 `[建议]` 灰色小字标签
- [ ] **菜单选中态样式**：左侧 3px 主题色高亮条 + 浅色背景 `#f2f5fa`

## 阶段 2: Pinia Store 与 Mock 数据 (State Management)

- [ ] **创建 `src/stores/todo.js`**：
  - `counts`：signature / center / review 三个数字
  - `commitmentList`（承诺书）、`recordList`（笔录）、`documentList`（文书签名）
  - `extensionList`（延期办理）、`chiefList`（选择首席）
  - `reviewList`（裁决书核阅）
- [ ] **Mock 数据填充**：每类列表填入 3-8 条逼真测试数据，字段对齐设计文档（案号、案由、申请人、被申请人、标的、经办秘书、仲裁庭、案件状态、提交时间等）
- [ ] **核心方法**（基于 Mock）：
  - `fetchAllCounts()` 汇总各分类数量
  - `signCommitment(id)` / `signRecord(id)` / `signDocument(id)`
  - `approveExtension(id, action)` / `approveBatch(ids, action)` 一键同意
  - `selectChief(id, data)` / `reviewAward(id, action)`

## 阶段 3: 共用组件开发 (Shared Components)

- [ ] **TodoEmptyState.vue**：
  - props: `text`（默认"暂无待办事项"）、`icon`
  - 居中布局，灰色图标 + 文字
- [ ] **SignaturePad.vue（手写签名板）**：
  - 基于 Canvas 实现手写签名（支持鼠标/触摸）
  - props: `width`、`height`
  - 方法：`clear()` 清除画布、`getSignature()` 获取签名图片 base64
  - 纯白画布背景，1px 边框

## 阶段 4: 签名列表开发 (Signature List)

- [ ] **SignatureList.vue 页面骨架**：
  - 使用 `el-tabs` 实现三个标签页切换：承诺书签署 / 笔录签名 / 文书签名
  - 每个 tab 内：筛选区 + 表格 + 分页
- [ ] **筛选区**（各 tab 共用布局）：
  - 案件编号、当事人（输入框）、类型（下拉）、经办秘书（下拉）、状态（待签名/已签名 下拉）
- [ ] **表格字段**：
  - 案号（可点击跳转案件详情，暂用 `router.push('/cases')` 占位）
  - 案由、申请人、被申请人（纯文本）
  - 标的（元）（金额格式化）
  - 经办秘书、仲裁庭（纯文本）
  - 案件状态（`el-tag`）
  - 提交时间
  - 操作列
- [ ] **承诺书签署操作流程**：
  - 点击「签名」→ 弹出 `el-dialog`
  - 弹窗内容：承诺书正文全文预览（可滚动）+ 底部签名区域
  - 点击底部签名区域 → 展开全屏签名区域（`SignaturePad`）
  - 底部操作：「取消」/「清除」/「确认签名」
  - 确认后 `store.signCommitment(id)` → `ElMessage.success` → 列表移除 + 徽标更新
- [ ] **笔录签名操作流程**：
  - 点击「签名」→ 弹出 `el-dialog`，手写签名区域占满整个屏幕（`SignaturePad`）
  - 底部操作：「取消」/「清除」/「确认签名」
- [ ] **文书签名操作**：
  - 点击「签名」→ `ElMessage.info` 提示"该功能暂未开放，后续实现"
- [ ] **空状态**：各 tab 列表无数据时展示 `TodoEmptyState`

## 阶段 5: 待办中心开发 (Todo Center)

- [ ] **TodoCenter.vue 页面骨架**：
  - 使用 `el-tabs` 实现两个标签页切换：延期办理 / 选择首席
- [ ] **筛选区**：案件编号、当事人、类型、经办秘书
- [ ] **表格字段**（延期办理）：
  - 案号、案由、申请人、被申请人、标的（元）
  - 经办秘书、仲裁庭、组庭日期
  - 裁决期限（年/月/日 + 倒计时天数 + 是否中止 Tag + 延期次数）
  - 案件状态、提交时间
  - 操作：「审批」按钮
- [ ] **一键同意功能**：
  - 延期办理 tab 顶部工具栏提供「一键同意」批量操作按钮
  - 点击后将当前列表所有待审批项批量通过
- [ ] **延期审批弹窗**：
  - `el-dialog` 展示案号、延期原因、申请延期天数
  - 底部：「同意」（type=primary）/「驳回」（type=danger）
  - 操作后 `store.approveExtension(id, action)` → 列表移除 + 徽标更新
- [ ] **选择首席 tab**：
  - 表格展示需选择首席仲裁员的案件
  - 操作：「选择」按钮 → 弹窗选择首席仲裁员（下拉/列表选择）
- [ ] **空状态**处理

## 阶段 6: 裁决书核阅列表开发 (Review List)

- [ ] **ReviewList.vue 页面骨架**：
  - 顶部工具栏：标题 + 搜索框（无筛选标签）
  - 主体：`el-table` + 底部分页
- [ ] **表格字段**：
  - 案号（可点击跳转）
  - 案由、申请人、被申请人、提交人（办案秘书姓名）、提交时间
  - 操作：「核阅」按钮
- [ ] **核阅弹窗**：
  - 大尺寸 `el-dialog`（宽度 80%），展示裁决书正文全文预览（可滚动）
  - 底部：「通过核阅」（type=primary）/「退回修改」
  - 操作后 `store.reviewAward(id, action)` → 列表移除 + 徽标更新
- [ ] **空状态**处理

## 阶段 7: 智能约庭占位页 (Scheduling Placeholder)

- [ ] **SchedulingView.vue**：
  - 居中空状态布局
  - 日历/排期类线性图标
  - 标题："智能约庭功能开发中，敬请期待"
  - 说明文字："未来将支持自动匹配仲裁员排期、庭审场地空闲时段，避开冲突，一键生成排期表。"

## 阶段 8: 首页联动改动 (Home Page Integration)

- [ ] **更新 TodoStats.vue**：
  - "总待办"卡片 path → `/todos`
  - "待签承诺书"/"待签笔录"/"待签文书"卡片 path → `/todos/signature`
  - "待审批延期"/"待草拟裁决书"卡片 path → `/todos/center`
- [ ] **验证跳转**：从首页点击各卡片能正确进入对应子模块

## 阶段 9: 联调与自测 (Review & Polish)

- [ ] **Mock 数据渲染检查**：各列表字段无错位
- [ ] **操作流程测试**：
  - 承诺书/笔录签名 → 列表移除 + 徽标减一
  - 延期审批（同意/驳回）+ 一键同意 → 列表移除 + 徽标更新
  - 核阅（通过/退回）→ 列表移除 + 徽标更新
- [ ] **tab 切换测试**：签名列表三 tab、待办中心两 tab 切换正常
- [ ] **手写签名测试**：canvas 绘制、清除、确认功能正常
- [ ] **筛选功能测试**：各筛选项联动正常
- [ ] **分页功能测试**：切换每页条数、页码跳转
- [ ] **响应式检查**：1440px 及以下屏幕适配
- [ ] **空状态检查**
- [ ] **设计规范验收**：无多余阴影、Tag 颜色正确、表头灰色背景
