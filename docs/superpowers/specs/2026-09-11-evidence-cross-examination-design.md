# 2026-09-11 案件详情页「证据和质证」模块设计

## 1. 背景与目标

案件详情页现有 5 个横向 Tab（办案 / 案情及当事人材料 / 仲裁文书 / 电子送达 / 讨论）。仲裁员在核阅案件时，证据与质证信息散落在「案情及当事人材料」中的简单列表里，缺少结构化的证据目录、附件与质证意见的集中呈现，且无「仲裁庭依职权调取证据」分类。

本次在「仲裁文书」之前新增 Tab「证据和质证」，集中、结构化地展示三类证据及其质证信息，帮助仲裁员逐条核阅证据、不漏看质证意见。

## 2. 设计决策摘要

| 决策点 | 结论 |
|--------|------|
| 顶层导航 | 新增横向 Tab「证据和质证」（`name: evidence`），位于「仲裁文书」之前 |
| 三类证据导航 | 左侧 200px 竖向侧栏（复用 `.todos-sidebar` 视觉模式），避免「横向 Tab 套横向 Tab」的视觉混淆 |
| 侧栏提示 | 侧栏项右侧显示证据清单条数徽标（有证据条数才显示），选中项浅蓝底主题蓝字、未选中浅灰底灰字；不采用红点 |
| 内容区 | 每类证据含 3 个子块：质证通知（文件条）、证据目录（摘要表格）、证据清单（展开式表格） |
| 证据清单 | 列：编号 / 证据名称 / 证据附件（chips）/ 质证徽标；点击行展开显示证据内容 + 质证详情；顶部统计筛选条（全部 / 有质证 / 无质证） |
| 文件交互 | 下载 + 预览（沿用 MaterialList 预览弹窗占位风格）；页面保留「材料阅览」快速预览入口 |
| 旧证据区块 | 「案情及当事人材料」Tab 中的「证据」区块删除，由新 Tab 全面接管 |
| 数据层 | 升级 `caseDetail` store 的 `evidence` 状态为三层结构，并同步适配 `MaterialReaderView` 目录分组 |

## 3. 信息架构

```
证据和质证（新 Tab，evidence）
├── 左侧竖向侧栏（200px）
│   ├── 申请人证据            [条数徽标]
│   ├── 被申请人证据          [条数徽标]
│   └── 仲裁庭依职权调取证据  [条数徽标]
└── 右侧内容区（选中类型）
    ├── 质证通知     → 文件条（图标 + 文件名 + 上传时间/人 + 下载）
    ├── 证据目录     → 摘要表格（序号 / 证据名称 / 证据形式 / 页数 / 提交日期）+ 下载目录文件
    └── 证据清单     → 统计筛选条 + 展开式表格
        ├── 列：编号 | 证据名称 | 证据附件 | 质证
        ├── 展开行：证据内容 + 质证（质证人 / 质证理由 / 质证意见附件）
        └── 顶部：共 N 项 · M 项有质证 + 全部/有质证/无质证筛选
```

## 4. 数据结构设计

`src/stores/caseDetail.js` 的 `evidence` 状态升级为三层结构：

```js
// 三种证据类型的 key
evidence: {
  applicant: EvidenceType,
  respondent: EvidenceType,
  tribunal: EvidenceType,   // 仲裁庭依职权调取证据
}

// EvidenceType 结构
{
  notice: {
    name: '质证通知（申请人）.pdf',
    uploadTime: '2026-06-10 15:00',
    uploader: '刘秘书',
  } | null,
  catalog: [
    { id, name, form, pages, submitDate },   // 证据目录摘要项
  ],
  list: [
    {
      id,
      name,              // 证据名称
      content,           // 证据内容（展开行展示）
      files: [           // 证据附件（多个）
        { id, name, fileType },   // fileType: pdf | image | ...
      ],
      challenge: {       // 质证（可空）
        challenger: '李律师（被申请人代理人）',   // 质证人
        reason: '...',                           // 质证理由
        opinionFiles: [ { id, name, fileType } ], // 质证意见附件
      } | null,
    },
  ],
}
```

- 侧栏条数徽标 = `evidence[type].list.length`
- `list` 中 `challenge` 非空的条目标记为「有质证」
- mock 数据：申请人类 3 条（1 条有质证）、被申请人类 2 条（1 条有质证）、依职权调取类 1 条（无质证）

## 5. 组件设计

### 5.1 新增组件 `EvidenceTab.vue`

路径：`src/views/cases/components/detail/EvidenceTab.vue`

接收 `caseId` prop（与 `DocsTab` 一致），内部从 `useCaseDetailStore` 读取 `evidence` 与 `caseInfo`。

**布局结构：**

```
.evidence-tab
└── .evidence-layout (display:flex)
    ├── .evidence-sidebar (width:200px，右 1px 分割线)
    │   └── 侧栏项 ×3（active 态：#f2f5fa 背景 + 主题蓝文字；右侧条数徽标）
    └── .evidence-content (flex:1)
        ├── 质证通知子块（文件条）
        ├── 证据目录子块（摘要表格）
        └── 证据清单子块（统计筛选条 + 展开式表格）
```

**交互：**

- 侧栏点击切换 `activeType`（默认 `applicant`）
- 证据清单：`el-table` + `type="expand"` 展开列；行内附件 chips 点击预览/下载
- 统计筛选条：`全部 / 有质证 / 无质证` 三选，筛选 `list`
- 顶栏操作：右侧内容区顶部提供「材料阅览」入口按钮（图标 `Reading`，位于右侧内容区首行、质证通知子块之上），点击 `window.open('/cases/:id/material-reader')` 新窗口打开

### 5.2 组件内部结构

为控制组件复杂度，将证据清单拆为子组件：

- `EvidenceList.vue`：证据清单子块（统计筛选条 + 展开式表格 + 预览弹窗）
- 质证通知、证据目录子块较小，直接写在 `EvidenceTab.vue` 内

### 5.3 路由与 Tab 挂载

`src/views/cases/CaseDetailView.vue`：

```vue
<el-tab-pane label="证据和质证" name="evidence">
  <EvidenceTab :case-id="store.currentCaseId" />
</el-tab-pane>
<!-- 插入在 仲裁文书 tab-pane 之前 -->
```

### 5.4 删除旧证据区块

`src/views/cases/components/detail/InfoTab.vue`：删除「证据」section-card（含 `handleDownloadAll`、`openMaterialReader`、`MaterialList` 引用、`evidence` prop）。其他附件区块保留。

### 5.5 适配 MaterialReaderView

`src/views/cases/MaterialReaderView.vue` 的 `catalogGroups` 从新结构提取材料：

```js
const catalogGroups = computed(() => [
  { id: 'applicant', label: '申请人证据', items: flatten(evidence.applicant) },
  { id: 'respondent', label: '被申请人证据', items: flatten(evidence.respondent) },
  { id: 'tribunal', label: '仲裁庭依职权调取证据', items: flatten(evidence.tribunal) },
  { id: 'attachment', label: '其他附件', items: attachments.value || [] },
])
// flatten：将每个证据的 files（附件）平铺为材料项 { id, name, type, submitDate, fileType }
```

`flatten` 规则：证据清单 `list` 中每条证据的每个 `files` 附件作为一个材料项，`name` 取附件名，`submitDate` 取证据提交日期（或 catalog 对应项），`fileType` 取附件类型。若某类型无数据则分组保留但 items 为空（空态沿用现有 `empty-inline`）。

## 6. 视觉规范遵循（DESIGN.md）

| 规则 | 应用 |
|------|------|
| 字体刻度 16/14/12/10 | 侧栏项 14px、子块标题 14px/600、辅助信息 12px secondary、徽标/质证 tag 10px |
| 表格 | 仅行底分隔线，无竖向边框；表头 `#f8f8f9`、无下边框（依赖全局强制样式） |
| 卡片 | 白底 + `--el-border-color-light` 边框 + 圆角 6px；section-card 复用 |
| 侧栏选中态 | `#f2f5fa` 背景 + 主题蓝文字（3px 竖条为 `.todos-sidebar` 局部侧栏系统元素，此处侧栏为组件内实现，不强制加竖条，用背景+文字表达选中） |
| 禁用左色条 | 展开行质证区用「完整边框 + 圆角 + 浅黄底」而非左侧竖条 |
| 空状态 | 清单无数据用 `CaseEmptyState` / 内联空提示 |
| 文字 | 不使用「—」破折号，用「暂无」/「无」 |

## 7. 交互与状态

- **质证徽标**：`challenge` 非空的行显示黄色徽标「有质证」（`#fff7e6` 底 + `#b45309` 字 + `#f5d9a0` 边框）；筛选「有质证」时仅显示带质证的条目
- **展开行**：质证内容用浅黄底卡片（`#fffdf7`）+ 左上角「质证」标签（`#f59e0b` 底白字）
- **附件 chips**：浅蓝底（`#f2f5fa`）+ 主题蓝文字 + 边框，hover 变深；点击预览（弹窗占位），提供下载
- **侧栏徽标**：`min-width:18px;height:18px;border-radius:9px`，选中项 `#e6e9f4` 底 `#0a1f8f` 字，未选中 `#f2f5fa` 底灰字；无证据条数时不显示
- **移动端（≤768px）**：侧栏可折叠为顶部分类选择（`el-select` 或横向 chips），避免 200px 固定侧栏挤压内容

## 8. 文件清单

| 操作 | 文件 |
|------|------|
| 新增 | `src/views/cases/components/detail/EvidenceTab.vue` |
| 新增 | `src/views/cases/components/detail/shared/EvidenceList.vue` |
| 修改 | `src/views/cases/CaseDetailView.vue`（新增 tab-pane） |
| 修改 | `src/stores/caseDetail.js`（evidence 三层结构 + mock 数据） |
| 修改 | `src/views/cases/components/detail/InfoTab.vue`（删除证据区块） |
| 修改 | `src/views/cases/MaterialReaderView.vue`（目录分组适配新结构 + 新增依职权调取分组） |

## 9. 测试要点

- 三种证据类型切换：侧栏高亮、右侧内容联动、徽标条数正确
- 证据清单：筛选（全部/有质证/无质证）正确；展开行显示内容与质证；无质证行展开仅显示证据内容
- 空类型：无证据条数时不显示徽标，右侧空态提示正常
- 文件交互：附件 chips / 质证通知 / 目录文件的预览弹窗与下载提示
- 材料阅览入口：新窗口打开，目录分组包含三类证据 + 其他附件
- 移动端：侧栏折叠为顶部分类选择
