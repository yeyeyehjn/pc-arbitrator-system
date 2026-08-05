import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// ============ Mock 数据 ============
// 颜色用语义键，由组件解析 CSS 变量（避免硬编码 hex，支持主题切换）
const MOCK_NEW_CASES = {
  total: 86,
  segments: [
    { type: 'sole', label: '独任', count: 32, ratio: 0.372, colorVar: '--el-color-primary' },
    { type: 'chief', label: '首席', count: 28, ratio: 0.326, colorVar: '--el-color-warning' },
    { type: 'side', label: '边裁', count: 26, ratio: 0.302, colorVar: '--el-color-success' },
  ],
}

const MOCK_ONGOING_CASES = {
  ongoingCount: 42,
  overdueCount: 3,
}

const MOCK_CLOSED_CASES = {
  total: 58,
  totalYoY: 12.5,
  breakdown: [
    { type: 'arbitration', label: '裁决率', rate: 0.62, yoy: -3.2, count: 36 },
    { type: 'mediation', label: '调解率', rate: 0.25, yoy: 1.8, count: 15 },
    { type: 'withdrawal', label: '撤案率', rate: 0.13, yoy: 1.4, count: 7 },
  ],
}

const MOCK_TOP_CAUSES = {
  causes: [
    { rank: 1, name: '买卖合同纠纷', count: 18, ratio: 0.321 },
    { rank: 2, name: '借款合同纠纷', count: 12, ratio: 0.214 },
    { rank: 3, name: '建设工程合同纠纷', count: 8, ratio: 0.143 },
    { rank: 4, name: '房屋买卖合同纠纷', count: 6, ratio: 0.107 },
    { rank: 5, name: '劳动争议', count: 5, ratio: 0.089 },
  ],
}

// ============ 日期工具函数 ============
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

const formatDateISO = (date) => {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const dayDiff = (start, end) => {
  const s = new Date(start)
  const e = new Date(end)
  return Math.round((e - s) / (1000 * 60 * 60 * 24))
}

// 计算预设日期范围
const computePresetRange = (type) => {
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  if (type === 'year') {
    const start = new Date(today.getFullYear(), 0, 1)
    start.setHours(0, 0, 0, 0)
    return { start: formatDateISO(start), end: formatDateISO(today) }
  }

  if (type === 'halfYear') {
    const start = new Date(today)
    start.setMonth(start.getMonth() - 6)
    start.setHours(0, 0, 0, 0)
    return { start: formatDateISO(start), end: formatDateISO(today) }
  }

  if (type === 'threeMonths') {
    const start = new Date(today)
    start.setMonth(start.getMonth() - 3)
    start.setHours(0, 0, 0, 0)
    return { start: formatDateISO(start), end: formatDateISO(today) }
  }

  return { start: '', end: '' }
}

// ============ Store ============
export const useStatisticsStore = defineStore('statistics', () => {
  // 筛选状态
  const dateRange = ref({ start: '', end: '' })
  const preset = ref('year') // 'year' | 'halfYear' | 'threeMonths' | null
  const isLoading = ref(false)
  const error = ref(null)

  // 图表数据
  const newCasesData = ref(null)
  const ongoingCasesData = ref(null)
  const closedCasesData = ref(null)
  const topCausesData = ref(null)

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
        fetchTopCauses(dateRange.value),
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
    preset.value = null
    if (new Date(start) > new Date(end)) {
      ;[start, end] = [end, start]
    }
    dateRange.value = { start, end }
  }

  // 动作：清除筛选
  function clearFilters() {
    setPreset('year')
  }

  return {
    dateRange,
    preset,
    isLoading,
    error,
    rangeSummary,
    newCasesData,
    ongoingCasesData,
    closedCasesData,
    topCausesData,
    loadAll,
    setPreset,
    setCustomRange,
    clearFilters,
  }
})

// ============ Mock fetch 函数 ============
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchNewCases() {
  await delay()
  return JSON.parse(JSON.stringify(MOCK_NEW_CASES))
}

async function fetchOngoingCases() {
  await delay()
  return JSON.parse(JSON.stringify(MOCK_ONGOING_CASES))
}

async function fetchClosedCases() {
  await delay()
  return JSON.parse(JSON.stringify(MOCK_CLOSED_CASES))
}

async function fetchTopCauses() {
  await delay()
  return JSON.parse(JSON.stringify(MOCK_TOP_CAUSES))
}
