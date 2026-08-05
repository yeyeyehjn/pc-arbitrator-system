# PC仲裁员端重构 - 第七阶段设计规范（"辅助功能"模块）

## 1. 概述 (Overview)

本文档定义"PC仲裁员办案系统重构"第七阶段的设计规范，聚焦于 **"辅助功能"模块（P2 级次要模块）**。该模块为仲裁员提供审理参考类工具与告知内容，包含三个并列子模块：审理指引列表、裁决书及案例列表、仲裁员须知。

依据 PRD（`docs/仲裁员PC端办案系统_PRD_V1.0.md` 第八节），本模块定位为审理参考资料的集中查阅入口，所有子模块均支持"在线预览及下载附件"。本期为 P2 优先级，采用轻量实现策略：单页 Tab 切换 + 列表查阅 + 新标签预览。

### 1.1 设计目标

- 提供单一入口（右上角账号下拉菜单）聚合三类参考资料，避免顶级导航膨胀
- 采用页面内 Tab 切换三个子模块，保持轻量查阅体验
- 裁决书及案例支持按业务分类（金融借款/民间借贷/建设工程）筛选
- 附件预览走新标签打开，下载走原生 `<a download>`，实现最简、不引入额外预览组件
- 全站样式与硬约束保持一致（div table、字号体系、空状态组件、分页样式）

### 1.2 范围说明

| 内容 | 状态 |
|------|------|
| MainLayout 右上角下拉菜单新增"辅助功能"入口 | 本期实现 |
| 移动端抽屉菜单同步新增"辅助功能"入口 | 本期实现 |
| 单路由 `/auxiliary` + 页面内 Tab（3 子模块） | 本期实现 |
| 审理指引列表（标题/备注 + 预览/下载） | 本期实现 |
| 裁决书及案例列表（标题/案由/备注/分类 + 分类筛选 + 预览/下载） | 本期实现 |
| 仲裁员须知列表（标题/备注 + 预览/下载） | 本期实现 |
| 分页（.pagination-wrapper 标准样式） | 本期实现 |
| 空状态（复用 CaseEmptyState） | 本期实现 |
| Pinia Store + Mock 数据 | 本期实现 |
| 后端接口对接 | 后续迭代 |

---

## 2. 信息架构 (Information Architecture)

### 2.1 入口位置

**PC 端**：右上角账号下拉菜单，在"退出登录"上方新增「辅助功能」项。点击跳转 `/auxiliary`。

**移动端**：左侧抽屉菜单，在"个人中心"下方、分隔线上方新增「辅助功能」项，保持多端入口一致。

辅助功能不进入顶部水平主菜单（首页/我的案件/待办事项/个人中心），因其为 P2 次要模块，归入账号下拉更符合信息层级。

### 2.2 页面结构

单路由 `/auxiliary`，页面顶部用 `el-tabs` 切换三个子模块，无需嵌套子路由（避免路由膨胀，Tab 切换用本地状态即可）：

```
辅助功能（/auxiliary）
├── Tab 1  审理指引         → 默认选中
├── Tab 2  裁决书及案例     → 顶部含分类筛选按钮组
└── Tab 3  仲裁员须知
```

**设计原则：**
- 三个 Tab 数据在 `onMounted` 时一次性加载（数据量小，无性能压力）
- Tab 切换不触发路由变化，保留页面内状态（如裁决书当前选中的分类）
- `/auxiliary` 受现有 `beforeEach` 守卫保护（需登录），无需额外配置

---

## 3. 路由与文件结构 (Routing & File Structure)

### 3.1 路由配置

在 `src/router/index.js` 根布局 children 中新增：

```js
{
  path: 'auxiliary',
  name: 'Auxiliary',
  component: () => import('../views/auxiliary/AuxiliaryView.vue'),
}
```

### 3.2 文件结构

```
src/views/auxiliary/
├── AuxiliaryView.vue          # Tab 容器页
└── components/
    ├── GuidelineList.vue      # 审理指引列表
    ├── AwardCaseList.vue      # 裁决书及案例列表（含分类筛选）
    └── NoticeList.vue         # 仲裁员须知列表
src/stores/auxiliary.js        # Pinia store + mock 数据
```

---

## 4. 页面布局与列表字段 (Layout & List Fields)

### 4.1 整体布局

```
┌─ 页面标题区（.section-card 包裹）─────────────────────┐
│  辅助功能                                              │
├─ Tab 区（el-tabs，顶部，默认下划线样式）────────────── │
│  [ 审理指引 ] [ 裁决书及案例 ] [ 仲裁员须知 ]          │
├─ Tab 内容区 ──────────────────────────────────────────┤
│  （裁决书 Tab 多一行分类筛选按钮组）                   │
│  ┌─ 列表区（div table 风格，背景 #F5F7FA）─────────── │
│  │  表头（粗体） | 行底分隔线                         │
│  │  ...数据行...                                      │
│  └─ 分页区（.pagination-wrapper，左对齐）            │
└──────────────────────────────────────────────────────┘
```

### 4.2 列表字段

三个 Tab 均采用全站 div table 样式（背景 `#F5F7FA`、粗体表头、仅行底分隔线、无 `border` prop）。

| Tab | 列字段 | 操作列 |
|-----|--------|--------|
| 审理指引 | 标题、备注 | 预览、下载 |
| 裁决书及案例 | 标题、案由、备注、分类 | 预览、下载 |
| 仲裁员须知 | 标题、备注 | 预览、下载 |

### 4.3 操作列交互

操作列右对齐，文字按钮样式，主题色：

- **预览**：`window.open(fileUrl, '_blank')` 新标签打开
- **下载**：`<a :href="fileUrl" download>` 触发原生下载
- 两者均无附件时显示「—」
- 链接样式：主题色、hover 下划线

### 4.4 裁决书及案例分类筛选

仅此 Tab 顶部显示分类筛选按钮组：

- 按钮组：`全部` / `金融借款类` / `民间借款类` / `建设工程类`
- 样式复用 `.filter-bar` 容器，按钮 `font-size: 12px`
- 选中态高亮品牌色（参考案件列表快捷筛选）
- 切换分类时本地过滤列表数据

### 4.5 分页与空状态

- **分页**：三个列表均支持分页（`.pagination-bar`，`justify-content: flex-start`，`margin-top: 16px`），默认 10 条/页，支持页码跳转。数据量小（≤1 页）时仍保留分页条以保持全站一致。
- **空状态**：无数据时统一使用 `CaseEmptyState` 组件，文案"暂无数据"。

---

## 5. 数据模型与 Store (Data Model & Store)

### 5.1 Store 文件

`src/stores/auxiliary.js`，Pinia setup 风格，沿用现有 store 模式（参考 `case.js`/`profile.js`）。本期全部使用 Mock 数据。

### 5.2 数据模型

```js
// 通用附件项（审理指引 / 仲裁员须知 共用）
{
  id: string,            // 唯一标识
  title: string,         // 标题
  remark: string,        // 备注（可空）
  fileUrl: string,       // 附件 URL（mock 用占位 PDF 路径）
  fileName: string,      // 附件文件名（下载用）
  fileSize: string,      // 文件大小展示（如 "1.2MB"，可空）
  updatedAt: string,     // 更新日期（YYYY-MM-DD，用于排序）
}

// 裁决书及案例项（扩展通用项）
{
  ...通用项,
  caseReason: string,    // 案由
  category: string,      // 分类枚举：'finance' | 'private' | 'construction'
}
```

### 5.3 分类枚举

```js
const AWARD_CATEGORYS = [
  { value: 'finance',      label: '金融借款类' },
  { value: 'private',      label: '民间借贷类' },
  { value: 'construction', label: '建设工程类' },
]
```

### 5.4 Store 结构

```js
// src/stores/auxiliary.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuxiliaryStore = defineStore('auxiliary', () => {
  // 审理指引列表
  const guidelines = ref([])
  // 裁决书及案例列表
  const awardCases = ref([])
  // 仲裁员须知列表
  const notices = ref([])
  // 加载态
  const loading = ref(false)

  // 拉取各列表（mock 同步赋值，预留 async 接口形态）
  async function fetchGuidelines() { ... }
  async function fetchAwardCases() { ... }
  async function fetchNotices() { ... }

  return {
    guidelines, awardCases, notices, loading,
    fetchGuidelines, fetchAwardCases, fetchNotices,
  }
})
```

### 5.5 数据加载策略

- `AuxiliaryView.vue` 在 `onMounted` 时一次性调用三个 fetch（数据量小，无性能压力）
- 每个 Tab 子组件直接从 store 读取对应列表，无需重复请求
- Mock 数据内联在 store 中（每个列表 5-9 条），覆盖三个分类，便于演示筛选交互

### 5.6 Mock 数据示例

- **审理指引**：6 条，标题如《建设工程施工合同纠纷审理指引》《民间借贷纠纷案件审理要点》
- **裁决书及案例**：9 条，三类各 3 条，案由如"金融借款合同纠纷""民间借贷纠纷""建设工程施工合同纠纷"
- **仲裁员须知**：5 条，标题如《仲裁员行为规范》《回避制度须知》

---

## 6. MainLayout 集成 (MainLayout Integration)

### 6.1 PC 端下拉菜单改动

在 `src/layout/MainLayout.vue` 下拉菜单中，于「退出登录」上方新增一项：

```vue
<el-dropdown-menu>
  <el-dropdown-item command="auxiliary">辅助功能</el-dropdown-item>
  <el-dropdown-item command="logout">退出登录</el-dropdown-item>
</el-dropdown-menu>
```

### 6.2 移动端抽屉菜单改动

在「个人中心」与分隔线之间新增「辅助功能」项，保持多端一致：

```vue
<el-menu-item index="/auxiliary">
  <el-icon><Reading /></el-icon>
  <span>辅助功能</span>
</el-menu-item>
```

### 6.3 图标选择

使用 `Reading`（@element-plus/icons-vue），语义贴合"指引/须知"查阅场景；与现有 `HomeFilled`/`Document`/`List`/`User` 风格统一。

### 6.4 handleCommand 逻辑

新增 `auxiliary` 分支：

```js
const handleCommand = (command) => {
  if (command === 'logout') {
    authStore.logout()
    router.push('/login')
  } else if (command === 'auxiliary') {
    router.push('/auxiliary')
  }
}
```

### 6.5 resolveActiveMenu

无需改动。`/auxiliary` 不在 `menuPaths` 中，顶部水平菜单无高亮项（符合预期——辅助功能非主导航）。

---

## 7. 样式约束 (Style Constraints)

遵循项目硬约束与工程约定：

| 约束项 | 落实方式 |
|--------|----------|
| 卡片容器 | `AuxiliaryView.vue` 外层用 `.section-card`，不重新定义组件级卡片样式 |
| 字号 | 标题 16px、正文 14px、辅助/筛选标签 12px；禁用 13px/15px |
| 表格 | div table 风格，背景 `#F5F7FA`，粗体表头，仅行底分隔线，无 `border` prop |
| 12px 辅助文字色 | `var(--el-text-color-secondary)` (#606266) |
| 操作按钮 | 文字按钮，主题色，右对齐 |
| 预览/下载链接 | 主题色、hover 下划线；下载用 `<a download>` |
| 分页 | `.pagination-wrapper` + `.pagination-bar`，`justify-content: flex-start`，`margin-top: 16px` |
| 空状态 | 复用 `CaseEmptyState` 组件 |
| 移动端弹窗 | 本设计无弹窗（预览走新标签），不涉及 el-dialog/drawer 规则 |
| 滚动锚点 | `.section-card` 已有 `scroll-margin-top: 100px`，单页 Tab 无需额外处理 |
| 无障碍 | 操作图标按钮带 `aria-label`；Tab 切换用 el-tabs 默认 ARIA 支持 |

### 7.1 Tab 样式细节

- 使用 `el-tabs`，默认下划线样式（与案件详情页 DocsTab/ServiceTab 一致）
- Tab 标签字号 14px，`is-active` 用品牌色
- Tab 内容区与列表区之间留 16px 间距
- 裁决书分类筛选按钮组放在该 Tab 内容区顶部，复用 `.filter-bar`，按钮 `font-size: 12px`

---

## 8. 验收标准 (Acceptance Criteria)

1. 右上角账号下拉菜单显示「辅助功能」项，位于「退出登录」上方；点击跳转 `/auxiliary`
2. 移动端抽屉菜单显示「辅助功能」项，点击跳转 `/auxiliary`
3. `/auxiliary` 页面顶部显示 3 个 Tab，默认选中「审理指引」
4. 三个列表均展示对应字段，样式符合 div table 规范
5. 裁决书及案例 Tab 顶部显示分类筛选按钮组，切换分类正确过滤列表
6. 点击「预览」在新标签打开附件；点击「下载」触发原生下载
7. 无附件时操作列显示「—」
8. 列表底部显示分页条，样式与全站一致
9. 无数据时显示 `CaseEmptyState` 空状态
10. 未登录访问 `/auxiliary` 被重定向到登录页
11. 全站样式扫描通过：无 13px/15px 字号、无禁用色值、无 `border` prop 表格
