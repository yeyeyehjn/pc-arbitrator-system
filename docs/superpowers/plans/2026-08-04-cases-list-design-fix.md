# /cases/list 页面设计修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 /cases/list 页面的 4 类设计问题：侧边栏类名对齐、移动端导航断裂、CaseListPanel 类名冲突、硬编码颜色违规。

**Architecture:** 修改 5 个文件，不新增文件。CasesView 改用全局 `.todos-sidebar` 类并删除重复 scoped 样式；新增移动端 el-select 下拉选择器；CaseListPanel 根类名重命名；3 个组件的硬编码 hex 色值逐一替换为 CSS 变量。

**Tech Stack:** Vue 3.4 (Composition API), Element Plus 2.7, SCSS, CSS 变量

## Global Constraints

- 字号仅允许 16/14/12/10px，禁止 13px/15px
- 禁止硬编码 `#909399`、`#c0c4cc`、`color: #606266`
- 禁止侧边条纹（border-left > 1px）作为装饰
- el-form 组件必须设置 label-position="left"
- 移动端（≤768px）el-drawer 非全屏使用 width: 90% !important
- 表格 td 文字颜色使用 var(--el-text-color-regular)
- 开发服务器端口：5173（若被占用自动切换 5174）

---

## File Structure

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/views/cases/CasesView.vue` | 修改 | P1 侧边栏类名对齐 + P2 移动端导航 |
| `src/views/cases/components/CaseListPanel.vue` | 修改 | P3 根类名重命名 |
| `src/views/cases/components/StatsBoard.vue` | 修改 | P4 硬编码颜色替换 |
| `src/views/cases/components/CaseTable.vue` | 修改 | P4 硬编码颜色替换 |
| `src/views/cases/components/CaseFilter.vue` | 修改 | P4 硬编码颜色替换 |

---

### Task 1: CasesView 侧边栏对齐全局规范 (P1)

**Files:**
- Modify: `src/views/cases/CasesView.vue`

**Interfaces:**
- Consumes: 全局 `.todos-sidebar` 样式（定义在 `src/styles/element/index.scss` L34-L109）
- Produces: CasesView 侧边栏使用 `.todos-sidebar` 类名，与 TodosView/ProfileView 一致

- [ ] **Step 1: 修改模板中的侧边栏类名**

将 `src/views/cases/CasesView.vue` 模板中 `<aside class="cases-sidebar"` 改为 `<aside class="todos-sidebar"`：

```vue
<aside class="todos-sidebar" :class="{ collapsed: !sidebarExpanded }">
```

- [ ] **Step 2: 删除 scoped 中重复的侧边栏样式**

删除 `src/views/cases/CasesView.vue` `<style scoped lang="scss">` 中以下样式块（这些由全局 `.todos-sidebar` 提供）：

- `.cases-sidebar { ... }` 整块（含 `&.collapsed`、`.sidebar-title`、`.sidebar-menu`）
- 移动端 `@media (max-width: 768px)` 中关于 `.cases-sidebar`、`.sidebar-title`、`.sidebar-menu` 的规则

- [ ] **Step 3: 保留并补充 scoped 样式**

保留以下样式，并新增移动端侧边栏隐藏规则：

```scss
.cases-view {
  display: flex;
  min-height: calc(100vh - 100px);
  margin: -20px;
}

.cases-content {
  flex: 1;
  padding: 20px;
  background-color: var(--el-bg-color-page);
  overflow: auto;
}

// 移动端：侧边栏隐藏，使用下拉选择器替代
@media (max-width: 768px) {
  .cases-view {
    flex-direction: column;
  }

  .todos-sidebar {
    display: none;
  }

  .cases-content {
    padding: 16px;
  }
}
```

- [ ] **Step 4: 启动开发服务器验证**

Run: `npm run dev`
访问 `http://localhost:5173/cases/list`（或 5174）
Expected: 侧边栏宽度 200px，菜单项激活时左侧 3px 竖条显示，未选中项文字为次要色

- [ ] **Step 5: Commit**

```bash
git add src/views/cases/CasesView.vue
git commit -m "fix(cases): CasesView 侧边栏改用全局 .todos-sidebar 类名，消除重复样式

- 将 .cases-sidebar 改为 .todos-sidebar，与 TodosView/ProfileView 一致
- 删除 scoped 中重复的侧边栏样式块
- 菜单项激活时左侧 3px 竖条由全局 .is-active::before 提供"
```

---

### Task 2: 移动端导航下拉选择器 (P2)

**Files:**
- Modify: `src/views/cases/CasesView.vue`

**Interfaces:**
- Consumes: `activeMenu` 计算属性（已存在，`computed(() => route.path)`）、`handleMenuSelect` 方法（已存在）
- Produces: 移动端可通过 el-select 切换"我的案件"和"数据统计"

- [ ] **Step 1: 在模板中添加移动端导航选择器**

在 `src/views/cases/CasesView.vue` 的 `<section class="cases-content">` 内、`<router-view />` 之前添加：

```vue
<section class="cases-content">
  <!-- 移动端导航选择器 -->
  <div class="mobile-nav-selector">
    <el-select
      :model-value="activeMenu"
      placeholder="请选择"
      @change="handleMenuSelect"
    >
      <el-option label="我的案件" value="/cases/list" />
      <el-option label="数据统计" value="/cases/statistics" />
    </el-select>
  </div>
  <router-view />
</section>
```

- [ ] **Step 2: 添加移动端导航选择器样式**

在 `src/views/cases/CasesView.vue` 的 scoped 样式中添加：

```scss
.mobile-nav-selector {
  display: none; // 桌面端隐藏

  :deep(.el-select) {
    width: 100%;

    .el-input__wrapper {
      font-size: 14px;
    }
  }
}

// 移动端样式在 Task 1 Step 3 的 @media 块中补充
```

在 Task 1 Step 3 的 `@media (max-width: 768px)` 块内追加：

```scss
@media (max-width: 768px) {
  // ... 已有规则 ...

  .mobile-nav-selector {
    display: block;
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-light);
  }
}
```

- [ ] **Step 3: 验证移动端导航**

浏览器开发者工具切换到移动端视图（≤768px）
Expected: 侧边栏隐藏，内容区顶部显示下拉选择器，切换选项路由正常跳转

- [ ] **Step 4: Commit**

```bash
git add src/views/cases/CasesView.vue
git commit -m "fix(cases): 修复移动端导航断裂，新增 el-select 下拉选择器

- 移动端侧边栏隐藏时显示下拉选择器
- el-select 选中项与当前路由同步
- 桌面端隐藏下拉选择器"
```

---

### Task 3: CaseListPanel 类名修复 (P3)

**Files:**
- Modify: `src/views/cases/components/CaseListPanel.vue`

**Interfaces:**
- Produces: CaseListPanel 根类名为 `.case-list-panel`，不再与 CasesView 的 `.cases-view` 冲突

- [ ] **Step 1: 修改模板根类名**

将 `src/views/cases/components/CaseListPanel.vue` 模板第 2 行：

```vue
<!-- 原 -->
<div class="cases-view">

<!-- 改为 -->
<div class="case-list-panel">
```

- [ ] **Step 2: 修改 scoped 样式选择器**

将 `src/views/cases/components/CaseListPanel.vue` scoped 样式中的 `.cases-view` 改为 `.case-list-panel`：

```scss
<!-- 原 -->
.cases-view {
  padding-bottom: 20px;
}

<!-- 改为 -->
.case-list-panel {
  padding-bottom: 20px;
}
```

- [ ] **Step 3: 验证页面渲染正常**

访问 `http://localhost:5173/cases/list`
Expected: 页面渲染正常，StatsBoard + CaseFilter + CaseTable 无样式丢失

- [ ] **Step 4: Commit**

```bash
git add src/views/cases/components/CaseListPanel.vue
git commit -m "fix(cases): CaseListPanel 根类名改为 .case-list-panel，避免与 CasesView 冲突"
```

---

### Task 4: StatsBoard 硬编码颜色替换 (P4)

**Files:**
- Modify: `src/views/cases/components/StatsBoard.vue`

**Interfaces:**
- Produces: StatsBoard.vue 中所有硬编码 hex 色值替换为 CSS 变量

**色值映射表**（本任务和 Task 5/6 共用）：

| 原始 | 替换为 |
|------|--------|
| `#ffffff` | `var(--el-bg-color)` |
| `#e4e7ed` | `var(--el-border-color-light)` |
| `#f2f5fa` | `var(--el-fill-color-light)` |
| `#303133` | `var(--el-text-color-primary)` |
| `#767a82` | `var(--el-text-color-secondary)` |
| `#dcdfe6` | `var(--el-border-color)` |
| `#67c23a` | `var(--el-color-success)` |
| `#e6a23c` | `var(--el-color-warning)` |
| `#f56c6c` | `var(--el-color-danger)` |

- [ ] **Step 1: 替换 .stat-card 容器颜色**

在 `src/views/cases/components/StatsBoard.vue` scoped 样式中：

```scss
// 原
.stat-card {
  background-color: #ffffff;
  border: 1px solid #e4e7ed;

// 改为
.stat-card {
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
```

- [ ] **Step 2: 替换 .stat-card.active 和 hover 颜色**

```scss
// 原 &.active
background-color: #f2f5fa;

// 改为
background-color: var(--el-fill-color-light);
```

- [ ] **Step 3: 替换 .stat-icon-wrap 颜色**

```scss
// 原
.stat-icon-wrap {
  background-color: #f2f5fa;
  .stat-icon {
    color: #767a82;

// 改为
.stat-icon-wrap {
  background-color: var(--el-fill-color-light);
  .stat-icon {
    color: var(--el-text-color-secondary);
```

- [ ] **Step 4: 替换 .stat-number 颜色**

```scss
// 原
.stat-number {
  color: #303133;

// 改为
.stat-number {
  color: var(--el-text-color-primary);
```

- [ ] **Step 5: 替换 .sub-stat-item 颜色**

```scss
// 原
.sub-stat-item {
  .sub-label {
    color: #767a82;
  }
  .sub-value {
    color: #303133;
  }
  &.normal .sub-value { color: #67c23a; }
  &.expiring .sub-value { color: #e6a23c; }
  &.expired .sub-value { color: #f56c6c; }
  &.ruling .sub-value { color: var(--el-color-primary); }
  &.mediation .sub-value { color: #67c23a; }
  &.withdraw .sub-value { color: #767a82; }
}

// 改为
.sub-stat-item {
  .sub-label {
    color: var(--el-text-color-secondary);
  }
  .sub-value {
    color: var(--el-text-color-primary);
  }
  &.normal .sub-value { color: var(--el-color-success); }
  &.expiring .sub-value { color: var(--el-color-warning); }
  &.expired .sub-value { color: var(--el-color-danger); }
  &.ruling .sub-value { color: var(--el-color-primary); }
  &.mediation .sub-value { color: var(--el-color-success); }
  &.withdraw .sub-value { color: var(--el-text-color-secondary); }
}
```

- [ ] **Step 6: 替换 .sub-divider 颜色**

```scss
// 原
.sub-divider {
  background-color: #dcdfe6;
}

// 改为
.sub-divider {
  background-color: var(--el-border-color);
}
```

- [ ] **Step 7: 验证无残留硬编码色值**

Run: 在 `src/views/cases/components/StatsBoard.vue` 中搜索 `#[0-9a-fA-F]{3,6}`
Expected: 无匹配结果（所有 hex 色值已替换为 CSS 变量）

- [ ] **Step 8: Commit**

```bash
git add src/views/cases/components/StatsBoard.vue
git commit -m "fix(cases): StatsBoard 硬编码色值替换为 CSS 变量

- #ffffff → var(--el-bg-color)
- #e4e7ed → var(--el-border-color-light)
- #f2f5fa → var(--el-fill-color-light)
- #303133 → var(--el-text-color-primary)
- #767a82 → var(--el-text-color-secondary)
- #dcdfe6 → var(--el-border-color)
- #67c23a → var(--el-color-success)
- #e6a23c → var(--el-color-warning)
- #f56c6c → var(--el-color-danger)"
```

---

### Task 5: CaseTable 硬编码颜色替换 (P4)

**Files:**
- Modify: `src/views/cases/components/CaseTable.vue`

**色值映射表**：同 Task 4，额外补充：

| 原始 | 替换为 |
|------|--------|
| `#053d99` | `var(--el-color-primary-dark-2)` |

- [ ] **Step 1: 替换 .major-star 颜色**

在 `src/views/cases/components/CaseTable.vue` scoped 样式中：

```scss
// 原
.major-star {
  color: #e6a23c;

// 改为
.major-star {
  color: var(--el-color-warning);
```

- [ ] **Step 2: 替换 .major-star:focus-visible outline 颜色**

```scss
// 原
&:focus-visible {
  outline: 2px solid #053d99;
}

// 改为
&:focus-visible {
  outline: 2px solid var(--el-color-primary-dark-2);
}
```

- [ ] **Step 3: 替换 :deep(.amount-major) 颜色**

```scss
// 原
:deep(.amount-major) {
  color: #e6a23c;

// 改为
:deep(.amount-major) {
  color: var(--el-color-warning);
```

- [ ] **Step 4: 替换 .deadline-days 颜色**

```scss
// 原
.deadline-days {
  color: #767a82;

  &.days-expiring {
    color: #e6a23c;
  }

  &.days-expired {
    color: #f56c6c;
  }
}

// 改为
.deadline-days {
  color: var(--el-text-color-secondary);

  &.days-expiring {
    color: var(--el-color-warning);
  }

  &.days-expired {
    color: var(--el-color-danger);
  }
}
```

- [ ] **Step 5: 替换案号高亮颜色**

```scss
// 原
:deep(.case-no-expiring) {
  color: #e6a23c !important;
}

:deep(.case-no-expired) {
  color: #f56c6c !important;
}

// 改为
:deep(.case-no-expiring) {
  color: var(--el-color-warning) !important;
}

:deep(.case-no-expired) {
  color: var(--el-color-danger) !important;
}
```

- [ ] **Step 6: 验证无残留硬编码色值**

Run: 在 `src/views/cases/components/CaseTable.vue` 中搜索 `#[0-9a-fA-F]{3,6}`
Expected: 无匹配结果

- [ ] **Step 7: Commit**

```bash
git add src/views/cases/components/CaseTable.vue
git commit -m "fix(cases): CaseTable 硬编码色值替换为 CSS 变量

- #e6a23c → var(--el-color-warning)
- #f56c6c → var(--el-color-danger)
- #767a82 → var(--el-text-color-secondary)
- #053d99 → var(--el-color-primary-dark-2)"
```

---

### Task 6: CaseFilter 硬编码颜色替换 (P4)

**Files:**
- Modify: `src/views/cases/components/CaseFilter.vue`

**色值映射表**：同 Task 4

- [ ] **Step 1: 替换 .quick-filter border-top 颜色**

在 `src/views/cases/components/CaseFilter.vue` scoped 样式中：

```scss
// 原
.quick-filter {
  border-top: 1px dashed #ebeef5;

// 改为
.quick-filter {
  border-top: 1px dashed var(--el-border-color-lighter);
```

- [ ] **Step 2: 替换 .el-check-tag border 和 background 颜色**

```scss
// 原
:deep(.el-check-tag) {
  border: 1px solid #dcdfe6;
  background-color: #ffffff;

// 改为
:deep(.el-check-tag) {
  border: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color);
```

- [ ] **Step 3: 验证无残留硬编码色值**

Run: 在 `src/views/cases/components/CaseFilter.vue` 中搜索 `#[0-9a-fA-F]{3,6}`
Expected: 无匹配结果

- [ ] **Step 4: Commit**

```bash
git add src/views/cases/components/CaseFilter.vue
git commit -m "fix(cases): CaseFilter 硬编码色值替换为 CSS 变量

- #ebeef5 → var(--el-border-color-lighter)
- #dcdfe6 → var(--el-border-color)
- #ffffff → var(--el-bg-color)"
```

---

### Task 7: 全局验证

**Files:**
- 无文件修改，仅验证

- [ ] **Step 1: 全局搜索禁用色值**

在 `src/views/cases/components/` 目录下搜索以下模式，确认无残留：
- `#909399`
- `#c0c4cc`
- `color: #606266`
- `font-size: 13px`
- `font-size: 15px`

Run: 使用 Grep 工具在 `src/views/cases/components/` 搜索上述模式
Expected: 无匹配

- [ ] **Step 2: 开发服务器桌面端验证**

访问 `http://localhost:5173/cases/list`
验证：
- 侧边栏宽度 200px，折叠后 64px
- 菜单项激活时左侧 3px 竖条显示
- 未选中菜单项文字颜色为 `var(--el-text-color-secondary)`
- StatsBoard 卡片背景/边框/文字颜色正常
- CaseTable 审限状态颜色（正常/即将到期/已延期）正常
- CaseFilter 快捷筛选芯片样式正常

- [ ] **Step 3: 移动端验证**

浏览器开发者工具切换到移动端视图（≤768px）
验证：
- 侧边栏隐藏
- 内容区顶部显示 el-select 下拉选择器
- 下拉选择器选中项与当前路由同步
- 切换选项路由跳转正常

- [ ] **Step 4: 数据统计看板回归验证**

访问 `http://localhost:5173/cases/statistics`
验证：数据统计看板页面渲染正常，左侧菜单仍可切换

- [ ] **Step 5: 最终 Commit（如有遗漏修复）**

```bash
git add -A
git commit -m "fix(cases): /cases/list 页面设计修复完成

- P1: CasesView 侧边栏对齐全局 .todos-sidebar 规范
- P2: 移动端导航下拉选择器实现
- P3: CaseListPanel 类名冲突修复
- P4: StatsBoard/CaseTable/CaseFilter 硬编码色值替换为 CSS 变量"
```

---

## Self-Review

**1. Spec coverage:**
- P1（侧边栏对齐）→ Task 1 ✓
- P2（移动端导航）→ Task 2 ✓
- P3（类名冲突）→ Task 3 ✓
- P4（硬编码颜色）→ Task 4 (StatsBoard) + Task 5 (CaseTable) + Task 6 (CaseFilter) ✓
- 验证清单 → Task 7 ✓

**2. Placeholder scan:** 无 TBD/TODO，每个步骤都有具体代码块 ✓

**3. Type consistency:** `.todos-sidebar` 类名在 Task 1 和 Task 2 中一致；色值映射表在 Task 4/5/6 中一致 ✓
