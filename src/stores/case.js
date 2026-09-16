import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 重大案件阈值：标的 ≥ 1 亿元 = 10000 万元
export const MAJOR_AMOUNT_THRESHOLD = 10000

// Mock 数据辅助：生成案件基础字段
const createCase = (idx, overrides = {}) => ({
  id: `case-${idx}`,
  caseNo: `(2026)沪仲第${String(1000 + idx).padStart(4, '0')}号`,
  caseReason: ['买卖合同纠纷', '股权转让纠纷', '建设工程施工合同纠纷', '借款合同纠纷', '房屋租赁合同纠纷'][idx % 5],
  applicant: ['上海宏图贸易有限公司', '李明华', '北京科瑞科技有限公司', '王秀英', '深圳市鹏程建筑集团'][idx % 5],
  respondent: ['上海远东物流有限公司', '张伟强', '北京恒盛投资集团', '陈建国', '深圳市宏基建材有限公司'][idx % 5],
  amount: [120, 580, 3500, 8.6, 4200, 15000, 320, 7600][idx % 8], // 万元
  secretary: ['刘秘书', '陈秘书', '王秘书', '赵秘书', '周秘书'][idx % 5],
  agent: ['张律师', '李律师', '王律师', '赵律师', '钱律师'][idx % 5],
  tribunal: ['张三', '张三、李四、王五', '李四', '王五、张三、赵六'][idx % 4],
  caseType: ['solo', 'chief', 'solo', 'side'][idx % 4], // solo独任 / chief首席 / side边裁
  groupDate: `2026-0${(idx % 6) + 1}-1${idx % 9}`,
  hearingDate: `2026-0${(idx % 6) + 1}-2${idx % 9}`,
  deadline: `2026-0${(idx % 6) + 1}-3${idx % 9}`,
  remainDays: [62, 36, -5, 120, 10, 45, -12, 8][idx % 8], // 含即将到期(≤15)、已过期(<0)、正常
  isSuspended: [false, false, false, false, false, false, true, false][idx % 8],
  extensionCount: [1, 2, 0, 0, 1, 0, 3, 0][idx % 8],
  caseStatus: ['审理中', '已组庭', '待开庭', '审理中', '已开庭'][idx % 5],
  ...overrides,
})

export const useCaseStore = defineStore('case', () => {
  // ============ 状态 ============
  const stats = ref({ active: 12, closed: 18 })
  const currentStatus = ref('active') // 'active' | 'closed'

  // 在办案件全量 Mock 数据（含多种场景）
  const activeList = ref([
    createCase(0, { amount: 120 }),                              // 正常案件
    createCase(1, { amount: 580, remainDays: 10 }),             // 即将到期(≤15)
    createCase(2, { amount: 3500, remainDays: -5 }),           // 已过期(<0)
    createCase(3, { amount: 8.6 }),                              // 小标的
    createCase(4, { amount: 15000, remainDays: 45 }),          // 重大案件(>1亿)
    createCase(5, { amount: 320, remainDays: 36 }),
    createCase(6, { amount: 7600, remainDays: -12, isSuspended: true }), // 已过期+中止
    createCase(7, { amount: 420, remainDays: 8 }),              // 即将到期
    createCase(8, { amount: 980, remainDays: 120, extensionCount: 0 }),
    createCase(9, { amount: 2300, remainDays: 62 }),
    createCase(10, { amount: 560, remainDays: 15 }),            // 即将到期边界
    createCase(11, { amount: 18000, remainDays: 30 }),          // 重大案件
  ])

  // 已结案件全量 Mock 数据
  const closedList = ref([
    createCase(12, { caseStatus: '已结案', closedType: 'ruling', amount: 1200, closedDate: '2026-03-15' }),
    createCase(13, { caseStatus: '已结案', closedType: 'mediation', amount: 580, closedDate: '2026-04-20' }),
    createCase(14, { caseStatus: '已结案', closedType: 'withdraw', amount: 350, closedDate: '2026-02-28' }),
    createCase(15, { caseStatus: '已结案', closedType: 'ruling', amount: 8900, closedDate: '2026-05-10' }),
    createCase(16, { caseStatus: '已结案', closedType: 'mediation', amount: 230, closedDate: '2026-01-18' }),
    createCase(17, { caseStatus: '已结案', closedType: 'ruling', amount: 16000, closedDate: '2026-06-05' }),
    createCase(18, { caseStatus: '已结案', closedType: 'withdraw', amount: 760, closedDate: '2026-03-22' }),
    createCase(19, { caseStatus: '已结案', closedType: 'mediation', amount: 4200, closedDate: '2026-04-08' }),
    createCase(20, { caseStatus: '已结案', closedType: 'ruling', amount: 980, closedDate: '2026-05-25' }),
    createCase(21, { caseStatus: '已结案', closedType: 'ruling', amount: 1500, closedDate: '2026-02-14' }),
    createCase(22, { caseStatus: '已结案', closedType: 'mediation', amount: 340, closedDate: '2026-06-18' }),
    createCase(23, { caseStatus: '已结案', closedType: 'withdraw', amount: 670, closedDate: '2026-03-30' }),
    createCase(24, { caseStatus: '已结案', closedType: 'ruling', amount: 2800, closedDate: '2026-04-12' }),
    createCase(25, { caseStatus: '已结案', closedType: 'mediation', amount: 1100, closedDate: '2026-05-06' }),
    createCase(26, { caseStatus: '已结案', closedType: 'ruling', amount: 450, closedDate: '2026-01-25' }),
    createCase(27, { caseStatus: '已结案', closedType: 'withdraw', amount: 890, closedDate: '2026-06-22' }),
    createCase(28, { caseStatus: '已结案', closedType: 'ruling', amount: 5200, closedDate: '2026-02-08' }),
    createCase(29, { caseStatus: '已结案', closedType: 'mediation', amount: 330, closedDate: '2026-03-05' }),
  ])

  // 筛选状态
  const filters = ref({
    caseYear: '',          // 案件年份
    caseNo: '',            // 案件编号
    party: '',             // 当事人（申请人或被申请人）
    agent: '',             // 代理人
    tribunal: '',          // 仲裁庭
    secretary: '',         // 办案秘书
    caseReason: '',        // 案由
    groupDateRange: [],    // 组庭时间范围 [start, end]
    closedDateRange: [],   // 结案时间范围 [start, end]
    amountMin: null,       // 标的最小（万元）
    amountMax: null,       // 标的最大（万元）
    caseType: '',          // 类型（solo独任/chief首席/side边裁）
    closedType: '',        // 结案方式（ruling/mediation/withdraw）
  })

  const quickFilters = ref({
    major: false,       // 重大案件（标的 > 1亿 = 10000万元）
    expiringSoon: false, // 即将延期（≤15天 且 > 0 且 !isSuspended）
    expired: false,     // 已延期（< 0）
  })

  const currentPage = ref(1)
  const pageSize = ref(10)

  // ============ 计算属性 ============
  // 应用常规筛选 + 快捷芯片后的列表
  const filteredCases = computed(() => {
    const list = currentStatus.value === 'active' ? activeList.value : closedList.value
    const f = filters.value
    const qf = quickFilters.value

    return list.filter((item) => {
      // 常规筛选
      if (f.caseYear) {
        const yearMatch = item.caseNo.match(/\((\d{4})\)/)
        const itemYear = yearMatch ? yearMatch[1] : ''
        if (itemYear !== f.caseYear) return false
      }
      if (f.caseNo && !item.caseNo.includes(f.caseNo.trim())) return false
      if (f.party) {
        const kw = f.party.trim()
        if (!item.applicant.includes(kw) && !item.respondent.includes(kw)) return false
      }
      if (f.agent && !item.agent.includes(f.agent.trim())) return false
      if (f.tribunal && !item.tribunal.includes(f.tribunal.trim())) return false
      if (f.secretary && !item.secretary.includes(f.secretary.trim())) return false
      if (f.caseReason && !item.caseReason.includes(f.caseReason.trim())) return false
      // 组庭时间范围
      if (f.groupDateRange && f.groupDateRange.length === 2) {
        const [start, end] = f.groupDateRange
        if (item.groupDate < start || item.groupDate > end) return false
      }
      // 结案时间范围（仅已结案件）
      if (f.closedDateRange && f.closedDateRange.length === 2) {
        const [start, end] = f.closedDateRange
        if (!item.closedDate || item.closedDate < start || item.closedDate > end) return false
      }
      if (f.amountMin != null && item.amount < f.amountMin) return false
      if (f.amountMax != null && item.amount > f.amountMax) return false
      if (f.caseType && item.caseType !== f.caseType) return false
      if (f.closedType && currentStatus.value === 'closed' && item.closedType !== f.closedType) return false

      // 快捷筛选（AND 关系）
      if (qf.major && item.amount <= MAJOR_AMOUNT_THRESHOLD) return false
      if (qf.expiringSoon && !(item.remainDays > 0 && item.remainDays <= 15 && !item.isSuspended)) return false
      if (qf.expired && !(item.remainDays < 0)) return false

      return true
    })
  })

  // 分页后的列表
  const pagedCases = computed(() => {
    const filtered = filteredCases.value
    const start = (currentPage.value - 1) * pageSize.value
    return filtered.slice(start, start + pageSize.value)
  })

  // 是否有激活的筛选条件（用于空状态判断是否显示「清除筛选」）
  const hasActiveFilters = computed(() => {
    const f = filters.value
    const qf = quickFilters.value
    return Boolean(
      f.caseYear || f.caseNo || f.party || f.agent || f.tribunal ||
      f.secretary || f.caseReason ||
      (f.groupDateRange && f.groupDateRange.length === 2) ||
      (f.closedDateRange && f.closedDateRange.length === 2) ||
      f.amountMin != null || f.amountMax != null || f.caseType || f.closedType ||
      qf.major || qf.expiringSoon || qf.expired
    )
  })

  // 子统计：在办案件的审限状态分布
  const activeSubStats = computed(() => {
    const list = activeList.value
    let normal = 0, expiringSoon = 0, expired = 0
    list.forEach((item) => {
      if (item.isSuspended) return // 中止案件不计入
      if (item.remainDays < 0) expired++
      else if (item.remainDays > 0 && item.remainDays <= 15) expiringSoon++
      else normal++
    })
    return { normal, expiringSoon, expired }
  })

  // 子统计：已结案件的结案类型分布
  const closedSubStats = computed(() => {
    const list = closedList.value
    let ruling = 0, mediation = 0, withdraw = 0
    list.forEach((item) => {
      if (item.closedType === 'ruling') ruling++
      else if (item.closedType === 'mediation') mediation++
      else if (item.closedType === 'withdraw') withdraw++
    })
    return { ruling, mediation, withdraw }
  })

  // ============ 方法 ============
  const fetchStats = () => {
    return stats.value
  }

  const switchStatus = (status) => {
    currentStatus.value = status
    // 重置筛选 + 分页
    resetFilters()
  }

  const applyFilters = () => {
    currentPage.value = 1
  }

  const resetFilters = () => {
    filters.value = {
      caseYear: '', caseNo: '', party: '', agent: '', tribunal: '',
      secretary: '', caseReason: '',
      groupDateRange: [], closedDateRange: [],
      amountMin: null, amountMax: null, caseType: '', closedType: '',
    }
    quickFilters.value = { major: false, expiringSoon: false, expired: false }
    currentPage.value = 1
  }

  const toggleQuickFilter = (key) => {
    quickFilters.value[key] = !quickFilters.value[key]
    currentPage.value = 1
  }

  return {
    // 状态
    stats,
    currentStatus,
    activeList,
    closedList,
    filters,
    quickFilters,
    currentPage,
    pageSize,
    // 计算属性
    filteredCases,
    pagedCases,
    hasActiveFilters,
    activeSubStats,
    closedSubStats,
    // 方法
    fetchStats,
    switchStatus,
    applyFilters,
    resetFilters,
    toggleQuickFilter,
  }
})
