# PC仲裁员端重构 - 第一阶段实施计划（整体框架与首页功能区）

## 阶段 1: 项目初始化与基础配置 (Project Setup)
- [x] **框架搭建**：初始化 Vue 3 + Vite 项目。
- [x] **依赖安装**：安装 `element-plus`, `vue-router`, `pinia`, `sass`, `@iconify/vue`。
- [x] **主题定制**：在全局 SCSS 文件中覆盖 Element Plus 默认的 CSS Variables：
  - 将 `--el-color-primary` 设置为 `#053d99`
  - 将 `--el-text-color-primary` 关联深色 `#00296b` 等
  - 设定全局页面背景色 `--el-bg-color-page` 为 `#F0F2F5`
- [x] **全局样式重置**：清理浏览器默认样式，确保卡片阴影关闭（或在全局组件默认配置中关闭 `el-card` 的阴影）。

## 阶段 2: 路由与全局布局 (Routing & Layout)
- [x] **路由配置**：配置 Vue Router，建立基础的首页路由 `/`。
- [x] **核心布局容器**：创建 `src/layout/MainLayout.vue`，实现上下结构的页面布局。
- [x] **顶部导航 (Header)**：
  - 开发包含系统 Logo 和名称的左侧区域。
  - 使用 `el-menu`（mode="horizontal"）实现中间主导航，调整选中态的底边框高亮样式。
  - 开发右侧用户信息及下拉菜单（退出登录）。
- [x] **主内容区 (Main)**：配置最大宽度 1440px、水平居中，并应用两边安全留白。

## 阶段 3: 首页骨架与基础组件结构 (Dashboard Skeleton)
- [x] **首页视图**：创建 `src/views/home/HomeView.vue`。
- [x] **栅格布局**：使用 `el-row` 和 `el-col` 搭建 16:8 的左右双栏布局，Gutter 设为 20px。
- [x] **卡片封装**：建立基础的首页卡片样式（纯白底、1px `#E4E7ED` 边框、4px 圆角）。
- [x] **组件占位**：在 `HomeView` 中引入即将开发的 5 个子组件占位。

## 阶段 4: 左栏核心业务组件开发 (Left Column)
- [x] **TodoStats.vue (待办中心)**：
  - 使用 CSS Grid 实现数据汇总卡片的横向排列。
  - 编写悬浮微交互样式（背景变浅灰），对接 Mock 数据展示待办数字。
- [x] **HearingList.vue (近期开庭)**：
  - 封装 `el-table`，定制灰色表头（`#F5F7FA`）。
  - 实现状态标签（待开庭/已开庭）的 Tag 渲染。
- [x] **NotificationList.vue (消息通知)**：
  - 实现精简消息列表，包含标题、接收时间、未读状态红点。
  - 头部添加“全部已读”等无边框文本按钮。

## 阶段 5: 右栏辅助工具组件开发 (Right Column)
- [x] **CalendarBoard.vue (日程安排)**：
  - 引入并定制 `el-calendar`，隐藏复杂的默认头部，仅保留简易的上下月切换。
  - 实现基于日期的自定义渲染（带有待办事项的日期展示品牌色小圆点）。
  - 底部补充“今日待办”文本列表模块。
- [x] **LegalSearch.vue (法律检索)**：
  - 实现顶部的 `el-radio-group`（按钮样式）切换“法律法规”与“司法案例”。
  - 实现底部占满宽度的 `el-input` 搜索框及 Icon。

## 阶段 6: 联调与自测 (Review & Polish)
- [x] **Mock 数据注入**：为各组件填入逼真的测试数据，确保页面撑起后的视觉效果。
- [x] **响应式检查**：测试 1440px 及以下常见笔记本屏幕的适配情况。
- [x] **设计规范验收**：逐一核对《设计规范》中的视觉硬约束（确认无多余阴影、无发光描边、无错误的高饱和度色彩）。
