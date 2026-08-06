# PC仲裁员端重构 — 智能约庭（工作日历维护）设计规范

## 1. 概述 (Overview)

本文档定义"PC仲裁员办案系统重构"中 **"智能约庭"模块第一阶段（工作日历维护）** 的设计规范。该模块对应 PRD 第十章 `[新增] 智能化能力增强` 的智能约庭方向，本期聚焦"仲裁员维护个人工作日历"这一基础能力，为后续秘书端约庭提供数据基础。

### 1.1 设计目标

- 让仲裁员能在首页日历上直观维护个人可用/不可用时段
- 支持单日状态设置与周期性规则管理两类录入方式
- 建立清晰的状态优先级算法，单日设置可覆盖周期规则
- 数据模型预留已约庭字段优先级，为后续迭代无缝衔接

### 1.2 范围说明

| 内容 | 状态 |
|------|------|
| 首页日历的视觉状态体系（4 种状态） | 本期实现 |
| 点击日期弹窗设置单日状态 | 本期实现 |
| 周期规则管理（增删改） | 本期实现 |
| 工作日历数据 Pinia store | 本期实现 |
| 约庭通知确认（接受/拒绝/调整） | 暂不实现 |
| 秘书端约庭发起（外部系统） | 暂不实现 |
| 待办事项 → 智能约庭列表 | 保持现有占位页 |
| 已约庭数据从秘书端同步 | 暂不实现 |

### 1.3 定位说明

本期聚焦"仲裁员维护个人工作日历"，为后续秘书端约庭提供数据基础。约庭通知确认功能留待后续迭代。完整业务闭环为：仲裁员维护日历 → 秘书据此约庭 → 仲裁员收到通知确认，本期仅实现第一步。

---

## 2. 信息架构 (Information Architecture)

### 2.1 功能位置与组件结构

```
首页（HomeView.vue）
└── 右栏 · 日程安排卡片
    └── CalendarBoard.vue（扩展）
        ├── 日历视图（el-calendar）
        │   ├── 头部：月份切换 + 本月 + ⚙周期规则入口
        │   └── 日期格：4 种状态可视化
        ├── DateSettingDialog.vue（新增）
        │   └── 单日状态设置弹窗
        ├── RecurringRuleDialog.vue（新增）
        │   └── 周期规则管理弹窗
        └── 今日开庭提醒 / 今日到期案件（保留）

stores/calendar.js（新增）
├── daySlots[]              // 单日设置
├── recurringRules[]        // 周期规则
├── getDayStatus(date)      // 计算某日最终状态
├── saveDaySlot(data)       // 保存单日设置
├── deleteDaySlot(date)     // 删除单日设置
├── addRecurringRule(rule)  // 新增周期规则
├── updateRecurringRule(id, data)  // 更新周期规则
└── deleteRecurringRule(id) // 删除周期规则
```

### 2.2 改动范围

| 文件 | 类型 | 改动内容 |
|------|------|----------|
| `src/views/home/components/CalendarBoard.vue` | 修改 | 扩展日期格渲染逻辑、添加周期规则入口 |
| `src/views/home/components/DateSettingDialog.vue` | 新增 | 单日状态设置弹窗组件 |
| `src/views/home/components/RecurringRuleDialog.vue` | 新增 | 周期规则管理弹窗组件 |
| `src/stores/calendar.js` | 新增 | 工作日历 Pinia store |

---

## 3. 数据模型与状态计算 (Data Model & Status Computation)

### 3.1 数据结构

```js
// ============ 类型定义 ============

// 单日设置（daySlots 数组元素）
{
  date: "2026-08-07",              // 日期 YYYY-MM-DD（主键）
  status: "unavailable",           // 状态：available(可用) |
                                    //       unavailable(不可用全天) |
                                    //       partial(部分不可用)
  reason: "出差",                  // 事由（选填）
  segments: [                      // 仅 status=partial 时存在
    { period: "AM", available: true },
    { period: "PM", available: false, reason: "其他开庭" }
  ]
}

// 周期规则（recurringRules 数组元素）
{
  id: "r1",                        // 规则 ID
  weekday: 3,                      // 星期几：0=周日, 1=周一, ..., 6=周六
  period: "PM",                    // 时段：AM(上午) | PM(下午) | ALL(全天)
  reason: "其他事务",              // 事由（选填）
  createdAt: "2026-08-01 10:00"    // 创建时间
}
```

### 3.2 状态计算逻辑

状态计算采用**双层架构**：

- **组件层（CalendarBoard）**：先查 hearing 数据（已约庭），命中则直接渲染"庭"状态，不调用 store
- **Store 层（getDayStatus）**：仅计算仲裁员自设数据的三级优先级

`getDayStatus(date)` 在 store 层采用三级优先级算法：

1. **查 daySlots**（store 层最高）：在 daySlots 数组中查找 date 匹配的记录，命中则返回该记录的 status
2. **查 recurringRules**：根据 date 计算星期几，查找匹配的周期规则，合并 AM/PM 规则
3. **默认 available**：单日设置和周期规则都未命中 → 该日期默认可用

**完整优先级（含组件层）：** 已约庭 hearing > 单日设置 daySlots > 周期规则 recurringRules > 默认可用

仲裁员可在任何一天通过单日设置覆盖周期规则。例如：8月6日是周三（周期规则"下午不可用"），但仲裁员可手动设为"全天可用"。注意：已约庭日期由外部系统写入，仲裁员设置不覆盖。

### 3.3 计算逻辑伪代码

```js
// Store 层：仅处理仲裁员自设数据（daySlots + recurringRules + 默认）
// 组件层在调用前先检查 hearing 数据，已约庭日期不进入此函数
function getDayStatus(dateStr) {
  // 1. 查单日设置（store 层最高优先级）
  const daySlot = daySlots.value.find(s => s.date === dateStr)
  if (daySlot) {
    return daySlot  // { status, reason, segments }
  }

  // 2. 查周期规则
  const weekday = new Date(dateStr).getDay()  // 0=周日
  const matchedRules = recurringRules.value.filter(r => r.weekday === weekday)

  if (matchedRules.length === 0) {
    // 3. 默认可用
    return { status: 'available', reason: '', segments: null }
  }

  // 合并周期规则：判断是全天不可用还是部分不可用
  const hasAllDay = matchedRules.some(r => r.period === 'ALL')
  if (hasAllDay) {
    return {
      status: 'unavailable',
      reason: matchedRules.find(r => r.period === 'ALL')?.reason || '',
      segments: null
    }
  }

  // 部分不可用：合并 AM/PM 规则
  const amRule = matchedRules.find(r => r.period === 'AM')
  const pmRule = matchedRules.find(r => r.period === 'PM')
  return {
    status: 'partial',
    reason: '',
    segments: [
      { period: 'AM', available: !amRule, reason: amRule?.reason || '' },
      { period: 'PM', available: !pmRule, reason: pmRule?.reason || '' }
    ]
  }
}
```

### 3.4 Mock 数据示例

```js
// 单日设置
daySlots: [
  {
    date: "2026-08-07",
    status: "unavailable",
    reason: "出差"
  },
  {
    date: "2026-08-10",
    status: "partial",
    reason: "",
    segments: [
      { period: "AM", available: true },
      { period: "PM", available: false, reason: "其他开庭" }
    ]
  }
]

// 周期规则
recurringRules: [
  {
    id: "r1",
    weekday: 3,            // 每周三
    period: "PM",          // 下午不可用
    reason: "其他事务",
    createdAt: "2026-08-01 10:00"
  },
  {
    id: "r2",
    weekday: 5,            // 每周五
    period: "PM",          // 下午不可用
    reason: "例会",
    createdAt: "2026-08-01 10:00"
  }
]
```

---

## 4. 组件设计与交互细节 (Component Design & Interaction)

### 4.1 CalendarBoard.vue 扩展

| 区域 | 现状 | 改动 |
|------|------|------|
| 日历头部 | 月份文字 + 翻月按钮（‹ 本月 ›） | 新增：分隔线 + "⚙ 周期规则"按钮 |
| 日期格 | 仅显示日期数字 + 事件圆点 | 重写：4 种状态背景 + 状态标识（庭/休/半）+ 点击触发弹窗 |
| 今日开庭提醒 | 保留 | 不变 |
| 今日到期案件 | 保留 | 不变 |

**日期格渲染逻辑：**

```
v-for 日期格 → 调用 store.getDayStatus(day)
  → status === 'available'    → 白底，无标识
  → status === 'unavailable'  → 浅红底 + "休" 标识
  → status === 'partial'      → 上白下红渐变 + "半" 标识
  → 已约庭（hearing 数据）     → 浅蓝底 + "庭" 标识（优先级最高）
@click → 打开 DateSettingDialog，传入 date
```

### 4.2 DateSettingDialog.vue — 单日状态设置弹窗

**弹窗结构：**

- **头部**：日期文字（如"2026年8月6日 周四"）+ 关闭按钮
- **当日状态**：三选一按钮组（可用 / 不可用 / 部分不可用），选中态主题色
- **时段设置**：仅 status=partial 时显示，上午/下午各自独立切换"可用/不可用"
- **事由**：单行输入，maxlength=50，选填
- **周期规则影响提示**：当该日期受周期规则影响时显示提示
- **底部操作**：
  - 左侧"清除单日设置"（仅当该日期已有 daySlot 时显示）
  - 右侧"取消" + "保存"按钮

**交互细节：**

- 弹窗宽度：480px（PC），移动端 92%（遵循 project_memory 规范）
- 状态选择：el-radio-group 按钮样式，选中态主题色
- 时段设置：仅 status=partial 时显示，AM/PM 各自独立切换
- 事由：单行输入，最多 50 字
- 底部"清除单日设置"：仅当该日期已有 daySlot 时显示，点击后删除并关闭弹窗
- 保存：调用 `store.saveDaySlot()`，ElMessage.success 提示，关闭弹窗

### 4.3 RecurringRuleDialog.vue — 周期规则管理弹窗

**弹窗结构：**

- **头部**：标题"周期规则管理" + 关闭按钮
- **已设置规则列表**：每项含星期+时段+事由，右侧"编辑"/"删除"
- **新增表单**：始终显示在列表下方，含星期/时段/事由三个字段
- **底部说明**：周期规则应用范围说明

**交互细节：**

- 弹窗宽度：560px（PC），移动端 92%
- 规则列表：每项含星期+时段+事由，右侧"编辑"/"删除"
- 编辑：点击"编辑"后，该项变为可编辑表单（inline 替换）
- 删除：ElMessageBox.confirm 确认后删除
- 新增表单：始终显示在列表下方，含星期/时段/事由三个字段
- 同星期同时段不可重复：保存时校验，已存在则提示
- 星期选项：周一至周日（7 选 1），时段：上午/下午/全天（3 选 1）

### 4.4 视觉规范遵循

| 规范项 | 应用 |
|------|------|
| 字体大小 | 16px（弹窗标题）/ 14px（正文）/ 12px（辅助）/ 10px（标签） |
| 移动端弹窗 | el-dialog 非 fullscreen 时 width: 92% !important + margin: 5vh auto |
| 表单标签 | label-position="left"，左对齐 |
| 操作按钮 | div 容器内右对齐 |
| el-dialog__title | color: var(--el-text-color-regular) |
| 辅助文字颜色 | 12px 文字使用 var(--el-text-color-secondary) (#606266) |

---

## 5. 边界情况与错误处理 (Edge Cases & Error Handling)

### 5.1 数据边界情况

| 场景 | 处理 | 用户感知 |
|------|------|----------|
| daySlots 与 recurringRules 同时命中 | 单日设置优先，忽略周期规则 | 弹窗内提示"当前设置覆盖周期规则" |
| 同星期同时段周期规则重复 | 保存前校验，已存在则拒绝 | ElMessage.error "该星期同时段已有规则" |
| 同星期不同时段的两条规则 | 允许共存，渲染时合并为 partial | 日历显示"半"，上午+下午都不可用 |
| 事由为空 | 允许保存（选填字段） | 列表/弹窗显示"—"或省略事由行 |
| 事由超长 | 输入框 maxlength=50 | 超出字符无法输入 |
| 过去日期设置 | 允许设置（保留历史记录） | 过去日期正常显示状态，可编辑/清除 |
| 清除已有单日设置 | 删除 daySlot，回退到周期规则或默认 | ElMessage.success "已清除" + 弹窗关闭 + 日历刷新 |

### 5.2 交互边界情况

| 场景 | 处理 | 用户感知 |
|------|------|----------|
| 弹窗中切换状态 | 从 partial 切到 unavailable 时，清空 segments | 时段设置区域隐藏 |
| 弹窗中切换时段可用性 | AM/PM 独立切换，互不影响 | 切换后按钮样式立即变化 |
| 未选择状态直接保存 | 默认选中"可用"，始终有值 | 无需校验，不会出现空状态 |
| 周期规则编辑中取消 | 点击"取消"恢复原值，不保存 | 表单回到只读展示态 |
| 删除最后一条周期规则 | 允许删除，列表显示空状态 | "暂无周期规则"提示 + 新增表单仍在 |
| 快速连续点击保存 | 保存按钮点击后立即 disabled，防止重复提交 | 按钮变灰，等待 ElMessage 提示后恢复 |

### 5.3 空状态与加载态

- **周期规则列表空状态**：图标 + "暂无周期规则"文案 + "可在下方新增规则"提示
- **日历无任何设置**：所有日期默认"可用"（白底），无需特殊空状态
- **加载态**：Mock 阶段同步填充，无加载态；对接 API 后日历用 v-loading 包裹，弹窗保存用按钮 loading

### 5.4 已约庭数据冲突处理

| 数据来源 | 优先级 | 处理 |
|------|------|------|
| 已约庭（hearing 数据） | 最高 | 日历显示"庭"标识，仲裁员设置不覆盖 |
| 单日设置（daySlots） | 高 | 覆盖周期规则 |
| 周期规则（recurringRules） | 中 | 应用到所有未来日期 |
| 默认 | 低 | 可用（白底） |

**本期说明：** 本期 hearing 数据来源为首页现有的 `todayHearings` mock，仅包含**今日**的已约庭记录。这意味着：

- 仅当日日期会显示"庭"标识，其他日期即使实际已约庭也无法显示
- 点击已约庭的当日日期，仍会打开 DateSettingDialog，但仲裁员的设置不会覆盖"庭"状态显示
- 完整的跨日期 hearing 数据同步留待阶段 2 接入

当前优先级逻辑已预留，阶段 2 接入只需在组件层补充 hearing 数据来源，无需重构 store。

### 5.5 操作反馈规范

| 操作 | 成功反馈 | 失败反馈 |
|------|----------|----------|
| 保存单日设置 | ElMessage.success "设置已保存" | ElMessage.error "保存失败，请重试" |
| 清除单日设置 | ElMessage.success "已清除单日设置" | — |
| 新增周期规则 | ElMessage.success "规则已添加" | ElMessage.error "该星期同时段已有规则" |
| 编辑周期规则 | ElMessage.success "规则已更新" | ElMessage.error "更新失败" |
| 删除周期规则 | ElMessage.success "规则已删除" | ElMessage.error "删除失败" |

---

## 6. 测试策略 (Testing Strategy)

### 6.1 测试范围

| 类型 | 重点 |
|------|------|
| 单元测试 — store 逻辑 | getDayStatus 优先级算法、saveDaySlot 增删改、recurringRules 合并逻辑、同星期同时段去重校验 |
| 组件测试 — 交互 | 日期格点击触发弹窗、状态切换时段区域显隐、周期规则增删改流程、清除单日设置入口 |
| 视觉回归 — 状态渲染 | 4 种状态背景渲染、partial 上白下红渐变、状态标识（庭/休/半）、移动端弹窗 92% 宽度 |

**测试工具：** Vitest（单元/组件测试）+ Vue Test Utils。本期聚焦 store 逻辑测试，组件测试覆盖关键交互路径。

### 6.2 关键测试用例 — getDayStatus 优先级算法

| 用例 | 输入 | 预期输出 |
|------|------|----------|
| 无任何设置 | 2026-08-01（周六） | status: 'available' |
| 仅有单日设置 | 2026-08-07（daySlots 命中） | status: 'unavailable', reason: '出差' |
| 仅有周期规则（全天） | 某周日（weekday=0, period=ALL） | status: 'unavailable' |
| 仅有周期规则（下午） | 某周三（weekday=3, period=PM） | status: 'partial', segments[PM].available: false |
| 单日覆盖周期 | 周三（周期PM不可用）+ daySlots 设为 available | status: 'available'（单日优先） |
| 多条周期规则合并 | 某日同时有 AM + PM 两条规则 | status: 'partial', AM/PM 均 available: false |

---

## 7. 后续迭代规划 (Future Iterations)

### 7.1 智能约庭功能完整路线图

**阶段 1（本期）：工作日历维护**
- 日历视觉状态 + 单日设置弹窗 + 周期规则管理 + Pinia store

**阶段 2（后续）：约庭通知确认**
- 待办事项 → 智能约庭列表（替换占位页）
- 接受 / 拒绝 / 调整操作
- 首页消息通知 + 待办统计徽标
- 已约庭数据同步至日历

**阶段 3（远期）：智能匹配增强**
- 对接秘书端系统，提供可用时段查询 API
- 多仲裁员排期冲突检测（独任/首席/边裁）
- 场地空闲时段匹配
- 一键生成排期表
- 约庭数据统计分析

### 7.2 本期与后续的衔接

本期建立的 `stores/calendar.js` 数据模型已预留 hearing 字段优先级，阶段 2 接入已约庭数据时无需重构 store，仅需补充数据来源。

---

## 8. 风险与缓解 (Risks & Mitigation)

| 风险 | 影响 | 缓解 |
|------|------|------|
| el-calendar 日期格定制受限 | 4 种状态背景渲染可能受组件默认样式干扰 | 使用 :deep() 覆盖，必要时用 date-cell slot 完全重写 |
| 周期规则合并逻辑复杂 | 多规则同时命中时渲染异常 | 单元测试覆盖所有合并场景（AM+PM、ALL 覆盖等） |
| 移动端日历交互 | 小屏日期格点击区域过小 | 移动端增大日期格高度（min-height: 36px） |
| Mock 数据与真实 API 差异 | 后续对接需改 store 内部实现 | store 方法封装完整，组件层不直接操作数据，替换成本低 |

---

**说明：** 本设计规范聚焦智能约庭模块第一阶段（工作日历维护），对应 PRD 第十章 `[新增] 智能化能力增强` 的智能约庭方向。约庭通知确认、秘书端约庭发起、智能匹配增强等功能留待后续迭代。
