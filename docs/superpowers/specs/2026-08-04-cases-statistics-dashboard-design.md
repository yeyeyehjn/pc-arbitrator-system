# 数据统计看板设计文档

> **版本**：v1.0
> **日期**：2026-08-04
> **状态**：已确认，待实施
> **PRD 来源**：`docs/仲裁员PC端办案系统_PRD_V1.0.md` 第九章
> **优先级**：P1（重构期落地）

---

## 一、背景与目标

### 1.1 背景

PRD 第九章定义了"数据统计看板"作为新增模块，为仲裁员提供个人办案数据的多维度可视化分析。本章原计划包含 5 个图板，经评审后**去除"裁调撤情况季度柱状图"**，本轮实际开发 4 个图板。

### 1.2 目标

- 为仲裁员提供个人办案数据的多维度可视化分析
- 支持「时间范围筛选 → 图表展示 → 点击下钻到案件列表」的完整闭环
- 保持与项目设计系统、响应式规范、无障碍标准的一致

### 1.3 核心问题（看板要回答的决策问题）

| 视角 | 问题 |
|---|---|
| 构成 | 新收案件中独任/首席/边裁的比例分布如何？ |
| 风险 | 在办案件中有多少已延期（需警示）？ |
| 效率 | 办结案件中裁决/调解/撤案的占比与历史同比如何？ |
| 结构 | 办理案件 Top5 案由分布如何？ |

### 1.4 数据更新模型

**非实时流**——数据按日期范围批量聚合（按组庭/结案时间统计），属于"分析型看板"而非"监控型看板"。因此不需要流式更新、ring buffer、sub-second 刷新；需要明确的"统计中"加载态与"最近更新时间"提示。

---

## 二、入口位置与导航改造

### 2.1 入口方案

**在"我的案件"页面增加左侧菜单栏目**，包含 2 项（第 3 项预留扩展位）：

| 序号 | 菜单项 | 路由 | 本轮状态 |
|---|---|---|---|
| 1 | 我的案件 | `/cases/list` | 开发（迁移原 CasesView 内容） |
| 2 | 数据统计 | `/cases/statistics` | 开发（本轮新增） |
| (3) | (申请专家咨询案件) | (`/cases/expert-consultation`) | 暂不开发，未来扩展 |

### 2.2 方案理由

1. **语义内聚**——"我的案件"、"数据统计"（未来含"申请专家咨询案件"）本质都是围绕"案件"的不同视角。
2. **导航模式一致**——与 `TodosView`、`ProfileView` 的页面级二级导航模式完全一致。
3. **顶部导航保持 4 项不膨胀**——"我的案件"作为父入口向下展开子菜单。
4. **同时解决 PRD 第七章"专家咨询"模块落地位置**（未来扩展）。

### 2.3 路由调整

```
/cases (父路由，重定向到 /cases/list)
├── /cases/list           → 案件列表（原 CasesView 的 StatsBoard + Filter + Table）
├── /cases/statistics     → 数据统计看板（新增）
├── /cases/:id            → 案件详情（保持不变）
└── /cases/:id/material-reader → 材料阅览（保持不变）
```

### 2.4 CasesView 改造为容器

参考 `src/views/todos/TodosView.vue` 的页面级二级导航模式：左栏固定宽度二级菜单，右栏 `<router-view />` 渲染对应子路由内容。

**移动端**：左侧菜单转为顶部下拉选择器（与 todos 页移动端处理保持一致）。

### 2.5 顶部导航激活逻辑

`src/layout/MainLayout.vue` 的 `resolveActiveMenu` 无需改动——最长前缀匹配仍会将 `/cases/list`、`/cases/statistics`、`/cases/:id` 都激活顶部"我的案件"项。

---

## 三、页面整体架构与布局

### 3.1 页面骨架

```
StatisticsView.vue（容器）
├── 筛选配置区（FilterBar）
│   ├── 标题区：「数据统计」标题 + 范围摘要文案「日期 ~ 日期 · 共 N 天」
│   ├── 快捷筛选按钮组：今年 | 近半年 | 近三个月
│   ├── 自定义日期范围：起始日期选择器 + 结束日期选择器
│   └── 清除筛选按钮（↺ 图标）
│
├── 统计中加载态（条件渲染，覆盖下方区域）
│   └── 半透明遮罩 + "统计中" 脉冲指示器
│
└── 图表区（响应式网格，4 个图板）
    ├── [块1] 新收案件情况（环形图 + 图例三块）
    ├── [块2] 在办案件情况（双格指标卡片）
    ├── [块3] 办结案件情况（1+3 指标卡片）
    └── [块4] 办理案件 Top5 案由（横向进度条，满宽）
```

### 3.2 桌面端布局（≥992px）

CSS Grid 12 列，行间距 20px：

```
┌─────────────────────────────────────────────────────────────┐
│  筛选配置区（横跨 12 列）                                       │
├──────────────┬──────────────┬──────────────────────────────────┤
│  块1 新收案件  │  块2 在办     │  块3 办结案件                    │
│  环形图       │  指标卡片     │  指标卡片                         │
│  (4 列)       │  (4 列)      │  (4 列)                          │
├──────────────────────────────────────────────────────────────┤
│  块4 Top5 案由进度条（满宽 12 列）                               │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 平板端布局（768-991px）

2 列网格：
- 上排：块1 + 块2 并列
- 中排：块3（满宽）
- 下排：块4（满宽）

### 3.4 移动端布局（≤767px）

单列堆叠，顺序保持：筛选 → 块1 → 块2 → 块3 → 块4。

**关键移动端规则**：
- 筛选配置区折叠为"筛选摘要条 + 展开按钮"，点击展开 `el-drawer`（方向 btt，宽度 90% !important）
- 每个图表块下方常驻显示核心数值（非 hover 才显示）
- 图表块之间间距 16px

### 3.5 阅读路径（视觉焦点顺序）

按"现状构成 → 风险警示 → 效率产出 → 结构画像"的认知逻辑：

1. 先看**新收案件构成**（我是谁、做什么角色）
2. 再看**在办案件风险**（有没有延期红灯）
3. 再看**办结案件效率**（产出质量如何）
4. 最后看**Top5 案由**（业务结构画像）

这一顺序在桌面端布局中从左到右、从上到下固化。

---

## 四、筛选配置区详细设计

### 4.1 区域结构

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 数据统计                                            2024.01.01 ~ 2024.12.31 · 共 366 天 │
│                                                                         │
│ [今年] [近半年] [近三个月]      起始日期 [____] 结束日期 [____]  [清除筛选 ↺] │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 元素细节

| 元素 | 实现 | 状态逻辑 |
|---|---|---|
| 标题「数据统计」 | 16px / 600 / `--el-text-color-primary` | 常驻 |
| 范围摘要文案 | 12px / `--el-text-color-secondary`，格式「YYYY.MM.DD ~ YYYY.MM.DD · 共 N 天」 | 跟随筛选变化实时更新 |
| 快捷按钮组 | `el-radio-group` `button` 模式，3 个 `el-radio-button`：今年 / 近半年 / 近三个月 | 选中态高亮蓝色（`--el-color-primary`）；手动改日期时自动取消高亮 |
| 起始日期选择器 | `el-date-picker` `type="date"`，placeholder「起始日期」，12px 字号 | 起 > 结时自动纠正互换 |
| 结束日期选择器 | `el-date-picker` `type="date"`，placeholder「结束日期」，12px 字号 | 同上 |
| 清除筛选 | 文本按钮 + `RefreshLeft` 图标，12px / 主题色 | 点击回到默认「今年」范围 |

### 4.3 三种日期范围预设规则

| 预设 | 计算规则（基于 today） |
|---|---|
| 今年 | 当年 1/1 00:00 → 今日 23:59 |
| 近半年 | 今日前推 6 个月 → 今日 |
| 近三个月 | 今日前推 3 个月 → 今日 |

### 4.4 预设与自定义日期的互斥逻辑

- 点击预设 → 同步填充两个日期选择器的值 + 清除其他预设高亮
- 手动改任一日期选择器 → 所有预设按钮取消高亮（视为自定义范围）
- 点击清除筛选 → 回到「今年」预设的默认高亮状态

### 4.5 加载态（统计中指示器）

触发时机：日期范围变更后发起后端聚合请求期间。

视觉表现：
- 半透明遮罩覆盖图表区（不阻挡操作，仅视觉提示）
- 中央显示「统计中」+ 脉冲圆点（蓝色呼吸效果）

**无障碍降级**：
- `prefers-reduced-motion: reduce` 时，脉冲动画停止，仅显示静态「统计中」文字
- 遮罩 `aria-live="polite"` + `role="status"`，屏幕阅读器播报"正在统计中"

**请求失败态**：
- 遮罩消失，图表区显示 `CaseEmptyState` 组件（项目通用空状态），文案「暂无统计数据」+ 重试按钮

### 4.6 移动端折叠（≤768px）

筛选配置区折叠为「筛选摘要条」：

```
┌─────────────────────────────────────┐
│ 筛选：今年 · 共 366 天       [展开 ▼] │
└─────────────────────────────────────┘
```

点击展开 → `el-drawer`（方向 btt，从底部滑出），内含完整筛选控件。抽屉宽度遵循项目约束：`width: 90% !important`（非全屏抽屉）。

点击「确认」或关闭抽屉 → 焦点返回筛选摘要条，图表区根据新条件重新渲染。

### 4.7 关键交互约束

1. **URL 状态持久化**——日期范围通过 query 参数 `?start=YYYY-MM-DD&end=YYYY-MM-DD&preset=year` 持久化到 URL，支持复制链接分享与浏览器前进后退
2. **防抖**——日期选择器 change 事件防抖 300ms，避免快速切换时多次请求
3. **键盘可达**——所有筛选控件可通过 Tab 顺序聚焦；预设按钮组支持 ←/→ 方向键切换
4. **对比度**——快捷按钮未选中态文字使用 `--el-text-color-regular`（≥4.5:1 对比度），选中态白色文字 + 主题色背景

---

## 五、4 个图板详细设计

### 5.1 块 1：新收案件情况（环形图）

#### 5.1.1 视觉结构

```
┌──────────────────────────────────┐
│ 新收案件情况          共 86 件    │  ← 标题行：16px/600；右侧总数 14px/400
├──────────────────────────────────┤
│                                  │
│        ╭─────────╮               │
│       │  86      │               │  ← 环心：总数 24px/700 + 「件」12px
│       │  件      │               │     居中对齐
│        ╰─────────╯               │
│                                  │
│  ● 独任  32  37.2%   点击查看 →   │  ← 三块图例：色点+名称+数值+占比+操作
│  ● 首席  28  32.6%   点击查看 →   │     14px/名称，12px/数值占比
│  ● 边裁  26  30.2%   点击查看 →   │     hover 时整行高亮浅蓝底
│                                  │
└──────────────────────────────────┘
```

#### 5.1.2 数据字段

```typescript
interface NewCasesData {
  total: number
  segments: Array<{
    type: 'sole' | 'chief' | 'side'  // 独任/首席/边裁
    label: string
    count: number
    ratio: number  // 0-1
    color: string
  }>
}
```

#### 5.1.3 颜色映射

| 类型 | 色值 | 用途 |
|---|---|---|
| 独任 | `#1E62EC`（蓝） | 环段填充 + 图例色点 |
| 首席 | `#F59E0B`（橙） | 同上 |
| 边裁 | `#74C080`（绿） | 同上 |

**无障碍冗余编码**：除颜色外，每个环段附直接标签（图例显示名称+数值+占比），环段本体 hover 时显示 Tooltip 含名称+数值。颜色非唯一编码。

#### 5.1.4 交互

| 触发 | 行为 |
|---|---|
| hover 环段 | 该段亮度提升 + 其他段半透明；Tooltip 显示「独任 · 32 件 · 37.2%」 |
| hover 图例行 | 整行浅蓝底高亮；对应环段同步高亮联动 |
| click 图例行 | 跳转 `/cases/list?role=sole&startDate=...&endDate=...` 案件列表 |
| click 环段 | 同 click 图例行 |
| 键盘 Tab | 焦点先到环图（role="img"），再到 3 个图例行（role="button"） |

#### 5.1.5 空状态

`total === 0` → 隐藏环图，显示 `CaseEmptyState` 文案「该时段暂无新收案件」。

#### 5.1.6 移动端

环图缩小为 160px × 160px，图例从纵向列表改为 2 列网格（节省高度），点击仍可跳转。

---

### 5.2 块 2：在办案件情况（双格指标卡片）

#### 5.2.1 视觉结构

```
┌──────────────────────────────────┐
│ 在办案件情况                       │  ← 标题行
├──────────────────┬───────────────┤
│                  │                │
│      42          │       3        │  ← 主数值：32px/700
│                  │                │
│   在办案件        │    已延期案件   │  ← 标签：14px/400
│                  │                │
│   [点击查看 →]    │   [点击查看 →]  │  ← 操作链接：12px/主题色
│                  │                │
└──────────────────┴───────────────┘
```

#### 5.2.2 已延期高亮规则

```
已延期数 === 0 → 数值使用 --el-text-color-primary（黑色）
已延期数  >  0 → 数值使用 #E04B6F（玫红）+ 右上角警示图标 Warning
```

**玫红高亮的语义**：审限到期风险提示，与项目已有"即将延期（黄色）/ 已延期（红色）"色彩语义一致。

#### 5.2.3 数据字段

```typescript
interface OngoingCasesData {
  ongoingCount: number    // 非已结案案件数
  overdueCount: number    // 有待开庭且过期的案件数
}
```

#### 5.2.4 交互

| 触发 | 行为 |
|---|---|
| hover 卡片 | 卡片轻微上浮 + 阴影加深（hover 提示可点击） |
| click 在办卡片 | 跳转 `/cases/list?status=ongoing` |
| click 已延期卡片 | 跳转 `/cases/list?status=overdue` |

#### 5.2.5 无障碍

- 每个卡片 `role="button"` + `aria-label`：例如「在办案件 42 件，点击查看列表」
- 已延期数 > 0 时 `aria-label` 追加「存在审限风险」
- 颜色非唯一编码：除玫红色外，附 Warning 图标作为冗余提示

#### 5.2.6 移动端

两卡片横向并排保持，宽度各 50%；数值字号降为 28px。

---

### 5.3 块 3：办结案件情况（1+3 指标卡片）

#### 5.3.1 视觉结构

```
┌────────────────────────────────────────────┐
│ 办结案件情况                                │
├────────────────────────────────────────────┤
│                                            │
│            58                              │  ← 办结总数：32px/700
│            件                              │
│   同比 ▲ 12.5%   ← 涨：绿色 #67C23A       │  ← 同比标签：12px，▲/▼ 箭头
│                                            │
├──────────────┬──────────────┬──────────────┤
│              │              │              │
│   裁决率      │   调解率      │   撤案率      │  ← 分项标签：12px/400
│              │              │              │
│   62%        │   25%        │   13%        │  ← 分项数值：20px/600
│              │              │              │
│  同比 ▼ 3.2% │ 同比 ▲ 1.8% │ 同比 ▲ 1.4%  │  ← 同比：12px，▼红 #E04B6F
│              │              │              │
│  [查看 →]    │  [查看 →]    │  [查看 →]    │
└──────────────┴──────────────┴──────────────┘
```

#### 5.3.2 同比涨跌色彩规则

| 情况 | 色值 | 图标 |
|---|---|---|
| 上涨（▲） | `#67C23A`（绿） | `CaretTop` 图标 |
| 下降（▼） | `#E04B6F`（玫红） | `CaretBottom` 图标 |
| 持平 | `--el-text-color-secondary` | `Minus` 图标 + "持平"文案 |

**注意**：比率涨跌的色彩不区分"好坏"，仅区分"方向"。这是因为裁决率上升未必好、撤案率上升未必坏，避免做价值判断。

#### 5.3.3 数据字段

```typescript
interface ClosedCasesData {
  total: number
  totalYoY: number | null  // 同比涨跌百分比，null 表示无对比数据
  breakdown: Array<{
    type: 'arbitration' | 'mediation' | 'withdrawal'  // 裁决/调解/撤案
    label: string
    rate: number  // 0-1
    yoy: number | null  // 同比涨跌
    count: number  // 对应案件数
  }>
}
```

#### 5.3.4 交互

| 触发 | 行为 |
|---|---|
| hover 总数卡 | 显示 Tooltip「按结案时间统计」 |
| hover 分项卡 | 显示 Tooltip 含「XX 件 · 占比 YY%」 |
| click 总数卡 | 跳转 `/cases/list?closedType=all&...` |
| click 裁决率 | 跳转 `/cases/list?closedType=arbitration&...` |
| click 调解率 | 跳转 `/cases/list?closedType=mediation&...` |
| click 撤案率 | 跳转 `/cases/list?closedType=withdrawal&...` |

#### 5.3.5 无障碍

- 总数卡片 `aria-label`：「办结案件 58 件，同比上涨 12.5%」
- 分项卡片 `aria-label`：「裁决率 62%，同比下跌 3.2%，对应 36 件」
- 颜色非唯一编码：▲/▼ 图标作为冗余提示

#### 5.3.6 移动端

- 总数卡片满宽显示
- 3 个分项卡片横向排列保持，每张宽度 33.3%
- 数值字号降为 18px

---

### 5.4 块 4：办理案件 Top5 案由（横向进度条）

#### 5.4.1 视觉结构

```
┌──────────────────────────────────────────────────────────────┐
│ 办理案件 Top5 案由                              按组庭时间统计  │  ← 副标题：12px/secondary
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ 1  买卖合同纠纷      18 件  32.1%                            │
│    ████████████████░░░░░░░░░░░░                             │  ← 进度条：主题色 #1E62EC
│                                                              │
│ 2  借款合同纠纷      12 件  21.4%                            │
│    ███████████░░░░░░░░░░░░░░░░░                             │
│                                                              │
│ 3  建设工程合同纠纷   8 件  14.3%                            │
│    ████████░░░░░░░░░░░░░░░░░░░░                             │
│                                                              │
│ 4  房屋买卖合同纠纷   6 件  10.7%                            │
│    ██████░░░░░░░░░░░░░░░░░░░░░░                             │
│                                                              │
│ 5  劳动争议           5 件   8.9%                            │
│    █████░░░░░░░░░░░░░░░░░░░░░░░                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### 5.4.2 进度条视觉规则

- 进度条高度：8px，圆角 4px
- **进度计算**：以第 1 名案件数为基准（100%），其余按比例。这样视觉对比更明显（非以总数为基准，否则全是短条）。
- 已填充部分：`#1E62EC`（主题蓝）
- 未填充部分：`--el-fill-color-light`（浅灰底）
- 排名序号：16px / 600 / 圆形描边样式
- 案由名称：14px / `--el-text-color-regular`
- 案件数 + 占比：12px / `--el-text-color-secondary`，右对齐

#### 5.4.3 数据字段

```typescript
interface TopCausesData {
  causes: Array<{
    rank: number
    name: string
    count: number
    ratio: number  // 0-1
  }>
  // 至多 5 项，不足 5 项时只显示实际数量
}
```

#### 5.4.4 交互

| 触发 | 行为 |
|---|---|
| hover 行 | 整行浅蓝底高亮 |
| click 案由名称或整行 | 跳转 `/cases/list?cause=买卖合同纠纷&...`（案由名称 URL 编码） |
| 键盘 Tab | 焦点落在每一行（role="link"），回车跳转 |

#### 5.4.5 空状态

无数据 → `CaseEmptyState` 文案「该时段暂无案件」。

#### 5.4.6 移动端

- 序号 + 名称 + 数值改 2 行布局：第 1 行为序号+名称+数值，第 2 行为进度条满宽
- 行间距增大为 12px

---

### 5.5 通用视觉规范（4 个图板共用）

| 元素 | 规范 |
|---|---|
| 卡片容器 | 项目通用 `.section-card` 类，`scroll-margin-top: 100px` |
| 卡片标题 | 16px / 600 / `--el-text-color-primary` |
| 卡片副标题 | 12px / `--el-text-color-secondary` |
| 卡片内边距 | 20px |
| 卡片间距 | 20px（gutter） |
| 数值字号 | 大数值 32px/700，分项数值 20px/600，小数值 14px/400 |
| 辅助文案 | 12px / `--el-text-color-secondary`（`#606266`，WCAG AA 合规） |
| 跳转操作 | "点击查看 →" 文本按钮，12px，主题色，hover 下划线 |
| 空状态 | 一律使用 `CaseEmptyState` 组件 |
| 加载态 | 半透明遮罩 + "统计中" 脉冲指示器（遵循 `prefers-reduced-motion`） |

---

## 六、技术实现方案

### 6.1 目录结构

```
src/views/cases/
├── CasesView.vue                    (改造为容器)
├── components/
│   ├── StatsBoard.vue               (原文件，移入 CaseListPanel)
│   ├── CaseFilter.vue               (原文件)
│   ├── CaseTable.vue                (原文件)
│   └── CaseListPanel.vue            (新增：组合 StatsBoard + CaseFilter + CaseTable)
└── statistics/                      (新增目录)
    ├── StatisticsView.vue           (容器：筛选区 + 4 个图板)
    ├── components/
    │   ├── FilterBar.vue             (筛选配置区)
    │   ├── NewCasesChart.vue        (块1 环形图)
    │   ├── OngoingCasesCard.vue      (块2 双格指标卡片)
    │   ├── ClosedCasesCard.vue      (块3 1+3 指标卡片)
    │   └── TopCausesChart.vue        (块4 横向进度条)
    └── composables/
        └── useStatisticsData.js     (数据获取与聚合逻辑)
```

### 6.2 路由配置

`src/router/index.js` 调整：

```javascript
// 原 /cases 路由改造为父路由
{
  path: '/cases',
  component: CasesView,  // 改为容器组件（含左侧菜单）
  redirect: '/cases/list',
  children: [
    {
      path: 'list',
      name: 'CaseList',
      component: () => import('@/views/cases/components/CaseListPanel.vue')
    },
    {
      path: 'statistics',
      name: 'CaseStatistics',
      component: () => import('@/views/cases/statistics/StatisticsView.vue')
    }
    // /cases/:id 和 /cases/:id/material-reader 保持原样作为子路由
  ]
}
```

### 6.3 CasesView 改造为容器

参考 `src/views/todos/TodosView.vue` 的页面级二级导航模式：

```vue
<template>
  <div class="cases-container">
    <aside class="cases-sidebar">
      <el-menu :default-active="activeMenu" @select="handleMenuSelect">
        <el-menu-item index="/cases/list">
          <el-icon><Document /></el-icon>
          <span>我的案件</span>
        </el-menu-item>
        <el-menu-item index="/cases/statistics">
          <el-icon><TrendCharts /></el-icon>
          <span>数据统计</span>
        </el-menu-item>
      </el-menu>
    </aside>
    <main class="cases-content">
      <router-view />
    </main>
  </div>
</template>
```

**移动端**：左侧菜单改为顶部下拉选择器（与 todos 页移动端处理保持一致）。

### 6.4 图表渲染库选型

**选择 ECharts 5.x**。

| 维度 | 理由 |
|---|---|
| 环形图 | ECharts `pie` + `radius` 内径原生支持 |
| 横向进度条 | ECharts `bar` 横向 + 自定义 series |
| 响应式 | ECharts `resize` 监听容器尺寸，移动端天然适配 |
| 无障碍 | ECharts 5+ 支持 `aria` 配置项自动生成图表描述 |
| 中文文档 | 阿里出品，文档完整，团队熟悉度高 |
| 体积 | 按需引入可控制在 ~150KB gzip |
| 集成 | `vue-echarts` 包装层 + `defineAsyncComponent` 懒加载 |

**未选 D3 / Vega-Lite** 的原因：4 个图板都是标准图表类型，ECharts 开箱即用；D3 需手写大量 SVG 代码，Vega-Lite 在中文场景下 Tooltip 配置繁琐。

**未选 Canvas2D / WebGL** 的原因：Mark 数量极少（≤20），SVG 渲染完全足够，且 ECharts SVG 渲染模式（`renderer: 'svg'`）天然无障碍（输出 DOM 节点）。

#### 依赖安装

```bash
npm install echarts vue-echarts
```

#### 按需引入配置

`src/utils/echarts.js`：

```javascript
import { use } from 'echarts/core'
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers'
import { PieChart, BarChart } from 'echarts/charts'
import {
  TitleComponent, TooltipComponent, LegendComponent,
  GridComponent, DatasetComponent
} from 'echarts/components'

use([
  CanvasRenderer, SVGRenderer,
  PieChart, BarChart,
  TitleComponent, TooltipComponent, LegendComponent,
  GridComponent, DatasetComponent
])
```

采用 **SVGRenderer**（`renderer: 'svg'`）以获得更好的无障碍支持和清晰度。

### 6.5 状态管理

`src/stores/statistics.js`：

```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useStatisticsStore = defineStore('statistics', () => {
  // 筛选状态
  const dateRange = ref({ start: '', end: '' })
  const preset = ref('year')  // 'year' | 'halfYear' | 'threeMonths' | null
  const isLoading = ref(false)
  const error = ref(null)

  // 图表数据
  const newCasesData = ref(null)      // 块1
  const ongoingCasesData = ref(null)  // 块2
  const closedCasesData = ref(null)   // 块3
  const topCausesData = ref(null)     // 块4

  // 计算属性：范围摘要文案
  const rangeSummary = computed(() => {
    if (!dateRange.value.start || !dateRange.value.end) return ''
    const days = dayDiff(dateRange.value.start, dateRange.value.end) + 1
    return `${formatDate(dateRange.value.start)} ~ ${formatDate(dateRange.value.end)} · 共 ${days} 天`
  })

  // 动作：加载数据
  async function loadAll() {
    isLoading.value = true
    error.value = null
    try {
      const [n, o, c, t] = await Promise.all([
        fetchNewCases(dateRange.value),
        fetchOngoingCases(dateRange.value),
        fetchClosedCases(dateRange.value),
        fetchTopCauses(dateRange.value)
      ])
      newCasesData.value = n
      ongoingCasesData.value = o
      closedCasesData.value = c
      topCausesData.value = t
    } catch (e) {
      error.value = e
    } finally {
      isLoading.value = false
    }
  }

  // 动作：设置预设范围
  function setPreset(type) {
    preset.value = type
    dateRange.value = computePresetRange(type)
  }

  // 动作：设置自定义范围
  function setCustomRange(start, end) {
    preset.value = null  // 取消预设高亮
    if (new Date(start) > new Date(end)) {
      [start, end] = [end, start]  // 自动纠正互换
    }
    dateRange.value = { start, end }
  }

  // 动作：清除筛选
  function clearFilters() {
    setPreset('year')
  }

  return {
    dateRange, preset, isLoading, error, rangeSummary,
    newCasesData, ongoingCasesData, closedCasesData, topCausesData,
    loadAll, setPreset, setCustomRange, clearFilters
  }
})
```

### 6.6 URL 状态同步

在 `StatisticsView.vue` 中通过 `watch` 双向同步 store 与路由 query：

```javascript
const route = useRoute()
const router = useRouter()
const store = useStatisticsStore()

// 初始化：从 URL 读取
onMounted(() => {
  const { start, end, preset } = route.query
  if (preset && ['year', 'halfYear', 'threeMonths'].includes(preset)) {
    store.setPreset(preset)
  } else if (start && end) {
    store.setCustomRange(start, end)
  } else {
    store.setPreset('year')  // 默认今年
  }
  store.loadAll()
})

// store 变化 → 更新 URL
watch(() => store.dateRange, (range) => {
  router.replace({
    query: {
      ...route.query,
      start: range.start,
      end: range.end,
      preset: store.preset || undefined
    }
  })
}, { deep: true })

// store 变化 → 重新加载数据（防抖 300ms）
watch(() => store.dateRange, debounce(() => store.loadAll(), 300), { deep: true })
```

### 6.7 组件 Props 契约

#### 块 1 `NewCasesChart.vue`

```typescript
defineProps<{
  data: {
    total: number
    segments: Array<{
      type: 'sole' | 'chief' | 'side'
      label: string
      count: number
      ratio: number
      color: string
    }>
  }
}>()

defineEmits<{
  (e: 'navigate', payload: { role: string }): void
}>()
```

#### 块 2 `OngoingCasesCard.vue`

```typescript
defineProps<{
  data: {
    ongoingCount: number
    overdueCount: number
  }
}>()

defineEmits<{
  (e: 'navigate', payload: { status: 'ongoing' | 'overdue' }): void
}>()
```

#### 块 3 `ClosedCasesCard.vue`

```typescript
defineProps<{
  data: {
    total: number
    totalYoY: number | null
    breakdown: Array<{
      type: 'arbitration' | 'mediation' | 'withdrawal'
      label: string
      rate: number
      yoy: number | null
      count: number
    }>
  }
}>()

defineEmits<{
  (e: 'navigate', payload: { closedType: string }): void
}>()
```

#### 块 4 `TopCausesChart.vue`

```typescript
defineProps<{
  data: {
    causes: Array<{
      rank: number
      name: string
      count: number
      ratio: number
    }>
  }
}>()

defineEmits<{
  (e: 'navigate', payload: { cause: string }): void
}>()
```

### 6.8 跳转到案件列表的 query 协议

所有图板的点击跳转统一走 `/cases/list?...` 路由，query 参数约定：

| 参数 | 类型 | 取值 |
|---|---|---|
| `startDate` | string (YYYY-MM-DD) | 当前筛选范围的起始日期 |
| `endDate` | string (YYYY-MM-DD) | 当前筛选范围的结束日期 |
| `role` | string | `sole` / `chief` / `side`（块1） |
| `status` | string | `ongoing` / `overdue`（块2） |
| `closedType` | string | `all` / `arbitration` / `mediation` / `withdrawal`（块3） |
| `cause` | string | 案由名称，URL 编码（块4） |

`CaseListPanel.vue`（原 CasesView 内容）在 `onMounted` 读取 query 参数，自动应用为筛选条件并触发查询。

### 6.9 Mock 数据策略

由于后端接口尚未定义，本轮先在 `src/stores/statistics.js` 内置 Mock 数据：

```javascript
const MOCK_NEW_CASES = {
  total: 86,
  segments: [
    { type: 'sole', label: '独任', count: 32, ratio: 0.372, color: '#1E62EC' },
    { type: 'chief', label: '首席', count: 28, ratio: 0.326, color: '#F59E0B' },
    { type: 'side', label: '边裁', count: 26, ratio: 0.302, color: '#74C080' }
  ]
}
// ... 其余 3 个图板的 Mock 数据
```

所有 `fetchXxx` 函数返回 `Promise.resolve(MOCK_XXX)`，方便前端独立开发与联调。后端就绪后替换为真实 `request` 调用即可。

### 6.10 性能预算

| 指标 | 预算 | 实际预估 |
|---|---|---|
| 首屏 JS bundle（echarts 按需） | ≤ 200KB gzip | ~150KB |
| 图表渲染时间 | ≤ 100ms | < 50ms（SVG 模式，Mark ≤ 20） |
| 数据加载时间 | ≤ 500ms（Mock） | < 50ms |
| 路由切换进入 | ≤ 200ms | < 100ms |
| 内存占用 | ≤ 10MB | < 5MB |

**懒加载策略**：
- `StatisticsView.vue` 在路由配置中 `component: () => import(...)` 异步加载
- 4 个图板子组件全部 `defineAsyncComponent` 异步加载
- `vue-echarts` 异步加载

### 6.11 响应式实现

#### ECharts 容器自适应

每个图板组件使用统一模式：

```vue
<template>
  <div ref="chartRef" class="chart-container" :style="{ height: '280px' }"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts/core'

const props = defineProps(['data'])
const chartRef = ref(null)
let chartInstance = null

onMounted(() => {
  chartInstance = echarts.init(chartRef.value, null, { renderer: 'svg' })
  chartInstance.setOption(buildOption(props.data))
  const resizeObserver = new ResizeObserver(() => chartInstance?.resize())
  resizeObserver.observe(chartRef.value)
})

watch(() => props.data, (newData) => {
  chartInstance?.setOption(buildOption(newData))
})

onBeforeUnmount(() => {
  chartInstance?.dispose()
})

function buildOption(data) {
  // 返回 ECharts 配置
}
</script>
```

#### CSS Grid 响应式

```scss
.statistics-grid {
  display: grid;
  gap: 20px;

  // 桌面端 ≥992px：3 上 + 1 下（块4满宽）
  @media (min-width: 992px) {
    grid-template-columns: repeat(3, 1fr);
    .top-causes-chart { grid-column: 1 / -1; }
  }

  // 平板 768-991px：2 列
  @media (min-width: 768px) and (max-width: 991px) {
    grid-template-columns: repeat(2, 1fr);
    .top-causes-chart { grid-column: 1 / -1; }
  }

  // 移动端 ≤767px：单列
  @media (max-width: 767px) {
    grid-template-columns: 1fr;
  }
}
```

由于去除了块 5（季度柱状图），桌面端布局简化为"3 上 + 1 下"（块 4 Top5 案由占满宽），更紧凑。

---

## 七、无障碍设计

### 7.1 核心原则

1. **颜色非唯一编码**——所有颜色均配合直接标签、图标、文本作为冗余编码
2. **对比度 ≥ 4.5:1**——辅助文案使用 `--el-text-color-secondary`（`#606266`）合规
3. **键盘可达**——所有交互元素可通过 Tab/方向键/回车操作
4. **默认视图自解释**——核心数值常驻可见，不依赖 hover
5. **降级路径**——`prefers-reduced-motion` 下脉冲动画停止；图表提供文本替代

### 7.2 图表无障碍实现

- ECharts 配置项 `aria: { enabled: true, decal: { show: true } }` 自动生成图表描述
- 环形图、柱状图容器 `role="img"` + `aria-label` 详细文本描述
- 颜色配合图形冗余：环形图附图例色点+文本，指标卡片附图标（Warning、CaretTop/Bottom）
- 加载态遮罩 `aria-live="polite"` + `role="status"`

### 7.3 移动端无障碍

- 触摸目标尺寸 ≥ 44×44px（iOS HIG）/ 48×48px（Material）
- 图表触摸点击即显示 Tooltip（不依赖 hover）
- 抽屉式筛选面板打开后焦点落入第一项控件，关闭后焦点返回触发按钮

---

## 八、错误处理与边界情况

### 8.1 错误态

| 场景 | 处理 |
|---|---|
| 数据请求失败 | 图表区显示 `CaseEmptyState`，文案「暂无统计数据」+ 重试按钮 |
| 某个图板数据为空 | 该图板单独显示空状态，不影响其他图板 |
| 网络超时 | 10s 超时后取消请求，显示错误态 |
| URL 参数无效 | 回退到默认「今年」范围并修正 URL |

### 8.2 边界情况

| 场景 | 处理 |
|---|---|
| 日期范围超过 1 年 | 允许但提示「范围较大，统计可能耗时」 |
| 起 > 结 | 自动纠正互换（PRD 9.2 要求） |
| 用户切换路由后再返回 | URL 状态恢复，自动重新加载 |
| 浏览器前进/后退 | URL query 驱动，自动同步筛选状态 |
| 移动端抽屉打开时切换路由 | 自动关闭抽屉 |

---

## 九、测试策略

### 9.1 功能测试

- 3 个预设按钮点击后日期填充正确
- 自定义日期修改后预设按钮取消高亮
- 起止日期互换自动纠正
- 清除筛选回到默认「今年」
- URL 状态与 store 双向同步
- 4 个图板点击跳转携带正确 query 参数

### 9.2 响应式测试

- 桌面端（≥992px）3 列布局
- 平板端（768-991px）2 列布局
- 移动端（≤767px）单列堆叠 + 筛选抽屉

### 9.3 无障碍测试

- 键盘 Tab 顺序合理
- 屏幕阅读器播报图表描述
- `prefers-reduced-motion` 下脉冲停止
- 对比度检查通过 WCAG AA

### 9.4 性能测试

- 路由切换进入 ≤ 200ms
- 图表渲染 ≤ 100ms
- 内存占用 ≤ 10MB
- 移动端低端设备无明显卡顿

---

## 十、实施计划

### 10.1 实施步骤

1. **路由与菜单改造**（CasesView 容器化 + 左侧菜单 + 路由配置）
2. **筛选配置区**（FilterBar.vue + 3 种预设 + 互斥逻辑 + URL 同步）
3. **状态管理**（statistics store + Mock 数据）
4. **块 2 在办案件卡片**（最简单，先做打通跳转链路）
5. **块 3 办结案件卡片**（结构与块 2 类似，扩展同比）
6. **块 1 新收案件环形图**（ECharts 集成 + 图例联动）
7. **块 4 Top5 案由进度条**（ECharts 横向 bar + 跳转）
8. **StatisticsView 容器组装**（4 个图板 + 加载态 + 响应式网格）
9. **响应式与移动端适配**（CSS Grid + 抽屉筛选）
10. **无障碍优化**（aria 标签 + 键盘导航 + 降级）
11. **Mock 数据完善**（覆盖空状态、边界情况）
12. **自测与联调**

### 10.2 依赖项

- 新增 npm 依赖：`echarts`、`vue-echarts`
- 现有项目依赖：`pinia`、`vue-router`、`element-plus`、`@element-plus/icons-vue`

### 10.3 交付物

- `src/views/cases/CasesView.vue`（改造为容器）
- `src/views/cases/components/CaseListPanel.vue`（新增，原 CasesView 内容）
- `src/views/cases/statistics/` 整个目录
- `src/stores/statistics.js`
- `src/utils/echarts.js`（按需引入配置）
- `src/router/index.js`（路由调整）
- `package.json`（新增依赖）

---

## 十一、未纳入本轮范围

以下功能本轮不开发，留待未来迭代：

| 功能 | 原因 |
|---|---|
| 申请专家咨询案件（左侧菜单第 3 项） | PRD 第七章次要模块，用户明确暂不开发 |
| 咨询案件（待办事项页） | 同上，且属专家角色模板 |
| 块 5 裁调撤情况季度柱状图 | 用户评审后去除 |
| AI 问答助手 | PRD 第十章建议项，未确认落地 |
| 智能约庭增强 | PRD 第十章建议项，未确认落地 |
| 移动端 H5 独立适配 | PRD 第十一章新增方向，本轮仅做响应式 |

---

## 十二、风险与缓解

| 风险 | 缓解措施 |
|---|---|
| ECharts 体积过大影响首屏 | 按需引入 + `defineAsyncComponent` 懒加载，预估 ~150KB gzip |
| CasesView 改造影响现有案件列表功能 | CaseListPanel 完整保留原 StatsBoard + CaseFilter + CaseTable 组合，仅做容器拆分不改业务逻辑 |
| 后端接口未定义 | 内置 Mock 数据先行开发，后端就绪后替换 `fetchXxx` 实现 |
| URL 状态同步可能引入 bug | 严格的单向数据流（URL → store → URL），加防抖避免循环 |
| 移动端筛选抽屉与主图表交互割裂 | 抽屉关闭后焦点返回触发按钮，图表区立即根据新条件重新渲染 |

---

**文档结束**
