# 待办事项-裁决书核阅调整 设计文档

日期：2026-08-20
关联模块：待办事项（裁决书核阅列表）、案件详情页（仲裁文书 Tab）

## 背景与目标

原"裁决书核阅列表"仅有 1 个关键字筛选，点击"核阅"打开弹窗预览全文并通过/退回。调整目标：

1. 列表筛选项扩充为 6 项，覆盖案件年份、案件编号、当事人、经办秘书、结案类型、核阅状态。
2. 点击"核阅/查看"不再弹窗，而是跳转案件详情页-仲裁文书 Tab，在该页面完成核阅闭环。
3. 案件详情页-仲裁文书 Tab 的"裁决书核阅"区重构为三个模块：裁决书、核阅流转记录、上传文书。

## 一、核阅列表（`src/views/todos/components/ReviewList.vue`）

### 筛选栏（复用全局 `.filter-bar`）

| 筛选项 | 控件 | 宽度 | 选项 |
| ---- | ---- | ---- | ---- |
| 案件年份 | el-select | 120px | 全部 / 2026 / 2025 / 2024 |
| 案件编号 | el-input | 180px | 模糊匹配案号 |
| 当事人 | el-input | 180px | 模糊匹配申请人/被申请人 |
| 经办秘书 | el-select | 180px | 全部 + 数据中出现的秘书 |
| 结案类型 | el-select | 120px | 全部 / 裁决 / 调解 / 撤回 |
| 核阅状态 | el-select | 120px | 待核阅（默认）/ 已核阅 |

### 表格列

案号（el-link 跳详情）、案由、申请人、被申请人、经办秘书、结案类型、提交时间、核阅状态（el-tag：待核阅-warning / 已核阅-success）、操作。

操作列：待核阅行显示 `核阅`；已核阅行显示 `查看`；点击均跳转 `/cases/:caseId?tab=docs`。原核阅弹窗整体删除（退回修改动作不再保留）。

## 二、数据层

### todo store（`src/stores/todo.js`）

- `reviewList` 每条新增字段：`caseId`（对应案件列表 id，用于跳转）、`caseYear`、`closingType`（裁决/调解/撤回）、`reviewStatus`（待核阅/已核阅）；移除 `submitter`/`awardContent`（改用 `secretary` 字段与详情页数据）。
- Mock 扩充至 7 条，覆盖各筛选值组合（不同年份/秘书/结案类型/两种核阅状态）。
- `reviewAward(id, action)` 删除，新增 `markReviewed(caseId)`：将对应行 `reviewStatus` 置为 `已核阅`（不删行）。
- 徽标 `counts.review` 口径改为仅统计 `待核阅` 行数。

### caseDetail store（`src/stores/caseDetail.js`）

- `award` 结构扩展：
  - `file`：`{ name, updater, updateTime }`（秘书上传的裁决书草稿）
  - `content`：在线编辑 HTML（保留）
  - `versions`：历史版本数组 `{ versionNo, fileName, updater, updateTime }`，倒序展示
  - `flowRecords`：核阅流转记录 `{ stage, operator, time, remark }`，替代原 `records`
- `saveAwardContent(html)`：保存成功后追加历史版本（更新人=当前仲裁员"张三"）并追加"编辑保存"流转记录。
- 新增 `downloadAwardDraft()`：Mock 下载提示。
- 新增 `submitAwardDoc(payload)`：`payload = { fileName, closingType, reminderTarget, reminderContent, otherFiles }`；更新 `award.file`、追加"上传文书"流转记录。

## 三、案件详情-仲裁文书 Tab 裁决书核阅区（`src/views/cases/components/detail/DocsTab.vue`）

参考 https://yeyeyehjn.github.io/document-check/pc/web-initiate.html 布局：单张 `.section-card` 承载"裁决书核阅"模块，裁决书 / 核阅流转记录 / 上传文书为其子模块：

- **标题行**：左"裁决书核阅"；右操作 `上传文书`（primary，开弹窗）。
- **子模块 裁决书**：文件信息条（Document 图标 + 文件名 el-link 点击进在线编辑 + `编辑`/`下载` small plain 按钮 + 更新人（仅姓名，不展示时间）+ `历史版本` small plain 按钮），浅灰底条。
- **子模块 核阅流转记录**：标题行（左"核阅流转记录"、右"共 N 条流转记录"）+ 时间线（40px 圆形头像节点显示角色字"秘/仲"+ 2px 中性竖向连线 + 全边框卡片）；卡片含操作人+动作、时间、备注、附件 chip（虚线边框、点击提示下载）。该案在待办列表为"待核阅"时，时间线末尾展示灰色 loading 等待节点"等待仲裁员核阅..."。
- **子模块 上传文书（弹窗 600px）**：提醒对象（必填，默认经办秘书）、提醒内容（必填，textarea 200 字）、裁决书附件（必填，el-upload drag 拖拽区，Word/PDF）、结案类型（radio：裁决/调解/撤回，默认裁决）、其他附件（drag 多文件，PDF/Word/图片）；底部 `取消` / `确认上传`。确认后更新裁决书文件与版本、追加"上传文书"流转记录（含其他附件）、同步 `markReviewed`、关闭并重置表单。
- **历史版本（弹窗 700px）**：卡片列表（文件图标 + 文件名 + 更新人 · 时间 + 下载链接），首项高亮为"当前版本"（primary-light-9 底 + primary-light-7 边框 + tag）。

## 四、不改动部分

- 文书签名模块（SignaturePanel）不动。
- AwardEditor 组件本身不动。
- 路由不动（复用既有 `/cases/:id?tab=docs` 定位机制）。

## 五、设计规范遵循要点（DESIGN.md）

- 字号四档（16/14/12/10px）；间距 4 的倍数；筛选栏/表格复用全局类。
- 3px 竖条仅用于选中态；流转记录用全边框卡片而非左色条时间线。
- 状态色仅用于状态传达（warning-待核阅、success-已核阅）。
- 移动端断点统一 `max-width: 768px`。
