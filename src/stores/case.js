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
    createCase(12, { caseStatus: '已结案', closedType: 'ruling', amount: 1200 }),
    createCase(13, { caseStatus: '已结案', closedType: 'mediation', amount: 580 }),
    createCase(14, { caseStatus: '已结案', closedType: 'withdraw', amount: 350 }),
    createCase(15, { caseStatus: '已结案', closedType: 'ruling', amount: 8900 }),
    createCase(16, { caseStatus: '已结案', closedType: 'mediation', amount: 230 }),
    createCase(17, { caseStatus: '已结案', closedType: 'ruling', amount: 16000 }),
    createCase(18, { caseStatus: '已结案', closedType: 'withdraw', amount: 760 }),
    createCase(19, { caseStatus: '已结案', closedType: 'mediation', amount: 4200 }),
    createCase(20, { caseStatus: '已结案', closedType: 'ruling', amount: 980 }),
    createCase(21, { caseStatus: '已结案', closedType: 'ruling', amount: 1500 }),
    createCase(22, { caseStatus: '已结案', closedType: 'mediation', amount: 340 }),
    createCase(23, { caseStatus: '已结案', closedType: 'withdraw', amount: 670 }),
    createCase(24, { caseStatus: '已结案', closedType: 'ruling', amount: 2800 }),
    createCase(25, { caseStatus: '已结案', closedType: 'mediation', amount: 1100 }),
    createCase(26, { caseStatus: '已结案', closedType: 'ruling', amount: 450 }),
    createCase(27, { caseStatus: '已结案', closedType: 'withdraw', amount: 890 }),
    createCase(28, { caseStatus: '已结案', closedType: 'ruling', amount: 5200 }),
    createCase(29, { caseStatus: '已结案', closedType: 'mediation', amount: 330 }),
  ])

  // 筛选状态
  const filters = ref({
    caseNo: '',
    applicant: '',
    respondent: '',
    caseReason: '',
    secretary: '',
    amountMin: null,
    amountMax: null,
    hearingDate: null,
    caseType: '',
    closedType: '',
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
      if (f.caseNo && !item.caseNo.includes(f.caseNo.trim())) return false
      if (f.applicant && !item.applicant.includes(f.applicant.trim())) return false
      if (f.respondent && !item.respondent.includes(f.respondent.trim())) return false
      if (f.caseReason && !item.caseReason.includes(f.caseReason.trim())) return false
      if (f.secretary && !item.secretary.includes(f.secretary.trim())) return false
      if (f.amountMin != null && item.amount < f.amountMin) return false
      if (f.amountMax != null && item.amount > f.amountMax) return false
      if (f.hearingDate) {
        const filterDate = new Date(f.hearingDate).toISOString().slice(0, 10)
        if (item.hearingDate !== filterDate) return false
      }
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
      f.caseNo || f.applicant || f.respondent || f.caseReason || f.secretary ||
      f.amountMin != null || f.amountMax != null || f.hearingDate ||
      f.caseType || f.closedType ||
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
      caseNo: '', applicant: '', respondent: '', caseReason: '', secretary: '',
      amountMin: null, amountMax: null, hearingDate: null, caseType: '', closedType: '',
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
