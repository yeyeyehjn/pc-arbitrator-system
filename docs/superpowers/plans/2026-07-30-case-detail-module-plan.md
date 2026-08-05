# PC仲裁员端重构 - 第四阶段实施计划（"案件详情页"模块）

> **关联设计文档**：`docs/superpowers/specs/2026-07-30-case-detail-module-design.md`

## 阶段 1: Pinia Store 与 Mock 数据 (State Management)

- [ ] **创建 `src/stores/caseDetail.js`**：
  - `currentCaseId`：当前案件 ID（来自路由 `:id`）
  - `caseInfo`：案件基本信息（id/caseNo/caseReason/caseStatus/filingDate/secretary/tribunal/groupDate/hearingDate/deadline/remainDays/isSuspended/extensionCount/amount）
  - `parties`：`{ applicant, respondent }`，各含 name/contact/address/agents[]
  - `claims`：`{ arbitrationClaims, defenseOpinion, counterClaim, counterDefense }`
  - `evidence`：`{ applicant: [...], respondent: [...] }`
  - `attachments`：其他附件数组
  - `caseTodos`：本案待办列表
  - `hearings`：庭审排期数组
  - `award`：`{ content, records: [] }`（裁决书 HTML 内容 + 核阅记录）
  - `docs`：`{ records: [], awards: [] }`（庭审笔录 + 结案文书）
  - `services`：电子送达记录数组
  - `activeTab`：`'work'`（默认 Tab）
  - `loading`：false
- [ ] **Mock 数据场景覆盖**：
  - 案件基本信息含：正常案件、重大案件（amount≥10000）、即将到期、已中止、已延期
  - 当事人含：多代理人场景
  - 请求答辩：4 项均含内容
  - 证据/附件：含图片与 PDF 类型 Mock
  - 本案待办：含延期审批、笔录签名、裁决书核阅 3 类
  - 庭审排期：含 2 次开庭记录
  - 裁决书：含核阅记录 2-3 条
  - 文书签名：含已签与待签
  - 电子送达：含已送达/待送达/失败/已读/未读多种状态
- [ ] **核心方法**（基于 Mock）：
  - `fetchCaseDetail(caseId)`：根据 ID 填充全量状态
  - `switchTab(tabKey)`：切换 activeTab
  - `saveAwardContent(html)`：保存裁决书（Mock + ElMessage）
  - `signDoc(docId, signatureData)`：文书签名（Mock + 更新状态）
  - `downloadTemplate(templateName)`：模板下载（Mock + ElMessage）
  - `runAITool(toolKey)`：返回预设 Mock 结果（延时 800ms）
- [ ] **AI Mock 结果文件**：创建 `src/views/cases/components/detail/work/aiMockResults.js`，预设 5 项工具结果

## 阶段 2: 容器与头部开发 (Container & Header)

- [ ] **创建目录结构**：
  - `src/views/cases/components/detail/`
  - `src/views/cases/components/detail/shared/`
  - `src/views/cases/components/detail/work/`
- [ ] **重写 `CaseDetailView.vue`**（替换占位）：
  - 整页灰底 `#f7f7f7`，内容区水平居中
  - 上下两段式：DetailHeader + el-tabs（4 Tab）
  - 挂载时从路由取 `:id` → `store.fetchCaseDetail(id)`
  - 全页 `v-loading` 绑定 store.loading
  - 监听子组件 `switch-tab` 事件统一切换 Tab
- [ ] **DetailHeader.vue 组件**：
  - props: `caseInfo`
  - emit: `back`
  - 白底卡片（#FFFFFF、1px 边框 #E4E7ED、4px 圆角、内边距 16px 20px）
  - 左侧：星标（amount≥10000 显示，黄色 #F7BA0A + tooltip）+ 案号(16px/600/#303133) + 分隔符 + 案由(14px/#606266) + 状态 el-tag + 立案日期 + 办案秘书
  - 右侧：返回按钮（el-button plain small + ArrowLeft 图标）→ router.push('/cases')
- [ ] **Tab 导航**：`el-tabs` v-model 绑定 store.activeTab
  - 4 个 `el-tab-pane`：办案(work) / 案情及当事人材料(info) / 仲裁文书(docs) / 电子送达(service)
  - 选中态下边线主题色 #053d99，font-size 14px

## 阶段 3: Tab 1 办案开发 (WorkTab)

- [ ] **WorkTab.vue 容器**：
  - props: `caseId`
  - emit: `switch-tab`
  - 4 个板块纵向卡片排列，各 margin-bottom 16px
- [ ] **work/CaseTodoList.vue（本案待办）**：
  - props: `caseId`
  - emit: `switch-tab`
  - 卡片标题「▎待办事项（本案）」+ 左侧 3px 主题色高亮条
  - 列表项：待办类型 el-tag（延期审批=warning/笔录签名=primary/裁决书核阅=success/文书签名=warning）+ 标题 + 时间 + 「去处理」el-link
  - 跳转逻辑：笔录签名/文书签名/裁决书核阅 → emit switch-tab 'docs'；延期审批 → ElMessage.info + router.push('/todos/center')
  - 空状态：CaseEmptyState「本案暂无待办事项」
- [ ] **work/TemplateDownload.vue（文书辅助工具）**：
  - 卡片标题「▎文书辅助工具」
  - 两组：结案文书模板（裁决书草稿/撤案决定书草稿/调解决定书草稿）+ 程序文书模板（延期裁决书呈批表/延期结案申请书）
  - 每模板 el-link type=primary + Download 图标 → store.downloadTemplate
- [ ] **work/AIToolGrid.vue（AI 工具网格）**：
  - 卡片标题「▎AI 辅助工具」
  - 5 卡片网格：display grid, repeat(auto-fill, minmax(180px, 1fr)), gap 12px
  - 卡片：图标 + 名称 + 说明，hover 边框变 #053d99
  - 点击 → emit open-tool(toolKey)
- [ ] **work/AIToolDrawer.vue（AI 结果抽屉）**：
  - props: `toolKey`, `visible`
  - emit: `copy-to-editor`
  - el-drawer direction=rtl size=40%
  - 内容：根据 toolKey 展示 aiMockResults 对应结果
  - 加载态：v-loading + 「AI 分析中…」（runAITool 延时 800ms）
  - 底部：「复制到裁决书编辑器」按钮 → emit copy-to-editor
- [ ] **work/HearingSchedule.vue（庭审排期）**：
  - 卡片标题「▎庭审排期」
  - 列表展示：开庭日期 + 类型 + 开庭地点，最近一次高亮
  - 空状态：CaseEmptyState「本案暂未排期」
- [ ] **WorkTab 组装与联动**：
  - AIToolGrid 的 open-tool → 控制 AIToolDrawer 显隐
  - AIToolDrawer 的 copy-to-editor → emit switch-tab 'docs'（CaseDetailView 接收）

## 阶段 4: Tab 2 案情及当事人材料开发 (InfoTab)

- [ ] **InfoTab.vue 容器**：
  - props: `caseInfo`
  - 5 个板块纵向卡片排列
- [ ] **基本信息区**：
  - el-descriptions :column=3 border
  - 字段：案号/案由/状态/立案日期/办案秘书/仲裁庭/组庭日期/开庭日期/审限
  - 审限复合格式：年/月/日（剩余 X 天）（是否中止）（延期 N 次）
    - 剩余≤15 天黄色 #E6A23C；<0 红色 #F56C6C + "已延期"；中止灰色 el-tag；延期 0 次不显示括号
- [ ] **shared/PartyCompare.vue（当事人对照）**：
  - props: `applicant`, `respondent`
  - 左右双栏 display flex gap 20px，各占 50%
  - 左「申请人」右「被申请人」，结构对称
  - 子卡片：白底 1px 边框 4px 圆角 内边距 16px
  - 标题 14px/600/#053d99；字段标签 12px/#909399 宽 80px 左对齐；字段值 13px/#303133
  - 代理人多个：列表纵向排列
- [ ] **请求答辩区**：
  - 4 子区块纵向：仲裁请求/答辩意见/反请求/反请求答辩
  - 子标题 13px/600/#303133 + 左侧 2px 主题色竖条
  - 内容 13px/#606266 line-height 1.8
- [ ] **shared/MaterialList.vue（材料清单，复用组件）**：
  - props: `title`, `materials`
  - 卡片标题 + el-table（证据名称/类型/提交日期/操作）
  - 操作：预览（el-dialog Mock）/下载（Mock 提示）
- [ ] **证据区**：使用 MaterialList 两次（申请人证据 + 被申请人证据）
- [ ] **其他附件区**：使用 MaterialList

## 阶段 5: Tab 3 仲裁文书开发 (DocsTab)

- [ ] **安装 wangEditor 依赖**：
  - `npm install @wangeditor/editor @wangeditor/editor-for-vue@next`
- [ ] **DocsTab.vue 容器**：
  - props: `caseId`
  - 2 板块纵向：裁决书核阅 + 文书签名
- [ ] **裁决书核阅区**：
  - 操作栏：上传裁决书（el-button primary plain + Upload）/ 在线编辑（el-button primary + Edit）/ 查看核阅记录（el-button link + Clock）
  - 预览区：未上传空状态「暂无裁决书，请上传或在线编辑」；已上传显示摘要
  - 上传：el-upload Mock，成功后填入编辑器
- [ ] **shared/AwardEditor.vue（类 Word 编辑器封装）**：
  - v-model: content（HTML 字符串）
  - emit: save
  - 全屏 el-dialog（fullscreen）
  - 集成 wangEditor 5：标题/正文/加粗/斜体/下划线/列表/对齐/字体字号/表格/撤销重做
  - 保存按钮 → emit save（空内容 ElMessage.warning 不保存）
- [ ] **核阅记录抽屉**：
  - el-drawer direction=rtl size=40%
  - 列表：核阅人/时间/结果（通过/退回）/备注
  - 空状态「暂无核阅记录」
- [ ] **shared/SignaturePanel.vue（文书签名面板）**：
  - props: `docType`, `docList`
  - 复用现有 `src/views/todos/components/shared/SignaturePad.vue`
  - 庭审笔录子区：列表（标题/庭审日期/提交时间/签名状态）+ 查看 + 签名
  - 结案文书子区：列表（标题/类型/提交时间/签名状态）+ 预览 + 签名
  - 签名弹窗：全屏签名模式（沿用待办模块交互）
  - 签名完成：store.signDoc + ElMessage.success + 更新状态；已签名禁用按钮 + ElMessage.info

## 阶段 6: Tab 4 电子送达开发 (ServiceTab)

- [ ] **ServiceTab.vue 组件**：
  - props: `caseId`
  - 卡片内 el-table
- [ ] **表格字段**：
  - 送达类型（立案送达/组庭送达/开庭送达/裁决送达）min-width 120
  - 送达地址 min-width 180
  - 送达方式（短信/Email）min-width 100
  - 送达情况 el-tag（已送达=success/待送达=warning/送达失败=danger）min-width 100
  - 读取情况（已读+时间/未读）min-width 120
  - 送达时间 min-width 140
- [ ] **空状态**：CaseEmptyState「本案暂无电子送达记录」

## 阶段 7: 路由与导航联动 (Routing Integration)

- [ ] **路由验证**：`/cases/:id` 路由已在第三阶段配置，确认指向 CaseDetailView.vue
- [ ] **MainLayout 联动**：确认 `resolveActiveMenu` 处理 `/cases/:id` → 高亮"我的案件"菜单（已有逻辑，验证即可）
- [ ] **从列表跳转**：验证"我的案件"表格点击案号 → `/cases/:id` → 详情页加载

## 阶段 8: 联调与自测 (Review & Polish)

- [ ] **Mock 数据渲染检查**：
  - 头部案号/案由/状态/星标显示正确
  - 4 个 Tab 切换正常，内容无错位
- [ ] **Tab 1 办案测试**：
  - 本案待办列表显示 + 「去处理」跳转 Tab 3
  - 文书模板下载提示
  - AI 工具卡片点击 → 抽屉打开 → 结果展示 → 复制提示
  - 庭审排期显示
- [ ] **Tab 2 案情测试**：
  - 基本信息审限复合格式（正常/即将到期/已过期/中止/延期 0 次）
  - 当事人左右对照 + 多代理人
  - 请求答辩 4 子区块
  - 证据/附件预览与下载提示
- [ ] **Tab 3 仲裁文书测试**：
  - 裁决书上传 → 编辑器填入
  - 在线编辑 → wangEditor 打开 → 编辑 → 保存
  - 空内容保存提示
  - 核阅记录抽屉
  - 文书签名：笔录/结案文书签名流程 + 已签名禁用
- [ ] **Tab 4 电子送达测试**：
  - 各送达状态 Tag 颜色正确
  - 读取情况显示
  - 空状态
- [ ] **跨 Tab 跳转测试**：
  - 待办「去处理」→ Tab 3
  - AI「复制到编辑器」→ Tab 3
- [ ] **头部交互测试**：
  - 重大案件星标 + tooltip
  - 返回按钮 → /cases
- [ ] **加载与空状态**：
  - 详情加载中 v-loading
  - 案件 ID 不存在 → 空状态 + 返回
- [ ] **响应式检查**：1440px 及以下屏幕适配
- [ ] **设计规范验收**：
  - 卡片白底/边框/圆角/无阴影
  - 板块标题左侧 3px 高亮条
  - 字号规范（16/14/13/12px）
  - Tab 选中态下边线主题色
  - 表头灰色背景（全局 !important 生效）
