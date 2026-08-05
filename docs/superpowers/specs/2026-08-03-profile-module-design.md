# PC仲裁员端重构 - 第六阶段设计规范（"个人中心"模块）

## 1. 概述 (Overview)

本文档定义"PC仲裁员办案系统重构"第六阶段的设计规范，聚焦于 **"个人中心"模块（P0级核心模块）**。该模块管理仲裁员个人信息、职业资料及财务相关信息，是仲裁员维护个人档案与查询酬金的主入口。

本设计沿用前几阶段确立的视觉基调与技术架构，与待办事项模块（左右双栏侧栏模式）、案件详情页（`.section-card` 卡片体系）形成全站一致体验。

### 1.1 设计目标

- 提供 6 个并列子模块的清晰导航，沿用待办事项模块的左右双栏布局
- 个人信息、工作单位、银行账号信息采用就地切换编辑模式（只读态展示 + 编辑态表单）
- 个人履历支持 5 类履历记录的增删改查，采用表格 + 弹窗 CRUD 模式
- 酬金单提供筛选 + 列表 + 分页的明细查询能力（统计留给数据看板模块，避免重复）
- 仲裁员聘书支持卡片列表展示 + 图片大图预览 + PDF 下载

### 1.2 范围说明

| 内容 | 状态 |
|------|------|
| 左右双栏布局（局部侧栏 + 内容区，6 个嵌套子路由） | 本期实现 |
| 个人信息（基本信息就地编辑 + 修改密码 + 地址首选机制） | 本期实现 |
| 工作单位（就地编辑 + 附件管理） | 本期实现 |
| 个人履历（5 类履历表格 + 弹窗增删改 + 排序规则） | 本期实现 |
| 酬金单（筛选 + 列表 + 分页，案号可跳转） | 本期实现 |
| 银行账号信息（就地编辑 + 取酬身份判断） | 本期实现 |
| 仲裁员聘书（卡片列表 + 图片预览 + 下载） | 本期实现 |
| Pinia Store + Mock 数据 | 本期实现 |

### 1.3 命名约定

PRD 中表格写"个人简历"，详细说明写"个人履历"，两者指代同一子模块。本设计统一采用 **"个人履历"**，对应路由 `/profile/resume`、组件 `PersonalResume.vue`。

---

## 2. 信息架构 (Information Architecture)

个人中心为多子模块并列结构，沿用待办事项模块的左右双栏布局：

```
个人中心（/profile）
├── 左侧局部侧栏（200px，复用 .todos-sidebar 样式）
│   ├── 个人信息         → /profile/info
│   ├── 工作单位         → /profile/work
│   ├── 个人履历         → /profile/resume
│   ├── 酬金单           → /profile/fee
│   ├── 银行账号信息     → /profile/bank
│   └── 仲裁员聘书       → /profile/certificate
└── 右侧内容区（router-view，自适应）
```

**设计原则：**
- 子模块切换产生路由变化，支持浏览器前进/后退与直达链接
- `/profile` 重定向到 `/profile/info`（默认进入个人信息）
- 左侧侧栏 is-active 高亮由 `route.path` 直接匹配（沿用待办事项方案）

---

## 3. 路由与文件结构 (Routing & File Structure)

### 3.1 路由配置

沿用待办事项的嵌套子路由模式，在 `src/router/index.js` 的根布局 children 中新增：

```js
{
  path: 'profile',
  component: () => import('../views/profile/ProfileView.vue'),
  redirect: '/profile/info',
  children: [
    {
      path: 'info',
      name: 'ProfileInfo',
      component: () => import('../views/profile/components/PersonalInfo.vue'),
    },
    {
      path: 'work',
      name: 'ProfileWork',
      component: () => import('../views/profile/components/WorkUnit.vue'),
    },
    {
      path: 'resume',
      name: 'ProfileResume',
      component: () => import('../views/profile/components/PersonalResume.vue'),
    },
    {
      path: 'fee',
      name: 'ProfileFee',
      component: () => import('../views/profile/components/FeeList.vue'),
    },
    {
      path: 'bank',
      name: 'ProfileBank',
      component: () => import('../views/profile/components/BankAccount.vue'),
    },
    {
      path: 'certificate',
      name: 'ProfileCertificate',
      component: () => import('../views/profile/components/CertificateList.vue'),
    },
  ],
}
```

- 顶部导航"个人中心"菜单项 `index="/profile"` 已在 MainLayout 中预留，无需改动
- `resolveActiveMenu` 已能处理 `/profile/*` 子路由高亮（沿用既有方案）

### 3.2 文件目录

```
src/views/profile/
  ProfileView.vue                  # 容器：左侧 .todos-sidebar + 右侧 router-view
  components/
    PersonalInfo.vue               # 个人信息（基本信息+修改密码）
    WorkUnit.vue                   # 工作单位（含附件）
    PersonalResume.vue             # 个人履历（5类履历表格+弹窗CRUD）
    FeeList.vue                    # 酬金单（筛选+列表+分页）
    BankAccount.vue                # 银行账号信息
    CertificateList.vue            # 仲裁员聘书（卡片列表+预览+下载）
    shared/
      InfoSection.vue              # 可复用：就地编辑区块（标题+编辑按钮+slot切换只读/表单）
      ProfileEmptyState.vue        # 空状态组件
    resume/
      ResumeDialog.vue             # 履历增删改弹窗（按类型动态字段）
src/stores/
  profile.js                       # Pinia store（个人信息/工作单位/履历/银行/聘书 mock 数据）
```

**目录结构说明：**
- `ProfileView.vue` 结构与 `TodosView.vue` 完全一致，仅替换菜单项与图标
- `InfoSection.vue` 抽取"标题行 + 编辑/保存/取消按钮 + 只读 slot / 编辑 slot"的通用结构，被 PersonalInfo / WorkUnit / BankAccount 复用，避免重复实现就地切换逻辑
- `resume/ResumeDialog.vue` 单一弹窗组件，根据 `recordType` prop 动态渲染 5 类履历的不同字段表单
- 移动端侧栏处理沿用待办事项模块（不特殊处理，保持一致）

---

## 4. 整体布局 (Layout)

沿用待办事项模块的左右双栏布局，整页灰底 `#f7f7f7`：

```
┌────────────┬───────────────────────────────────────────┐
│            │                                           │
│  侧栏菜单  │            子模块内容区                    │
│  (200px)   │         (router-view, 自适应)              │
│            │                                           │
│  · 个人信息 │   复用 .section-card / .filter-bar /       │
│  · 工作单位 │   .table-section / .pagination-bar 等      │
│  · 个人履历 │   全局类，各子模块内部布局见 §5             │
│  · 酬金单   │                                           │
│  · 银行账号 │                                           │
│  · 仲裁员聘书│                                           │
│            │                                           │
└────────────┴───────────────────────────────────────────┘
```

**容器实现（ProfileView.vue）：** 与 `TodosView.vue` 结构一致：

```vue
<template>
  <div class="profile-view">
    <aside class="todos-sidebar">
      <div class="sidebar-title">个人中心</div>
      <el-menu :default-active="activeMenu" class="sidebar-menu" @select="handleMenuSelect">
        <el-menu-item index="/profile/info"><el-icon><User /></el-icon><span>个人信息</span></el-menu-item>
        <el-menu-item index="/profile/work"><el-icon><OfficeBuilding /></el-icon><span>工作单位</span></el-menu-item>
        <el-menu-item index="/profile/resume"><el-icon><Document /></el-icon><span>个人履历</span></el-menu-item>
        <el-menu-item index="/profile/fee"><el-icon><Money /></el-icon><span>酬金单</span></el-menu-item>
        <el-menu-item index="/profile/bank"><el-icon><CreditCard /></el-icon><span>银行账号信息</span></el-menu-item>
        <el-menu-item index="/profile/certificate"><el-icon><Medal /></el-icon><span>仲裁员聘书</span></el-menu-item>
      </el-menu>
    </aside>
    <section class="profile-content">
      <router-view />
    </section>
  </div>
</template>
```

- `activeMenu` 为 `computed(() => route.path)`
- `handleMenuSelect` 调用 `router.push(key)`
- 容器样式与 `TodosView.vue` 相同：`.profile-view { display: flex; min-height: calc(100vh - 100px); margin: -20px; }`，`.profile-content { flex: 1; padding: 20px; background-color: var(--el-bg-color-page); overflow: auto; }`

---

## 5. 各子模块详细设计

### 5.1 个人信息（PersonalInfo.vue）

**结构：** 两个 `.section-card`，分别为"基本信息"和"修改密码"。基本信息使用 `InfoSection.vue` 的就地编辑模式，修改密码始终为表单态。

#### 5.1.1 基本信息卡片

**字段清单：**

| 字段 | 控件 | 可编辑 | 说明 |
|------|------|--------|------|
| 姓名 | 文本展示 | 否 | 系统只读 |
| 身份证号 | 文本展示 | 否 | 系统只读 |
| 国籍/地区 | 文本展示 | 否 | 系统只读 |
| 其他证件 - 证件类型 | `el-select`（身份证/护照/港澳台证件等） | 是 | |
| 其他证件 - 证件号码 | `el-input` | 是 | |
| 其他证件 - 有效期 | `el-date-picker` | 是 | |
| 手机号码 | `el-input` + 手机号校验 | 是 | 只读态以 `tel:` 链接展示 |
| 性别 | `el-select`（男/女） | 是 | |
| 电子邮箱 | `el-input` + 邮箱校验 | 是 | 只读态以 `mailto:` 链接展示 |
| 居住地址 | `el-input` | 是 | 支持设为首选地址 |
| 单位地址 | `el-input` | 是 | 支持设为首选地址 |
| 其他地址 | `el-input` | 是 | 支持设为首选地址 |

**地址首选机制：**
- 三个地址字段各自带 `el-radio`，三选一标记为"首选地址"
- 切换时自动取消其他地址的首选标记（互斥）
- 只读态下首选地址以 10px 主题色 tag 标注"首选"

**只读态布局：**
- `el-descriptions` `:column="2"`，移动端 1 列（沿用 PartyDetailDrawer 响应式方案）
- 手机号/邮箱以主题色 `a` 链接展示（`tel:` / `mailto:` 协议，hover 下划线）
- 只读字段（姓名/身份证号/国籍）以纯文本展示

**编辑态：**
- 字段转为 `el-form`，底部"保存/取消"按钮
- 保存前校验：手机号格式（11 位、首位为 1）、邮箱格式（标准正则）、证件有效期
- 校验通过 → `store.updateBasicInfo(formData)` → `ElMessage.success('保存成功')` → 切回只读
- 校验失败 → `el-form` 显示对应错误信息，不切换状态

#### 5.1.2 修改密码卡片

**结构：** 始终为表单态（无需只读/编辑切换），底部"确认修改"按钮。

**切换方式：** 顶部 `el-radio-group` 切换"短信验证方式 / 旧密码方式"。

**短信验证方式字段：**
- 短信验证码：`el-input` + "获取验证码"按钮
  - 点击按钮后 60s 倒计时，倒计时中按钮禁用，文案"Xs 后重新获取"
  - mock 模式下不实际发送，仅模拟倒计时
- 输入新密码：`el-input type="password"` + 显示/隐藏切换
- 确认新密码：`el-input type="password"` + 显示/隐藏切换

**旧密码方式字段：**
- 输入旧密码：`el-input type="password"` + 显示/隐藏切换
- 输入新密码：`el-input type="password"` + 显示/隐藏切换
- 确认新密码：`el-input type="password"` + 显示/隐藏切换

**校验规则：**
- 新密码复杂度：8-20 位，含字母 + 数字；不满足提示"密码需 8-20 位且包含字母和数字"
- 两次密码一致：不一致提示"两次输入的密码不一致"
- 提交成功 → `ElMessage.success('密码修改成功')` → 清空表单

---

### 5.2 工作单位（WorkUnit.vue）

**结构：** 单个 `.section-card`，使用 `InfoSection.vue` 就地编辑模式。

**字段清单：**

| 字段 | 控件 | 说明 |
|------|------|------|
| 单位名称 | `el-input` | |
| 工作部门 | `el-input` | |
| 职务 | `el-input` | |
| 单位电话 | `el-input` + 电话格式校验 | 只读态以 `tel:` 链接展示 |
| 工作状态 | `el-select`（在职/退休） | |
| 单位传真 | `el-input` | |
| 单位地址 | `el-input` | |
| 备注 | `el-input type="textarea"` | |
| 附件 | `el-upload`（编辑态）/ 文件名链接列表（只读态） | 支持多文件，限制 pdf/doc/docx |

**只读态：**
- `el-descriptions` `:column="2"`
- 单位电话以 `tel:` 链接展示
- 附件以文件名链接列表展示，点击下载（mock 模式 `ElMessage.info` 提示）

**编辑态：**
- `el-form` + `el-upload`
- `el-upload` 配置：`action="#"` `:auto-upload="false"`，mock 模式仅记录文件名列表到 `attachments` 数组
- 保存校验通过 → `store.updateWorkUnit(formData)` → `ElMessage.success` → 切回只读

---

### 5.3 个人履历（PersonalResume.vue）— 最复杂

**结构：** 5 个 `.section-card`，每张卡片对应一类履历，卡片内为 `el-table` + "添加"按钮。

#### 5.3.1 5 类履历及字段

| 类别 | 字段 | 排序规则 |
|------|------|----------|
| 教育背景 | 起始日期、结束日期、在读院校、专业、学历、学位、附件 | 起始日期升序 |
| 外语能力 | 语种、附件 | 添加时间升序 |
| 培训/工作经历 | 起始日期、结束日期、单位/机构名称、职务/结业情况、附件 | 起始日期升序 |
| 主要专业成果 | 获得时间、成果名称、描述、附件 | 起始日期升序（"获得时间"作为起始日期） |
| 工作背景信息 | 起始日期、结束日期、名称、描述 | 起始日期升序 |

#### 5.3.2 每张卡片结构

```
.section-card
├── .section-title-row
│   ├── .section-title（如"教育背景"）
│   └── .section-actions → el-button「添加」
└── el-table（表格列根据类别动态生成）
    ├── 数据行
    │   └── 操作列：el-button link「编辑」/ el-button link「删除」
    └── #empty 插槽：「暂无履历记录」
```

#### 5.3.3 表格列定义（以教育背景为例）

| 列名 | 字段 | 宽度 | 交互 |
|------|------|------|------|
| 起始日期 | startDate | 120 | 展示 |
| 结束日期 | endDate | 120 | 展示 |
| 在读院校 | school | min 160 | `show-overflow-tooltip` |
| 专业 | major | min 140 | `show-overflow-tooltip` |
| 学历 | education | 100 | 展示 |
| 学位 | degree | 100 | 展示 |
| 附件 | attachments | 120 | 有则显示文件名链接，无则「-」 |
| 操作 | - | 120 | 「编辑」「删除」link 按钮 |

**附件列展示：** 有附件显示文件名（主题色 link，点击下载），无附件显示「-」。

**其他类别表格列：** 按各自字段动态生成，规则同上（日期列 120、名称列 min 160、描述列 min 180 + tooltip、附件列 120、操作列 120）。

#### 5.3.4 弹窗 CRUD（ResumeDialog.vue）

- `el-dialog`，标题根据模式动态生成：「添加教育背景」/「编辑教育背景」等
- `recordType` prop 决定渲染哪组字段表单（`education` / `language` / `training` / `achievement` / `workHistory`）
- 表单字段根据类别动态渲染：
  - 教育背景：起始日期、结束日期、在读院校、专业、学历、学位、附件
  - 外语能力：语种、附件
  - 培训/工作经历：起始日期、结束日期、单位/机构名称、职务/结业情况、附件
  - 主要专业成果：获得时间（表单标签为"获得时间"，数据字段映射为 `startDate`）、成果名称、描述、附件
  - 工作背景信息：起始日期、结束日期、名称、描述
- 附件字段统一用 `el-upload`（`auto-upload="false"`，mock 记录文件名）
- 底部"取消 / 确定"，确定前做必填校验（起止日期、名称等必填）

**删除操作（表格行内）：** 在 §5.3.2 表格操作列的"删除"按钮上直接使用 `el-popconfirm` 包裹，二次确认「确定删除该条履历记录？」，确认后调用 `store.deleteResumeRecord(type, id)`。删除交互在 PersonalResume.vue 表格内完成，不经过 ResumeDialog。

#### 5.3.5 排序实现

- 新增/编辑后由 store 按规则重排：
  - 外语能力按 `createdAt` 升序
  - 其余 4 类按 `startDate` 升序
- 组件读取 store 的 `getSortedResume(type)` computed，自动呈现排序结果
- 排序在 store 层处理，组件无需关心

---

### 5.4 酬金单（FeeList.vue）

**结构：** 上下两段式：① 筛选区（`.filter-bar`）+ ② 表格区（`.table-section` + `.pagination-bar`）。无统计卡（统计留给数据看板模块，避免重复）。

#### 5.4.1 筛选项

| 筛选项 | 控件 | 宽度 |
|--------|------|------|
| 案号 | `el-input` clearable | 180px |
| 结算状态 | `el-select`（全部/已结/未结） | 120px |
| 年份 | `el-select`（近 5 年 + 全部） | 120px |

操作按钮：查询 / 重置（`.filter-actions`，12px）

#### 5.4.2 表格字段

| 列名 | 字段 | 宽度 | 交互 |
|------|------|------|------|
| 案号 | caseNo | min 160 | **点击跳转** `/cases/:id`（el-link primary） |
| 案件名称 | caseName | min 180 | `show-overflow-tooltip` |
| 酬金金额（元） | amount | min 120 | 右对齐，千分位 + 2 位小数 |
| 结算状态 | status | 100 | `el-tag`（已结 success / 未结 warning） |
| 发放日期 | payDate | 140 | 未结显示「-」 |
| 办案秘书 | secretary | 120 | 展示 |
| 操作 | - | 100 | 「查看明细」link（mock：`ElMessage.info` 提示） |

#### 5.4.3 分页与空状态

- 分页：`.pagination-bar`，每页 5/10/20 条，`layout="total, prev, pager, next, sizes"` + `background` + `small`
- 空状态：`ProfileEmptyState` 组件（图标 + 「暂无酬金记录」）
- 筛选无结果：`el-table` `#empty` 插槽「暂无匹配数据」

---

### 5.5 银行账号信息（BankAccount.vue）

**结构：** 单个 `.section-card`，使用 `InfoSection.vue` 就地编辑模式。

**字段清单：**

| 字段 | 控件 | 说明 |
|------|------|------|
| 是否公务员/参公人员 | `el-radio-group`（是/否） | |
| 是否其他依法不取酬人员 | `el-radio-group`（是/否） | |
| 开户银行 | `el-select`（下拉选项，mock 银行列表） | |
| 账户名称 | 文本展示 | **不可修改**（系统只读，取自 `basicInfo.name`） |
| 银行账号 | `el-input` + 银行卡号校验 | |

**只读态：** `el-descriptions` `:column="2"`；"是否"字段展示"是/否"。

**编辑态：**
- `el-form`；账户名称始终为只读文本（非 input）
- 两个"是否"radio 改变时，若任一为"是"，`ElMessageBox.confirm` 提示"取酬人员身份变更将影响酬金发放，请确认"；取消则回退原值
- 银行账号校验：16-19 位数字；不通过提示"请输入正确的银行账号"

---

### 5.6 仲裁员聘书（CertificateList.vue）

**结构：** 卡片列表布局，每份聘书一张 `.section-card`（可能多份不同任期）。

**每张聘书卡片内容：**

| 字段 | 展示 |
|------|------|
| 聘任编号 | 文本 |
| 聘任期限 | 起始日期 ~ 结束日期 |
| 专业领域 | 文本 / tag |
| 聘任状态 | `el-tag`（有效 success / 已过期 info） |
| 聘书扫描件 | 缩略图（`el-image`，64x64） |
| 操作 | 「查看大图」link + 「下载 PDF」link |

**卡片结构：**

```
.section-card
├── .section-title-row
│   ├── .section-title（如"仲裁员聘书 - 第X届"）
│   └── .section-actions → el-tag（有效/已过期）
├── el-descriptions（:column="2"，移动端 1 列）
│   └── 聘任编号 / 聘任期限 / 专业领域 / 聘书扫描件（缩略图）
└── 操作区：「查看大图」「下载 PDF」
```

**查看大图：** `el-image` 的 `preview-src-list` 全屏预览扫描件。

**下载 PDF：** mock 模式下 `ElMessage.info` 提示"下载功能开发中"。

**空状态：** `ProfileEmptyState` 组件（图标 + 「暂无聘书记录」）。

**聘书状态判定：** `endDate` ≥ 当前日期为"有效"，否则为"已过期"（store computed 计算）。

---

## 6. 组件职责与数据流 (Component Architecture & Data Flow)

### 6.1 组件职责

| 组件 | 职责 | 对外接口 |
|------|------|----------|
| `ProfileView.vue` | 容器：左侧 `.todos-sidebar`（6 个菜单项）+ 右侧 `router-view` | 无 |
| `InfoSection.vue` | 通用就地编辑区块：标题行 + 编辑/保存/取消按钮 + 只读 slot / 编辑 slot 切换 | props: `title`; v-model: `editing`; slots: `view`, `edit`, `actions` |
| `PersonalInfo.vue` | 个人信息（基本信息 + 修改密码），含地址首选机制 | 无 |
| `WorkUnit.vue` | 工作单位（含附件），就地编辑 | 无 |
| `PersonalResume.vue` | 5 类履历表格 + 添加按钮 + 弹窗 CRUD 触发 | 无 |
| `ResumeDialog.vue` | 履历增删改弹窗，按 `recordType` 动态渲染字段 | props: `visible`, `recordType`, `editData`; emit: `save`, `close` |
| `FeeList.vue` | 酬金单筛选 + 表格 + 分页 | 无 |
| `BankAccount.vue` | 银行账号信息，就地编辑 | 无 |
| `CertificateList.vue` | 聘书卡片列表 + 图片预览 + 下载 | 无 |
| `ProfileEmptyState.vue` | 空状态组件 | props: `text`, `icon` |

### 6.2 Pinia Store（`stores/profile.js`）

集中管理个人中心全部 mock 数据与操作，按子模块分组：

```js
// 核心状态
{
  // —— 个人信息 ——
  basicInfo: {
    name: '张三',                    // 只读
    idCard: '4401**********1234',   // 只读
    nationality: '中国',            // 只读
    otherIdType: '', otherIdNo: '', otherIdExpiry: null,
    phone: '', gender: '', email: '',
    addresses: {
      home: '', work: '', other: '',
      preferred: 'home',            // 'home' | 'work' | 'other'
    },
  },

  // —— 工作单位 ——
  workUnit: {
    company: '', department: '', position: '',
    phone: '', status: 'active',    // 'active' | 'retired'
    fax: '', address: '', remark: '',
    attachments: [],                // [{ name, url }]
  },

  // —— 个人履历（5 类，每类数组） ——
  resume: {
    education: [],                  // [{ id, startDate, endDate, school, major, education, degree, attachments, createdAt }]
    language: [],                   // [{ id, language, attachments, createdAt }]
    training: [],                   // [{ id, startDate, endDate, org, result, attachments, createdAt }]
    achievement: [],                // [{ id, startDate, name, description, attachments, createdAt }]
    workHistory: [],                // [{ id, startDate, endDate, name, description, createdAt }]
  },

  // —— 酬金单 ——
  fee: {
    list: [],                       // 全量
    filters: { caseNo: '', status: '', year: '' },
    currentPage: 1, pageSize: 10,
  },

  // —— 银行账号 ——
  bank: {
    isCivilServant: 'no',           // 'yes' | 'no'
    isNonRemuneration: 'no',        // 'yes' | 'no'
    bankName: '',
    accountName: '张三',            // 只读，取自 basicInfo.name
    accountNo: '',
  },

  // —— 聘书 ——
  certificates: [],                 // [{ id, certNo, startDate, endDate, field, status, scanUrl }]
}
```

**核心方法：**

```js
// 个人信息
fetchBasicInfo()                          // 挂载时拉取
updateBasicInfo(data)                     // 保存基本信息
changePassword({ mode, ...payload })      // 修改密码（mode: 'sms' | 'old'）

// 工作单位
fetchWorkUnit()
updateWorkUnit(data)

// 个人履历
fetchResume()                             // 拉取全部 5 类
addResumeRecord(type, data)               // type: 'education' | 'language' | ...
updateResumeRecord(type, id, data)
deleteResumeRecord(type, id)
getSortedResume(type)                     // computed：按规则排序后的列表

// 酬金单
fetchFeeList()
applyFeeFilters() / resetFeeFilters()
getFilteredFees()                         // computed
getPagedFees()                            // computed

// 银行账号
fetchBank()
updateBank(data)

// 聘书
fetchCertificates()
```

### 6.3 数据流（关键路径）

**就地编辑保存（基本信息/工作单位/银行账号）：**

```
点击「编辑」 → InfoSection v-model:editing = true → slot 切换为表单
点击「保存」 → 组件内 el-form validate
  → 校验通过 → store.updateXxx(formData)
  → store 更新 state → ElMessage.success('保存成功')
  → editing = false → slot 切回只读，展示新数据
点击「取消」 → editing = false → 丢弃表单草稿，恢复只读
```

**个人履历增删改：**

```
点击「添加」 → ResumeDialog visible=true, recordType='education', editData=null
点击行「编辑」 → ResumeDialog visible=true, recordType='education', editData=row
弹窗「确定」 → el-form validate
  → 校验通过 → emit('save', { type, data, isEdit })
  → store.addResumeRecord / updateResumeRecord
  → store 内部按规则重排 → getSortedResume 重算 → 表格刷新
  → ElMessage.success → 弹窗关闭
点击行「删除」 → el-popconfirm 确认
  → store.deleteResumeRecord(type, id)
  → 表格刷新 → ElMessage.success('已删除')
```

**酬金单筛选 + 分页：**

```
挂载 → store.fetchFeeList()
点击查询 → store.applyFeeFilters() → currentPage=1 → getFilteredFees 重算
点击重置 → store.resetFeeFilters() → currentPage=1 → 重算
点击案号 → router.push('/cases/' + row.caseId)
分页变化 → store 更新 currentPage/pageSize → getPagedFees 重算
```

**地址首选切换：**

```
编辑态点击某地址的「设为首选」radio
 → basicInfo.addresses.preferred 更新
 → 只读态对应地址显示 10px「首选」tag
```

**当前阶段使用 Mock 数据：** 所有 store 方法返回本地静态/模拟数据。后续对接真实 API 时，只需替换 store 方法内部实现，组件层无需改动。

---

## 7. 视觉规范 (Visual Consistency)

沿用 DESIGN.md 确立的设计约束，确保全站一致性。本模块要点：

| 项目 | 规范 |
|------|------|
| 页面背景 | 灰底 `#f7f7f7` |
| 左侧侧栏 | 复用全局 `.todos-sidebar`（200px、is-active 3px 竖条、`#f2f5fa` 背景） |
| 内容区背景 | `var(--el-bg-color-page)`，padding 20px |
| 卡片 | `.section-card`（白底、1px `#e4e7ed` 边框、4px 圆角、padding 20px、`margin-bottom: 16px`） |
| 标题行 | `.section-title-row`（flex space-between），标题 14px 600 |
| 只读展示 | `el-descriptions` `:column="2"`，移动端 1 列（沿用 PartyDetailDrawer 响应式方案） |
| 表格 | 复用全局表头样式（`#f8f8f9` 灰底、行底分隔线、无竖向边框） |
| 筛选栏 | 复用全局 `.filter-bar` / `.filter-item` / `.filter-label`（56px 宽，左对齐） |
| 分页 | 复用 `.pagination-bar`（flex, flex-start, margin-top 16px） |
| 字号 | 严格 16/14/12/10px，禁 13/15px |
| 12px 辅助文字 | `var(--el-text-color-secondary)` `#606266`（WCAG AA） |
| 手机号/邮箱 | `tel:` / `mailto:` 链接，主题色，hover 下划线 |
| 操作按钮 | `el-button` link 类型，12px，主题色 |
| 状态 tag | 已结 success / 未结 warning / 聘书有效 success / 已过期 info |
| 移动端弹窗 | 沿用全局 `@media (max-width: 768px)` 规则（el-dialog 92% 宽 + 5vh margin） |
| 图标按钮 | 含 `aria-label`（无障碍） |

---

## 8. 边界情况处理 (Edge Cases)

| 场景 | 处理方式 |
|------|----------|
| 个人信息只读字段 | 姓名/身份证号/国籍/账户名称以纯文本展示，编辑态也不出现 input |
| 手机号格式校验 | 11 位数字、首位为 1；不通过则 `el-form` 校验提示"请输入正确的手机号" |
| 邮箱格式校验 | 标准邮箱正则；不通过提示"请输入正确的邮箱地址" |
| 证件有效期 | `el-date-picker`，过期不阻断保存但 `ElMessage.warning` 提示"证件已过期" |
| 地址首选互斥 | 三选一 radio，切换时自动取消其他地址的首选标记 |
| 密码复杂度 | 8-20 位含字母+数字；不满足提示"密码需 8-20 位且包含字母和数字" |
| 两次密码不一致 | 提交时校验，提示"两次输入的密码不一致" |
| 验证码倒计时 | 60s，倒计时中按钮禁用，文案"Xs 后重新获取" |
| 履历起止日期 | 结束日期不得早于起始日期；提示"结束日期不能早于起始日期" |
| 履历必填校验 | 起止日期、名称等必填，未填提示对应字段名 |
| 履历删除二次确认 | `el-popconfirm`「确定删除该条履历记录？」 |
| 履历空列表 | `el-table` `#empty` 插槽「暂无履历记录」 |
| 履历附件无 | 附件列显示「-」 |
| 酬金单无数据 | `ProfileEmptyState`「暂无酬金记录」 |
| 酬金案号跳转 | 跳转到 `/cases/:id`，沿用 MainLayout 的 `resolveActiveMenu` 高亮"我的案件" |
| 酬金未结发放日期 | 显示「-」 |
| 银行账号"是否"取酬变更 | 任一改为"是"时 `ElMessageBox.confirm` 提示影响酬金发放，取消则回退 |
| 银行账号格式 | 16-19 位数字；不通过提示"请输入正确的银行账号" |
| 聘书扫描件加载失败 | `el-image` 错误插槽显示「图片加载失败」 |
| 聘书下载（mock） | `ElMessage.info`「下载功能开发中」 |
| 加载中 | `el-table` `v-loading` + 品牌色 spinner |
| 移动端 | `el-descriptions` 1 列；el-dialog 92% 宽（全局规则） |

---

## 9. 后续规划 (Next Steps)

完成本模块开发与数据 mock 后，个人中心模块作为 P0 核心模块将闭环。后续阶段可推进：

- **数据统计看板模块**（PRD 第九节）：承接个人中心酬金单的统计数据可视化，避免与本模块重复
- **专家咨询模块**（PRD 第七节）：P2 优先级，可后续迭代
- **辅助功能模块**（PRD 第八节）：审理指引、裁决书及案例列表、仲裁员须知
- **移动端适配深化**（PRD 第十一节）：本模块已遵循移动端基础适配规则，后续可针对核心场景优化
