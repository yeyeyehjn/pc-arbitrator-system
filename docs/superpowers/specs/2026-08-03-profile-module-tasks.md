# 个人中心模块 - 实施计划

> 参考设计：[2026-08-03-profile-module-design.md](./2026-08-03-profile-module-design.md)

## 实施顺序

按依赖关系分 7 个阶段，每阶段交付可独立验证的成果。

---

## 阶段 1：基础骨架（路由 + 容器 + Store 初始化）

**目标：** 建立 `/profile` 路由与左右双栏容器，6 个子路由可切换（页面暂为占位）。

**任务：**

- [ ] 1.1 创建 `src/stores/profile.js`，定义全部 state 结构（basicInfo / workUnit / resume / fee / bank / certificates），方法暂返回 mock 数据
- [ ] 1.2 创建 `src/views/profile/ProfileView.vue`，复用 `TodosView.vue` 的左右双栏结构，6 个 `el-menu-item`（个人信息/工作单位/个人履历/酬金单/银行账号信息/仲裁员聘书）
- [ ] 1.3 在 `src/router/index.js` 根布局 children 中新增 `profile` 嵌套路由，含 6 个子路由，`/profile` 重定向到 `/profile/info`
- [ ] 1.4 创建 6 个子组件占位文件（PersonalInfo/WorkUnit/PersonalResume/FeeList/BankAccount/CertificateList），每个仅含 `<div class="section-card">占位</div>`
- [ ] 1.5 创建 `shared/InfoSection.vue` 通用就地编辑组件（props: title；v-model: editing；slots: view/edit/actions）
- [ ] 1.6 创建 `shared/ProfileEmptyState.vue` 空状态组件（props: text/icon）

**验证：** 访问 `/profile` 自动跳转到 `/profile/info`，6 个菜单项可切换，侧栏 is-active 高亮正确。

---

## 阶段 2：个人信息子模块

**目标：** 完成基本信息就地编辑 + 修改密码功能。

**任务：**

- [ ] 2.1 在 `profile.js` store 中完善 `basicInfo` mock 数据（姓名/身份证号/国籍只读，其他证件/手机/性别/邮箱/地址可编辑，addresses 含 preferred 字段）
- [ ] 2.2 实现 `PersonalInfo.vue` 基本信息卡片：
  - 只读态：`el-descriptions :column="2"`，手机号 `tel:` 链接、邮箱 `mailto:` 链接、首选地址 10px tag
  - 编辑态：`el-form` 含其他证件（类型/号码/有效期）、手机、性别、邮箱、3 个地址 + 各自"设为首选"radio
  - 校验：手机号 11 位首位 1、邮箱正则、证件有效期过期 warning 但不阻断
  - 保存调用 `store.updateBasicInfo()`，`ElMessage.success`
- [ ] 2.3 实现修改密码卡片：
  - `el-radio-group` 切换"短信验证/旧密码"两种方式
  - 短信方式：验证码输入 + "获取验证码"按钮 60s 倒计时
  - 两种方式均含新密码 + 确认新密码
  - 校验：密码 8-20 位含字母+数字、两次一致
  - 提交调用 `store.changePassword()`，成功后清空表单
- [ ] 2.4 移动端响应式：`el-descriptions` 1 列（≤768px），沿用 PartyDetailDrawer 方案

**验证：** 基本信息可编辑保存，校验生效；修改密码两种方式可切换，倒计时正常，校验生效。

---

## 阶段 3：工作单位子模块

**目标：** 完成工作单位就地编辑 + 附件管理。

**任务：**

- [ ] 3.1 在 store 中完善 `workUnit` mock 数据（9 个字段 + attachments 数组）
- [ ] 3.2 实现 `WorkUnit.vue`：
  - 使用 `InfoSection` 组件
  - 只读态：`el-descriptions :column="2"`，单位电话 `tel:` 链接，附件以文件名链接列表展示
  - 编辑态：`el-form` + `el-upload`（`action="#"` `:auto-upload="false"`，记录文件名到 attachments）
  - 保存调用 `store.updateWorkUnit()`
- [ ] 3.3 附件限制 pdf/doc/docx，超限提示

**验证：** 工作单位可编辑保存，附件可添加/删除，只读态正确展示附件列表。

---

## 阶段 4：个人履历子模块（最复杂）

**目标：** 完成 5 类履历的表格展示 + 弹窗 CRUD + 排序。

**任务：**

- [ ] 4.1 在 store 中完善 `resume` 5 类数组 mock 数据（每类 2-3 条示例），实现 `addResumeRecord` / `updateResumeRecord` / `deleteResumeRecord` / `getSortedResume`（外语能力按 createdAt 升序，其余按 startDate 升序）
- [ ] 4.2 实现 `PersonalResume.vue`：5 个 `.section-card`，每张含标题行 + "添加"按钮 + `el-table`
  - 5 类表格列按设计文档定义动态生成
  - 操作列："编辑"link 按钮 + "删除" `el-popconfirm` 包裹
  - 附件列：有则文件名 link，无则「-」
  - `#empty` 插槽「暂无履历记录」
- [ ] 4.3 实现 `resume/ResumeDialog.vue`：
  - props: visible / recordType / editData
  - 根据 recordType 动态渲染 5 类字段表单
  - 附件字段统一 `el-upload`
  - 校验：起止日期必填、结束日期不早于起始日期、名称必填
  - emit: save({ type, data, isEdit }) / close
- [ ] 4.4 在 PersonalResume.vue 中接入 ResumeDialog，处理添加/编辑/删除事件，调用 store 方法
- [ ] 4.5 排序验证：新增/编辑后表格按规则重排

**验证：** 5 类履历均可增删改，校验生效，排序正确，删除有二次确认。

---

## 阶段 5：酬金单子模块

**目标：** 完成筛选 + 列表 + 分页 + 案号跳转。

**任务：**

- [ ] 5.1 在 store 中完善 `fee.list` mock 数据（10+ 条，含已结/未结、不同年份），实现 `getFilteredFees` / `getPagedFees` computed
- [ ] 5.2 实现 `FeeList.vue`：
  - 筛选区：案号 input、结算状态 select、年份 select + 查询/重置按钮
  - 表格：案号 el-link 跳转、金额右对齐千分位、状态 el-tag、未结发放日期「-」
  - 分页：`.pagination-bar`，5/10/20 条每页
  - 空状态：`ProfileEmptyState`「暂无酬金记录」
- [ ] 5.3 案号点击 `router.push('/cases/' + row.caseId)`

**验证：** 筛选生效，分页正常，案号可跳转案件详情，空状态展示正确。

---

## 阶段 6：银行账号信息子模块

**目标：** 完成就地编辑 + 取酬身份判断。

**任务：**

- [ ] 6.1 在 store 中完善 `bank` mock 数据（isCivilServant / isNonRemuneration / bankName / accountName 只读 / accountNo）
- [ ] 6.2 实现 `BankAccount.vue`：
  - 使用 `InfoSection` 组件
  - 只读态：`el-descriptions :column="2"`，"是否"字段展示"是/否"
  - 编辑态：两个"是否"radio、开户银行 select、账户名称只读文本、银行账号 input
  - 两个"是否"任一改为"是"时 `ElMessageBox.confirm` 提示，取消则回退
  - 银行账号校验 16-19 位数字
  - 保存调用 `store.updateBank()`

**验证：** 可编辑保存，取酬身份变更有确认提示，账号格式校验生效。

---

## 阶段 7：仲裁员聘书子模块

**目标：** 完成卡片列表 + 图片预览 + 下载。

**任务：**

- [ ] 7.1 在 store 中完善 `certificates` mock 数据（2-3 份聘书，含有效/已过期），status 由 endDate 与当前日期比较计算
- [ ] 7.2 实现 `CertificateList.vue`：
  - 每份聘书一张 `.section-card`，标题行含 el-tag（有效 success / 已过期 info）
  - `el-descriptions :column="2"` 展示聘任编号/期限/专业领域/扫描件缩略图（el-image 64x64）
  - 操作区："查看大图"link（`el-image` `preview-src-list` 全屏预览）+ "下载 PDF"link（mock `ElMessage.info`）
  - 空状态：`ProfileEmptyState`「暂无聘书记录」
  - 扫描件加载失败时 `el-image` 错误插槽显示「图片加载失败」

**验证：** 聘书卡片正确展示，状态 tag 正确，大图预览生效，下载有提示，空状态展示正确。

---

## 全局收尾

- [ ] 8.1 移动端响应式验证（≤768px）：`el-descriptions` 1 列、el-dialog 92% 宽（全局规则已覆盖）
- [ ] 8.2 视觉规范扫描：字号 16/14/12/10px、12px 辅助文字用 `var(--el-text-color-secondary)`、无 13/15px
- [ ] 8.3 无障碍检查：图标按钮含 `aria-label`
- [ ] 8.4 启动开发服务器，6 个子模块逐一走查
