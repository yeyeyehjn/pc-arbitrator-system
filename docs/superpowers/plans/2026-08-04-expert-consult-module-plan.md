# PC仲裁员端重构 - 第八阶段实施计划（"专家咨询"模块）

> **关联设计文档**：`docs/superpowers/specs/2026-08-04-expert-consult-module-design.md`

> **For agentic workers:** 步骤使用 checkbox（`- [ ]`）语法跟踪。本模块为 P2 级前端 Mock 实现，沿用项目既有"分阶段 + 联调自测"约定（无独立单元测试框架），每个阶段产出可独立预览的交付物。

**目标**：在「待办事项」与「我的案件」侧栏各新增一个专家咨询子模块入口，落地两个列表页 + 两个详情页 + 回避/接受咨询签署弹窗，全部走 Mock 数据。

**架构**：两个子模块分属不同父级侧栏，独立路由。两个详情页复用 `shared/consult/` 下的组件族（ConsultInfo / ConsultOpinion / ConsultEditor / SignCommitmentDialog），通过 `mode` prop 区分可操作（expert）/ 只读（applicant）。Store 采用 Pinia setup 风格，`expertList`（待办侧）+ `applicantList`（我的案件侧）双列表 + 操作方法。

**技术栈**：Vue 3 `<script setup>` + Pinia（setup 风格）+ Element Plus（el-menu / el-table / el-tag / el-dialog / el-upload / ElMessageBox）+ 全局 SCSS 类（`.section-card` / `.filter-bar` / `.table-section` / `.pagination-bar` / `.todos-sidebar` / `.menu-badge`）。

## 全局约束（取自设计文档 §9，逐条落地）

- **字号**：仅允许 16px（大标题）/ 14px（正文、Tab 标签、按钮）/ 12px（辅助、筛选按钮、分页、tag 辅助）/ 10px（el-tag size=small）；禁用 13px、15px。
- **12px 辅助文字色**：`var(--el-text-color-secondary)`（#606266）。
- **卡片容器**：外层复用全局 `.section-card`，不重定义组件级卡片样式。
- **表格**：`el-table` 不传 `border` prop；表头样式由全局 `index.scss` 统一覆盖（背景 #f8f8f9、粗体、无上边框）。
- **筛选栏**：复用 `.filter-bar` + `.filter-items` + `.filter-item` + `.filter-label` + `.filter-actions`；按钮 `font-size: 12px`。
- **分页**：`.pagination-bar`（全局已定义，`justify-content: flex-start; margin-top: 16px`）。
- **空状态**：待办侧复用 `src/views/todos/components/shared/TodoEmptyState.vue`；我的案件侧复用 `src/views/cases/components/shared/CaseEmptyState.vue`。
- **侧栏菜单**：复用 `.todos-sidebar` + `.sidebar-menu` + `.el-menu-item` + `.menu-badge`；选中态 3px 竖条由全局样式提供。
- **滚动锚点**：`.section-card` 已有 `scroll-margin-top: 100px`。
- **无障碍**：操作图标按钮带 `aria-label`；状态 Tag 用 el-tag 默认 ARIA。
- **二次确认**：退出咨询用 `ElMessageBox.confirm`。
- **路由守卫**：新路由均为非 `meta.public`，受现有 `beforeEach` 守卫保护（未登录自动重定向登录页，无需额外配置）。
- **品牌主色**：`var(--el-color-primary)` = #053d99（非 #1e62ec，线框图色值仅用于示意）。

---

## 阶段 1: 路由配置与目录骨架 (Routing & Scaffold)

**Files:**
- Create: `src/views/todos/components/consult/`（空目录）
- Create: `src/views/cases/components/consult/`（空目录）
- Create: `src/views/cases/components/shared/consult/`（空目录）
- Create: `src/views/todos/components/consult/ConsultListView.vue`（占位骨架）
- Create: `src/views/todos/components/consult/ConsultDetailView.vue`（占位骨架）
- Create: `src/views/cases/components/consult/ConsultListView.vue`（占位骨架）
- Create: `src/views/cases/components/consult/ConsultDetailView.vue`（占位骨架）
- Modify: `src/router/index.js`（两个父路由 children 各新增 2 条）

**Interfaces:**
- Produces: 4 条新路由
  - `name: 'TodoConsultList'` → `/todos/consult` → `../views/todos/components/consult/ConsultListView.vue`
  - `name: 'TodoConsultDetail'` → `/todos/consult/:id` → `../views/todos/components/consult/ConsultDetailView.vue`
  - `name: 'CaseConsultList'` → `/cases/consult` → `../views/cases/components/consult/ConsultListView.vue`
  - `name: 'CaseConsultDetail'` → `/cases/consult/:id` → `../views/cases/components/consult/ConsultDetailView.vue`
- 所有新路由受现有 `beforeEach` 守卫保护（非 `meta.public`）。

- [ ] **Step 1: 在 `/todos` children 新增 2 条路由**

  在 `src/router/index.js` 的 `/todos` 路由 `children` 数组末尾（`scheduling` 之后）追加：

  ```js
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

- [ ] **Step 2: 在 `/cases` children 新增 2 条路由**

  在 `/cases` 路由 `children` 数组中，`list` 与 `statistics` 之后、`:id` 之前插入（避免 `:id` 通配提前匹配 `consult`）：

  ```js
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
  ```

  注意：必须放在 `path: ':id'` 之前，否则 `/cases/consult` 会被 `:id` 捕获。

- [ ] **Step 3: 创建 4 个占位骨架组件**

  四个组件结构相同，仅文案与外层 class 不同。以 `src/views/todos/components/consult/ConsultListView.vue` 为例：

  ```vue
  <template>
    <div class="section-card consult-list-view">
      <h1 class="page-title">专家咨询案件</h1>
      <p class="placeholder">专家咨询案件列表开发中</p>
    </div>
  </template>

  <script setup>
  // 阶段 5/6 填充
  </script>

  <style scoped lang="scss">
  .consult-list-view {
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

  四个文件对应的 `page-title` 文案：
  - `src/views/todos/components/consult/ConsultListView.vue` → "专家咨询案件"
  - `src/views/todos/components/consult/ConsultDetailView.vue` → "专家咨询详情"
  - `src/views/cases/components/consult/ConsultListView.vue` → "申请专家咨询案件"
  - `src/views/cases/components/consult/ConsultDetailView.vue` → "查看专家意见"

- [ ] **Step 4: 创建 shared/consult 目录**

  创建空目录 `src/views/cases/components/shared/consult/`（后续阶段放入复用组件族）。

- [ ] **Step 5: 预览验证**

  启动 dev server（`npm run dev`），登录后浏览器手动访问以下路由，确认页面渲染占位文案、无控制台报错：
  - `/todos/consult`
  - `/todos/consult/test-id`
  - `/cases/consult`
  - `/cases/consult/test-id`
  - 未登录状态访问任一新路由被重定向到 `/login?redirect=...`（守卫已生效，无需改动）。

- [ ] **Step 6: 提交**

  ```bash
  git add src/router/index.js src/views/todos/components/consult/ src/views/cases/components/consult/ src/views/cases/components/shared/consult/
  git commit -m "feat(consult): 新增专家咨询模块路由与占位骨架"
  ```

---

## 阶段 2: Pinia Store 与 Mock 数据 (State Management)

**Files:**
- Create: `src/stores/consult.js`

**Interfaces:**
- Produces: `useConsultStore`，暴露：
  - `expertList`（`ref([])`）：我作为专家处理的咨询案件（待办侧）
  - `applicantList`（`ref([])`）：我发起专家咨询的案件（我的案件侧）
  - `loading`（`ref(false)`）
  - `pendingCount`（`computed`）：`expertList` 中 `status !== 'processed'` 的数量
  - `currentDetail`（`ref(null)`）：当前详情页数据
  - 异步方法 `fetchExpertList(filters)` / `fetchApplicantList(filters)` / `fetchDetail(id, mode)`（Mock 同步赋值，返回 Promise）
  - 操作方法 `submitSign(id, { method, decision })` / `submitOpinion(id, { content, attachments })` / `exitConsult(id)`
- 导出常量 `SPECIALTIES`（咨询专业枚举）、`STATUS_CONFIG`（状态枚举含 tagType）
- 数据模型（设计文档 §7.1）：

  ```js
  {
    id, title, secretary, specialty, status,
    relatedCaseNo, focus, reportFile: { name, url },
    attachments: [{ name, url }],
    opinion: { content, attachments: [{ name, url }], submittedAt } | null,
    createdAt,
  }
  ```

- [ ] **Step 1: 创建 store 文件与枚举常量**

  创建 `src/stores/consult.js`，沿用 `todo.js` 的 setup 风格：

  ```js
  import { defineStore } from 'pinia'
  import { ref, computed } from 'vue'

  // 咨询专业枚举（设计文档 §7.2）
  export const SPECIALTIES = [
    { value: 'finance',      label: '金融投资' },
    { value: 'offline',      label: '线下会议' },
    { value: 'hklaw',        label: '港澳法律' },
    { value: 'construction', label: '建设工程' },
  ]

  // 状态枚举（设计文档 §7.2，含 el-tag type 映射）
  export const STATUS_CONFIG = [
    { value: 'pending',    label: '待处理',     tagType: 'warning' },
    { value: 'unreplied',  label: '未回复意见', tagType: 'success' },
    { value: 'processed',  label: '已处理',     tagType: 'info' },
  ]

  // 便捷查表函数
  export const getSpecialtyLabel = (val) => SPECIALTIES.find(s => s.value === val)?.label || val
  export const getStatusConfig = (val) => STATUS_CONFIG.find(s => s.value === val) || STATUS_CONFIG[2]
  ```

- [ ] **Step 2: 填充 expertList Mock 数据（6-8 条，覆盖三种状态与四个专业）**

  在 store 文件顶部定义 `MOCK_EXPERT_LIST`，覆盖 pending / unreplied / processed 三种状态，专业分布四个值。`opinion` 字段：processed 状态有值，其他为 null：

  ```js
  const MOCK_EXPERT_LIST = [
    {
      id: 'ec1', title: '关于某建设工程纠纷的专家咨询', secretary: '张秘书', specialty: 'construction', status: 'pending',
      relatedCaseNo: '(2026)沪仲第1001号', focus: '工程款结算标准及违约金计算方式存在争议，涉及合同条款解释与实际履约行为冲突',
      reportFile: { name: '案件审理报告.pdf', url: '/mock/report-ec1.pdf' },
      attachments: [{ name: '证据清单.pdf', url: '/mock/evidence-ec1.pdf' }, { name: '鉴定意见.pdf', url: '/mock/appraisal-ec1.pdf' }],
      opinion: null, createdAt: '2026-07-28',
    },
    {
      id: 'ec2', title: '金融借款合同利率合规性咨询', secretary: '陈秘书', specialty: 'finance', status: 'pending',
      relatedCaseNo: '(2026)沪仲第1002号', focus: '借款利率是否超过法定上限，复利计算方式合规性认定',
      reportFile: { name: '案件审理报告.pdf', url: '/mock/report-ec2.pdf' },
      attachments: [{ name: '借款合同.pdf', url: '/mock/loan-ec2.pdf' }],
      opinion: null, createdAt: '2026-07-25',
    },
    {
      id: 'ec3', title: '港澳法律适用问题咨询', secretary: '王秘书', specialty: 'hklaw', status: 'unreplied',
      relatedCaseNo: '(2026)沪仲第1003号', focus: '跨境合同纠纷法律适用选择条款效力认定',
      reportFile: { name: '案件审理报告.pdf', url: '/mock/report-ec3.pdf' },
      attachments: [{ name: '涉外合同.pdf', url: '/mock/contract-ec3.pdf' }],
      opinion: null, createdAt: '2026-07-20',
    },
    {
      id: 'ec4', title: '线下会议纠纷处理方案咨询', secretary: '刘秘书', specialty: 'offline', status: 'unreplied',
      relatedCaseNo: '(2026)沪仲第1004号', focus: '会议纪要效力认定与补充协议冲突处理',
      reportFile: { name: '案件审理报告.pdf', url: '/mock/report-ec4.pdf' },
      attachments: [{ name: '会议纪要.pdf', url: '/mock/minutes-ec4.pdf' }],
      opinion: null, createdAt: '2026-07-18',
    },
    {
      id: 'ec5', title: '建设工程质量保修金返还争议咨询', secretary: '张秘书', specialty: 'construction', status: 'processed',
      relatedCaseNo: '(2026)沪仲第1005号', focus: '保修期满后质量保修金返还条件是否成就',
      reportFile: { name: '案件审理报告.pdf', url: '/mock/report-ec5.pdf' },
      attachments: [{ name: '竣工验收报告.pdf', url: '/mock/acceptance-ec5.pdf' }],
      opinion: {
        content: '经审查，本案质量保修期已满，且被申请人未提供有效证据证明保修期内存在质量问题。建议支持申请人返还保修金的请求，违约金按合同约定标准计算。',
        attachments: [{ name: '专家意见附件-类似案例.pdf', url: '/mock/expert-ec5.pdf' }],
        submittedAt: '2026-07-15 14:30',
      }, createdAt: '2026-07-10',
    },
    {
      id: 'ec6', title: '金融借款担保责任范围咨询', secretary: '陈秘书', specialty: 'finance', status: 'processed',
      relatedCaseNo: '(2026)沪仲第1006号', focus: '连带保证人责任范围是否及于违约金',
      reportFile: { name: '案件审理报告.pdf', url: '/mock/report-ec6.pdf' },
      attachments: [{ name: '担保合同.pdf', url: '/mock/guarantee-ec6.pdf' }],
      opinion: {
        content: '根据《民法典》第六百八十八条，连带保证人责任范围依约定；本案担保合同明确约定"担保范围包括主债权及违约金"，故保证人责任及于违约金。',
        attachments: [], submittedAt: '2026-07-08 10:15',
      }, createdAt: '2026-07-01',
    },
  ]
  ```

- [ ] **Step 3: 填充 applicantList Mock 数据（5-6 条，均有 opinion）**

  定义 `MOCK_APPLICANT_LIST`，均为已回复状态（`status: 'processed'` 或不设 status，因列表无状态筛选），每条 `opinion` 有值：

  ```js
  const MOCK_APPLICANT_LIST = [
    {
      id: 'ac1', title: '我的建设工程纠纷专家咨询', secretary: '张秘书', specialty: 'construction',
      relatedCaseNo: '(2026)沪仲第2001号', focus: '工程变更后价款调整方法争议',
      reportFile: { name: '案件审理报告.pdf', url: '/mock/report-ac1.pdf' },
      attachments: [{ name: '变更签证.pdf', url: '/mock/visa-ac1.pdf' }],
      opinion: {
        content: '工程变更属于合同变更，应根据《建设工程司法解释》第十六条，参照签订合同时当地建设行政主管部门发布的计价方法或标准结算。',
        attachments: [{ name: '专家意见书.pdf', url: '/mock/expert-ac1.pdf' }],
        submittedAt: '2026-07-22 16:00',
      }, createdAt: '2026-07-15',
    },
    {
      id: 'ac2', title: '金融借款利率合规咨询', secretary: '陈秘书', specialty: 'finance',
      relatedCaseNo: '(2026)沪仲第2002号', focus: '逾期利息与违约金并存时上限认定',
      reportFile: { name: '案件审理报告.pdf', url: '/mock/report-ac2.pdf' },
      attachments: [{ name: '借款合同.pdf', url: '/mock/loan-ac2.pdf' }],
      opinion: {
        content: '逾期利息与违约金并存的，总和超过合同成立时一年期贷款市场报价利率四倍的部分不予支持。',
        attachments: [{ name: 'LPR历史数据.pdf', url: '/mock/lpr-ac2.pdf' }],
        submittedAt: '2026-07-18 11:30',
      }, createdAt: '2026-07-10',
    },
    {
      id: 'ac3', title: '港澳法律适用咨询', secretary: '王秘书', specialty: 'hklaw',
      relatedCaseNo: '(2026)沪仲第2003号', focus: '涉港合同法律适用选择条款效力',
      reportFile: { name: '案件审理报告.pdf', url: '/mock/report-ac3.pdf' },
      attachments: [{ name: '涉外合同.pdf', url: '/mock/contract-ac3.pdf' }],
      opinion: {
        content: '当事人协议选择适用法律的条款有效，但不得规避我国强制性法律规定。涉及外汇管制的部分应适用内地法律。',
        attachments: [], submittedAt: '2026-07-12 09:45',
      }, createdAt: '2026-07-05',
    },
    {
      id: 'ac4', title: '线下会议纪要效力咨询', secretary: '刘秘书', specialty: 'offline',
      relatedCaseNo: '(2026)沪仲第2004号', focus: '未经全体签字的会议纪要是否具有合同效力',
      reportFile: { name: '案件审理报告.pdf', url: '/mock/report-ac4.pdf' },
      attachments: [{ name: '会议纪要.pdf', url: '/mock/minutes-ac4.pdf' }],
      opinion: {
        content: '会议纪要经双方授权代表签字即具有合同效力，未经全体与会人员签字不影响已签字部分的效力，但需证明签字人具有相应授权。',
        attachments: [{ name: '授权委托书.pdf', url: '/mock/auth-ac4.pdf' }],
        submittedAt: '2026-07-08 14:20',
      }, createdAt: '2026-06-28',
    },
    {
      id: 'ac5', title: '建设工程结算争议咨询', secretary: '张秘书', specialty: 'construction',
      relatedCaseNo: '(2026)沪仲第2005号', focus: '施工合同无效后已完工程价款结算依据',
      reportFile: { name: '案件审理报告.pdf', url: '/mock/report-ac5.pdf' },
      attachments: [{ name: '竣工验收报告.pdf', url: '/mock/acceptance-ac5.pdf' }],
      opinion: {
        content: '施工合同无效但工程验收合格的，可参照合同约定结算工程价款；实际履约行为与合同约定冲突时，以实际履约为准。',
        attachments: [{ name: '类似案例汇编.pdf', url: '/mock/cases-ac5.pdf' }],
        submittedAt: '2026-07-03 15:50',
      }, createdAt: '2026-06-20',
    },
  ]
  ```

- [ ] **Step 4: 实现 store 主体逻辑**

  补全 store 主体，包含状态、computed、fetch 与操作方法。Mock 数据在 fetch 中同步赋值，预留 async 形态：

  ```js
  export const useConsultStore = defineStore('consult', () => {
    const expertList = ref([])
    const applicantList = ref([])
    const loading = ref(false)
    const currentDetail = ref(null)

    const pendingCount = computed(() =>
      expertList.value.filter(i => i.status !== 'processed').length
    )

    async function fetchExpertList(filters = {}) {
      loading.value = true
      let list = [...MOCK_EXPERT_LIST]
      const { title, secretary, specialty, status } = filters
      if (title) list = list.filter(i => i.title.includes(title.trim()))
      if (secretary) list = list.filter(i => i.secretary.includes(secretary.trim()))
      if (specialty) list = list.filter(i => i.specialty === specialty)
      if (status) {
        // 待处理筛选下包含 unreplied 子状态
        if (status === 'pending') list = list.filter(i => i.status === 'pending' || i.status === 'unreplied')
        else list = list.filter(i => i.status === status)
      }
      expertList.value = list
      loading.value = false
    }

    async function fetchApplicantList(filters = {}) {
      loading.value = true
      let list = [...MOCK_APPLICANT_LIST]
      const { title, secretary, specialty } = filters
      if (title) list = list.filter(i => i.title.includes(title.trim()))
      if (secretary) list = list.filter(i => i.secretary.includes(secretary.trim()))
      if (specialty) list = list.filter(i => i.specialty === specialty)
      applicantList.value = list
      loading.value = false
    }

    async function fetchDetail(id, mode) {
      loading.value = true
      const source = mode === 'expert' ? MOCK_EXPERT_LIST : MOCK_APPLICANT_LIST
      currentDetail.value = source.find(i => i.id === id) || null
      loading.value = false
    }

    // 提交签署（回避/接受咨询）→ 状态转为 processed（接受后实际应为 unreplied，但 Mock 简化为 processed）
    // 设计文档 §6.4：签署后选择"回避"或"接受"。接受咨询后进入"未回复意见"态，回避则直接终态
    function submitSign(id, { method, decision }) {
      const item = expertList.value.find(i => i.id === id)
      if (!item) return
      if (decision === 'accept') {
        item.status = 'unreplied'
      } else {
        item.status = 'processed'
      }
      if (currentDetail.value?.id === id) currentDetail.value = { ...item }
    }

    function submitOpinion(id, { content, attachments }) {
      const item = expertList.value.find(i => i.id === id)
      if (!item) return
      item.opinion = {
        content,
        attachments: attachments || [],
        submittedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      }
      item.status = 'processed'
      if (currentDetail.value?.id === id) currentDetail.value = { ...item }
    }

    function exitConsult(id) {
      const item = expertList.value.find(i => i.id === id)
      if (!item) return
      item.status = 'processed'
      if (currentDetail.value?.id === id) currentDetail.value = { ...item }
    }

    return {
      expertList, applicantList, loading, currentDetail, pendingCount,
      fetchExpertList, fetchApplicantList, fetchDetail,
      submitSign, submitOpinion, exitConsult,
    }
  })
  ```

- [ ] **Step 5: 预览验证**

  在浏览器控制台手动验证 store（通过 Vue Devtools 或临时在占位组件中调用）：
  - `useConsultStore().expertList` 初始为 `[]`
  - 调用 `await fetchExpertList()` 后长度为 6
  - `pendingCount` 为 4（2 pending + 2 unreplied）
  - 调用 `await fetchApplicantList()` 后长度为 5
  - `fetchDetail('ec1', 'expert')` 后 `currentDetail` 不为 null

- [ ] **Step 6: 提交**

  ```bash
  git add src/stores/consult.js
  git commit -m "feat(consult): 新增专家咨询 Pinia store 与 Mock 数据"
  ```

---

## 阶段 3: 侧栏菜单集成 (Sidebar Integration)

**Files:**
- Modify: `src/views/todos/TodosView.vue`（新增「专家咨询案件」菜单项 + badge）
- Modify: `src/views/cases/CasesView.vue`（新增「申请专家咨询案件」菜单项 + 移动端下拉选项）

**Interfaces:**
- Consumes: `useConsultStore` 的 `pendingCount`（待办侧 badge）、`fetchExpertList`（onMounted 拉取）
- Produces: 侧栏菜单项可点击跳转 `/todos/consult` 与 `/cases/consult`

- [ ] **Step 1: TodosView 新增「专家咨询案件」菜单项**

  在 `src/views/todos/TodosView.vue` 的 `el-menu` 中，`scheduling` 菜单项之后追加：

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

- [ ] **Step 2: TodosView 引入 store 与图标**

  在 `<script setup>` 中：
  - 从 `@element-plus/icons-vue` 的 import 中追加 `ChatDotRound`
  - 引入 store：`import { useConsultStore } from '@/stores/consult'`
  - 实例化：`const consultStore = useConsultStore()`
  - 在 `onMounted` 中追加调用：`consultStore.fetchExpertList()`（拉取数据驱动 badge）

  修改后的 `onMounted`：

  ```js
  onMounted(() => {
    todoStore.fetchAllCounts()
    consultStore.fetchExpertList()
  })
  ```

- [ ] **Step 3: CasesView 新增「申请专家咨询案件」菜单项**

  在 `src/views/cases/CasesView.vue` 的 `el-menu` 中，`statistics` 菜单项之后追加：

  ```vue
  <el-menu-item index="/cases/consult">
    <el-icon><ChatLineRound /></el-icon>
    <span>申请专家咨询案件</span>
  </el-menu-item>
  ```

  并在 `import` 中追加 `ChatLineRound`：`import { Document, TrendCharts, Fold, Expand, ChatLineRound } from '@element-plus/icons-vue'`

- [ ] **Step 4: CasesView 移动端下拉选择器同步新增选项**

  在 `.mobile-nav-selector` 的 `el-select` 中追加：

  ```vue
  <el-option label="申请专家咨询案件" value="/cases/consult" />
  ```

- [ ] **Step 5: 预览验证**

  启动 dev server，登录后验证：
  - 待办事项侧栏底部显示「专家咨询案件」菜单项（ChatDotRound 图标），badge 显示数字 4
  - 我的案件侧栏显示「申请专家咨询案件」菜单项（ChatLineRound 图标），无 badge
  - 点击两个菜单项分别跳转 `/todos/consult` 与 `/cases/consult`，显示占位文案
  - 移动端（缩窄浏览器至 ≤768px）我的案件下拉选择器含「申请专家咨询案件」选项
  - 顶部水平主菜单仍为四项，无变化

- [ ] **Step 6: 提交**

  ```bash
  git add src/views/todos/TodosView.vue src/views/cases/CasesView.vue
  git commit -m "feat(consult): 侧栏新增专家咨询菜单项入口"
  ```

---

## 阶段 4: 详情页复用组件族 (Shared Components)

**Files:**
- Create: `src/views/cases/components/shared/consult/ConsultInfo.vue`
- Create: `src/views/cases/components/shared/consult/ConsultOpinion.vue`
- Create: `src/views/cases/components/shared/consult/ConsultEditor.vue`
- Create: `src/views/cases/components/shared/consult/SignCommitmentDialog.vue`

**Interfaces:**
- Consumes: `useConsultStore` 的 `currentDetail`、`submitSign`、`submitOpinion`、`exitConsult`；`getSpecialtyLabel`、`getStatusConfig` 常量函数
- Produces: 4 个可复用组件
  - `ConsultInfo`：props `detail`，展示咨询信息区块
  - `ConsultOpinion`：props `opinion`（object | null），展示专家回复意见区块
  - `ConsultEditor`：props `detail`，emits `sign`、`submit-opinion`、`exit`，发表意见编辑 + 操作按钮区
  - `SignCommitmentDialog`：props `visible`（v-model）、`detail`，emits `update:visible`、`signed`（payload `{ method, decision }`），签署弹窗

- [ ] **Step 1: 创建 ConsultInfo 组件（区块1：咨询信息）**

  创建 `src/views/cases/components/shared/consult/ConsultInfo.vue`。用 `el-descriptions` 展示结构化字段，附件走文字链接（`window.open` 预览）：

  ```vue
  <template>
    <div class="section-card consult-info">
      <div class="section-title">咨询信息</div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="标题">{{ detail.title }}</el-descriptions-item>
        <el-descriptions-item label="咨询专业">
          <el-tag size="small">{{ getSpecialtyLabel(detail.specialty) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="咨询秘书">{{ detail.secretary }}</el-descriptions-item>
        <el-descriptions-item label="关联案件">{{ detail.relatedCaseNo }}</el-descriptions-item>
        <el-descriptions-item label="争议焦点" :span="2">{{ detail.focus }}</el-descriptions-item>
        <el-descriptions-item label="案件审理报告" :span="2">
          <el-link v-if="detail.reportFile?.url" type="primary" :underline="false" @click="previewFile(detail.reportFile.url)">
            📄 {{ detail.reportFile.name }}
          </el-link>
          <span v-else>—</span>
        </el-descriptions-item>
        <el-descriptions-item label="附件" :span="2">
          <template v-if="detail.attachments?.length">
            <el-link v-for="f in detail.attachments" :key="f.url" type="primary" :underline="false" class="file-link" @click="previewFile(f.url)">
              📎 {{ f.name }}
            </el-link>
          </template>
          <span v-else>—</span>
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </template>

  <script setup>
  import { getSpecialtyLabel } from '@/stores/consult'

  defineProps({
    detail: { type: Object, required: true },
  })

  const previewFile = (url) => window.open(url, '_blank')
  </script>

  <style scoped lang="scss">
  .consult-info {
    .file-link {
      margin-right: 12px;
    }
  }
  </style>
  ```

- [ ] **Step 2: 创建 ConsultOpinion 组件（区块2：专家回复意见）**

  创建 `src/views/cases/components/shared/consult/ConsultOpinion.vue`。有意见展示内容 + 附件 + 提交时间；无意见显示空状态：

  ```vue
  <template>
    <div class="section-card consult-opinion">
      <div class="section-title">专家回复意见</div>
      <template v-if="opinion">
        <div class="opinion-meta">
          <span class="meta-label">提交时间：</span>
          <span class="meta-value">{{ opinion.submittedAt }}</span>
        </div>
        <div class="opinion-content">{{ opinion.content }}</div>
        <div v-if="opinion.attachments?.length" class="opinion-attachments">
          <span class="meta-label">附件：</span>
          <el-link v-for="f in opinion.attachments" :key="f.url" type="primary" :underline="false" class="file-link" @click="previewFile(f.url)">
            📎 {{ f.name }}
          </el-link>
        </div>
      </template>
      <div v-else class="opinion-empty">
        <el-icon class="empty-icon"><ChatLineSquare /></el-icon>
        <span class="empty-text">暂无回复意见</span>
      </div>
    </div>
  </template>

  <script setup>
  import { ChatLineSquare } from '@element-plus/icons-vue'

  defineProps({
    opinion: { type: Object, default: null },
  })

  const previewFile = (url) => window.open(url, '_blank')
  </script>

  <style scoped lang="scss">
  .consult-opinion {
    .opinion-meta {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-bottom: 12px;
    }
    .opinion-content {
      font-size: 14px;
      line-height: 1.8;
      color: var(--el-text-color-regular);
      background: #f5f7fa;
      padding: 16px;
      border-radius: 4px;
      white-space: pre-wrap;
      margin-bottom: 12px;
    }
    .opinion-attachments {
      font-size: 14px;
      .file-link { margin-right: 12px; }
    }
    .opinion-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 0;
      .empty-icon {
        font-size: 40px;
        color: var(--el-text-color-placeholder);
        margin-bottom: 8px;
      }
      .empty-text {
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }
  }
  </style>
  ```

- [ ] **Step 3: 创建 ConsultEditor 组件（区块3：发表意见 + 操作按钮）**

  创建 `src/views/cases/components/shared/consult/ConsultEditor.vue`。包含意见输入框（textarea）、附件上传、操作按钮（按状态联动）。操作通过 emit 事件交由父组件处理：

  ```vue
  <template>
    <div class="section-card consult-editor">
      <div class="section-title">发表意见</div>
      <el-input
        v-model="opinionText"
        type="textarea"
        :rows="5"
        placeholder="请输入回复意见内容…"
        :disabled="detail.status === 'processed'"
      />
      <div class="upload-area">
        <span class="upload-label">📎 上传附件（法律文书、证据材料）</span>
        <el-upload
          v-if="detail.status !== 'processed'"
          :file-list="fileList"
          :auto-upload="false"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          multiple
        >
          <el-button size="small" plain>选择文件</el-button>
        </el-upload>
      </div>
      <div class="action-bar">
        <template v-if="detail.status === 'pending'">
          <el-button type="primary" @click="$emit('sign')">回避 / 接受咨询</el-button>
          <el-button type="danger" plain class="exit-btn" @click="$emit('exit')">退出咨询</el-button>
        </template>
        <template v-else-if="detail.status === 'unreplied'">
          <el-button type="primary" @click="handleSubmit">提交意见</el-button>
          <el-button type="danger" plain class="exit-btn" @click="$emit('exit')">退出咨询</el-button>
        </template>
      </div>
    </div>
  </template>

  <script setup>
  import { ref, watch } from 'vue'

  const props = defineProps({
    detail: { type: Object, required: true },
  })

  const emit = defineEmits(['sign', 'submit-opinion', 'exit'])

  const opinionText = ref(props.detail?.opinion?.content || '')
  const fileList = ref([])

  watch(() => props.detail, (val) => {
    opinionText.value = val?.opinion?.content || ''
    fileList.value = []
  })

  const handleFileChange = (file, files) => {
    fileList.value = files
  }
  const handleFileRemove = (file, files) => {
    fileList.value = files
  }

  const handleSubmit = () => {
    if (!opinionText.value.trim()) {
      ElMessage.warning('请输入回复意见内容')
      return
    }
    emit('submit-opinion', {
      content: opinionText.value,
      attachments: fileList.value.map(f => ({ name: f.name, url: f.url || f.raw?.url || '#' })),
    })
  }
  </script>

  <script>
  import { ElMessage } from 'element-plus'
  export default { components: { ElMessage } }
  </script>

  <style scoped lang="scss">
  .consult-editor {
    .upload-area {
      margin: 12px 0;
      .upload-label {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-right: 12px;
      }
    }
    .action-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      border-top: 1px solid var(--el-border-color-lighter);
      padding-top: 12px;
      .exit-btn {
        margin-left: auto;
      }
    }
  }
  </style>
  ```

  注意：`ConsultEditor` 仅在 `mode="expert"` 且 `status !== 'processed'` 时由父组件渲染，因此无需自行判断 mode。

- [ ] **Step 4: 创建 SignCommitmentDialog 组件（签署弹窗）**

  创建 `src/views/cases/components/shared/consult/SignCommitmentDialog.vue`。弹窗内两步：选方式 → 子流程。线上签名模拟 GDCA loading，上传文件走 el-upload 单文件：

  ```vue
  <template>
    <el-dialog
      :model-value="visible"
      title="回避 / 接受咨询"
      width="600px"
      :close-on-click-modal="false"
      @update:model-value="$emit('update:visible', $event)"
    >
      <!-- 步骤1：选择确认方式 -->
      <div v-if="step === 'select'" class="step-select">
        <p class="step-tip">请选择确认方式：</p>
        <div class="method-options">
          <div class="method-card" :class="{ active: method === 'online' }" @click="method = 'online'">
            <el-icon><EditPen /></el-icon>
            <span>线上签名（GDCA）</span>
          </div>
          <div class="method-card" :class="{ active: method === 'upload' }" @click="method = 'upload'">
            <el-icon><Upload /></el-icon>
            <span>上传扫描件</span>
          </div>
        </div>
      </div>

      <!-- 步骤2a：线上签名子流程 -->
      <div v-else-if="step === 'online'" class="step-online">
        <div class="commitment-preview">
          <div class="preview-title">声明承诺书</div>
          <div class="preview-body">{{ COMMITMENT_TEXT }}</div>
        </div>
        <div v-if="!onlineSigned" class="online-action">
          <el-button type="primary" :loading="gdcaLoading" @click="handleGdcaSign">
            {{ gdcaLoading ? '正在调起 GDCA 签名…' : '调起 GDCA 电子签名' }}
          </el-button>
        </div>
        <div v-else class="online-signed">
          <el-tag type="success">已完成签名</el-tag>
        </div>
      </div>

      <!-- 步骤2b：上传文件子流程 -->
      <div v-else-if="step === 'upload'" class="step-upload">
        <div class="upload-tip">
          <span>请下载声明承诺书模板，签署后上传扫描件：</span>
          <el-link type="primary" :underline="false" @click="downloadTemplate">下载模板</el-link>
        </div>
        <el-upload
          :file-list="uploadFileList"
          :auto-upload="false"
          :limit="1"
          :on-change="handleUploadChange"
          :on-remove="handleUploadRemove"
          drag
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">将扫描件拖到此处，或<em>点击上传</em></div>
        </el-upload>
      </div>

      <!-- 底部操作 -->
      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button v-if="step !== 'select'" @click="backToSelect">返回选择</el-button>
        <el-button
          v-if="step === 'online' && onlineSigned"
          type="warning"
          @click="handleDecision('withdraw')"
        >回避咨询</el-button>
        <el-button
          v-if="step === 'online' && onlineSigned"
          type="primary"
          @click="handleDecision('accept')"
        >接受咨询</el-button>
        <el-button
          v-if="step === 'upload' && uploadFileList.length > 0"
          type="warning"
          @click="handleDecision('withdraw')"
        >回避咨询</el-button>
        <el-button
          v-if="step === 'upload' && uploadFileList.length > 0"
          type="primary"
          @click="handleDecision('accept')"
        >接受咨询</el-button>
        <el-button v-if="step === 'select' && method" type="primary" @click="goToStep">下一步</el-button>
      </template>
    </el-dialog>
  </template>

  <script setup>
  import { ref, watch } from 'vue'
  import { EditPen, Upload, UploadFilled } from '@element-plus/icons-vue'

  const props = defineProps({
    visible: { type: Boolean, default: false },
  })
  const emit = defineEmits(['update:visible', 'signed'])

  const COMMITMENT_TEXT = '本人作为专家，郑重声明将独立、公正地出具咨询意见，严格遵守仲裁规则与保密义务，与案件当事人无利益冲突，不私下接触当事人及其代理人。'

  const step = ref('select')
  const method = ref('')
  const gdcaLoading = ref(false)
  const onlineSigned = ref(false)
  const uploadFileList = ref([])

  // 弹窗打开时重置状态
  watch(() => props.visible, (val) => {
    if (val) {
      step.value = 'select'
      method.value = ''
      gdcaLoading.value = false
      onlineSigned.value = false
      uploadFileList.value = []
    }
  })

  const goToStep = () => {
    step.value = method.value
  }
  const backToSelect = () => {
    step.value = 'select'
    onlineSigned.value = false
    uploadFileList.value = []
  }
  const handleClose = () => {
    emit('update:visible', false)
  }

  const handleGdcaSign = () => {
    gdcaLoading.value = true
    // 模拟 GDCA 接口调用
    setTimeout(() => {
      gdcaLoading.value = false
      onlineSigned.value = true
    }, 1500)
  }

  const downloadTemplate = () => {
    // 模板下载（Mock：使用 docs/声明承诺书.docx 路径）
    const a = document.createElement('a')
    a.href = '/docs/声明承诺书.docx'
    a.download = '声明承诺书.docx'
    a.click()
  }

  const handleUploadChange = (file, files) => {
    uploadFileList.value = files
  }
  const handleUploadRemove = (file, files) => {
    uploadFileList.value = files
  }

  const handleDecision = (decision) => {
    emit('signed', { method: method.value, decision })
    emit('update:visible', false)
  }
  </script>

  <style scoped lang="scss">
  .step-select {
    .step-tip {
      font-size: 14px;
      color: var(--el-text-color-regular);
      margin-bottom: 16px;
    }
    .method-options {
      display: flex;
      gap: 16px;
    }
    .method-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 24px 16px;
      border: 1px solid var(--el-border-color);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      color: var(--el-text-color-regular);
      .el-icon {
        font-size: 28px;
      }
      &:hover {
        border-color: var(--el-color-primary);
        color: var(--el-color-primary);
      }
      &.active {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
      }
    }
  }
  .commitment-preview {
    .preview-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 8px;
    }
    .preview-body {
      font-size: 14px;
      line-height: 1.8;
      color: var(--el-text-color-regular);
      background: #f5f7fa;
      padding: 16px;
      border-radius: 4px;
      max-height: 200px;
      overflow-y: auto;
    }
  }
  .online-action, .online-signed {
    text-align: center;
    margin-top: 16px;
  }
  .upload-tip {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  </style>
  ```

- [ ] **Step 5: 预览验证**

  组件无法独立预览，通过 Vue Devtools 确认 4 个组件可正常 import 无报错。实际功能在阶段 5/6 集成后验证。

- [ ] **Step 6: 提交**

  ```bash
  git add src/views/cases/components/shared/consult/
  git commit -m "feat(consult): 新增详情页复用组件族（信息/意见/编辑/签署弹窗）"
  ```

---

## 阶段 5: 待办侧列表页与详情页 (Expert Mode)

**Files:**
- Modify: `src/views/todos/components/consult/ConsultListView.vue`（替换占位骨架）
- Modify: `src/views/todos/components/consult/ConsultDetailView.vue`（替换占位骨架）

**Interfaces:**
- Consumes: `useConsultStore` 的 `expertList`、`fetchExpertList`、`currentDetail`、`fetchDetail`、`submitSign`、`submitOpinion`、`exitConsult`；`SPECIALTIES`、`STATUS_CONFIG`、`getSpecialtyLabel`、`getStatusConfig`
- Consumes: `ConsultInfo`、`ConsultOpinion`、`ConsultEditor`、`SignCommitmentDialog` 组件
- Consumes: `TodoEmptyState` 空状态组件

- [ ] **Step 1: 实现待办侧列表页 ConsultListView.vue**

  替换 `src/views/todos/components/consult/ConsultListView.vue`。筛选栏含咨询标题、咨询秘书、咨询专业（下拉）、处理状态（下拉），表格按状态联动操作按钮：

  ```vue
  <template>
    <div class="consult-list-view">
      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="filter-items">
          <div class="filter-item">
            <span class="filter-label">咨询标题</span>
            <el-input v-model="filters.title" placeholder="请输入" clearable />
          </div>
          <div class="filter-item">
            <span class="filter-label">咨询秘书</span>
            <el-input v-model="filters.secretary" placeholder="请输入" clearable />
          </div>
          <div class="filter-item">
            <span class="filter-label">咨询专业</span>
            <el-select v-model="filters.specialty" placeholder="全部" clearable>
              <el-option v-for="s in SPECIALTIES" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
          </div>
          <div class="filter-item">
            <span class="filter-label">处理状态</span>
            <el-select v-model="filters.status" placeholder="全部" clearable>
              <el-option label="待处理" value="pending" />
              <el-option label="已处理" value="processed" />
            </el-select>
          </div>
        </div>
        <div class="filter-actions">
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
      </div>

      <!-- 表格区 -->
      <div class="table-section">
        <div class="table-title">
          <span>咨询案件列表&nbsp;&nbsp;<span class="title-count">共 {{ consultStore.expertList.length }} 条</span></span>
        </div>
        <el-table :data="pagedData" style="width: 100%" v-loading="consultStore.loading">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="title" label="咨询标题" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">
              <el-link type="primary" :underline="false" @click="goDetail(row)">{{ row.title }}</el-link>
            </template>
          </el-table-column>
          <el-table-column prop="secretary" label="咨询秘书" width="100" />
          <el-table-column label="咨询专业" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ getSpecialtyLabel(row.specialty) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="getStatusConfig(row.status).tagType" size="small">{{ getStatusConfig(row.status).label }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <template v-if="row.status === 'pending'">
                <el-button type="primary" link @click="goDetail(row)">回避/接受咨询</el-button>
                <el-button type="danger" link @click="confirmExit(row)">退出咨询</el-button>
              </template>
              <template v-else-if="row.status === 'unreplied'">
                <el-button type="primary" link @click="goDetail(row)">提交意见</el-button>
                <el-button type="danger" link @click="confirmExit(row)">退出咨询</el-button>
              </template>
              <template v-else>
                <el-button link class="view-btn" @click="goDetail(row)">查看</el-button>
              </template>
            </template>
          </el-table-column>
          <template #empty>
            <TodoEmptyState text="暂无专家咨询案件" />
          </template>
        </el-table>

        <!-- 分页 -->
        <div v-if="consultStore.expertList.length > 0" class="pagination-bar">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[5, 10, 20]"
            :total="consultStore.expertList.length"
            layout="total, prev, pager, next, sizes"
            background
            small
          />
        </div>
      </div>
    </div>
  </template>

  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessageBox, ElMessage } from 'element-plus'
  import { useConsultStore, SPECIALTIES, getSpecialtyLabel, getStatusConfig } from '@/stores/consult'
  import TodoEmptyState from '../shared/TodoEmptyState.vue'

  const router = useRouter()
  const consultStore = useConsultStore()

  const filters = ref({ title: '', secretary: '', specialty: '', status: '' })
  const currentPage = ref(1)
  const pageSize = ref(10)

  const pagedData = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return consultStore.expertList.slice(start, start + pageSize.value)
  })

  const handleSearch = () => {
    currentPage.value = 1
    consultStore.fetchExpertList(filters.value)
  }
  const handleReset = () => {
    filters.value = { title: '', secretary: '', specialty: '', status: '' }
    currentPage.value = 1
    consultStore.fetchExpertList()
  }

  const goDetail = (row) => {
    router.push(`/todos/consult/${row.id}`)
  }

  const confirmExit = async (row) => {
    await ElMessageBox.confirm('确定退出本次咨询？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    consultStore.exitConsult(row.id)
    ElMessage.success('已退出咨询')
  }

  onMounted(() => {
    consultStore.fetchExpertList()
  })
  </script>

  <style scoped lang="scss">
  .consult-list-view {
    .view-btn {
      color: var(--el-text-color-secondary);
    }
  }
  </style>
  ```

- [ ] **Step 2: 实现待办侧详情页 ConsultDetailView.vue（expert 模式）**

  替换 `src/views/todos/components/consult/ConsultDetailView.vue`。单栏纵向堆叠 ConsultInfo + ConsultOpinion + ConsultEditor，expert 模式含操作。集成 SignCommitmentDialog 弹窗，处理 sign/submit-opinion/exit 事件：

  ```vue
  <template>
    <div class="consult-detail-view" v-loading="consultStore.loading">
      <!-- 不存在兜底 -->
      <TodoEmptyState v-if="!consultStore.currentDetail" text="咨询案件不存在或已归档" />

      <template v-else>
        <!-- 返回栏 + 标题状态 -->
        <div class="section-card detail-header">
          <div class="header-left">
            <el-button plain size="small" :icon="ArrowLeft" @click="goBack">返回</el-button>
            <span class="detail-title">{{ consultStore.currentDetail.title }}</span>
            <el-tag :type="getStatusConfig(consultStore.currentDetail.status).tagType" size="small">
              {{ getStatusConfig(consultStore.currentDetail.status).label }}
            </el-tag>
          </div>
        </div>

        <!-- 区块1：咨询信息 -->
        <ConsultInfo :detail="consultStore.currentDetail" />

        <!-- 区块2：专家回复意见 -->
        <ConsultOpinion :opinion="consultStore.currentDetail.opinion" />

        <!-- 区块3：发表意见 + 操作（仅 pending/unreplied 状态显示） -->
        <ConsultEditor
          v-if="consultStore.currentDetail.status !== 'processed'"
          :detail="consultStore.currentDetail"
          @sign="signDialogVisible = true"
          @submit-opinion="handleSubmitOpinion"
          @exit="handleExit"
        />
      </template>

      <!-- 签署弹窗 -->
      <SignCommitmentDialog
        v-model:visible="signDialogVisible"
        @signed="handleSigned"
      />
    </div>
  </template>

  <script setup>
  import { ref, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { ElMessageBox, ElMessage } from 'element-plus'
  import { ArrowLeft } from '@element-plus/icons-vue'
  import { useConsultStore, getStatusConfig } from '@/stores/consult'
  import TodoEmptyState from '../../shared/TodoEmptyState.vue'
  import ConsultInfo from '@/views/cases/components/shared/consult/ConsultInfo.vue'
  import ConsultOpinion from '@/views/cases/components/shared/consult/ConsultOpinion.vue'
  import ConsultEditor from '@/views/cases/components/shared/consult/ConsultEditor.vue'
  import SignCommitmentDialog from '@/views/cases/components/shared/consult/SignCommitmentDialog.vue'

  const route = useRoute()
  const router = useRouter()
  const consultStore = useConsultStore()

  const signDialogVisible = ref(false)

  const goBack = () => {
    router.push('/todos/consult')
  }

  const handleSubmitOpinion = async ({ content, attachments }) => {
    await consultStore.submitOpinion(route.params.id, { content, attachments })
    ElMessage.success('意见已提交')
  }

  const handleSigned = async ({ method, decision }) => {
    await consultStore.submitSign(route.params.id, { method, decision })
    ElMessage.success(decision === 'accept' ? '已接受咨询，请回复意见' : '已回避咨询')
  }

  const handleExit = async () => {
    await ElMessageBox.confirm('确定退出本次咨询？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await consultStore.exitConsult(route.params.id)
    ElMessage.success('已退出咨询')
    goBack()
  }

  onMounted(() => {
    consultStore.fetchDetail(route.params.id, 'expert')
  })
  </script>

  <style scoped lang="scss">
  .detail-header {
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      .detail-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }
  }
  </style>
  ```

- [ ] **Step 3: 预览验证**

  启动 dev server，登录后验证待办侧完整流程：
  - 访问 `/todos/consult`，显示筛选栏（含处理状态筛选）+ 表格 + 分页
  - 表格 6 条数据，操作列按状态联动：pending 显示「回避/接受咨询」「退出咨询」；unreplied 显示「提交意见」「退出咨询」；processed 显示灰色「查看」
  - 点击咨询标题进入 `/todos/consult/:id`，显示标题栏 + 咨询信息 + 专家回复意见 + 发表意见编辑区
  - pending 状态点击「回避/接受咨询」弹出签署弹窗，选「线上签名」→ 点击「调起 GDCA 电子签名」→ loading 1.5s 后显示「已完成签名」→ 显示「回避咨询」「接受咨询」按钮 → 点击「接受咨询」→ 弹窗关闭，状态变为「未回复意见」，ConsultEditor 仍显示（切换为提交意见模式）
  - pending 状态签署时点击「回避咨询」→ 状态变为「已处理」，ConsultEditor 隐藏
  - unreplied 状态在意见输入框填写内容 → 点击「提交意见」→ 状态变为「已处理」，ConsultEditor 隐藏，ConsultOpinion 显示刚提交的意见
  - 点击「退出咨询」→ 二次确认 → 状态变为「已处理」→ 返回列表
  - processed 状态详情页无 ConsultEditor 区块
  - 列表筛选：选「待处理」显示 pending + unreplied 共 4 条；选「已处理」显示 2 条

- [ ] **Step 4: 提交**

  ```bash
  git add src/views/todos/components/consult/ConsultListView.vue src/views/todos/components/consult/ConsultDetailView.vue
  git commit -m "feat(consult): 实现待办侧专家咨询案件列表与详情页（expert 模式）"
  ```

---

## 阶段 6: 我的案件侧列表页与详情页 (Applicant Mode)

**Files:**
- Modify: `src/views/cases/components/consult/ConsultListView.vue`（替换占位骨架）
- Modify: `src/views/cases/components/consult/ConsultDetailView.vue`（替换占位骨架）

**Interfaces:**
- Consumes: `useConsultStore` 的 `applicantList`、`fetchApplicantList`、`currentDetail`、`fetchDetail`；`SPECIALTIES`、`getSpecialtyLabel`
- Consumes: `ConsultInfo`、`ConsultOpinion` 组件（不使用 ConsultEditor / SignCommitmentDialog，只读模式）
- Consumes: `CaseEmptyState` 空状态组件

- [ ] **Step 1: 实现我的案件侧列表页 ConsultListView.vue**

  替换 `src/views/cases/components/consult/ConsultListView.vue`。筛选栏无处理状态筛选，操作列固定「查看专家意见」按钮：

  ```vue
  <template>
    <div class="consult-list-view">
      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="filter-items">
          <div class="filter-item">
            <span class="filter-label">咨询标题</span>
            <el-input v-model="filters.title" placeholder="请输入" clearable />
          </div>
          <div class="filter-item">
            <span class="filter-label">咨询秘书</span>
            <el-input v-model="filters.secretary" placeholder="请输入" clearable />
          </div>
          <div class="filter-item">
            <span class="filter-label">咨询专业</span>
            <el-select v-model="filters.specialty" placeholder="全部" clearable>
              <el-option v-for="s in SPECIALTIES" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
          </div>
        </div>
        <div class="filter-actions">
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
      </div>

      <!-- 表格区 -->
      <div class="table-section">
        <div class="table-title">
          <span>咨询案件列表&nbsp;&nbsp;<span class="title-count">共 {{ consultStore.applicantList.length }} 条</span></span>
        </div>
        <el-table :data="pagedData" style="width: 100%" v-loading="consultStore.loading">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="title" label="咨询标题" min-width="240" show-overflow-tooltip />
          <el-table-column prop="secretary" label="咨询秘书" width="100" />
          <el-table-column label="咨询专业" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ getSpecialtyLabel(row.specialty) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="goDetail(row)">查看专家意见</el-button>
            </template>
          </el-table-column>
          <template #empty>
            <CaseEmptyState text="暂无专家咨询记录" />
          </template>
        </el-table>

        <!-- 分页 -->
        <div v-if="consultStore.applicantList.length > 0" class="pagination-bar">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[5, 10, 20]"
            :total="consultStore.applicantList.length"
            layout="total, prev, pager, next, sizes"
            background
            small
          />
        </div>
      </div>
    </div>
  </template>

  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useConsultStore, SPECIALTIES, getSpecialtyLabel } from '@/stores/consult'
  import CaseEmptyState from '../shared/CaseEmptyState.vue'

  const router = useRouter()
  const consultStore = useConsultStore()

  const filters = ref({ title: '', secretary: '', specialty: '' })
  const currentPage = ref(1)
  const pageSize = ref(10)

  const pagedData = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return consultStore.applicantList.slice(start, start + pageSize.value)
  })

  const handleSearch = () => {
    currentPage.value = 1
    consultStore.fetchApplicantList(filters.value)
  }
  const handleReset = () => {
    filters.value = { title: '', secretary: '', specialty: '' }
    currentPage.value = 1
    consultStore.fetchApplicantList()
  }

  const goDetail = (row) => {
    router.push(`/cases/consult/${row.id}`)
  }

  onMounted(() => {
    consultStore.fetchApplicantList()
  })
  </script>
  ```

- [ ] **Step 2: 实现我的案件侧详情页 ConsultDetailView.vue（applicant 模式，只读）**

  替换 `src/views/cases/components/consult/ConsultDetailView.vue`。只展示 ConsultInfo + ConsultOpinion，无 ConsultEditor、无操作按钮：

  ```vue
  <template>
    <div class="consult-detail-view" v-loading="consultStore.loading">
      <!-- 不存在兜底 -->
      <CaseEmptyState v-if="!consultStore.currentDetail" text="咨询记录不存在" />

      <template v-else>
        <!-- 返回栏 + 标题 -->
        <div class="section-card detail-header">
          <div class="header-left">
            <el-button plain size="small" :icon="ArrowLeft" @click="goBack">返回</el-button>
            <span class="detail-title">{{ consultStore.currentDetail.title }}</span>
            <el-tag size="small">{{ getSpecialtyLabel(consultStore.currentDetail.specialty) }}</el-tag>
          </div>
          <div class="header-meta">
            关联案件：{{ consultStore.currentDetail.relatedCaseNo }}
          </div>
        </div>

        <!-- 区块1：咨询信息 -->
        <ConsultInfo :detail="consultStore.currentDetail" />

        <!-- 区块2：专家回复意见（申请人查看的核心内容） -->
        <ConsultOpinion :opinion="consultStore.currentDetail.opinion" />
      </template>
    </div>
  </template>

  <script setup>
  import { onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { ArrowLeft } from '@element-plus/icons-vue'
  import { useConsultStore, getSpecialtyLabel } from '@/stores/consult'
  import CaseEmptyState from '../shared/CaseEmptyState.vue'
  import ConsultInfo from '../shared/consult/ConsultInfo.vue'
  import ConsultOpinion from '../shared/consult/ConsultOpinion.vue'

  const route = useRoute()
  const router = useRouter()
  const consultStore = useConsultStore()

  const goBack = () => {
    router.push('/cases/consult')
  }

  onMounted(() => {
    consultStore.fetchDetail(route.params.id, 'applicant')
  })
  </script>

  <style scoped lang="scss">
  .detail-header {
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      .detail-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }
    .header-meta {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-top: 8px;
    }
  }
  </style>
  ```

- [ ] **Step 3: 预览验证**

  启动 dev server，登录后验证我的案件侧完整流程：
  - 访问 `/cases/consult`，显示筛选栏（**无处理状态筛选**）+ 表格 + 分页
  - 表格 5 条数据，操作列固定显示「查看专家意见」按钮
  - 点击「查看专家意见」进入 `/cases/consult/:id`，显示标题栏 + 咨询信息 + 专家回复意见
  - **无** ConsultEditor 编辑区，**无**操作按钮（只读）
  - 专家回复意见区块显示意见内容、附件、提交时间
  - 列表筛选：选「建设工程」显示 2 条；输入标题关键字过滤正常
  - 与待办侧详情页对比：同样复用 ConsultInfo + ConsultOpinion，但无第三区块

- [ ] **Step 4: 提交**

  ```bash
  git add src/views/cases/components/consult/ConsultListView.vue src/views/cases/components/consult/ConsultDetailView.vue
  git commit -m "feat(consult): 实现我的案件侧申请专家咨询案件列表与详情页（applicant 只读模式）"
  ```

---

## 阶段 7: 验收与样式扫描 (Acceptance & Style Scan)

**Files:**
- 无新增/修改，仅全链路验证

- [ ] **Step 1: 全链路功能验收**

  按设计文档 §10 验收标准逐条核对：
  1. 待办侧栏「专家咨询案件」菜单项 + badge 显示数字 4
  2. 我的案件侧栏「申请专家咨询案件」菜单项，无 badge
  3. 移动端下拉选择器含「申请专家咨询案件」选项
  4. 顶部水平主菜单仍为四项
  5. 待办侧列表含处理状态筛选 + 表格 + 分页
  6. 我的案件侧列表无处理状态筛选 + 表格 + 分页
  7. 待办侧操作列按状态联动（pending/unreplied/processed 三种）
  8. 我的案件侧操作列固定「查看专家意见」
  9. 详情页走新页面（非弹窗/抽屉）
  10. 详情页单栏纵向堆叠三区块（expert 模式）
  11. applicant 模式隐藏编辑区与操作按钮
  12. 签署弹窗可选线上签名 / 上传文件
  13. 线上签名模拟 GDCA loading + 声明承诺书文本摘要
  14. 上传文件支持下载模板 + 单文件上传
  15. 两种方式签署后选"回避"或"接受"，状态更新
  16. 提交意见可填写内容 + 附件，状态转为已处理
  17. 退出咨询二次确认，确认后返回列表
  18. 已处理状态详情页隐藏操作区
  19. 筛选/分页/空状态样式一致
  20. 未登录访问新路由重定向登录页

- [ ] **Step 2: 样式扫描**

  全局搜索新文件，确认无违规：
  - 无 13px / 15px 字号（grep `font-size: 1[35]px`）
  - 无 `border` prop 的 el-table（grep `<el-table` 检查无 `border` 属性）
  - 无禁用色值（grep 线框图色值 `#1e62ec` / `#1E62EC`，应使用 `var(--el-color-primary)`）

- [ ] **Step 3: 构建验证**

  运行 `npm run build`，确认无构建错误、无控制台警告（除已知第三方库警告）。

- [ ] **Step 4: 提交验收结果**

  ```bash
  git add -A
  git commit -m "chore(consult): 专家咨询模块全链路验收通过"
  ```

---

## 自检清单 (Self-Review)

**设计文档覆盖**：
- §1 概述/范围 → 阶段 1-7 全覆盖
- §2 信息架构 → 阶段 1 路由 + 阶段 3 侧栏
- §3 路由与文件结构 → 阶段 1
- §4 待办侧列表 → 阶段 5 Step 1
- §5 我的案件侧列表 → 阶段 6 Step 1
- §6 详情页（含签署/提交意见/退出） → 阶段 4 组件族 + 阶段 5/6 集成
- §7 数据模型与 Store → 阶段 2
- §8 MainLayout 集成 → 阶段 3
- §9 样式约束 → 阶段 7 样式扫描
- §10 验收标准 → 阶段 7 全链路验收

**类型/命名一致性**：
- `useConsultStore` 暴露的方法名在 store 定义、列表页调用、详情页调用中一致（fetchExpertList / fetchApplicantList / fetchDetail / submitSign / submitOpinion / exitConsult）
- `SPECIALTIES` / `STATUS_CONFIG` / `getSpecialtyLabel` / `getStatusConfig` 在 store 导出、组件 import 中一致
- 组件名 ConsultInfo / ConsultOpinion / ConsultEditor / SignCommitmentDialog 在创建与引用中一致
- `mode` 取值 'expert' / 'applicant' 在 fetchDetail 调用中一致

**无占位符**：所有步骤含完整代码，无 TBD/TODO。
