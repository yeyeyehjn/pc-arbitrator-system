# /cases/list 页面设计修复文档

> **版本**：v1.0
> **日期**：2026-08-04
> **状态**：已确认，待实施
> **关联文档**：`docs/superpowers/specs/2026-08-04-cases-statistics-dashboard-design.md`（数据统计看板设计）
> **优先级**：P1

---

## 一、背景与目标

### 1.1 背景

在数据统计看板实施过程中，`/cases` 路由改造为父容器（CasesView），原 CasesView 内容迁移至 CaseListPanel.vue（`/cases/list`）。代码审查发现该页面存在 4 类设计问题，违反项目设计系统约束或 spec 文档要求。

### 1.2 目标

- 将 CasesView 侧边栏对齐全局 `.todos-sidebar` 规范，消除重复样式
- 修复移动端导航断裂问题，实现下拉选择器替代方案
- 消除 CaseListPanel 与 CasesView 的类名冲突
- 替换 StatsBoard/CaseTable/CaseFilter 中所有硬编码色值为 CSS 变量

### 1.3 修复范围

仅限 `src/views/cases/` 目录下的 4 个文件，不影响 TodosView、ProfileView 及其他模块。

---

## 二、问题清单

| # | 问题 | 严重度 | 涉及文件 |
|---|------|--------|---------|
| P1 | CasesView 侧边栏未复用全局 `.todos-sidebar` 类，scoped 中重复定义了一套样式 | 高 | `CasesView.vue` |
| P2 | 移动端侧边栏 `display:none` 但未实现替代下拉选择器，导航断裂 | 高 | `CasesView.vue` L126 |
| P3 | CaseListPanel 根元素使用 `.cases-view` 类名，与父容器 CasesView 冲突 | 中 | `CaseListPanel.vue` L2 |
| P4 | StatsBoard/CaseTable/CaseFilter 使用 `#303133`、`#767a82`、`#ffffff` 等硬编码色值 | 中 | 3 个组件文件 |

---

## 三、详细设计

### 3.1 P1 — CasesView 侧边栏对齐全局规范

#### 3.1.1 问题

项目全局侧边栏样式定义在 `src/styles/element/index.scss` 的 `.todos-sidebar` 类（L34-L109）。TodosView 和 ProfileView 均复用此类名：

```vue
<!-- TodosView.vue -->
<aside class="todos-sidebar" :class="{ collapsed: !sidebarExpanded }">

<!-- ProfileView.vue -->
<aside class="todos-sidebar" :class="{ collapsed: !sidebarExpanded }">
```

但 CasesView 自创了 `.cases-sidebar` 类名，并在 scoped 样式中重复定义了宽度、背景、边框、折叠、标题、菜单等样式。导致：

1. **样式分叉**：全局 `.todos-sidebar` 更新时 CasesView 不会同步
2. **激活指示器缺失**：全局 `.el-menu-item.is-active::before` 的 3px 左侧竖条在 CasesView 中不生效
3. **违反 spec 2.4**："参考 TodosView 的页面级二级导航模式"

#### 3.1.2 改动

**模板**：`CasesView.vue` 中 `<aside class="cases-sidebar">` 改为 `<aside class="todos-sidebar">`。

**scoped 样式**：删除以下重复样式块：

```scss
// 删除全部以下样式（由全局 .todos-sidebar 提供）
.cases-sidebar { ... }
.sidebar-title { ... }
.sidebar-menu { ... }
// 以及对应的移动端 @media 块
```

**保留的 scoped 样式**：

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
```

#### 3.1.3 验证点

- 侧边栏宽度 200px、折叠 64px（由全局提供）
- 菜单项激活时左侧 3px 竖条出现（全局 `.is-active::before`）
- 未选中菜单项文字颜色为 `var(--el-text-color-secondary)`（全局 `.el-menu-item` color）

---

### 3.2 P2 — 移动端导航修复

#### 3.2.1 问题

CasesView 当前移动端样式：

```scss
@media (max-width: 768px) {
  .sidebar-menu {
    display: none; // 移动端使用下拉选择器替代
  }
}
```

但模板中从未实现该"下拉选择器"。移动端用户无法在"我的案件"和"数据统计"间切换。

#### 3.2.2 改动

在 CasesView 模板的 `.cases-content` 内顶部添加移动端导航选择器：

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

**`activeMenu` 计算属性**：已存在（`computed(() => route.path)`），直接复用。

**scoped 样式**：

```scss
.mobile-nav-selector {
  display: none; // 桌面端隐藏
}

@media (max-width: 768px) {
  .cases-view {
    flex-direction: column;
  }

  .mobile-nav-selector {
    display: block;
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-light);

    :deep(.el-select) {
      width: 100%;
    }
  }
}
```

**注意**：全局 `.todos-sidebar` 无移动端 `display: none` 规则。需在 CasesView 的 scoped 中添加：

```scss
@media (max-width: 768px) {
  .todos-sidebar {
    display: none;
  }
}
```

#### 3.2.3 验证点

- 桌面端（>768px）：侧边栏可见，下拉选择器隐藏
- 移动端（≤768px）：侧边栏隐藏，下拉选择器显示在内容区顶部
- 下拉选择器选中项与当前路由同步
- 切换选项后路由跳转正常

---

### 3.3 P3 — CaseListPanel 类名修复

#### 3.3.1 问题

CaseListPanel.vue 根元素 `<div class="cases-view">` 与 CasesView.vue 容器根类名相同。虽然 scoped 样式避免直接冲突，但语义混乱。

#### 3.3.2 改动

**模板**：`<div class="cases-view">` → `<div class="case-list-panel">`

**scoped 样式**：

```scss
// 原
.cases-view {
  padding-bottom: 20px;
}

// 改为
.case-list-panel {
  padding-bottom: 20px;
}
```

---

### 3.4 P4 — 硬编码颜色替换

#### 3.4.1 色值映射表

| 原始色值 | CSS 变量 | 语义 | 出现位置 |
|---------|---------|------|---------|
| `#ffffff` | `var(--el-bg-color)` | 白色背景 | StatsBoard, CaseFilter |
| `#e4e7ed` | `var(--el-border-color-light)` | 浅边框 | StatsBoard |
| `#f2f5fa` | `var(--el-fill-color-light)` | 浅填充 | StatsBoard |
| `#f8f8f9` | `var(--el-fill-color-lighter)` | 更浅填充 | StatsBoard（hover 态） |
| `#303133` | `var(--el-text-color-primary)` | 主要文字 | StatsBoard |
| `#767a82` | `var(--el-text-color-secondary)` | 次要文字 | StatsBoard, CaseTable |
| `#dcdfe6` | `var(--el-border-color)` | 常规边框 | StatsBoard, CaseFilter |
| `#ebeef5` | `var(--el-border-color-lighter)` | 更浅边框 | CaseFilter |
| `#67c23a` | `var(--el-color-success)` | 成功/正常 | StatsBoard |
| `#e6a23c` | `var(--el-color-warning)` | 警告/即将到期 | StatsBoard, CaseTable |
| `#f56c6c` | `var(--el-color-danger)` | 危险/已延期 | StatsBoard, CaseTable |
| `#053d99` | `var(--el-color-primary-dark-2)` | 主题色深 | CaseTable（focus outline） |

#### 3.4.2 涉及文件与替换点

按 3.4.1 映射表，将以下 3 个文件中**所有**硬编码色值替换为对应 CSS 变量：

**StatsBoard.vue**：`.stat-card` 背景色/边框、`.stat-card.active` 背景色、`.stat-icon-wrap` 背景色、`.stat-icon` 颜色、`.stat-number` 颜色、`.sub-label` 颜色、`.sub-value` 颜色、`.sub-divider` 背景色、`.sub-stat-item` 各状态语义色（normal/expiring/expired/ruling/mediation/withdraw）

**CaseTable.vue**：`.major-star` 颜色、`.major-star:focus-visible` outline 色、`:deep(.amount-major)` 颜色、`.deadline-days` 颜色、`.days-expiring` 颜色、`.days-expired` 颜色、`:deep(.case-no-expiring)` 颜色、`:deep(.case-no-expired)` 颜色

**CaseFilter.vue**：`.quick-filter` 的 `border-top` 虚线色、`.el-check-tag` 的 `border` 色和 `background-color`

---

## 四、验证清单

### 4.1 功能验证

- [ ] 桌面端侧边栏宽度 200px，折叠后 64px
- [ ] 菜单项激活时左侧 3px 竖条显示
- [ ] 未选中菜单项文字颜色为 `var(--el-text-color-secondary)`
- [ ] 移动端侧边栏隐藏，下拉选择器显示
- [ ] 下拉选择器切换路由正常
- [ ] CaseListPanel 页面渲染正常，无样式丢失

### 4.2 约束验证

- [ ] 全局 grep `#303133`、`#767a82`、`#ffffff`（在 cases 组件 scoped 中）均无残留
- [ ] 无 `font-size: 13px` 或 `font-size: 15px`
- [ ] 无 `#909399`、`#c0c4cc`、`color: #606266`
- [ ] CSS 变量在 Element Plus 默认主题和暗色主题下均可用

### 4.3 响应式验证

- [ ] 桌面端（≥992px）：侧边栏 + 内容区左右布局
- [ ] 平板端（768-991px）：同桌面端
- [ ] 移动端（≤767px）：下拉选择器 + 内容区上下布局

---

## 五、涉及文件

| 文件 | 改动类型 |
|------|---------|
| `src/views/cases/CasesView.vue` | 模板类名 + scoped 样式重构 + 移动端导航新增 |
| `src/views/cases/components/CaseListPanel.vue` | 根类名重命名 |
| `src/views/cases/components/StatsBoard.vue` | 硬编码色值替换 |
| `src/views/cases/components/CaseTable.vue` | 硬编码色值替换 |
| `src/views/cases/components/CaseFilter.vue` | 硬编码色值替换 |

---

## 六、风险与缓解

| 风险 | 缓解措施 |
|------|---------|
| CasesView 删除 scoped 侧边栏样式后视觉变化 | 全局 `.todos-sidebar` 提供等价样式，且额外提供激活竖条指示器 |
| 移动端 el-select 样式与项目设计系统不一致 | 使用 `:deep()` 覆盖 el-select 字号为 14px，与全局规范一致 |
| CSS 变量在旧浏览器不支持 | 项目已全面使用 CSS 变量，不存在额外兼容风险 |

---

**文档结束**
