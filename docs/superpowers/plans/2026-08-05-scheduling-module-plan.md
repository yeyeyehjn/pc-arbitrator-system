# PC仲裁员端重构 - 智能约庭（工作日历维护）实施计划

> **关联设计文档**：`docs/superpowers/specs/2026-08-05-scheduling-module-design.md`

> **For agentic workers:** 步骤使用 checkbox（`- [ ]`）语法跟踪。本模块为 P1 级前端 Mock 实现，沿用项目既有"分阶段 + 联调自测"约定（无独立单元测试框架），每个阶段产出可独立预览的交付物。

**目标**：在首页日历 `CalendarBoard.vue` 落地仲裁员工作日历维护能力——支持 4 种状态可视化（可用/不可用/部分不可用/已约庭）、点击日期弹窗设置单日状态、周期规则管理弹窗（增删改），数据由新增 `stores/calendar.js` 集中管理。

**架构**：双层状态计算——组件层先查 hearing（已约庭）→ 命中直接渲染"庭"；未命中则调用 store `getDayStatus()` 走"单日设置 > 周期规则 > 默认可用"三级优先级。两个弹窗组件（DateSettingDialog / RecurringRuleDialog）由 CalendarBoard 持有，通过 v-model:visible 控制显隐。

**技术栈**：Vue 3 `<script setup>` + Pinia（setup 风格）+ Element Plus（el-calendar / el-dialog / el-radio-group / el-select / el-input / ElMessageBox / ElMessage）+ 项目全局 SCSS 规范。

## 全局约束（取自设计文档 §4.4，逐条落地）

- **字号**：仅允许 16px（弹窗标题）/ 14px（正文）/ 12px（辅助、按钮）/ 10px（标签）；禁用 13px、15px。
- **12px 辅助文字色**：`var(--el-text-color-secondary)`（#606266）。
- **移动端弹窗**：el-dialog 非 fullscreen 时 `width: 92% !important` + `margin: 5vh auto`（全局 SCSS 已覆盖，组件无需重复）。
- **表单标签**：`label-position="left"`，左对齐。
- **操作按钮**：div 容器内右对齐（`justify-content: flex-end`）。
- **el-dialog__title**：`color: var(--el-text-color-regular)`（全局 SCSS 已覆盖）。
- **el-dialog__title**：`color: var(--el-text-color-regular)`（全局 SCSS 已覆盖）。
- **无障碍**：图标按钮带 `aria-label`；日期格可点击区域带 `role="button"` + `tabindex="0"`。
- **状态色板**：可用=白底；不可用=浅红 `#fef0f0` + 标识"休"；部分不可用=上白下红渐变 + 标识"半"；已约庭=浅蓝 `#ecf5ff` + 标识"庭"。

---

## 阶段 1: Pinia Store + Mock 数据 (Data Foundation)

**Files:**
- Create: `src/stores/calendar.js`

**Interfaces:**
- Produces: `useCalendarStore`，含响应式 `daySlots`、`recurringRules`、`getDayStatus(dateStr)`、`saveDaySlot(data)`、`deleteDaySlot(date)`、`addRecurringRule(rule)`、`updateRecurringRule(id, data)`、`deleteRecurringRule(id)`、`hasDaySlot(date)`、`getRecurringRuleById(id)`、`isRuleDuplicate(weekday, period, excludeId)`

- [ ] **Step 1: 创建 store 文件骨架**

  创建 `src/stores/calendar.js`，先写入 import 和 Mock 数据：

  ```js
  import { defineStore } from 'pinia'
  import { ref } from 'vue'

  // ============ Mock 数据 ============

  // 单日设置：date 为 YYYY-MM-DD 主键
  const initialDaySlots = [
    {
      date: '2026-08-07',
      status: 'unavailable',
      reason: '出差',
      segments: null,
    },
    {
      date: '2026-08-10',
      status: 'partial',
      reason: '',
      segments: [
        { period: 'AM', available: true, reason: '' },
        { period: 'PM', available: false, reason: '其他开庭' },
      ],
    },
  ]

  // 周期规则：weekday 0=周日, 1=周一, ..., 6=周六；period: AM/PM/ALL
  const initialRecurringRules = [
    {
      id: 'r1',
      weekday: 3, // 每周三
      period: 'PM',
      reason: '其他事务',
      createdAt: '2026-08-01 10:00',
    },
    {
      id: 'r2',
      weekday: 5, // 每周五
      period: 'PM',
      reason: '例会',
      createdAt: '2026-08-01 10:00',
    },
  ]
  ```

- [ ] **Step 2: 实现 store 主体与状态定义**

  在 `src/stores/calendar.js` 追加 store 定义：

  ```js
  export const useCalendarStore = defineStore('calendar', () => {
    // ============ 状态 ============
    const daySlots = ref(initialDaySlots.map(s => ({ ...s })))
    const recurringRules = ref(initialRecurringRules.map(r => ({ ...r })))

    // ============ Getters ============

    // 查询单日设置是否存在
    const hasDaySlot = (dateStr) => {
      return daySlots.value.some(s => s.date === dateStr)
    }

    // 按 ID 查周期规则
    const getRecurringRuleById = (id) => {
      return recurringRules.value.find(r => r.id === id) || null
    }

    // 校验同星期同时段是否重复（编辑时排除自身）
    const isRuleDuplicate = (weekday, period, excludeId = null) => {
      return recurringRules.value.some(
        r => r.weekday === weekday && r.period === period && r.id !== excludeId
      )
    }
  ```

- [ ] **Step 3: 实现 getDayStatus 核心算法**

  在 store 内追加 `getDayStatus`（store 层三级优先级，组件层先查 hearing）：

  ```js
    // ============ 核心算法：getDayStatus ============
    // Store 层：仅处理仲裁员自设数据（daySlots + recurringRules + 默认）
    // 组件层在调用前先检查 hearing 数据，已约庭日期不进入此函数
    const getDayStatus = (dateStr) => {
      // 1. 查单日设置（store 层最高优先级）
      const daySlot = daySlots.value.find(s => s.date === dateStr)
      if (daySlot) {
        return {
          status: daySlot.status,
          reason: daySlot.reason || '',
          segments: daySlot.segments || null,
        }
      }

      // 2. 查周期规则
      const weekday = new Date(dateStr).getDay() // 0=周日
      const matchedRules = recurringRules.value.filter(r => r.weekday === weekday)

      if (matchedRules.length === 0) {
        // 3. 默认可用
        return { status: 'available', reason: '', segments: null }
      }

      // 合并周期规则：判断是全天不可用还是部分不可用
      const hasAllDay = matchedRules.some(r => r.period === 'ALL')
      if (hasAllDay) {
        const allRule = matchedRules.find(r => r.period === 'ALL')
        return {
          status: 'unavailable',
          reason: allRule?.reason || '',
          segments: null,
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
          { period: 'PM', available: !pmRule, reason: pmRule?.reason || '' },
        ],
      }
    }
  ```

- [ ] **Step 4: 实现单日设置增删方法**

  在 store 内追加 `saveDaySlot` 和 `deleteDaySlot`：

  ```js
    // ============ Actions：单日设置 ============

    // 保存单日设置（新增或覆盖）
    const saveDaySlot = (data) => {
      // data: { date, status, reason, segments }
      const payload = {
        date: data.date,
        status: data.status,
        reason: data.reason || '',
        segments: data.status === 'partial' ? (data.segments || null) : null,
      }
      const idx = daySlots.value.findIndex(s => s.date === data.date)
      if (idx >= 0) {
        daySlots.value[idx] = payload
      } else {
        daySlots.value.push(payload)
      }
    }

    // 删除单日设置
    const deleteDaySlot = (dateStr) => {
      const idx = daySlots.value.findIndex(s => s.date === dateStr)
      if (idx >= 0) {
        daySlots.value.splice(idx, 1)
      }
    }
  ```

- [ ] **Step 5: 实现周期规则增删改方法**

  在 store 内追加 `addRecurringRule`、`updateRecurringRule`、`deleteRecurringRule`，并关闭 store：

  ```js
    // ============ Actions：周期规则 ============

    // 新增周期规则（调用方负责 isRuleDuplicate 校验）
    const addRecurringRule = (rule) => {
      // rule: { weekday, period, reason }
      const newRule = {
        id: `r${Date.now()}`,
        weekday: rule.weekday,
        period: rule.period,
        reason: rule.reason || '',
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      }
      recurringRules.value.push(newRule)
      return newRule
    }

    // 更新周期规则
    const updateRecurringRule = (id, data) => {
      const idx = recurringRules.value.findIndex(r => r.id === id)
      if (idx >= 0) {
        recurringRules.value[idx] = {
          ...recurringRules.value[idx],
          weekday: data.weekday,
          period: data.period,
          reason: data.reason || '',
        }
      }
    }

    // 删除周期规则
    const deleteRecurringRule = (id) => {
      const idx = recurringRules.value.findIndex(r => r.id === id)
      if (idx >= 0) {
        recurringRules.value.splice(idx, 1)
      }
    }

    return {
      daySlots,
      recurringRules,
      hasDaySlot,
      getRecurringRuleById,
      isRuleDuplicate,
      getDayStatus,
      saveDaySlot,
      deleteDaySlot,
      addRecurringRule,
      updateRecurringRule,
      deleteRecurringRule,
    }
  })
  ```

- [ ] **Step 6: 联调自测 — 在浏览器控制台验证 store**

  启动 `npm run dev`，打开首页，在浏览器控制台执行：

  ```js
  // 获取 pinia 实例
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const store = pinia._s.get('calendar')

  // 验证 getDayStatus 三级优先级
  console.log(store.getDayStatus('2026-08-07'))  // 单日设置命中 → unavailable
  console.log(store.getDayStatus('2026-08-10'))  // partial
  console.log(store.getDayStatus('2026-08-05'))  // 周三 → 周期规则 PM → partial
  console.log(store.getDayStatus('2026-08-01'))  // 周六 → 默认 available

  // 验证 isRuleDuplicate
  console.log(store.isRuleDuplicate(3, 'PM'))     // true（r1 已存在）
  console.log(store.isRuleDuplicate(3, 'AM'))     // false

  // 验证 saveDaySlot
  store.saveDaySlot({ date: '2026-08-15', status: 'unavailable', reason: '测试' })
  console.log(store.hasDaySlot('2026-08-15'))     // true
  ```

  预期：所有断言输出与注释一致。

- [ ] **Step 7: 提交**

  ```bash
  git add src/stores/calendar.js
  git commit -m "feat(calendar): add Pinia store for arbitrator work calendar

  - daySlots + recurringRules state with Mock data
  - getDayStatus with 3-level priority (daySlots > recurringRules > default)
  - CRUD actions: saveDaySlot, deleteDaySlot, addRecurringRule,
    updateRecurringRule, deleteRecurringRule
  - Validation helpers: hasDaySlot, getRecurringRuleById, isRuleDuplicate"
  ```

---

## 阶段 2: DateSettingDialog 单日状态设置弹窗

**Files:**
- Create: `src/views/home/components/DateSettingDialog.vue`

**Interfaces:**
- Consumes: `useCalendarStore` 的 `getDayStatus`、`hasDaySlot`、`saveDaySlot`、`deleteDaySlot`
- Produces: 组件 props `visible: Boolean`、`date: String (YYYY-MM-DD)`；emits `update:visible`、`saved`

- [ ] **Step 1: 创建组件文件骨架**

  创建 `src/views/home/components/DateSettingDialog.vue`，写入 template、script、style 三块基础结构：

  ```vue
  <template>
    <el-dialog
      :model-value="visible"
      :title="dialogTitle"
      width="480px"
      :close-on-click-modal="false"
      append-to-body
      @update:model-value="$emit('update:visible', $event)"
    >
      <div class="date-setting-dialog">
        <!-- 内容区在 Step 2 填充 -->
      </div>
      <template #footer>
        <!-- 底部操作在 Step 4 填充 -->
      </template>
    </el-dialog>
  </template>

  <script setup>
  import { ref, computed, watch } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useCalendarStore } from '@/stores/calendar'

  const props = defineProps({
    visible: { type: Boolean, default: false },
    date: { type: String, default: '' },
  })

  const emit = defineEmits(['update:visible', 'saved'])

  const store = useCalendarStore()

  // 表单状态在 Step 3 填充
  const dialogTitle = computed(() => {
    if (!props.date) return '设置日期状态'
    const d = new Date(props.date)
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`
  })
  </script>

  <style scoped lang="scss">
  .date-setting-dialog {
    // 样式在 Step 5 填充
  }
  </style>
  ```

- [ ] **Step 2: 填充内容区 — 状态选择 + 时段设置 + 事由**

  在 `<div class="date-setting-dialog">` 内填入：

  ```vue
  <!-- 当日状态 -->
  <div class="form-section">
    <div class="form-label">当日状态</div>
    <el-radio-group v-model="form.status" class="status-group">
      <el-radio-button value="available">可用</el-radio-button>
      <el-radio-button value="unavailable">不可用</el-radio-button>
      <el-radio-button value="partial">部分不可用</el-radio-button>
    </el-radio-group>
  </div>

  <!-- 时段设置（仅 partial 时显示） -->
  <div v-if="form.status === 'partial'" class="form-section segment-section">
    <div class="form-label">时段设置</div>
    <div class="segment-grid">
      <div class="segment-card">
        <div class="segment-title">上午 09:00-12:00</div>
        <div class="segment-toggle">
          <el-radio-group v-model="segments.am" size="small">
            <el-radio-button :value="true">可用</el-radio-button>
            <el-radio-button :value="false">不可用</el-radio-button>
          </el-radio-group>
        </div>
      </div>
      <div class="segment-card">
        <div class="segment-title">下午 14:00-18:00</div>
        <div class="segment-toggle">
          <el-radio-group v-model="segments.pm" size="small">
            <el-radio-button :value="true">可用</el-radio-button>
            <el-radio-button :value="false">不可用</el-radio-button>
          </el-radio-group>
        </div>
      </div>
    </div>
  </div>

  <!-- 事由 -->
  <div class="form-section">
    <div class="form-label">事由（选填）</div>
    <el-input
      v-model="form.reason"
      maxlength="50"
      placeholder="如：出差、其他开庭、个人事务"
    />
  </div>

  <!-- 周期规则影响提示 -->
  <div v-if="recurringHint" class="recurring-hint">
    <strong>提示：</strong>{{ recurringHint }}
  </div>
  ```

- [ ] **Step 3: 实现表单状态与初始化逻辑**

  在 `<script setup>` 内补充表单状态与 watch：

  ```js
  // 表单状态
  const form = ref({
    status: 'available',
    reason: '',
  })
  const segments = ref({ am: true, pm: false })

  // 周期规则影响提示
  const recurringHint = computed(() => {
    if (!props.date) return ''
    // 查周期规则是否影响该日期
    const weekday = new Date(props.date).getDay()
    const rules = store.recurringRules.filter(r => r.weekday === weekday)
    if (rules.length === 0) return ''
    const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const parts = rules.map(r => {
      const periodText = r.period === 'ALL' ? '全天' : r.period === 'AM' ? '上午' : '下午'
      return `${periodText}不可用`
    })
    return `该日期受周期规则影响（${weekdayNames[weekday]}${parts.join('、')}）。当前设置将覆盖周期规则。`
  })

  // 弹窗打开时初始化表单
  watch(
    () => props.visible,
    (val) => {
      if (val && props.date) {
        if (store.hasDaySlot(props.date)) {
          // 已有单日设置：回填
          const existing = store.daySlots.find(s => s.date === props.date)
          form.value.status = existing.status
          form.value.reason = existing.reason || ''
          if (existing.status === 'partial' && existing.segments) {
            const am = existing.segments.find(s => s.period === 'AM')
            const pm = existing.segments.find(s => s.period === 'PM')
            segments.value.am = am ? am.available : true
            segments.value.pm = pm ? pm.available : false
          }
        } else {
          // 无单日设置：默认值（参考周期规则）
          const status = store.getDayStatus(props.date)
          form.value.status = status.status === 'available' ? 'available' : status.status
          form.value.reason = status.reason || ''
          if (status.status === 'partial' && status.segments) {
            const am = status.segments.find(s => s.period === 'AM')
            const pm = status.segments.find(s => s.period === 'PM')
            segments.value.am = am ? am.available : true
            segments.value.pm = pm ? pm.available : false
          } else {
            segments.value.am = true
            segments.value.pm = false
          }
        }
      }
    },
    { immediate: true }
  )
  ```

- [ ] **Step 4: 实现底部操作 — 保存/清除/取消**

  在 `<template #footer>` 内填入：

  ```vue
  <div class="dialog-footer">
    <span
      v-if="store.hasDaySlot(date)"
      class="clear-link"
      @click="handleClear"
    >清除单日设置</span>
    <span v-else></span>
    <div class="footer-actions">
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button
        type="primary"
        :loading="saving"
        @click="handleSave"
      >保存</el-button>
    </div>
  </div>
  ```

  在 `<script setup>` 内补充保存与清除逻辑：

  ```js
  const saving = ref(false)

  const handleSave = () => {
    saving.value = true
    try {
      const payload = {
        date: props.date,
        status: form.value.status,
        reason: form.value.reason,
        segments:
          form.value.status === 'partial'
            ? [
                { period: 'AM', available: segments.value.am, reason: '' },
                { period: 'PM', available: segments.value.pm, reason: '' },
              ]
            : null,
      }
      store.saveDaySlot(payload)
      ElMessage.success('设置已保存')
      emit('saved')
      emit('update:visible', false)
    } catch (e) {
      ElMessage.error('保存失败，请重试')
    } finally {
      saving.value = false
    }
  }

  const handleClear = async () => {
    try {
      await ElMessageBox.confirm(
        '清除后该日期将回退到周期规则或默认可用状态，是否继续？',
        '清除单日设置',
        { type: 'warning', confirmButtonText: '清除', cancelButtonText: '取消' }
      )
      store.deleteDaySlot(props.date)
      ElMessage.success('已清除单日设置')
      emit('saved')
      emit('update:visible', false)
    } catch (e) {
      // 用户取消，不处理
    }
  }
  ```

- [ ] **Step 5: 填充样式**

  在 `<style scoped lang="scss">` 内填入：

  ```scss
  .date-setting-dialog {
    .form-section {
      margin-bottom: 16px;
      .form-label {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-bottom: 8px;
      }
    }

    .status-group {
      :deep(.el-radio-button__inner) {
        font-size: 12px;
      }
    }

    .segment-section {
      padding: 12px;
      background: var(--el-fill-color-light);
      border-radius: 4px;

      .segment-grid {
        display: flex;
        gap: 10px;
      }
      .segment-card {
        flex: 1;
        background: #fff;
        padding: 10px;
        border-radius: 4px;
        border: 1px solid var(--el-border-color-lighter);

        .segment-title {
          font-size: 12px;
          color: var(--el-text-color-regular);
          margin-bottom: 8px;
        }
      }
    }

    .recurring-hint {
      margin-top: 12px;
      padding: 8px 10px;
      background: var(--el-color-warning-light-9);
      border-radius: 4px;
      font-size: 12px;
      color: var(--el-color-warning);
      line-height: 1.5;
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .clear-link {
      font-size: 12px;
      color: var(--el-color-danger);
      cursor: pointer;
      &:hover {
        opacity: 0.8;
      }
    }
    .footer-actions {
      display: flex;
      gap: 8px;
    }
  }
  ```

- [ ] **Step 6: 联调自测 — 临时挂载验证**

  在 `CalendarBoard.vue` 临时引入弹窗验证（阶段 4 会正式集成）：

  临时修改 `CalendarBoard.vue` 的 `<script setup>`：

  ```js
  import DateSettingDialog from './DateSettingDialog.vue'
  const settingDialogVisible = ref(false)
  const settingDialogDate = ref('')
  const openSettingDialog = (day) => {
    settingDialogDate.value = day
    settingDialogVisible.value = true
  }
  ```

  在 `<el-calendar>` 的 `#date-cell` 模板内临时加 `@click="openSettingDialog(data.day)"`，并在 template 末尾加：

  ```vue
  <DateSettingDialog v-model:visible="settingDialogVisible" :date="settingDialogDate" />
  ```

  打开首页，点击任意日期，验证：
  - 弹窗标题显示正确日期与星期
  - 状态三选一切换正常
  - 选"部分不可用"时时段设置区域出现
  - 保存后控制台 `store.daySlots` 多一条记录
  - 再次打开同一天，回填正确
  - 点"清除单日设置"弹确认框，确认后记录消失

- [ ] **Step 7: 提交**

  ```bash
  git add src/views/home/components/DateSettingDialog.vue
  git commit -m "feat(calendar): add DateSettingDialog for single-day status

  - Status radio group: available / unavailable / partial
  - Segment toggle (AM/PM) shown only when status=partial
  - Reason input with maxlength=50
  - Recurring rule impact hint
  - Clear day slot action with confirm dialog
  - Form auto-fills from existing daySlot or recurringRules"
  ```

---

## 阶段 3: RecurringRuleDialog 周期规则管理弹窗

**Files:**
- Create: `src/views/home/components/RecurringRuleDialog.vue`

**Interfaces:**
- Consumes: `useCalendarStore` 的 `recurringRules`、`addRecurringRule`、`updateRecurringRule`、`deleteRecurringRule`、`isRuleDuplicate`、`getRecurringRuleById`
- Produces: 组件 props `visible: Boolean`；emits `update:visible`

- [ ] **Step 1: 创建组件骨架与常量**

  创建 `src/views/home/components/RecurringRuleDialog.vue`：

  ```vue
  <template>
    <el-dialog
      :model-value="visible"
      title="周期规则管理"
      width="560px"
      :close-on-click-modal="false"
      append-to-body
      @update:model-value="$emit('update:visible', $event)"
    >
      <div class="recurring-rule-dialog">
        <!-- 内容区在 Step 2 填充 -->
      </div>
    </el-dialog>
  </template>

  <script setup>
  import { ref } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useCalendarStore } from '@/stores/calendar'

  defineProps({
    visible: { type: Boolean, default: false },
  })
  defineEmits(['update:visible'])

  const store = useCalendarStore()

  // 选项常量
  const WEEKDAY_OPTIONS = [
    { value: 1, label: '周一' },
    { value: 2, label: '周二' },
    { value: 3, label: '周三' },
    { value: 4, label: '周四' },
    { value: 5, label: '周五' },
    { value: 6, label: '周六' },
    { value: 0, label: '周日' },
  ]
  const PERIOD_OPTIONS = [
    { value: 'AM', label: '上午' },
    { value: 'PM', label: '下午' },
    { value: 'ALL', label: '全天' },
  ]

  const getWeekdayLabel = (v) => WEEKDAY_OPTIONS.find(o => o.value === v)?.label || ''
  const getPeriodLabel = (v) => PERIOD_OPTIONS.find(o => o.value === v)?.label || ''

  // 新增表单
  const addForm = ref({ weekday: 1, period: 'PM', reason: '' })

  // 编辑状态：editingId 非 null 时表示正在编辑某条
  const editingId = ref(null)
  const editForm = ref({ weekday: 1, period: 'PM', reason: '' })
  </script>

  <style scoped lang="scss">
  .recurring-rule-dialog {
    // 样式在 Step 4 填充
  }
  </style>
  ```

- [ ] **Step 2: 填充规则列表与新增表单**

  在 `<div class="recurring-rule-dialog">` 内填入：

  ```vue
  <!-- 已设置规则列表 -->
  <div class="form-label">已设置规则（{{ store.recurringRules.length }}）</div>

  <div v-if="store.recurringRules.length === 0" class="empty-state">
    <el-icon class="empty-icon"><Calendar /></el-icon>
    <div class="empty-text">暂无周期规则</div>
    <div class="empty-tip">可在下方新增规则</div>
  </div>

  <div v-else class="rule-list">
    <div
      v-for="rule in store.recurringRules"
      :key="rule.id"
      class="rule-item"
    >
      <!-- 只读展示 -->
      <template v-if="editingId !== rule.id">
        <div class="rule-info">
          <div class="rule-title">
            每周{{ getWeekdayLabel(rule.weekday) }} · {{ getPeriodLabel(rule.period) }}不可用
          </div>
          <div class="rule-desc">
            {{ rule.reason || '无事由' }}
          </div>
        </div>
        <div class="rule-actions">
          <el-button text size="small" @click="startEdit(rule)">编辑</el-button>
          <el-button text size="small" type="danger" @click="handleDelete(rule)">删除</el-button>
        </div>
      </template>

      <!-- 编辑表单（inline 替换） -->
      <div v-else class="rule-edit-form">
        <div class="edit-fields">
          <el-select v-model="editForm.weekday" size="small" style="width: 90px">
            <el-option
              v-for="opt in WEEKDAY_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-select v-model="editForm.period" size="small" style="width: 90px">
            <el-option
              v-for="opt in PERIOD_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-input
            v-model="editForm.reason"
            size="small"
            placeholder="事由（选填）"
            maxlength="50"
            style="flex: 1"
          />
        </div>
        <div class="edit-actions">
          <el-button size="small" @click="cancelEdit">取消</el-button>
          <el-button size="small" type="primary" @click="saveEdit(rule.id)">保存</el-button>
        </div>
      </div>
    </div>
  </div>

  <!-- 新增表单 -->
  <div class="add-form">
    <div class="add-form-title">+ 新增周期规则</div>
    <div class="add-fields">
      <el-select v-model="addForm.weekday" size="small" style="width: 90px">
        <el-option
          v-for="opt in WEEKDAY_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
      <el-select v-model="addForm.period" size="small" style="width: 90px">
        <el-option
          v-for="opt in PERIOD_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
      <el-input
        v-model="addForm.reason"
        size="small"
        placeholder="事由（选填）"
        maxlength="50"
        style="flex: 1"
      />
      <el-button size="small" type="primary" @click="handleAdd">添加</el-button>
    </div>
  </div>

  <!-- 说明 -->
  <div class="form-tip">
    <strong>说明：</strong>周期规则会自动应用到日历未来日期。已设置的单日状态不受规则变更影响。
  </div>
  ```

  在 `<script setup>` 顶部 import 补充图标：

  ```js
  import { Calendar } from '@element-plus/icons-vue'
  ```

- [ ] **Step 3: 实现增删改逻辑**

  在 `<script setup>` 内补充方法：

  ```js
  // 新增
  const handleAdd = () => {
    if (store.isRuleDuplicate(addForm.value.weekday, addForm.value.period)) {
      ElMessage.error('该星期同时段已有规则')
      return
    }
    store.addRecurringRule({
      weekday: addForm.value.weekday,
      period: addForm.value.period,
      reason: addForm.value.reason,
    })
    ElMessage.success('规则已添加')
    addForm.value = { weekday: 1, period: 'PM', reason: '' }
  }

  // 进入编辑
  const startEdit = (rule) => {
    editingId.value = rule.id
    editForm.value = {
      weekday: rule.weekday,
      period: rule.period,
      reason: rule.reason || '',
    }
  }

  // 取消编辑
  const cancelEdit = () => {
    editingId.value = null
  }

  // 保存编辑
  const saveEdit = (id) => {
    if (store.isRuleDuplicate(editForm.value.weekday, editForm.value.period, id)) {
      ElMessage.error('该星期同时段已有规则')
      return
    }
    store.updateRecurringRule(id, editForm.value)
    ElMessage.success('规则已更新')
    editingId.value = null
  }

  // 删除
  const handleDelete = async (rule) => {
    try {
      await ElMessageBox.confirm(
        `确认删除"每周${getWeekdayLabel(rule.weekday)} · ${getPeriodLabel(rule.period)}不可用"规则？`,
        '删除周期规则',
        { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
      )
      store.deleteRecurringRule(rule.id)
      ElMessage.success('规则已删除')
    } catch (e) {
      // 用户取消
    }
  }
  ```

- [ ] **Step 4: 填充样式**

  在 `<style scoped lang="scss">` 内填入：

  ```scss
  .recurring-rule-dialog {
    .form-label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-bottom: 8px;
    }

    .empty-state {
      text-align: center;
      padding: 24px 0;
      background: var(--el-fill-color-light);
      border-radius: 4px;
      margin-bottom: 16px;

      .empty-icon {
        font-size: 32px;
        color: var(--el-text-color-placeholder);
        margin-bottom: 8px;
      }
      .empty-text {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
      .empty-tip {
        font-size: 10px;
        color: var(--el-text-color-placeholder);
        margin-top: 4px;
      }
    }

    .rule-list {
      margin-bottom: 16px;
    }
    .rule-item {
      background: var(--el-fill-color-light);
      padding: 10px 12px;
      border-radius: 4px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .rule-info {
        .rule-title {
          font-size: 12px;
          color: var(--el-text-color-primary);
          font-weight: 600;
        }
        .rule-desc {
          font-size: 10px;
          color: var(--el-text-color-secondary);
          margin-top: 2px;
        }
      }
      .rule-actions {
        display: flex;
        gap: 4px;
      }

      .rule-edit-form {
        width: 100%;
        .edit-fields {
          display: flex;
          gap: 6px;
          margin-bottom: 8px;
        }
        .edit-actions {
          display: flex;
          justify-content: flex-end;
          gap: 6px;
        }
      }
    }

    .add-form {
      border: 1px dashed var(--el-color-primary);
      border-radius: 4px;
      padding: 12px;
      background: var(--el-color-primary-light-9);

      .add-form-title {
        font-size: 12px;
        color: var(--el-color-primary);
        font-weight: 600;
        margin-bottom: 10px;
      }
      .add-fields {
        display: flex;
        gap: 6px;
        align-items: center;
      }
    }

    .form-tip {
      margin-top: 12px;
      padding: 8px 10px;
      background: var(--el-color-primary-light-9);
      border-radius: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      line-height: 1.5;
    }
  }
  ```

- [ ] **Step 5: 联调自测**

  在 `CalendarBoard.vue` 临时引入该弹窗：

  ```js
  import RecurringRuleDialog from './RecurringRuleDialog.vue'
  const ruleDialogVisible = ref(false)
  ```

  在日历头部"本月"按钮后临时加一个按钮：

  ```vue
  <el-button class="calendar-nav-btn today-btn" @click="ruleDialogVisible = true">规则</el-button>
  ```

  template 末尾加：

  ```vue
  <RecurringRuleDialog v-model:visible="ruleDialogVisible" />
  ```

  打开首页，验证：
  - 列表显示 2 条 Mock 规则（每周三下午、每周五下午）
  - 新增表单填写后点"添加"，列表增加一条，且成功提示
  - 重复添加"周三下午"，提示错误
  - 点"编辑"，行内变为表单，修改后点"保存"
  - 点"删除"，弹确认框，确认后列表减少
  - 删除所有规则后显示空状态

- [ ] **Step 6: 提交**

  ```bash
  git add src/views/home/components/RecurringRuleDialog.vue
  git commit -m "feat(calendar): add RecurringRuleDialog for weekly rule management

  - List view with inline edit and delete
  - Add form with weekday/period/reason fields
  - Duplicate rule validation (same weekday + period)
  - Delete confirmation via ElMessageBox
  - Empty state when no rules exist"
  ```

---

## 阶段 4: CalendarBoard 集成与状态可视化

**Files:**
- Modify: `src/views/home/components/CalendarBoard.vue`

**Interfaces:**
- Consumes: 阶段 1 的 `useCalendarStore`、阶段 2 的 `DateSettingDialog`、阶段 3 的 `RecurringRuleDialog`
- Produces: 扩展后的日历组件，日期格支持 4 种状态渲染与点击交互

- [ ] **Step 1: 引入 store 与弹窗组件**

  修改 `CalendarBoard.vue` 的 `<script setup>`，在顶部补充 import：

  ```js
  import { useCalendarStore } from '@/stores/calendar'
  import DateSettingDialog from './DateSettingDialog.vue'
  import RecurringRuleDialog from './RecurringRuleDialog.vue'

  const calendarStore = useCalendarStore()

  // 弹窗状态
  const settingDialogVisible = ref(false)
  const settingDialogDate = ref('')
  const ruleDialogVisible = ref(false)

  const openSettingDialog = (day) => {
    settingDialogDate.value = day
    settingDialogVisible.value = true
  }
  ```

- [ ] **Step 2: 重写日期格模板 — 4 种状态可视化**

  替换 `#date-cell` 模板：

  ```vue
  <template #date-cell="{ data }">
    <div
      class="date-cell"
      :class="getDateCellClass(data.day)"
      role="button"
      tabindex="0"
      @click="openSettingDialog(data.day)"
      @keydown.enter="openSettingDialog(data.day)"
    >
      <span class="date-day">{{ data.day.split('-').slice(2).join('-') }}</span>
      <span v-if="getDateBadge(data.day)" class="date-badge">{{ getDateBadge(data.day) }}</span>
    </div>
  </template>
  ```

  在 `<script setup>` 内补充状态计算方法（组件层先查 hearing，再调 store）：

  ```js
  // 今日开庭日期集合（来自现有 todayHearings mock，本期仅今日）
  const todayHearingDates = computed(() => {
    const today = new Date().toISOString().slice(0, 10)
    return todayHearings.value.length > 0 ? new Set([today]) : new Set()
  })

  // 日期格样式 class
  const getDateCellClass = (day) => {
    // 1. 已约庭（hearing 数据，优先级最高）
    if (todayHearingDates.value.has(day)) {
      return 'is-hearing'
    }
    // 2. 调用 store 计算仲裁员自设状态
    const status = calendarStore.getDayStatus(day)
    return `is-${status.status}`
  }

  // 日期格标识文字（庭/休/半）
  const getDateBadge = (day) => {
    if (todayHearingDates.value.has(day)) return '庭'
    const status = calendarStore.getDayStatus(day)
    if (status.status === 'unavailable') return '休'
    if (status.status === 'partial') return '半'
    return ''
  }
  ```

  > **注意**：原 `events` 数组与 `hasEvent` 方法在重写后不再使用，需删除原 `<el-badge>` 事件圆点逻辑。原 `isSelected` 方法保留用于"今日"高亮（el-calendar 内置 is-selected 已处理）。

- [ ] **Step 3: 日历头部添加"周期规则"入口**

  修改 `#header` 模板，在 `header-actions` 内翻月按钮组前添加"周期规则"按钮：

  ```vue
  <template #header="{ date }">
    <div class="calendar-header">
      <span class="calendar-title-text">{{ formatCalendarHeader(date) }}</span>
      <div class="header-actions">
        <el-button
          class="calendar-nav-btn rule-btn"
          aria-label="周期规则"
          @click="ruleDialogVisible = true"
        >⚙ 周期规则</el-button>
        <span class="action-divider"></span>
        <el-button
          class="calendar-nav-btn"
          :icon="ArrowLeft"
          aria-label="上一月"
          @click="selectDate('prev-month')"
        />
        <el-button
          class="calendar-nav-btn today-btn"
          @click="selectDate('today')"
        >本月</el-button>
        <el-button
          class="calendar-nav-btn"
          :icon="ArrowRight"
          aria-label="下一月"
          @click="selectDate('next-month')"
        />
      </div>
    </div>
  </template>
  ```

- [ ] **Step 4: 在 template 末尾挂载两个弹窗**

  在 `</el-calendar>` 与 `<div class="today-summary">` 之间，或 `</div>`（最外层）之前添加：

  ```vue
  <!-- 单日设置弹窗 -->
  <DateSettingDialog
    v-model:visible="settingDialogVisible"
    :date="settingDialogDate"
    @saved="handleCalendarRefresh"
  />
  <!-- 周期规则弹窗 -->
  <RecurringRuleDialog v-model:visible="ruleDialogVisible" />
  ```

  由于 Pinia store 是响应式的，日历会自动刷新，`handleCalendarRefresh` 仅作为占位（无需实际操作）：

  ```js
  // 弹窗保存后回调（store 响应式驱动日历刷新，此处无需额外操作）
  const handleCalendarRefresh = () => {
    // 预留：后续对接 API 时可在此触发数据重新拉取
  }
  ```

- [ ] **Step 5: 删除旧的 events 相关代码**

  删除 `<script setup>` 中的：

  ```js
  // 删除以下代码
  const events = ref([
    '2026-07-16',
    '2026-07-20',
    '2026-07-25',
  ])
  const hasEvent = (day) => {
    return events.value.includes(day)
  }
  ```

- [ ] **Step 6: 补充日期格状态样式**

  在 `<style scoped lang="scss">` 的 `.date-cell` 块内补充状态样式，并新增 `.rule-btn` 与 `.action-divider`：

  ```scss
  .date-cell {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.2s ease;

    .date-day {
      font-size: 12px;
      color: var(--el-text-color-regular);
    }

    .date-badge {
      position: absolute;
      top: 2px;
      right: 2px;
      font-size: 10px;
      line-height: 1;
      padding: 1px 3px;
      border-radius: 2px;
    }

    // 4 种状态
    &.is-available {
      background-color: #fff;
    }
    &.is-hearing {
      background-color: #ecf5ff;
      .date-badge {
        color: var(--el-color-primary);
      }
    }
    &.is-unavailable {
      background-color: #fef0f0;
      .date-day {
        color: var(--el-color-danger);
      }
      .date-badge {
        color: var(--el-color-danger);
      }
    }
    &.is-partial {
      background: linear-gradient(to bottom, #fff 0%, #fff 50%, #fef0f0 50%, #fef0f0 100%);
      .date-badge {
        color: var(--el-color-danger);
      }
    }

    &:hover {
      box-shadow: inset 0 0 0 1px var(--el-color-primary);
    }
  }
  ```

  在 `.header-actions` 内补充：

  ```scss
  .rule-btn {
    padding: 0 10px;
    font-size: 12px;
  }
  .action-divider {
    width: 1px;
    height: 16px;
    background-color: var(--el-border-color);
    margin: 0 4px;
  }
  ```

  删除原有的 `.event-dot` 样式块（不再使用）。

- [ ] **Step 7: 联调自测 — 完整验证**

  启动 `npm run dev`，打开首页，完整验证以下场景：

  **状态渲染：**
  - 8月7日显示浅红底 + "休"标识（Mock daySlots unavailable）
  - 8月10日显示上白下红渐变 + "半"标识（Mock daySlots partial）
  - 8月5日（周三）显示"半"标识（周期规则 r1 每周三下午）
  - 8月1日（周六）显示白底无标识（默认可用）
  - 今日日期显示浅蓝底 + "庭"标识（todayHearings 非空）

  **单日设置弹窗：**
  - 点击任意日期 → 弹窗打开，标题显示正确日期与星期
  - 点击 8月7日（已有 daySlot）→ 弹窗回填"不可用 + 出差"
  - 切换状态为"部分不可用" → 时段设置区域出现
  - 保存 → ElMessage 成功提示，日历立即刷新
  - 点击有 daySlot 的日期 → 底部显示"清除单日设置"
  - 点击"清除单日设置" → 确认框 → 确认后该日期回退到周期规则或默认

  **周期规则弹窗：**
  - 点击头部"⚙ 周期规则" → 弹窗打开
  - 列表显示 2 条 Mock 规则
  - 新增"每周一上午不可用" → 列表增加，日历中所有周一显示"半"
  - 编辑"每周三下午"为"每周三全天" → 列表更新，日历中所有周三显示"休"
  - 删除"每周五下午" → 列表减少，日历中所有周五回到白底
  - 删除所有规则 → 显示空状态

  **边界验证：**
  - 同星期同时段新增 → 错误提示"该星期同时段已有规则"
  - 8月6日（周三，周期规则下午不可用）手动设为"可用" → 日历显示白底（单日覆盖周期）
  - 清除 8月6日的单日设置 → 回退到"半"（周期规则恢复生效）

- [ ] **Step 8: 提交**

  ```bash
  git add src/views/home/components/CalendarBoard.vue
  git commit -m "feat(calendar): integrate work calendar into CalendarBoard

  - 4-state date cell rendering (available/hearing/unavailable/partial)
  - Date cell click opens DateSettingDialog
  - Header adds recurring rule button with divider
  - Component-layer hearing check before store getDayStatus
  - Remove legacy events array and event-dot badge"
  ```

---

## 阶段 5: 完整回归与清理

**Files:**
- Verify: `src/views/home/components/CalendarBoard.vue`
- Verify: `src/views/home/components/DateSettingDialog.vue`
- Verify: `src/views/home/components/RecurringRuleDialog.vue`
- Verify: `src/stores/calendar.js`

- [ ] **Step 1: 移除阶段 2/3 的临时挂载代码**

  检查 `CalendarBoard.vue`，确保阶段 2 和阶段 3 中临时添加的测试代码已被阶段 4 的正式集成替换，无残留重复声明（如重复的 `settingDialogVisible`、`ruleDialogVisible` 声明）。

  如果存在重复，删除临时版本，保留阶段 4 的正式版本。

- [ ] **Step 2: 验证视觉规范遵循**

  打开浏览器 DevTools，逐项核对：

  - 弹窗标题字号 16px，`color: var(--el-text-color-regular)`
  - 正文/按钮字号 14px 或 12px，无 13px/15px
  - 辅助文字 12px 且 `color: var(--el-text-color-secondary)`
  - 标识"庭/休/半"字号 10px
  - el-dialog title 颜色为 `var(--el-text-color-regular)`（全局 SCSS 覆盖）
  - 操作按钮在 div 容器内右对齐

  调整窗口宽度至 ≤768px，验证：
  - 两个弹窗宽度变为 92%
  - 弹窗 margin 为 5vh auto
  - 日期格点击区域足够大（min-height 38px 已在原有样式中保证）

- [ ] **Step 3: 验证无控制台报错**

  打开浏览器控制台，刷新首页，确认：
  - 无 Vue warn（如重复声明、缺失 import）
  - 无 JS 运行时错误
  - Pinia store 正确注册（`$pinia._s.get('calendar')` 可访问）

- [ ] **Step 4: 验证 SchedulingView 占位页未受影响**

  打开"待办事项 → 智能约庭"，确认仍显示原占位页"智能约庭功能开发中，敬请期待"。本期不改动 `SchedulingView.vue`。

- [ ] **Step 5: 最终提交**

  如果 Step 1-4 有任何修改：

  ```bash
  git add -A
  git commit -m "chore(calendar): cleanup and visual spec compliance"
  ```

  如果无修改，跳过此步骤。

---

## 完工标准

- [ ] 首页日历支持 4 种状态可视化（可用/不可用/部分不可用/已约庭）
- [ ] 点击任意日期可打开单日设置弹窗，支持三态切换 + 时段设置 + 事由
- [ ] 已有单日设置可清除，回退到周期规则或默认
- [ ] 日历头部"⚙ 周期规则"按钮可打开周期规则管理弹窗
- [ ] 周期规则支持增删改，同星期同时段不可重复
- [ ] 单日设置可覆盖周期规则，清除后回退
- [ ] 视觉规范遵循 project_memory 全部约束
- [ ] 无控制台报错，无 Vue warn
- [ ] SchedulingView 占位页保持不变
