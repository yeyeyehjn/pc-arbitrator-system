# PC仲裁员端重构 - 第七阶段实施计划（"辅助功能"模块）

> **关联设计文档**：`docs/superpowers/specs/2026-08-04-auxiliary-module-design.md`

> **For agentic workers:** 步骤使用 checkbox（`- [ ]`）语法跟踪。本模块为 P2 级前端 Mock 实现，沿用项目既有"分阶段 + 联调自测"约定（无独立单元测试框架），每个阶段产出可独立预览的交付物。

**目标**：在账号下拉/移动端抽屉新增「辅助功能」入口，落地单路由 `/auxiliary` + 页面内 Tab（审理指引 / 裁决书及案例 / 仲裁员须知）的轻量查阅页，全部走 Mock 数据。

**架构**：单路由 `AuxiliaryView.vue` 作 Tab 容器，`onMounted` 一次性拉取三组列表；三个子组件（GuidelineList / AwardCaseList / NoticeList）各自从 `useAuxiliaryStore` 读取数据、维护本地分页/分类筛选；附件预览走 `window.open` 新标签、下载走原生 `<a download>`。

**技术栈**：Vue 3 `<script setup>` + Pinia（setup 风格）+ Element Plus（el-tabs / el-table / el-pagination / el-check-tag）+ 全局 SCSS 类（`.section-card` / `.filter-bar` / `.pagination-wrapper`）。

## 全局约束（取自设计文档 §7，逐条落地）

- **字号**：仅允许 16px（大标题）/ 14px（正文、Tab 标签）/ 12px（辅助、筛选按钮、分页）/ 10px（tag）；禁用 13px、15px。
- **12px 辅助文字色**：`var(--el-text-color-secondary)`（#606266）。
- **卡片容器**：外层复用全局 `.section-card`，不重定义组件级卡片样式。
- **表格**：`el-table` 不传 `border` prop；表头样式由全局 `index.scss` 统一覆盖（背景 #f8f8f9、粗体、无上边框）。"div table 风格"在本项目即指此全局表格规范。
- **分页**：`.pagination-wrapper`（全局已定义，`justify-content: flex-start; margin-top: 16px`）。
- **筛选条**：分类筛选复用 `.filter-bar` 容器；按钮用 `el-check-tag`，12px，选中态品牌色背景。
- **空状态**：复用 `src/views/cases/components/shared/CaseEmptyState.vue`。
- **滚动锚点**：`.section-card` 已有 `scroll-margin-top`，无需额外处理。
- **无障碍**：操作图标按钮带 `aria-label`；Tab 切换沿用 el-tabs 默认 ARIA。
- **预览/下载**：预览 `window.open(fileUrl, '_blank')`；下载 `<a :href="fileUrl" download>`；无附件显示「—」。

---

## 阶段 1: 路由配置与目录骨架 (Routing & Scaffold)

**Files:**
- Create: `src/views/auxiliary/AuxiliaryView.vue`（占位骨架）
- Create: `src/views/auxiliary/components/`（空目录）
- Modify: `src/router/index.js`（根布局 children 新增 auxiliary 路由）

**Interfaces:**
- Produces: 路由 `name: 'Auxiliary'`，懒加载 `../views/auxiliary/AuxiliaryView.vue`；`/auxiliary` 受现有 `beforeEach` 守卫保护（非 `meta.public`，未登录自动重定向登录页，无需额外配置）。

- [ ] **Step 1: 新增路由**

  在 `src/router/index.js` 根布局 `'/'` 的 `children` 数组末尾（`profile` 之后）追加：

  ```js
  {
    path: 'auxiliary',
    name: 'Auxiliary',
    component: () => import('../views/auxiliary/AuxiliaryView.vue'),
  },
  ```

- [ ] **Step 2: 创建 AuxiliaryView 占位骨架**

  创建 `src/views/auxiliary/AuxiliaryView.vue`，先放最小可渲染内容，便于后续阶段填充。外层用全局 `.section-card`，页面大标题「辅助功能」16px：

  ```vue
  <template>
    <div class="section-card auxiliary-view">
      <h1 class="page-title">辅助功能</h1>
      <p class="placeholder">辅助功能页开发中</p>
    </div>
  </template>

  <script setup>
  // 阶段 4 填充
  </script>

  <style scoped lang="scss">
  .auxiliary-view {
    .page-title {
      margin: 0 0 16px;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
    .placeholder {
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }
  </style>
  ```

- [ ] **Step 3: 创建 components 子目录**

  创建 `src/views/auxiliary/components/` 目录（后续阶段放入三个列表组件）。

- [ ] **Step 4: 预览验证**

  启动 dev server，登录后浏览器手动访问 `/auxiliary`，确认：
  - 页面渲染「辅助功能」标题与占位文案，无控制台报错。
  - 未登录状态访问 `/auxiliary` 被重定向到 `/login?redirect=/auxiliary`（守卫已生效，无需改动）。

- [ ] **Step 5: 提交**

  ```bash
  git add src/router/index.js src/views/auxiliary/
  git commit -m "feat(auxiliary): 新增 /auxiliary 路由与容器骨架"
  ```

---

## 阶段 2: Pinia Store 与 Mock 数据 (State Management)

**Files:**
- Create: `src/stores/auxiliary.js`

**Interfaces:**
- Produces: `useAuxiliaryStore`，暴露 `guidelines` / `awardCases` / `notices`（均为 `ref([])`）、`loading`（`ref(false)`）、异步方法 `fetchGuidelines()` / `fetchAwardCases()` / `fetchNotices()`（Mock 同步赋值，返回 Promise，预留 async 接口形态）。
- 数据模型（设计文档 §5.2）：

  ```js
  // 通用附件项（审理指引 / 仲裁员须知）
  { id, title, remark, fileUrl, fileName, fileSize, updatedAt }
  // 裁决书及案例项（扩展通用项）
  { id, title, remark, fileUrl, fileName, fileSize, updatedAt, caseReason, category }
  // category 枚举：'finance' | 'private' | 'construction'
  ```
- 分类常量（设计文档 §5.3）：

  ```js
  export const AWARD_CATEGORYS = [
    { value: 'all',          label: '全部' },
    { value: 'finance',      label: '金融借款类' },
    { value: 'private',      label: '民间借贷类' },
    { value: 'construction', label: '建设工程类' },
  ]
  ```

- [ ] **Step 1: 创建 store 文件与 setup 骨架**

  创建 `src/stores/auxiliary.js`，沿用 `profile.js` 的 setup 风格（`defineStore('auxiliary', () => { ... })`）：

  ```js
  import { defineStore } from 'pinia'
  import { ref } from 'vue'

  export const AWARD_CATEGORYS = [
    { value: 'all',          label: '全部' },
    { value: 'finance',      label: '金融借款类' },
    { value: 'private',      label: '民间借贷类' },
    { value: 'construction', label: '建设工程类' },
  ]

  export const useAuxiliaryStore = defineStore('auxiliary', () => {
    const guidelines = ref([])
    const awardCases = ref([])
    const notices = ref([])
    const loading = ref(false)

    async function fetchGuidelines() { guidelines.value = MOCK_GUIDELINES }
    async function fetchAwardCases() { awardCases.value = MOCK_AWARD_CASES }
    async function fetchNotices()    { notices.value = MOCK_NOTICES }

    return {
      guidelines, awardCases, notices, loading,
      fetchGuidelines, fetchAwardCases, fetchNotices,
    }
  })
  ```

- [ ] **Step 2: 填充审理指引 Mock（6 条）**

  在 store 文件顶部定义 `MOCK_GUIDELINES`，覆盖金融/民间借贷/建设工程等场景，`updatedAt` 用于排序，部分条目 `fileUrl` 留空以验证「—」兜底。示例：

  ```js
  const MOCK_GUIDELINES = [
    { id: 'g1', title: '建设工程施工合同纠纷审理指引', remark: '适用于建设工程类案件的审理参考', fileUrl: '/mock/guideline-construction.pdf', fileName: '建设工程审理指引.pdf', fileSize: '1.2MB', updatedAt: '2026-07-20' },
    { id: 'g2', title: '民间借贷纠纷案件审理要点', remark: '含利率上限与证据认定要点', fileUrl: '/mock/guideline-private.pdf', fileName: '民间借贷审理要点.pdf', fileSize: '0.9MB', updatedAt: '2026-06-15' },
    { id: 'g3', title: '金融借款合同纠纷审理指引', remark: '', fileUrl: '/mock/guideline-finance.pdf', fileName: '金融借款审理指引.pdf', fileSize: '1.0MB', updatedAt: '2026-07-01' },
    { id: 'g4', title: '仲裁程序操作规程', remark: '立案至结案全流程指引', fileUrl: '/mock/guideline-procedure.pdf', fileName: '仲裁程序操作规程.pdf', fileSize: '1.5MB', updatedAt: '2026-05-10' },
    { id: 'g5', title: '庭审驾驭与询问技巧', remark: '', fileUrl: '', fileName: '', fileSize: '', updatedAt: '2026-04-18' },
    { id: 'g6', title: '裁决书撰写规范', remark: '附通用模板与常见问题', fileUrl: '/mock/guideline-writing.pdf', fileName: '裁决书撰写规范.pdf', fileSize: '0.8MB', updatedAt: '2026-07-25' },
  ]
  ```

- [ ] **Step 3: 填充裁决书及案例 Mock（9 条，三类各 3 条）**

  定义 `MOCK_AWARD_CASES`，`caseReason` 与 `category` 对应（finance→金融借款合同纠纷、private→民间借贷纠纷、construction→建设工程施工合同纠纷），便于演示分类筛选：

  ```js
  const MOCK_AWARD_CASES = [
    { id: 'a1', title: '某银行与某公司金融借款合同纠纷案', caseReason: '金融借款合同纠纷', remark: '典型利率认定案例', category: 'finance', fileUrl: '/mock/award-finance-1.pdf', fileName: '金融借款案例一.pdf', fileSize: '2.1MB', updatedAt: '2026-07-10' },
    { id: 'a2', title: '某信托与某集团金融借款纠纷案', caseReason: '金融借款合同纠纷', remark: '', category: 'finance', fileUrl: '/mock/award-finance-2.pdf', fileName: '金融借款案例二.pdf', fileSize: '1.8MB', updatedAt: '2026-06-22' },
    { id: 'a3', title: '某消费金融公司与王某借款案', caseReason: '金融借款合同纠纷', remark: '小额贷款利率上限', category: 'finance', fileUrl: '/mock/award-finance-3.pdf', fileName: '金融借款案例三.pdf', fileSize: '1.3MB', updatedAt: '2026-05-30' },
    { id: 'a4', title: '张某与李某民间借贷纠纷案', caseReason: '民间借贷纠纷', remark: '现金交付举证责任', category: 'private', fileUrl: '/mock/award-private-1.pdf', fileName: '民间借贷案例一.pdf', fileSize: '1.1MB', updatedAt: '2026-07-15' },
    { id: 'a5', title: '王某与赵某民间借贷纠纷案', caseReason: '民间借贷纠纷', remark: '', category: 'private', fileUrl: '/mock/award-private-2.pdf', fileName: '民间借贷案例二.pdf', fileSize: '0.9MB', updatedAt: '2026-06-08' },
    { id: 'a6', title: '某公司与刘某民间借贷纠纷案', caseReason: '民间借贷纠纷', remark: '夫妻共同债务认定', category: 'private', fileUrl: '', fileName: '', fileSize: '', updatedAt: '2026-04-20' },
    { id: 'a7', title: '某建筑公司与某开发公司建设工程施工合同纠纷案', caseReason: '建设工程施工合同纠纷', remark: '工程款结算争议', category: 'construction', fileUrl: '/mock/award-construction-1.pdf', fileName: '建设工程案例一.pdf', fileSize: '2.5MB', updatedAt: '2026-07-22' },
    { id: 'a8', title: '某施工队与某集团建设工程纠纷案', caseReason: '建设工程施工合同纠纷', remark: '', category: 'construction', fileUrl: '/mock/award-construction-2.pdf', fileName: '建设工程案例二.pdf', fileSize: '2.0MB', updatedAt: '2026-06-18' },
    { id: 'a9', title: '某装饰公司与某酒店建设工程合同纠纷案', caseReason: '建设工程施工合同纠纷', remark: '质量保修金返还', category: 'construction', fileUrl: '/mock/award-construction-3.pdf', fileName: '建设工程案例三.pdf', fileSize: '1.7MB', updatedAt: '2026-05-12' },
  ]
  ```

- [ ] **Step 4: 填充仲裁员须知 Mock（5 条）**

  定义 `MOCK_NOTICES`：

  ```js
  const MOCK_NOTICES = [
    { id: 'n1', title: '仲裁员行为规范', remark: '仲裁员履职基本准则', fileUrl: '/mock/notice-code.pdf', fileName: '仲裁员行为规范.pdf', fileSize: '0.6MB', updatedAt: '2026-07-01' },
    { id: 'n2', title: '回避制度须知', remark: '回避情形与申请流程', fileUrl: '/mock/notice-avoidance.pdf', fileName: '回避制度须知.pdf', fileSize: '0.4MB', updatedAt: '2026-06-01' },
    { id: 'n3', title: '保密义务告知书', remark: '', fileUrl: '/mock/notice-confidential.pdf', fileName: '保密义务告知书.pdf', fileSize: '0.3MB', updatedAt: '2026-05-01' },
    { id: 'n4', title: '仲裁员酬金与税务须知', remark: '酬金发放与个税说明', fileUrl: '/mock/notice-fee.pdf', fileName: '仲裁员酬金须知.pdf', fileSize: '0.5MB', updatedAt: '2026-04-01' },
    { id: 'n5', title: '庭审纪律与着装要求', remark: '', fileUrl: '', fileName: '', fileSize: '', updatedAt: '2026-03-15' },
  ]
  ```

- [ ] **Step 5: 自查 store 导出**

  确认 `useAuxiliaryStore` 返回值含 `guidelines`、`awardCases`、`notices`、`loading` 及三个 fetch 方法；`AWARD_CATEGORYS` 通过 `export` 单独导出供组件引用。

- [ ] **Step 6: 提交**

  ```bash
  git add src/stores/auxiliary.js
  git commit -m "feat(auxiliary): 新增 auxiliary store 与三组 Mock 数据"
  ```

---

## 阶段 3: MainLayout 入口集成（PC 下拉 + 移动端抽屉）

**Files:**
- Modify: `src/layout/MainLayout.vue`（模板 + script import + handleCommand）

**Interfaces:**
- Consumes: 路由 `/auxiliary`（阶段 1 已建立）。
- 改动遵循设计文档 §6：PC 下拉在「退出登录」上方加项；移动端抽屉在「个人中心」与分隔线之间加项；图标用 `Reading`；`resolveActiveMenu` 无需改动（`/auxiliary` 不在 `menuPaths` 白名单，顶部主菜单不高亮符合预期）。

- [ ] **Step 1: 引入 Reading 图标**

  在 `MainLayout.vue` 的 `<script setup>` 图标 import 行追加 `Reading`（与既有 `HomeFilled`/`Document`/`List`/`User`/`SwitchButton` 同来源 `@element-plus/icons-vue`）：

  ```js
  import { ArrowDown, Bell, Menu, Close, HomeFilled, Document, List, User, SwitchButton, Reading } from '@element-plus/icons-vue'
  ```

- [ ] **Step 2: PC 下拉菜单新增「辅助功能」项**

  在 `<el-dropdown-menu>` 内、「退出登录」上方插入：

  ```vue
  <el-dropdown-menu>
    <el-dropdown-item command="auxiliary">辅助功能</el-dropdown-item>
    <el-dropdown-item command="logout">退出登录</el-dropdown-item>
  </el-dropdown-menu>
  ```

- [ ] **Step 3: 移动端抽屉菜单新增「辅助功能」项**

  在「个人中心」`el-menu-item`（`index="/profile"`）之后、`<li class="drawer-divider">` 之前插入：

  ```vue
  <el-menu-item index="/auxiliary">
    <el-icon><Reading /></el-icon>
    <span>辅助功能</span>
  </el-menu-item>
  ```

  > 说明：`handleDrawerMenuSelect` 已对非 `logout` 的 key 走 `router.push(key)`，`index="/auxiliary"` 可直接复用，无需改动该函数。

- [ ] **Step 4: handleCommand 新增 auxiliary 分支**

  修改 `handleCommand`：

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

- [ ] **Step 5: 预览验证**

  - PC 端：点击右上角账号下拉，确认「辅助功能」位于「退出登录」上方；点击后跳转 `/auxiliary`，显示阶段 1 的占位页；顶部主菜单（首页/我的案件/待办事项/个人中心）均不高亮。
  - 移动端（缩窗 ≤768px）：打开左侧抽屉，确认「辅助功能」位于「个人中心」下方、分隔线上方；点击后跳转 `/auxiliary` 并自动收起抽屉。

- [ ] **Step 6: 提交**

  ```bash
  git add src/layout/MainLayout.vue
  git commit -m "feat(auxiliary): MainLayout 下拉与抽屉新增辅助功能入口"
  ```

---

## 阶段 4: AuxiliaryView Tab 容器页 (Tab Container)

**Files:**
- Modify: `src/views/auxiliary/AuxiliaryView.vue`（替换阶段 1 占位内容）

**Interfaces:**
- Consumes: `useAuxiliaryStore`（阶段 2）；三个子组件 `GuidelineList.vue` / `AwardCaseList.vue` / `NoticeList.vue`（阶段 5-7 创建）。
- Produces: 页面内 Tab 切换，默认选中「审理指引」；`onMounted` 一次性调用三个 fetch。

- [ ] **Step 1: 编写 Tab 容器模板**

  替换 `AuxiliaryView.vue` 全文。外层 `.section-card`，标题「辅助功能」16px；`el-tabs` 默认下划线样式，`v-model="activeTab"`，默认 `'guideline'`。Tab 字号 14px、选中品牌色（参考 `CaseDetailView.vue` 的 `:deep()` 覆盖写法）：

  ```vue
  <template>
    <div class="section-card auxiliary-view">
      <h1 class="page-title">辅助功能</h1>
      <el-tabs v-model="activeTab" class="auxiliary-tabs">
        <el-tab-pane label="审理指引" name="guideline">
          <GuidelineList />
        </el-tab-pane>
        <el-tab-pane label="裁决书及案例" name="award">
          <AwardCaseList />
        </el-tab-pane>
        <el-tab-pane label="仲裁员须知" name="notice">
          <NoticeList />
        </el-tab-pane>
      </el-tabs>
    </div>
  </template>

  <script setup>
  import { ref, onMounted } from 'vue'
  import { useAuxiliaryStore } from '@/stores/auxiliary'
  import GuidelineList from './components/GuidelineList.vue'
  import AwardCaseList from './components/AwardCaseList.vue'
  import NoticeList from './components/NoticeList.vue'

  const store = useAuxiliaryStore()
  const activeTab = ref('guideline')

  onMounted(() => {
    store.fetchGuidelines()
    store.fetchAwardCases()
    store.fetchNotices()
  })
  </script>

  <style scoped lang="scss">
  .auxiliary-view {
    .page-title {
      margin: 0 0 16px;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .auxiliary-tabs {
      :deep(.el-tabs__header) {
        margin-bottom: 16px;
      }
      :deep(.el-tabs__item) {
        font-size: 14px;
        height: 48px;
        line-height: 48px;
      }
      :deep(.el-tabs__item.is-active) {
        color: var(--el-color-primary);
        font-weight: 600;
      }
      :deep(.el-tabs__active-bar) {
        background-color: var(--el-color-primary);
      }
    }
  }
  </style>
  ```

- [ ] **Step 2: 临时跳过子组件引用（可选）**

  若阶段 5-7 尚未创建，可先在 `<script setup>` 注释掉三个 import 与模板中的子组件标签，用占位 `<p>` 验证 Tab 切换；阶段 5-7 完成后恢复。**推荐顺序**：先完成阶段 5-7 再回到本阶段替换，避免引用空文件。本计划假设按阶段 5→6→7→4 替换顺序执行，或本步骤先占位、后续回填。

- [ ] **Step 3: 提交（子组件就绪后）**

  ```bash
  git add src/views/auxiliary/AuxiliaryView.vue
  git commit -m "feat(auxiliary): 实现 Tab 容器页与一次性数据加载"
  ```

---

## 阶段 5: 审理指引列表 GuidelineList (Guideline Tab)

**Files:**
- Create: `src/views/auxiliary/components/GuidelineList.vue`

**Interfaces:**
- Consumes: `useAuxiliaryStore.guidelines`；`CaseEmptyState`（`@/views/cases/components/shared/CaseEmptyState.vue`）。
- 字段（设计文档 §4.2）：标题、备注、操作列（预览/下载）。
- 本地状态：`currentPage`、`pageSize`（默认 10）；无筛选。

- [ ] **Step 1: 创建组件骨架与 store 读取**

  ```vue
  <script setup>
  import { ref, computed } from 'vue'
  import { useAuxiliaryStore } from '@/stores/auxiliary'
  import CaseEmptyState from '@/views/cases/components/shared/CaseEmptyState.vue'

  const store = useAuxiliaryStore()
  const currentPage = ref(1)
  const pageSize = ref(10)

  const pagedList = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return store.guidelines.slice(start, start + pageSize.value)
  })
  </script>
  ```

- [ ] **Step 2: 编写表格模板（el-table 无 border）**

  表格列：标题（`show-overflow-tooltip`）、备注（`show-overflow-tooltip`，空值显示「—」）、操作（右对齐，预览/下载文字按钮，无附件显示「—」）。无数据时用 `#empty` 插槽渲染 `CaseEmptyState`：

  ```vue
  <template>
    <div class="list-section">
      <el-table :data="pagedList" style="width: 100%">
        <el-table-column prop="title" label="标题" min-width="260" show-overflow-tooltip />
        <el-table-column prop="remark" label="备注" min-width="240" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.remark || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="right">
          <template #default="{ row }">
            <template v-if="row.fileUrl">
              <el-link type="primary" :underline="false" @click="preview(row)">预览</el-link>
              <el-link type="primary" :underline="false" class="dl-link" @click="download(row)">下载</el-link>
            </template>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <template #empty>
          <CaseEmptyState text="暂无数据" />
        </template>
      </el-table>

      <div v-if="store.guidelines.length > 0" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="store.guidelines.length"
          :page-sizes="[10, 20, 50]"
          layout="total, prev, pager, next, sizes"
          background
          small
        />
      </div>
    </div>
  </template>
  ```

- [ ] **Step 3: 实现预览/下载方法**

  预览 `window.open(fileUrl, '_blank')`；下载构造临时 `<a download>` 触发：

  ```js
  const preview = (row) => {
    if (!row.fileUrl) return
    window.open(row.fileUrl, '_blank')
  }

  const download = (row) => {
    if (!row.fileUrl) return
    const a = document.createElement('a')
    a.href = row.fileUrl
    a.download = row.fileName || ''
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
  ```

- [ ] **Step 4: 操作列链接样式**

  两个链接之间留间距，hover 下划线（el-link 默认 hover 行为；`:underline="false"` 控制常驻无下划线）：

  ```vue
  <style scoped lang="scss">
  .list-section {
    :deep(.dl-link) {
      margin-left: 12px;
    }
  }
  </style>
  ```

- [ ] **Step 5: 预览验证**

  进入 `/auxiliary` 默认 Tab，确认：
  - 6 条 Mock 渲染，标题/备注正确；备注为空的行显示「—」。
  - `fileUrl` 为空的行（g5）操作列显示「—」。
  - 点「预览」新标签打开（Mock 路径 404 不影响交互验证）；点「下载」触发浏览器下载请求。
  - 数据量 ≤10 时分页条仍显示（total=6）。
  - 暂时清空 `store.guidelines`（devtools 或临时改 mock）验证空状态显示「暂无数据」。

- [ ] **Step 6: 提交**

  ```bash
  git add src/views/auxiliary/components/GuidelineList.vue
  git commit -m "feat(auxiliary): 审理指引列表（表格/预览/下载/分页/空状态）"
  ```

---

## 阶段 6: 裁决书及案例列表 AwardCaseList（含分类筛选）

**Files:**
- Create: `src/views/auxiliary/components/AwardCaseList.vue`

**Interfaces:**
- Consumes: `useAuxiliaryStore.awardCases`、`AWARD_CATEGORYS`（阶段 2 导出）；`CaseEmptyState`。
- 字段（设计文档 §4.2）：标题、案由、备注、分类、操作（预览/下载）。
- 本地状态：`currentCategory`（默认 `'all'`）、`currentPage`、`pageSize`。
- 分类筛选：顶部 `.filter-bar` 容器 + `el-check-tag` 按钮组，12px，选中品牌色（参考 `CaseFilter.vue` 的 `el-check-tag` 样式覆盖）。

- [ ] **Step 1: 创建组件骨架与筛选/分页计算**

  ```vue
  <script setup>
  import { ref, computed } from 'vue'
  import { useAuxiliaryStore, AWARD_CATEGORYS } from '@/stores/auxiliary'
  import CaseEmptyState from '@/views/cases/components/shared/CaseEmptyState.vue'

  const store = useAuxiliaryStore()
  const currentCategory = ref('all')
  const currentPage = ref(1)
  const pageSize = ref(10)

  const filteredList = computed(() => {
    if (currentCategory.value === 'all') return store.awardCases
    return store.awardCases.filter((item) => item.category === currentCategory.value)
  })

  const pagedList = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filteredList.value.slice(start, start + pageSize.value)
  })

  const selectCategory = (value) => {
    currentCategory.value = value
    currentPage.value = 1
  }
  </script>
  ```

- [ ] **Step 2: 编写分类筛选按钮组（.filter-bar + el-check-tag）**

  放在表格上方。按钮组用 `el-check-tag`，仅单选（点击即切换 `currentCategory`）：

  ```vue
  <template>
    <div class="award-list">
      <div class="filter-bar category-bar">
        <div class="filter-items">
          <el-check-tag
            v-for="cat in AWARD_CATEGORYS"
            :key="cat.value"
            :checked="currentCategory === cat.value"
            @change="selectCategory(cat.value)"
          >
            {{ cat.label }}
          </el-check-tag>
        </div>
      </div>

      <el-table :data="pagedList" style="width: 100%">
        <!-- Step 3 -->
      </el-table>
    </div>
  </template>
  ```

- [ ] **Step 3: 编写表格列（含分类列）**

  在 `<el-table>` 内补充：标题、案由、备注、分类、操作。分类列展示中文标签（映射 `category` → `AWARD_CATEGORYS` 的 `label`）：

  ```vue
  <el-table-column prop="title" label="标题" min-width="280" show-overflow-tooltip />
  <el-table-column prop="caseReason" label="案由" min-width="160" show-overflow-tooltip />
  <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip>
    <template #default="{ row }">
      <span>{{ row.remark || '—' }}</span>
    </template>
  </el-table-column>
  <el-table-column label="分类" width="120">
    <template #default="{ row }">
      {{ categoryLabel(row.category) }}
    </template>
  </el-table-column>
  <el-table-column label="操作" width="140" align="right">
    <template #default="{ row }">
      <template v-if="row.fileUrl">
        <el-link type="primary" :underline="false" @click="preview(row)">预览</el-link>
        <el-link type="primary" :underline="false" class="dl-link" @click="download(row)">下载</el-link>
      </template>
      <span v-else>—</span>
    </template>
  </el-table-column>
  <template #empty>
    <CaseEmptyState text="暂无数据" />
  </template>
  ```

- [ ] **Step 4: 补充分页与方法**

  分页 `total` 绑定 `filteredList.length`（随分类变化）：

  ```vue
  <div v-if="filteredList.length > 0" class="pagination-wrapper">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="filteredList.length"
      :page-sizes="[10, 20, 50]"
      layout="total, prev, pager, next, sizes"
      background
      small
    />
  </div>
  ```

  方法（与阶段 5 一致，外加分类标签映射）：

  ```js
  const categoryLabel = (value) => {
    const hit = AWARD_CATEGORYS.find((c) => c.value === value)
    return hit ? hit.label : '—'
  }
  const preview = (row) => { if (row.fileUrl) window.open(row.fileUrl, '_blank') }
  const download = (row) => {
    if (!row.fileUrl) return
    const a = document.createElement('a')
    a.href = row.fileUrl
    a.download = row.fileName || ''
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
  ```

- [ ] **Step 5: el-check-tag 样式覆盖（12px、选中品牌色）**

  参考 `CaseFilter.vue` 的 `.quick-filter :deep(.el-check-tag)` 写法，落到本组件：

  ```vue
  <style scoped lang="scss">
  .award-list {
    .category-bar {
      margin-bottom: 16px;

      .filter-items {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      :deep(.el-check-tag) {
        height: 28px;
        line-height: 26px;
        padding: 0 14px;
        font-size: 12px;
        border-radius: 4px;
        border: 1px solid #dcdfe6;
        background-color: #ffffff;
        color: var(--el-text-color-regular);
        cursor: pointer;
        transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;

        &:hover {
          border-color: var(--el-color-primary-light-5);
          color: var(--el-color-primary-light-3);
        }
        &.is-checked {
          background-color: var(--el-color-primary);
          border-color: var(--el-color-primary);
          color: #ffffff;
        }
      }
    }

    :deep(.dl-link) {
      margin-left: 12px;
    }
  }
  </style>
  ```

- [ ] **Step 6: 预览验证**

  切到「裁决书及案例」Tab，确认：
  - 默认「全部」选中，显示 9 条；分类列中文标签正确。
  - 点「金融借款类」→ 列表过滤为 3 条、分页 total 同步、`currentPage` 重置为 1。
  - 依次切「民间借贷类」「建设工程类」各 3 条；切回「全部」恢复 9 条。
  - `fileUrl` 为空行（a6）操作列「—」。
  - 空状态：临时选一个无数据的分类（或清空 mock 对应分类）验证 `CaseEmptyState`。

- [ ] **Step 7: 提交**

  ```bash
  git add src/views/auxiliary/components/AwardCaseList.vue
  git commit -m "feat(auxiliary): 裁决书及案例列表（分类筛选/表格/预览/下载/分页）"
  ```

---

## 阶段 7: 仲裁员须知列表 NoticeList (Notice Tab)

**Files:**
- Create: `src/views/auxiliary/components/NoticeList.vue`

**Interfaces:**
- Consumes: `useAuxiliaryStore.notices`；`CaseEmptyState`。
- 字段（设计文档 §4.2）：标题、备注、操作（预览/下载）。
- 本地状态：`currentPage`、`pageSize`（默认 10）；无筛选。
- 结构与 `GuidelineList` 一致（同为通用附件项），仅 store 数据源与文案不同。

- [ ] **Step 1: 创建组件（结构同 GuidelineList）**

  复用阶段 5 的模板与脚本，仅将数据源改为 `store.notices`：

  ```vue
  <template>
    <div class="list-section">
      <el-table :data="pagedList" style="width: 100%">
        <el-table-column prop="title" label="标题" min-width="260" show-overflow-tooltip />
        <el-table-column prop="remark" label="备注" min-width="240" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.remark || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="right">
          <template #default="{ row }">
            <template v-if="row.fileUrl">
              <el-link type="primary" :underline="false" @click="preview(row)">预览</el-link>
              <el-link type="primary" :underline="false" class="dl-link" @click="download(row)">下载</el-link>
            </template>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <template #empty>
          <CaseEmptyState text="暂无数据" />
        </template>
      </el-table>

      <div v-if="store.notices.length > 0" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="store.notices.length"
          :page-sizes="[10, 20, 50]"
          layout="total, prev, pager, next, sizes"
          background
          small
        />
      </div>
    </div>
  </template>

  <script setup>
  import { ref, computed } from 'vue'
  import { useAuxiliaryStore } from '@/stores/auxiliary'
  import CaseEmptyState from '@/views/cases/components/shared/CaseEmptyState.vue'

  const store = useAuxiliaryStore()
  const currentPage = ref(1)
  const pageSize = ref(10)

  const pagedList = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return store.notices.slice(start, start + pageSize.value)
  })

  const preview = (row) => { if (row.fileUrl) window.open(row.fileUrl, '_blank') }
  const download = (row) => {
    if (!row.fileUrl) return
    const a = document.createElement('a')
    a.href = row.fileUrl
    a.download = row.fileName || ''
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
  </script>

  <style scoped lang="scss">
  .list-section {
    :deep(.dl-link) {
      margin-left: 12px;
    }
  }
  </style>
  ```

- [ ] **Step 2: 预览验证**

  切到「仲裁员须知」Tab，确认 5 条 Mock 渲染、备注空值「—」、`fileUrl` 空行（n5）操作列「—」、预览/下载可触发、分页条显示。

- [ ] **Step 3: 提交**

  ```bash
  git add src/views/auxiliary/components/NoticeList.vue
  git commit -m "feat(auxiliary): 仲裁员须知列表（表格/预览/下载/分页/空状态）"
  ```

---

## 阶段 8: 组装、回填容器与全量联调 (Integration & Self-Test)

**Files:**
- Modify: `src/views/auxiliary/AuxiliaryView.vue`（若阶段 4 用了占位，此处回填真实子组件引用）

- [ ] **Step 1: 回填 AuxiliaryView 子组件引用**

  确认阶段 4 的 `AuxiliaryView.vue` 已 import 并渲染 `GuidelineList` / `AwardCaseList` / `NoticeList`，且 `onMounted` 调用三个 fetch。若阶段 4 走的是占位分支，此时替换为真实引用并删除占位 `<p>`。

- [ ] **Step 2: 全量功能联调**

  按「设计文档 §8 验收标准」逐条核对：
  1. 右上角下拉「辅助功能」位于「退出登录」上方，点击跳 `/auxiliary`。
  2. 移动端抽屉「辅助功能」位于「个人中心」下方、分隔线上方，点击跳 `/auxiliary` 并收起抽屉。
  3. `/auxiliary` 默认选中「审理指引」Tab。
  4. 三列表格字段与 div table 规范一致（无 border、表头灰底粗体由全局样式生效）。
  5. 裁决书 Tab 分类筛选四按钮切换过滤正确。
  6. 「预览」新标签打开、「下载」触发原生下载。
  7. 无附件行操作列显示「—」。
  8. 三列表底分页条样式一致（左对齐）。
  9. 无数据显示 `CaseEmptyState`「暂无数据」。
  10. 未登录访问 `/auxiliary` 重定向登录页。

- [ ] **Step 3: 样式扫描（设计文档 §7、§8.11）**

  全局排查新文件：
  - 无 13px / 15px 字号（仅 16/14/12/10）。
  - 无禁用色值（硬编码颜色仅限全局 SCSS 已登记的 `#f8f8f9`/`#f5f7fa`/`#dcdfe6` 等品牌系统例外；其余走 `var(--el-*)`）。
  - 表格均未传 `border` prop。
  - 12px 辅助文字使用 `var(--el-text-color-secondary)`。

- [ ] **Step 4: 响应式检查**

  - 1440px 桌面：三 Tab + 表格正常。
  - ≤768px 移动：表格横向滚动正常、分类筛选按钮组换行正常、分页条不被截断。

- [ ] **Step 5: 提交**

  ```bash
  git add src/views/auxiliary/AuxiliaryView.vue
  git commit -m "feat(auxiliary): 回填 Tab 容器子组件并完成全量联调"
  ```

---

## 自检（Self-Review）

**设计文档覆盖核对：**
- §2.1 入口位置 → 阶段 3（PC 下拉 + 移动端抽屉）✅
- §2.2 / §3.1 / §3.2 路由与文件结构 → 阶段 1（路由 + 目录）✅
- §4.1 整体布局（.section-card + el-tabs）→ 阶段 4 ✅
- §4.2 列表字段 → 阶段 5/6/7 ✅
- §4.3 操作列交互（预览/下载/「—」）→ 阶段 5/6/7 Step ✅
- §4.4 裁决书分类筛选 → 阶段 6 ✅
- §4.5 分页与空状态 → 阶段 5/6/7 + 阶段 8 ✅
- §5 Store + Mock → 阶段 2 ✅
- §6 MainLayout 集成（下拉/抽屉/handleCommand/图标/resolveActiveMenu 不变）→ 阶段 3 ✅
- §7 样式约束 → 全局约束节 + 各阶段样式步骤 + 阶段 8 Step 3 ✅
- §8 验收标准 1-11 → 阶段 8 Step 2/3 逐条核对 ✅

**命名一致性：** store 方法 `fetchGuidelines/fetchAwardCases/fetchNotices`、列表 ref `guidelines/awardCases/notices`、分类常量 `AWARD_CATEGORYS` 在各阶段引用一致；`CaseEmptyState` 导入路径统一为 `@/views/cases/components/shared/CaseEmptyState.vue`。

**注：** 设计文档 §4.5 与 §7 中「div table」在本项目语义为「`el-table` 不传 `border` + 全局表头样式覆盖」（见 `src/styles/element/index.scss` §全局表格样式规范），计划已据此落地，无需手写 div 表格结构。
