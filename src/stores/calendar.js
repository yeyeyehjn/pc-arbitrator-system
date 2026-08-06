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
