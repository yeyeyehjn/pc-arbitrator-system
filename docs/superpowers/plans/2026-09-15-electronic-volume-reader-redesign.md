# 电子卷宗页（材料阅览）重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `MaterialReaderView.vue` 从两栏占位页升级为「目录-预览-笔记」闭环的沉浸式电子卷宗阅读工作台（含组合筛选、划词批注、批量操作、证据关联/已读未读追踪）。

**Architecture:** 保持 `MaterialReaderView.vue` 为主容纳结构，将新增的纯逻辑拆为 4 个组合式 hook（`useMaterialFilters` / `useTextSelection` / `useNotes` / `useQuoteList`），统一放入 `src/views/cases/components/material-reader/`。数据层扩展 `caseDetail` store 的 `flattenEvidence`，为材料项补齐 `textSnippet` / `pageCount` / `readStatus` / `linkedEvidenceId`。预览区用 Mock 文本层承载划词选区，不引入 pdf.js。

**Tech Stack:** Vue3（Composition API）、Element Plus、Pinia、SCSS。

注意：本项目**无测试基建**（无 vitest / test 脚本 / eslint）。因此本计划不使用 TDD，每个任务的验收方式是「dev server 手测 + 具体操作步骤/预期」。全程遵守 [DESIGN.md](../../../DESIGN.md)。

## Global Constraints

- 字号严格用 16/14/12/10px；禁止 13px/15px。
- 不用 em dash「—」；文案用逗号/冒号/句号/括号。
- 复用全局类 `.filter-bar` / `.filter-item` / `.filter-label`（14px，宽 56px，左对齐），不在组件内重复定义。
- 筛选控件宽度 180px（下拉/数值可 120px）。
- 查询/重置按钮 12px，置于 `.filter-actions`。
- 表头 `border-bottom: none !important`；行底仅用 `--el-border-color-lighter` 1px。
- 局部侧栏 is-active 用 3px 主题色竖条（DESIGN.md 登记例外）；未选中卡片不得出现侧条 accent。
- 抽屉：移动端 ≤768px 非全屏 `el-drawer` 宽 `90% !important`，`el-dialog` 宽 `92% !important` + `margin: 5vh auto`。
- 空态复用 `CaseEmptyState` 风格；图标按钮必须带 `aria-label`。
- Hook 文件统一 `useXxx.js`，导出组合式 API；组件内 `setup` 顶层解构。

---

### Task 1: 数据层扩展与 flattenEvidence 增强

在 `caseDetail` store 稳定材料项结构，供后续 hook 消费。

**Files:**
- Modify: `src/stores/caseDetail.js`（`flattenEvidence` 仅在 `MaterialReaderView.vue` 内定义，见下）
- Modify: `src/views/cases/MaterialReaderView.vue:313-325`（`flattenEvidence`）

> 说明：`flattenEvidence` 是组件内函数，不跨组件复用；为最小改动，直接在组件内增强，不改为 store 方法。

**Interfaces:**
- Produces: 材料项对象新增字段 `textSnippet`（回退 `ev.content`）、`pageCount`（回退 `catalog.pages`）、`readStatus`（默认 `'unread'`）、`linkedEvidenceId`（= `ev.id`）。

- [ ] **Step 1: 修改 flattenEvidence**

将 `MaterialReaderView.vue` 内 `flattenEvidence` 的映射对象扩展：

```js
const flattenEvidence = (type) => {
  const list = type?.list || []
  const catalog = type?.catalog || []
  return list.flatMap((ev) =>
    (ev.files || []).map((f) => ({
      id: f.id,
      name: f.name,
      fileType: f.fileType || 'pdf',
      type: ev.name,
      submitDate: findCatalogDate(catalog, ev) || '暂无',
      pages: findCatalogPages(catalog, ev) || 1,
      textSnippet: ev.content || f.name,
      readStatus: 'unread',
      linkedEvidenceId: ev.id || null,
    })),
  )
}
```

同时新增 `findCatalogPages`（在 `findCatalogDate` 下）：

```js
const findCatalogPages = (catalog, ev) => {
  const item = (catalog || []).find((c) => c.name === ev.name)
  return item?.pages
}
```

对应 `MaterialReaderView.vue` 中 `flattenEvidence`、`findCatalogDate` 的现有实现（约 L313-331）整体替换为上述逻辑。

- [ ] **Step 2: `attachments` 分组补齐同构字段**

`catalogGroups` 里 `attachments` 项直接来自 store（`attachments.value`），其对象已有 `id/name/type/submitDate/fileType`，需补齐一致字段。在 `catalogGroups` computed 的 attachment 项后做一次映射：

```js
{ id: 'attachment', label: '其他附件', items: (attachments.value || []).map((a) => ({
  id: a.id, name: a.name, fileType: a.fileType || 'pdf', type: a.type,
  submitDate: a.submitDate || '暂无', pages: a.pages || 1,
  textSnippet: a.name, readStatus: 'unread', linkedEvidenceId: null,
})) },
```

- [ ] **Step 3: 手测验收**

Run: `npm run dev` 打开 http://localhost:5173/pc-arbitrator-system/cases/case-0/material-reader
- 目录各材料项仍正常展示，页数显示为真实目录页数（不再恒为 1）。
- 申请人证据「买卖合同」下 3 个文件项正常。

- [ ] **Step 4: Commit**

```bash
git add src/views/cases/MaterialReaderView.vue
git commit -m "feat(电子卷宗): 材料项扩充 textSnippet/pageCount/readStatus/linkedEvidenceId 字段"
```

---

### Task 2: useMaterialFilters 组合筛选 hook

实现 3 条件组合筛选 + 分组过滤，目录树可直接消费。

**Files:**
- Create: `src/views/cases/components/material-reader/useMaterialFilters.js`

**Interfaces:**
- Produces:
  - `filters` = `reactive({ submitter, fileType, dateRange })`，`submitter` 取值 `'all' | 'applicant' | 'respondent' | 'tribunal' | 'attachment'`，`fileType` 取值 `'all' | 'pdf' | 'image' | 'excel'`，`dateRange` = `'' 或 [start, end]`。
  - `filteredGroups(groupKey)` = `(groups) => groups` 过滤后的分组数组（含空组剔除）。
  - `resetFilters()` 重置三条件。
  - `groupIdFromSubmitter(submitterValue)` 映射提交主体到分组 id。

- [ ] **Step 1: 创建 hook**

```js
import { reactive, computed } from 'vue'

const SUBMITTER_TO_GROUP = {
  all: null, applicant: 'applicant', respondent: 'respondent',
  tribunal: 'tribunal', attachment: 'attachment',
}

export function useMaterialFilters() {
  const filters = reactive({ submitter: 'all', fileType: 'all', dateRange: '' })

  const resetFilters = () => {
    filters.submitter = 'all'
    filters.fileType = 'all'
    filters.dateRange = ''
  }

  const matchesItem = (item) => {
    if (filters.fileType !== 'all' && (item.fileType || '').toLowerCase() !== filters.fileType) return false
    if (filters.dateRange) {
      const d = item.submitDate
      if (d && d !== '暂无') {
        const [s, e] = filters.dateRange
        if (s && d < s) return false
        if (e && d > e) return false
      }
    }
    return true
  }

  const filteredGroups = (groups) =>
    groups
      .filter((g) => (filters.submitter === 'all' ? true : g.id === SUBMITTER_TO_GROUP[filters.submitter]))
      .map((g) => ({ ...g, items: g.items.filter(matchesItem) }))
      .filter((g) => g.items.length > 0)

  const groupIdFromSubmitter = (v) => SUBMITTER_TO_GROUP[v]

  return { filters, resetFilters, filteredGroups, groupIdFromSubmitter }
}
```

注意：沿用现有 `searchKeyword` 逻辑；若同时启用搜索，调用方把 `filteredGroups(searchFilteredGroups)` 串联（见 Task 5）。

- [ ] **Step 2: 手测验收（暂接入后由 Task 5 验证）**

自测为本 hook 提供脚本级验证不可行（无框架），验收并入 Task 5 统验。

- [ ] **Step 3: Commit**

```bash
git add src/views/cases/components/material-reader/useMaterialFilters.js
git commit -m "feat(电子卷宗): useMaterialFilters 组合筛选 hook"
```

---

### Task 3: useTextSelection 划词选区 hook

捕获选中文本、定位浮动工具条、按段落与 offset 记录选区。

**Files:**
- Create: `src/views/cases/components/material-reader/useTextSelection.js`

**Interfaces:**
- Produces:
  - `selection` = `reactive({ active, text, startOffset, endOffset, paragraphId, x, y })`
  - `onSelect(containerEl, materialId)` 绑定容器 `mouseup` / `keyup`，读取 `window.getSelection()`。
  - `clearSelection()` 主动清除选区。
  - `escapeBound` = `onKeydown` 处理 Escape 关闭浮动条。

- [ ] **Step 1: 创建 hook**

```js
import { reactive } from 'vue'

export function useTextSelection() {
  const selection = reactive({
    active: false, text: '', startOffset: 0, endOffset: 0,
    paragraphId: '', x: 0, y: 0,
  })

  const getParagraphId = (node) => {
    const p = node && node.nodeType === 1 ? node : node?.parentElement
    return p && p.dataset?.para ? p.dataset.para : ''
  }

  const onSelect = (containerEl) => {
    const sel = window.getSelection()
    const text = sel?.toString().trim() || ''
    if (!text || !containerEl) { selection.active = false; return }
    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    selection.active = true
    selection.text = text
    selection.startOffset = range.startOffset
    selection.endOffset = range.endOffset
    selection.paragraphId = getParagraphId(range.startContainer)
    selection.x = rect.left
    selection.y = rect.top
  }

  const clearSelection = () => {
    selection.active = false
    selection.text = ''
  }

  const onKeydown = (e) => {
    if (e.key === 'Escape') clearSelection()
  }

  return { selection, onSelect, clearSelection, onKeydown }
}
```

`textSnippet` 渲染时每段需带 `data-para`（见 Task 6），供定位。

- [ ] **Step 2: 手测验收**（并入 Task 6 统验，本任务仅落文件）

- [ ] **Step 3: Commit**

```bash
git add src/views/cases/components/material-reader/useTextSelection.js
git commit -m "feat(电子卷宗): useTextSelection 划词选区 hook"
```

---

### Task 4: useNotes 与 useQuoteList 笔记/引用 hook

管理材料笔记、划词批注、引用清单。

**Files:**
- Create: `src/views/cases/components/material-reader/useNotes.js`
- Create: `src/views/cases/components/material-reader/useQuoteList.js`

**Interfaces:**
- useNotes Produces:
  - `notes` = `ref([])`: `{ id, materialId, page, content, createdAt }`
  - `annotations` = `ref([])`: `{ id, materialId, page, startOffset, endOffset, text, highlight, comment, pinned }`
  - `addNote(materialId, page, content)`
  - `addAnnotation({ materialId, page, startOffset, endOffset, text, comment })`
  - `toggleHighlight(materialId, selection)`（把当前选区加为高亮注）
  - `removeAnnotation(id)` / `removeNote(id)`
  - `notesForMaterial(materialId)` / `annotationsForMaterial(materialId)`
- useQuoteList Produces:
  - `quoteList` = `ref([])`: `{ id, materialId, materialName, caseNo, page, excerpt, createdAt }`
  - `addQuote({ materialId, materialName, caseNo, page, excerpt })`
  - `removeQuote(id)`
  - `copyQuote(item)`（`navigator.clipboard.writeText`）

- [ ] **Step 1: 创建 useNotes.js**

```js
import { ref } from 'vue'

let nSeq = 1
export function useNotes() {
  const notes = ref([])
  const annotations = ref([])

  const addNote = (materialId, page, content) => {
    if (!content?.trim()) return
    notes.value.push({ id: `n-${nSeq++}`, materialId, page, content, createdAt: Date.now() })
  }
  const removeNote = (id) => { notes.value = notes.value.filter((x) => x.id !== id) }

  const addAnnotation = (a) => annotations.value.push({ id: `a-${nSeq++}`, ...a })
  const toggleHighlight = (materialId, sel) => {
    const existing = annotations.value.findIndex(
      (x) => x.materialId === materialId && x.startOffset === sel.startOffset && x.endOffset === sel.endOffset,
    )
    if (existing >= 0) { annotations.value.splice(existing, 1); return }
    addAnnotation({ materialId, page: 1, startOffset: sel.startOffset, endOffset: sel.endOffset, text: sel.text, highlight: true, comment: '', pinned: false })
  }
  const removeAnnotation = (id) => { annotations.value = annotations.value.filter((x) => x.id !== id) }

  const notesForMaterial = (id) => notes.value.filter((x) => x.materialId === id)
  const annotationsForMaterial = (id) => annotations.value.filter((x) => x.materialId === id)

  return { notes, annotations, addNote, removeNote, addAnnotation, toggleHighlight, removeAnnotation, notesForMaterial, annotationsForMaterial }
}
```

- [ ] **Step 2: 创建 useQuoteList.js**

```js
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

let qSeq = 1
export function useQuoteList() {
  const quoteList = ref([])
  const addQuote = (info) => quoteList.value.push({ id: `q-${qSeq++}`, ...info, createdAt: Date.now() })
  const removeQuote = (id) => { quoteList.value = quoteList.value.filter((x) => x.id !== id) }
  const copyQuote = async (item) => {
    const text = `【${item.caseNo}】${item.materialName} 第${item.page}页：${item.excerpt}`
    try { await navigator.clipboard.writeText(text); ElMessage.success('已复制引用') }
    catch { ElMessage.warning('复制失败，请手动选择复制') }
  }
  return { quoteList, addQuote, removeQuote, copyQuote }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/views/cases/components/material-reader/useNotes.js src/views/cases/components/material-reader/useQuoteList.js
git commit -m "feat(电子卷宗): useNotes/useQuoteList 笔记批注与引用 hook"
```

---

### Task 5: MaterialReaderView 布局重构（目录-预览即时联动 + 收纳式筛选）

把现有「封面态跳预览」改为「点目录项即时渲染」，并在目录头部接入收纳式筛选 + 标题行展开折叠按钮。

**Files:**
- Modify: `src/views/cases/MaterialReaderView.vue`

**Interfaces:**
- Consumes: `useMaterialFilters`（Task 2）、`useTextSelection`（Task 3）、`useNotes` / `useQuoteList`（Task 4）。
- Produces: `activeMaterial`（选中材料）、`viewMode`（`'cover' | 'preview'`）、`filterPanelOpen`、`selectedIds`、`notesPanelVisible`。

- [ ] **Step 1: 注入 hook 与目录点击联动**

在 `<script setup>` 引入并初始化：

```js
import { useMaterialFilters } from './components/material-reader/useMaterialFilters'
import { useTextSelection } from './components/material-reader/useTextSelection'
import { useNotes } from './components/material-reader/useNotes'
import { useQuoteList } from './components/material-reader/useQuoteList'

const { filters, resetFilters, filteredGroups: applyFilters, groupIdFromSubmitter } = useMaterialFilters()
const { selection, onSelect, clearSelection, onKeydown } = useTextSelection()
const { notes, annotations, addNote, removeNote, addAnnotation, toggleHighlight, removeAnnotation, notesForMaterial, annotationsForMaterial } = useNotes()
const { quoteList, addQuote, removeQuote, copyQuote } = useQuoteList()

const filterPanelOpen = ref(false)
const notesPanelVisible = ref(false)
const selectedIds = ref(new Set())
```

将现有 `filteredCatalogGroups` computed 串联搜索 + 组合筛选：

```js
const searchFiltered = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  const groups = catalogGroups.value
  if (!kw) return groups
  return groups.map((g) => ({ ...g, items: g.items.filter((it) => (it.name || '').toLowerCase().includes(kw)) })).filter((g) => g.items.length > 0)
})
const filteredCatalogGroups = computed(() => applyFilters(searchFiltered.value))
```

- [ ] **Step 2: 目录项即时渲染（去封面跳转）**

`selectMaterial` 改为直接渲染：

```js
const selectMaterial = (group, item) => {
  activeGroup.value = group.id
  activeMaterial.value = item
  item.readStatus = 'read'
  viewMode.value = 'preview'
  splitMode.value = false
  summaryVisible.value = false
  caseInfoVisible.value = false
  notesPanelVisible.value = false
  const exist = openTabs.value.find((t) => t.id === item.id)
  if (!exist) openTabs.value.push({ id: item.id, name: item.name, group: group.id, material: item })
  activeTabId.value = item.id
  clearSelection()
}
```

- [ ] **Step 3: 目录标题行 + 收纳式筛选 UI**

在目录 `sidebar-inner` 内、`sidebar-search` 上/下插入：

```vue
<!-- 目录标题行增加展开/折叠/收起 -->
<div class="sidebar-title-row">
  <span class="sidebar-title">材料目录</span>
  <div class="sidebar-title-actions">
    <el-tooltip content="展开全部" placement="bottom">
      <el-button size="small" link :icon="Expand" aria-label="展开全部" @click="expandAll" />
    </el-tooltip>
    <el-tooltip content="折叠全部" placement="bottom">
      <el-button size="small" link :icon="Fold" aria-label="折叠全部" @click="collapseAll" />
    </el-tooltip>
    <el-tooltip content="收起目录" placement="bottom">
      <el-button size="small" link :icon="DArrowLeft" aria-label="收起目录" @click="collapseSidebar" />
    </el-tooltip>
  </div>
</div>

<!-- 组合筛选：收纳式 -->
<div class="sidebar-filter">
  <button class="filter-toggle" type="button" aria-label="组合筛选" @click="filterPanelOpen = !filterPanelOpen">
    组合筛选 <el-icon><ArrowDown v-if="filterPanelOpen" /><ArrowRight v-else /></el-icon>
  </button>
  <div v-show="filterPanelOpen" class="filter-panel">
    <div class="filter-item"><span class="filter-label">提交主体</span>
      <el-select v-model="filters.submitter" size="small" style="width:120px">
        <el-option label="全部" value="all" />
        <el-option label="申请人" value="applicant" />
        <el-option label="被申请人" value="respondent" />
        <el-option label="庭依职权" value="tribunal" />
        <el-option label="其他附件" value="attachment" />
      </el-select>
    </div>
    <div class="filter-item"><span class="filter-label">文件类型</span>
      <el-select v-model="filters.fileType" size="small" style="width:120px">
        <el-option label="全部" value="all" />
        <el-option label="PDF" value="pdf" />
        <el-option label="图片" value="image" />
        <el-option label="Excel" value="excel" />
      </el-select>
    </div>
    <div class="filter-item"><span class="filter-label">提交日期</span>
      <el-date-picker v-model="filters.dateRange" type="daterange" size="small" value-format="YYYY-MM-DD" start-placeholder="开始" end-placeholder="结束" style="width:180px" />
    </div>
    <div class="filter-actions">
      <el-button size="small" @click="resetFilters">重置</el-button>
    </div>
  </div>
</div>
```

- [ ] **Step 4: 目录项复选框 + 已读/未读 tag**

在 `catalog-item` 内、图标前加复选框，名称后加未读 tag：

```vue
<div class="catalog-item" :class="{ active: activeMaterial?.id === item.id }" @click="selectMaterial(group, item)">
  <el-checkbox :model-value="selectedIds.has(item.id)" size="small" @click.stop @change="(v) => toggleSelect(item, v)" aria-label="选择材料" />
  <el-icon><Document /></el-icon>
  <span class="item-name" :title="item.name">{{ item.name }}</span>
  <span v-if="item.fileType" class="item-type">{{ item.fileType.toUpperCase() }}</span>
  <span v-if="item.readStatus === 'unread'" class="unread-tag">未读</span>
</div>
```

```js
const toggleSelect = (item, v) => {
  const s = new Set(selectedIds.value)
  if (v) s.add(item.id); else s.delete(item.id)
  selectedIds.value = s
}
```

- [ ] **Step 5: 手测验收**

Run: `npm run dev`，材料阅读页。
- 点目录任一材料项 → 即时进入预览态渲染该材料，无需点卡片。
- 组合筛选：切换提交主体/文件类型/日期区间，目录项相应过滤；点重置还原全量。
- 目录可展开全部 / 折叠全部 / 收起成窄条。
- 勾选目录项出现选中效果；未读材料显示「未读」小 tag；打开后 tag 消失。

- [ ] **Step 6: Commit**

```bash
git add src/views/cases/MaterialReaderView.vue
git commit -m "feat(电子卷宗): 目录即时渲染联动 + 收纳式组合筛选 + 复选框/已读未读"
```

---

### Task 6: Mock 文本渲染层 + 划词高亮与侧条批注

替换 `pdf-placeholder` 为可选中 mock 文本，接入浮动工具条（高亮/批注/引用）与侧条批注锚点。

**Files:**
- Modify: `src/views/cases/MaterialReaderView.vue`（预览态 `preview-pane` 内）

**Interfaces:**
- Consumes: `activeMaterial`、`selection` / `onSelect` / `clearSelection` / `onKeydown`（Task 3）、`toggleHighlight` / `addAnnotation`（Task 4）、`addQuote` / `quoteList`（Task 4）、`caseInfo.caseNo`。

- [ ] **Step 1: 渲染文本层与浮动工具条**

将 `pdf-placeholder` 内容替换为：

```vue
<div
  v-if="activeMaterial"
  class="text-layer"
  @mouseup="onSelect($event.currentTarget)"
  @keyup="onSelect($event.currentTarget)"
  @keydown="onKeydown"
  tabindex="0"
>
  <p data-para="p1">{{ activeMaterial.textSnippet }}</p>
  <transition name="fade">
    <div v-if="selection.active" class="floating-toolbar" :style="{ left: selection.x + 'px', top: (selection.y - 40 < 0 ? 8 : selection.y - 40) + 'px' }">
      <el-button size="small" @click="doHighlight">高亮</el-button>
      <el-button size="small" @click="doAnnotate">批注</el-button>
      <el-button size="small" @click="doQuote">引用</el-button>
    </div>
  </transition>
</div>
```

- [ ] **Step 2: 动作实现**

```js
const doHighlight = () => {
  toggleHighlight(activeMaterial.value.id, { startOffset: selection.startOffset, endOffset: selection.endOffset, text: selection.text })
  clearSelection()
  notesPanelVisible.value = true
  ElMessage.success('已高亮')
}
const doAnnotate = () => {
  addAnnotation({ materialId: activeMaterial.value.id, page: 1, startOffset: selection.startOffset, endOffset: selection.endOffset, text: selection.text, highlight: false, comment: '', pinned: true })
  clearSelection()
  notesPanelVisible.value = true
}
const doQuote = () => {
  addQuote({ materialId: activeMaterial.value.id, materialName: activeMaterial.value.name, caseNo: caseInfo.value.caseNo, page: 1, excerpt: selection.text })
  clearSelection()
  notesPanelVisible.value = true
  ElMessage.success('已收录引用')
}
```

- [ ] **Step 3: 侧条批注锚点渲染**

文本层右侧绘出批注锚点（`annotationsForMaterial(activeMaterial.id)` 中 `pinned` 为 true 的项），每项一个小圆点，点击弹出批注内容：

```vue
<div class="annotation-rail">
  <div
    v-for="ann in annotationsForMaterial(activeMaterial?.id)"
    :key="ann.id"
    class="annotation-dot"
    :title="ann.text"
    @click="activeAnnotation = ann"
  />
</div>
```

- [ ] **Step 4: 手测验收**

Run: dev server。
- 预览区显示可选中文本；拖动选中出现「高亮/批注/引用」浮动条。
- 点高亮 → 右侧笔记抽屉出现该高亮记录，`annotations` 归集正确。
- 点批注 → 侧条出现锚点，点击可显示批注文本。
- 点引用 → 引用清单新增条目含案号/材料/页码/摘录。
- 切换材料后批注/高亮不串写到其他材料。

- [ ] **Step 5: Commit**

```bash
git add src/views/cases/MaterialReaderView.vue
git commit -m "feat(电子卷宗): mock文本层划词高亮/批注/引用交互"
```

---

### Task 7: 笔记抽屉（材料笔记 + 本材料记录 + 引用清单）

实现右侧笔记抽屉三区块，含复制引用。

**Files:**
- Modify: `src/views/cases/MaterialReaderView.vue`

**Interfaces:**
- Consumes: `notesPanelVisible`、`notes` / `annotations` / `addNote` / `removeNote` / `removeAnnotation` / `notesForMaterial` / `annotationsForMaterial`、`quoteList` / `removeQuote` / `copyQuote`。

- [ ] **Step 1: 插入笔记抽屉模板（预览主体 right 侧）**

```vue
<transition name="slide-summary">
  <div v-if="notesPanelVisible" class="notes-panel">
    <div class="notes-header">
      <span class="notes-title">阅卷笔记</span>
      <el-button size="small" :icon="Close" link aria-label="关闭笔记" @click="notesPanelVisible = false" />
    </div>
    <div class="notes-body">
      <section class="notes-section">
        <h4 class="notes-sec-title">材料笔记</h4>
        <div v-if="!notesForMaterial(activeMaterial?.id).length" class="notes-empty">该材料暂无笔记</div>
        <div v-for="n in notesForMaterial(activeMaterial?.id)" :key="n.id" class="note-item">
          <span class="note-content">{{ n.content }}</span>
          <el-button size="small" link :icon="Delete" aria-label="删除笔记" @click="removeNote(n.id)">删除</el-button>
        </div>
        <div class="note-input">
          <el-input v-model="newNote" size="small" placeholder="记一条笔记..." @keyup.enter="submitNote" />
          <el-button size="small" type="primary" @click="submitNote">保存</el-button>
        </div>
      </section>
      <section class="notes-section">
        <h4 class="notes-sec-title">划词/批注</h4>
        <div v-for="a in annotationsForMaterial(activeMaterial?.id)" :key="a.id" class="ann-item">
          <span class="ann-text">{{ a.text }}</span>
          <el-button size="small" link :icon="Delete" aria-label="删除批注" @click="removeAnnotation(a.id)">删除</el-button>
        </div>
      </section>
      <section class="notes-section">
        <h4 class="notes-sec-title">引用清单</h4>
        <div v-if="!quoteList.length" class="notes-empty">暂无引用</div>
        <div v-for="q in quoteList" :key="q.id" class="quote-item">
          <div class="quote-meta">【{{ q.caseNo }}】{{ q.materialName }} 第{{ q.page }}页</div>
          <div class="quote-excerpt">{{ q.excerpt }}</div>
          <el-button size="small" link :icon="CopyDocument" aria-label="复制引用" @click="copyQuote(q)">复制</el-button>
          <el-button size="small" link :icon="Delete" aria-label="删除引用" @click="removeQuote(q.id)">删除</el-button>
        </div>
      </section>
    </div>
  </div>
</transition>
```

- [ ] **Step 2: 注数据与方法**

```js
const newNote = ref('')
const submitNote = () => {
  if (!activeMaterial.value?.id) return
  addNote(activeMaterial.value.id, 1, newNote.value)
  newNote.value = ''
}
```

- [ ] **Step 3: 笔记抽屉与现有摘要/案件信息侧栏互斥**

`toggleSummary` / `toggleCaseInfo` 增加关闭笔记抽屉：

```js
const toggleSummary = () => {
  summaryVisible.value = !summaryVisible.value
  if (summaryVisible.value) { caseInfoVisible.value = false; notesPanelVisible.value = false }
}
const toggleCaseInfo = () => {
  caseInfoVisible.value = !caseInfoVisible.value
  if (caseInfoVisible.value) { summaryVisible.value = false; notesPanelVisible.value = false }
}
```

新增工具条「笔记」按钮：

```vue
<el-button size="small" :icon="Notebook" @click="notesPanelVisible = !notesPanelVisible">笔记</el-button>
```

- [ ] **Step 4: 手测验收**

Run: dev server。
- 预览态点工具栏「笔记」→ 右侧弹出笔记抽屉（默认收起，不占三栏）。
- 三区块正常：材料笔记可新增/删除；划词批注列表；引用清单含案号/材料/页码/摘录。
- 引用项「复制」写入剪贴板并提示"已复制引用"。
- 打开笔记时开摘要/案件信息会互斥关闭。
- ≤768px 时笔记抽屉宽度适配（90% 全宽覆盖）。

- [ ] **Step 5: Commit**

```bash
git add src/views/cases/MaterialReaderView.vue
git commit -m "feat(电子卷宗): 阅卷笔记抽屉（笔记/批注/引用清单）"
```

---

### Task 8: 批量操作 + 关联质证标记落地

工具条批量按钮（导出/打印/全选下载）+ 预览卡片 meta 的关联质证标记。

**Files:**
- Modify: `src/views/cases/MaterialReaderView.vue`

**Interfaces:**
- Consumes: `selectedIds`（Task 5）、`linkedEvidenceId`（材料字段）、`toggleSelect`（Task 5）。

- [ ] **Step 1: 工具条批量操作（勾选后显示）**

预览工具条 `toolbar-left` 后新增：

```vue
<div v-if="selectedIds.size > 0" class="toolbar-batch">
  <span class="batch-count">已选 {{ selectedIds.size }} 项</span>
  <el-button size="small" @click="batchExport">批量导出</el-button>
  <el-button size="small" @click="batchPrint">打印</el-button>
  <el-button size="small" @click="batchDownload">全选下载</el-button>
</div>
```

```js
const selectedMaterials = computed(() => allMaterials.value.filter((it) => selectedIds.value.has(it.id)))
const batchNames = () => selectedMaterials.value.map((m) => m.name).join('、')
const batchExport = () => ElMessage.success(`已批量导出：${batchNames()}`)
const batchPrint = () => ElMessage.success(`开始打印 ${selectedIds.value.size} 份材料`)
const batchDownload = () => ElMessage.success(`开始下载 ${selectedIds.value.size} 份材料`)
```

`allMaterials` 已存在（Task 5 环境沿用）。

- [ ] **Step 2: 预览/封面卡片 meta 关联质证标记**

`cover-card` 的 `.cover-meta` 前新增关联标记；预览态工具条 center 当前材料名后也提示：

```vue
<div v-if="item.linkedEvidenceId" class="link-badge" title="关联质证对象">关联质证</div>
<div v-if="activeMaterial?.linkedEvidenceId" class="link-badge" title="关联质证对象">关联质证</div>
```

- [ ] **Step 3: 手测验收**

Run: dev server。
- 目录勾选 ≥1 项 → 工具条出现「已选 N 项 + 批量导出/打印/全选下载」，点击有 ElMessage 反馈。
- 封面卡片 / 预览态对有 `linkedEvidenceId` 的材料显示「关联质证」标记。
- 未勾选时批量按钮不显示。

- [ ] **Step 4: Commit**

```bash
git add src/views/cases/MaterialReaderView.vue
git commit -m "feat(电子卷宗): 批量导出/打印/下载 + 关联质证标记"
```

---

### Task 9: 样式落地与移动端适配

补齐新 UI 的 scoped 样式，遵循 DESIGN.md，含 ≤768px 适配。

**Files:**
- Modify: `src/views/cases/MaterialReaderView.vue`（样式块）
- Modify: `docs/superpowers/specs/2026-09-15-electronic-volume-reader-redesign-design.md`（如新增 token 需登记）

**Interfaces:**
- Styles for: `.sidebar-filter`/`.filter-toggle`/`.filter-panel`、`.unread-tag`、`.text-layer`/`.floating-toolbar`/`.annotation-rail`/`.annotation-dot`、`.notes-panel`、`.toolbar-batch`/`.link-badge`、`.slide-summary` 过渡复用。

- [ ] **Step 1: 新增 scoped 样式**

```scss
.sidebar-filter { padding: 8px 12px; border-bottom: 1px solid var(--el-border-color-lighter);
  .filter-toggle { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 4px 0; background: none; border: none; font-size: 12px; color: var(--el-text-color-secondary); cursor: pointer; }
  .filter-panel { margin-top: 8px; display: flex; flex-direction: column; gap: 6px;
    .filter-item { display: flex; align-items: center; gap: 8px;
      .filter-label { width: 56px; flex-shrink: 0; font-size: 14px; color: var(--el-text-color-regular); text-align: left; } } }
  .filter-actions { display: flex; justify-content: flex-end; margin-top: 4px; }
}
.unread-tag { font-size: 10px; color: #fff; background-color: var(--el-color-primary); border-radius: 3px; padding: 1px 4px; flex-shrink: 0; }

.text-layer { flex: 1; overflow-y: auto; padding: 24px 32px; font-size: 14px; line-height: 2; color: var(--el-text-color-regular); cursor: text;
  p { margin: 0; white-space: pre-wrap; } }
.floating-toolbar { position: absolute; z-index: 20; display: flex; gap: 4px; background: #fff; border: 1px solid var(--el-border-color-light); border-radius: 4px; padding: 2px; box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
.annotation-rail { position: absolute; right: 4px; top: 0; bottom: 0; width: 8px;
  .annotation-dot { width: 8px; height: 8px; margin: 8px 0; border-radius: 50%; background-color: var(--app-color-accent, #f59e0b); cursor: pointer; } }

.notes-panel { position: absolute; top: 0; right: 0; bottom: 0; width: 320px; background: #fff; border-left: 1px solid var(--el-border-color-light); box-shadow: -4px 0 12px rgba(0,0,0,0.06); display: flex; flex-direction: column; z-index: 10;
  .notes-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--el-border-color-lighter);
    .notes-title { font-size: 14px; font-weight: 600; color: var(--el-text-color-regular); } }
  .notes-body { flex: 1; overflow-y: auto; padding: 12px 16px; display: flex; flex-direction: column; gap: 16px;
    .notes-section { .notes-sec-title { font-size: 12px; color: var(--el-text-color-secondary); margin: 0 0 8px; } .notes-empty { font-size: 12px; color: var(--el-text-color-placeholder); padding: 8px 0; }
      .note-item, .ann-item, .quote-item { display: flex; align-items: flex-start; gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--el-border-color-lighter); font-size: 12px; color: var(--el-text-color-regular); }
      .quote-meta { font-size: 12px; color: var(--el-text-color-secondary); } .quote-excerpt { font-size: 12px; color: var(--el-text-color-regular); flex: 1; }
      .note-input { display: flex; gap: 6px; margin-top: 8px; } } } }

.toolbar-batch { display: inline-flex; align-items: center; gap: 4px; padding: 0 8px; border-left: 1px solid var(--el-border-color-lighter);
  .batch-count { font-size: 12px; color: var(--el-text-color-secondary); } }
.link-badge { font-size: 10px; color: #fff; background-color: var(--app-color-accent, #f59e0b); border-radius: 3px; padding: 1px 5px; display: inline-block; }
```

- [ ] **Step 2: 移动端适配（≤768px，追加到现有 media query）**

```scss
@mmedia += {
  .notes-panel { width: 100% !important; }
  .floating-toolbar { position: fixed; }
}
```

> 在文件现有 `@media (max-width: 768px)` 块内追加以上两条；`.notes-panel` 全宽覆盖，浮动条改 fixed 避免溢出。

- [ ] **Step 3: 全量回归手测**

Run: `npm run dev`。
- PC 与 ≤768px 两态：目录可折叠、筛选收纳、目录即时渲染、划词高亮/批注/引用、笔记抽屉、批量操作、关联标记、已读未读均正常。
- 检查设计合规（无 13/15px、字号刻度正确、空态、aria-label）。
- 构建冒烟：`npm run build` 应通过。

- [ ] **Step 4: Commit**

```bash
git add src/views/cases/MaterialReaderView.vue
git commit -m "feat(电子卷宗): 新组件样式落地 + 移动端适配 + 全量回归"
```

---

## 自审记录

- **Spec 覆盖**：D1 布局（Task 5/6/7，目录即时渲染 + 笔记抽屉）；D2 收纳筛选（Task 2/5）；D3 笔记+划词（Task 4/6/7）；D4 mock 文本（Task 6）；D5 引用程度1（Task 4/6/7，仅收录+复制，不写文档）；D6 批量+标记分拆（Task 5/8）。信息架构各区块均有对应任务。
- **无占位符**：所有代码步骤给出真实实现；无 TBD/TODO。
- **类型一致性**：`selection`（Task 3）字段 `startOffset/endOffset/text` 被 Task 4 `toggleHighlight`、Task 6 `doHighlight` 消费；`quoteList` 项字段 `caseNo/materialName/page/excerpt` 与 Task 4/7 一致；`linkedEvidenceId`、`readStatus` 在 Task 1 定义、Task 5/8 消费；`selectedIds`（Task 5）被 Task 8 消费，钩子名 `toggleSelect` 全篇一致。
- **测试说明**：项目无测试基建，测试步骤统一为 dev server 手测验收；hook 逻辑集中、便于后续若引入 vitest 时补单测。