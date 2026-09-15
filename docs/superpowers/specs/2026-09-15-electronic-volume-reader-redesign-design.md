# 电子卷宗页（材料阅览）重构 · 设计规范

> 版本：V1.0 · 日期：2026-09-15
> 模块：`/cases/:id/material-reader`（`MaterialReaderView.vue`）
> 目标：把纯占位的材料阅览页升级为贴近真实仲裁办案的沉浸式电子卷宗阅读工作台，在不引入真实 PDF 渲染的前提下跑通「目录-预览-笔记」核心闭环，面向体验评审与演示。

## 1. 背景与问题

现状 [MaterialReaderView.vue](../../../src/views/cases/MaterialReaderView.vue) 是两栏结构（左目录 + 右封面网格/PDF 占位），存在以下可优化点：

1. **目录与阅读割裂**：封面态需先选组、再点卡片才进入预览态，点卡片是"切页"而非"即时渲染"，打断阅读。
2. **搜索筛选单一**：仅有"搜索材料名称"输入框，无提交主体 / 文件类型 / 提交日期组合筛选。
3. **缺"边看边记"能力**：无笔记、划词高亮、批注、"引用至裁决书"入口，无法支撑仲裁员核心阅卷场景。
4. **缺批量能力**：无批量导出 / 打印 / 全选下载。
5. **缺证据关联与已读/未读追踪**：无法标识材料的质证关联对象和复核进度。

## 2. 目标

- 用 **Mock 文本渲染层** 替代 PDF 占位，支撑划词高亮、侧条批注、引用清单的完整交互闭环（技术决策：不引入 pdf.js）。
- 让 **目录点击即时渲染** 预览，消除封面/预览切页跳转感。
- 落地组合筛选、批量操作、证据关联标记、已读/未读追踪四大增强。
- 全程遵循 [DESIGN.md](../../../DESIGN.md) 的 token、组件类与禁令。

## 3. 已确认的决策记录

| # | 决策点 | 选定方案 | 说明 |
|---|--------|----------|------|
| D1 | 整体布局 | **C · 可变分栏** | 左可折叠目录 + 中预览区；右侧笔记独立抽屉（非三栏常驻） |
| D2 | 筛选组织 | **A · 收纳式** | 搜索 + 折叠式组合筛选行 + 标题行展开折叠按钮 |
| D3 | 笔记深度 | **C · 材料笔记 + 划词批注** | 材料/页码级笔记 + 文档内划词高亮 + 侧条批注 |
| D4 | 文本基础 | **路线 1 · Mock 文本渲染层** | 每份材料渲染可选中 mock 文本，承载选区/高亮/批注，不引入 pdf.js |
| D5 | 引用能力 | **程度 1** | 划词/批注可"引用"，收录进右侧引用清单（带案号/材料/页码/段落），可复制带出 |
| D6 | 批量+标记落位 | **B · 分拆** | 复选框/批量在目录栏；「关联质证」标记在预览卡 meta；已读/未读在目录项 |

## 4. 信息架构

```
材料阅览页（可变分栏）
├── 顶部栏（保留现有）案号 + 基本信息 + 关闭
├── 左侧：材料目录（可折叠收起成窄条）
│   ├── 标题行：材料目录 + 展开全部 / 折叠全部 / 收起目录
│   ├── 搜索框（保留）
│   └── 组合筛选（收纳式，点开展开）
│       ├── 提交主体（申请人 / 被申请人 / 庭依职权 / 其他附件 / 全部）
│       ├── 文件类型（PDF / 图片 / Excel / 全部）
│       └── 提交日期（单日 / 区间，可选）
│   └── 目录树分组（申请人/被申请人/庭依职权/其他附件）
│       ├── 分组标题：名称 + 数量（现有）
│       └── 材料项：复选框 + 图标 + 名称 + 类型 + 已读/未读小 tag
├── 中部：预览区
│   ├── 封面态：分组下所有材料第一页缩略卡片（保留），卡片 meta 增加「关联质证」标记
│   └── 预览态：
│       ├── 便签页 tabs（保留）
│       ├── 工具条：返回目录 / 上一份 / 下一份 + 案件信息 / 双屏 / 摘要 / 验签 / 下载 / 全屏 / OCR
│       │   └── （勾选后）批量导出 / 打印 / 全选下载
│       ├── Mock 文本渲染层（原 pdf-placeholder 替换）
│       │   ├── 可选中 mock 文本，支持划词高亮 + 浮动工具条（高亮/批注/引用）
│       │   └── 侧条批注锚点
│       └── 摘要侧栏（现有） / 案件信息侧栏（现有）
└── 右侧：笔记抽屉（预览工具条「笔记」按钮唤起，非三栏常驻）
    ├── 材料级笔记（整份 / 按页码）
    ├── 本材料记录（划词高亮 + 侧条批注列表）
    └── 引用清单（带案号/材料/页码/段落，支持复制带出）
```

## 5. 组件设计

### 5.1 MaterialReaderView.vue（重构主组件）

维持单文件承载，内部按区域组织 template 与 scoped style。新增与调整的状态：

| 状态 | 类型 | 说明 |
|------|------|------|
| `filterPanelOpen` | `ref(false)` | 组合筛选行展开态 |
| `filters` | `reactive` | `{ submitter, fileType, dateRange }` |
| `selectedIds` | `ref(Set)` | 批量勾选的材料 id 集合 |
| `notes` | `ref([])` | 材料级笔记 `[{ materialId, page, content, createdAt }]` |
| `annotations` | `ref([])` | 划词/批注 `[{ id, materialId, page, startOffset, endOffset, text, highlight, comment, pinned }]` |
| `quoteList` | `ref([])` | 引用清单 `[{ id, materialId, materialName, caseNo, page, excerpt, createdAt }]` |
| `notesPanelVisible` | `ref(false)` | 右侧笔记抽屉开合 |

**computed 拆分建议**：当前 `MaterialReaderView.vue` 已达 1370+ 行，重构后新增笔记/批注/引用/筛选逻辑，为保持单一职责，建议将以下逻辑抽离为独立可测模块（避免组件文件无序膨胀）：

- `useMaterialFilters.js`：提交主体/文件类型/日期区间过滤与目录分组计算
- `useTextSelection.js`：划词选区（`window.getSelection`）、浮动工具条定位、offset 计算
- `useNotes.js`：材料笔记 + 批注的增删改、按材料归集
- `useQuoteList.js`：引用收录 + 复制带出

> 这四个 hook 均为纯逻辑 + Vue 组合式 API，无跨层依赖，可作为独立单元测试。

### 5.2 数据扩展（caseDetail store + Mock）

`caseDetail.js` 的 `evidence`（四分组 `applicant/respondent/tribunal` + `attachments`）下，每份材料的文件项（`files[]` 平铺后的材料项）需扩展字段：

| 字段 | 类型 | 示例 | 说明 |
|------|------|------|------|
| `textSnippet` | `string` | 可选中 mock 文本 | 划词选区载体（沿用证据 `content` 字段或扩展） |
| `pageCount` | `number` | 8 | 页码（已有 `catalog.pages`，flatten 时回填，不再恒为 1） |
| `readStatus` | `'read' \| 'unread'` | `unread` | 目录项已读/未读 tag |
| `linkedEvidenceId` | `string \| null` | `ev-a1` | 关联质证对象（`challenge` 非空时关联） |
| `submitter` | `string` | `申请人` | 提交主体（由分组自然推导，可用派生） |

> `flattenEvidence` 需同步：小项 `pages` 由 `catalog.pages` 回填；`linkedEvidenceId` 取所属证据 `id`；`readStatus` 先 mock 默认 `unread`（点开后置 `read`）。

### 5.3 Mock 文本渲染层

- 用 `activeMaterial.textSnippet`（或回退到所属证据 `content`）渲染为 `pre`/`p` 文本块。
- 用户选中文本时，通过 `useTextSelection` 捕获选区（`anchorOffset`/`focusOffset` + 所属段落定位），弹出浮动工具条：**高亮 / 批注 / 引用**。
  - 高亮：在目标文本节点外围包 `<mark>`，同时写入 `annotations`（记录 `startOffset`/`endOffset`/`paragraphId`），供右侧笔记抽屉渲染高亮列表。
  - 批注：锚点处渲染侧条图标，点击展开批注框。
  - 引用：将选中片段收录进 `quoteList`，正文高亮保留。
- 不引入 PDF 渲染；后续接入真实 PDF 引擎时，仅替换文本层，其余交互与数据模型不变。

### 5.4 抽屉化说明（方案 C）

- **笔记抽屉**：右侧独立面板（`el-drawer` 或复用现有 `slide-summary` 过渡的绝对定位面板），承载「材料级笔记 + 本材料划词/批注列表 + 引用清单」三个区块，宽度 `320px`（遵循 DESIGN.md 侧栏习惯）。默认收起，保持沉浸阅读。
- **与现有「摘要」侧栏的关系**：预览工具条保留现有「摘要」（`toggleSummary`，展示 `activeMaterial.summary` 预生成摘要）与「案件信息」（`toggleCaseInfo`）侧栏，二者功能独立、互相互斥（沿用现有 `toggleSummary`/`toggleCaseInfo` 的互斥逻辑）。笔记抽屉作为第三个独立侧栏，唤起优先级为「任一开启时关闭其余」，与现有两个侧栏并列互斥。

## 6. 交互与状态

- **目录-预览联动**：点击目录材料项 → 直接切到预览态渲染该材料（不再经封面态跳页）；封面态保留为"点分组标题查看组内总览"。
- **收入/收起**：左侧目录保留现有 collapse 成窄条（`.collapsed`）能力。
- **批量**：目录项复选框多选 / 全选；勾选 ≥1 后预览工具条出现「批量导出 / 打印 / 全选下载」（ElMessage 反馈，mock）。
- **已读/未读**：打开某材料预览即置 `read`；目录项以 10px 小 tag 呈现未读态。
- **引用清单**：`quoteList` 在笔记抽屉内独立区展示，项含案号/材料/页码/摘录，提供「复制」按钮（`navigator.clipboard`）。
- **浮动工具条定位**：随选区几何位置（`getBoundingClientRect` + 预览容器坐标）定位，候补键盘 `Escape` 关闭。

## 7. 错误处理与边界

- 材料无 `textSnippet`/`content` 时，文本层显示空态占位，不崩坏其余布局。
- 切换材料 / 关闭抽屉前，若有未保存批注，予以保留（内存态）；本期不做持久化（Mock 数据源，刷新即重置），文档需明示此边界，避免评审时被误解为丢失数据。
- 选区跨 `pre` 多段未做合并处理，`useTextSelection` 取用户可见选中片段即可。
- 溢出：文本层过长时容器内滚动，侧条批注相对段落锚点定位，不做 PDF 翻页式分页（Mock 阶段以单段长文本呈现）。

## 8. 视觉规范遵循（DESIGN.md）

| 项 | 遵循规则 |
|----|----------|
| 字体 | 字号严格 16/14/12/10；标题 16/600，正文 14，辅助 12，tag 10 |
| 分割 | 表头 `border-bottom: none !important`；行底 `--el-border-color-lighter` 1px |
| 组件类 | `.filter-bar` / `.filter-item` / `.filter-label`（14px，宽 56px，左对齐）；分页用 `.pagination-wrapper` |
| 筛选控件 | 宽度 180px；数值/下拉可 120px |
| 选中态 | 局部侧栏 is-active 用 3px 主题色竖条（登记例外），未选中不得出现 |
| 抽屉 | 移动端 ≤768px 非全屏 `el-drawer` 宽 90% / `el-dialog` 直 92% + margin 5vh auto |
| 链接 | 案号/操作链接 `el-link type="primary" :underline="false"` |
| 按钮 | 查询/重置 12px，置于 `.filter-actions` |
| 禁止 | 不用 em dash「—」；不用 13/15px；时间线左色条；卡片侧条 accent（选中态 3px 例外除外） |
| 空态 | 复用 `CaseEmptyState` 风格 |

## 9. 测试要点

- **目录-预览联动**：点目录项即刻渲染对应材料，封面态仅用于分组总览。
- **组合筛选**：提交主体/文件类型/日期区间任意组合过滤目录；清空筛选还原全量。
- **划词高亮**：选中文本 → 高亮生效且 `annotations` 记录 offset 正确；切换材料后不串写。
- **批注**：锚点批注增删改，归集到对应材料；关闭抽屉再开保留（内存态）。
- **引用清单**：引用项含案号/材料/页码/摘录；「复制」能写入剪贴板。
- **批量**：多选/全选；勾选后批量按钮出现并可触发 mock 反馈。
- **已读/未读**：打开即置已读，目录 tag 相应刷新。
- **Hook 单测**：`useMaterialFilters` / `useTextSelection` / `useNotes` / `useQuoteList` 各覆盖主分支与空值分支。

## 10. 范围边界（本期不做）

- 不接入 pdf.js 真实 PDF 渲染（仅 Mock 文本层）。
- 引用仅为"收录 + 复制"，不写入裁决书草稿文档。
- 笔记/批注不持久化（Mock 数据源，刷新即重置）。
- 不新增真实文件上传/OCR 落库（OCR 仍为 mock 提示）。