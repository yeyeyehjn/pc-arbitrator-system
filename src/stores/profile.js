import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useProfileStore = defineStore('profile', () => {
  // ============ 个人信息 ============
  const basicInfo = ref({
    name: '张三',
    idCard: '4401**********1234',
    nationality: '中国',
    otherIdType: '身份证',
    otherIdNo: '440106198505120001',
    otherIdExpiry: '2030-12-31',
    phone: '13800138000',
    gender: '男',
    email: 'zhangsan@example.com',
    addresses: {
      home: '上海市黄浦区南京东路100号',
      work: '上海市浦东新区陆家嘴环路1000号',
      other: '杭州市西湖区文三路200号',
      preferred: 'home',
    },
  })

  // ============ 工作单位 ============
  const workUnit = ref({
    company: '上海正义律师事务所',
    department: '商事仲裁部',
    position: '高级合伙人',
    phone: '021-68880001',
    status: 'active',
    fax: '021-68880002',
    address: '上海市浦东新区陆家嘴环路1000号恒生大厦18楼',
    remark: '执业年限 20 年，擅长商事合同纠纷',
    attachments: [
      { name: '执业证书.pdf', url: '#' },
      { name: '单位证明.docx', url: '#' },
    ],
  })

  // ============ 个人履历（5 类） ============
  const resume = ref({
    education: [
      { id: 'edu1', startDate: '1999-09-01', endDate: '2003-06-30', school: '华东政法学院', major: '法学', education: '本科', degree: '法学学士', attachments: [{ name: '毕业证书.pdf', url: '#' }], createdAt: 1 },
      { id: 'edu2', startDate: '2003-09-01', endDate: '2006-06-30', school: '复旦大学', major: '民商法学', education: '硕士', degree: '法学硕士', attachments: [], createdAt: 2 },
    ],
    language: [
      { id: 'lan1', language: '英语（CET-6）', attachments: [{ name: 'CET6证书.pdf', url: '#' }], createdAt: 1 },
      { id: 'lan2', language: '日语（N2）', attachments: [], createdAt: 2 },
    ],
    training: [
      { id: 'trn1', startDate: '2010-03-01', endDate: '2010-06-30', org: '上海仲裁委员会', result: '仲裁员岗前培训结业', attachments: [{ name: '结业证书.pdf', url: '#' }], createdAt: 1 },
      { id: 'trn2', startDate: '2018-09-01', endDate: '2018-10-31', org: '中国国际经济贸易仲裁委员会', result: '涉外仲裁研修', attachments: [], createdAt: 2 },
    ],
    achievement: [
      { id: 'ach1', startDate: '2015-06-01', name: '上海市优秀仲裁员', description: '被上海市司法局评为年度优秀仲裁员', attachments: [{ name: '荣誉证书.pdf', url: '#' }], createdAt: 1 },
    ],
    workHistory: [
      { id: 'wh1', startDate: '2006-07-01', endDate: '2010-08-31', name: '上海某律师事务所', description: '实习律师、专职律师' },
      { id: 'wh2', startDate: '2010-09-01', endDate: '', name: '上海正义律师事务所', description: '高级合伙人，主持商事仲裁部工作' },
    ],
  })

  // ============ 酬金单 ============
  const fee = ref({
    list: [
      { id: 'f1', caseId: 'c1', caseNo: '(2026)沪仲第1000号', caseName: '上海宏图贸易有限公司诉上海远东物流有限公司买卖合同纠纷', amount: 8000.00, status: '已结', payDate: '2026-05-10', secretary: '刘秘书' },
      { id: 'f2', caseId: 'c2', caseNo: '(2026)沪仲第1002号', caseName: '北京科瑞科技有限公司诉北京恒盛投资集团股权转让纠纷', amount: 15000.00, status: '已结', payDate: '2026-05-20', secretary: '陈秘书' },
      { id: 'f3', caseId: 'c3', caseNo: '(2025)沪仲第0998号', caseName: '王秀英诉陈建国借款合同纠纷', amount: 5000.00, status: '已结', payDate: '2025-12-15', secretary: '王秘书' },
      { id: 'f4', caseId: 'c4', caseNo: '(2026)沪仲第1004号', caseName: '深圳市鹏程建筑集团诉深圳市宏基建材有限公司建设工程施工合同纠纷', amount: 20000.00, status: '未结', payDate: '', secretary: '周秘书' },
      { id: 'f5', caseId: 'c5', caseNo: '(2026)沪仲第1006号', caseName: '李明华诉张伟强房屋租赁合同纠纷', amount: 6000.00, status: '未结', payDate: '', secretary: '刘秘书' },
      { id: 'f6', caseId: 'c6', caseNo: '(2025)沪仲第0990号', caseName: '某买卖合同纠纷案', amount: 7500.00, status: '已结', payDate: '2025-11-08', secretary: '陈秘书' },
      { id: 'f7', caseId: 'c7', caseNo: '(2025)沪仲第0985号', caseName: '某股权转让纠纷案', amount: 12000.00, status: '已结', payDate: '2025-10-22', secretary: '王秘书' },
      { id: 'f8', caseId: 'c8', caseNo: '(2024)沪仲第0970号', caseName: '某借款合同纠纷案', amount: 4500.00, status: '已结', payDate: '2024-12-30', secretary: '周秘书' },
    ],
    filters: { caseNo: '', status: '', year: '' },
    currentPage: 1,
    pageSize: 10,
  })

  // ============ 银行账号 ============
  const bank = ref({
    isCivilServant: 'no',
    isNonRemuneration: 'no',
    bankName: '中国工商银行',
    accountName: '张三',
    accountNo: '6222021001112345678',
  })

  // ============ 聘书 ============
  const certificates = ref([
    {
      id: 'cert1',
      certNo: '上海仲字第2020-0358号',
      startDate: '2020-06-01',
      endDate: '2026-05-31',
      field: '买卖合同、建设工程',
      term: '第八届',
      scanUrl: 'https://via.placeholder.com/400x560?text=仲裁员聘书',
    },
    {
      id: 'cert2',
      certNo: '上海仲字第2014-0216号',
      startDate: '2014-06-01',
      endDate: '2020-05-31',
      field: '民商事合同',
      term: '第七届',
      scanUrl: 'https://via.placeholder.com/400x560?text=仲裁员聘书(旧)',
    },
  ])

  // ============ 个人信息方法 ============
  const fetchBasicInfo = () => {
    return Promise.resolve(basicInfo.value)
  }

  const updateBasicInfo = (data) => {
    basicInfo.value = { ...basicInfo.value, ...data }
    return Promise.resolve(true)
  }

  const changePassword = (payload) => {
    // mock: 不实际校验旧密码/验证码
    return Promise.resolve(true)
  }

  // ============ 工作单位方法 ============
  const fetchWorkUnit = () => Promise.resolve(workUnit.value)

  const updateWorkUnit = (data) => {
    workUnit.value = { ...workUnit.value, ...data }
    return Promise.resolve(true)
  }

  // ============ 个人履历方法 ============
  const fetchResume = () => Promise.resolve(resume.value)

  const getSortedResume = (type) => {
    const list = resume.value[type] || []
    if (type === 'language') {
      return [...list].sort((a, b) => a.createdAt - b.createdAt)
    }
    return [...list].sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''))
  }

  let resumeIdCounter = 100
  const addResumeRecord = (type, data) => {
    const newRecord = { ...data, id: `${type}_${++resumeIdCounter}`, createdAt: Date.now() }
    resume.value[type].push(newRecord)
    return Promise.resolve(newRecord)
  }

  const updateResumeRecord = (type, id, data) => {
    const idx = resume.value[type].findIndex((r) => r.id === id)
    if (idx !== -1) {
      resume.value[type][idx] = { ...resume.value[type][idx], ...data }
    }
    return Promise.resolve(true)
  }

  const deleteResumeRecord = (type, id) => {
    const idx = resume.value[type].findIndex((r) => r.id === id)
    if (idx !== -1) {
      resume.value[type].splice(idx, 1)
    }
    return Promise.resolve(true)
  }

  // ============ 酬金单方法 ============
  const fetchFeeList = () => Promise.resolve(fee.value.list)

  const applyFeeFilters = (filters) => {
    fee.value.filters = { ...filters }
    fee.value.currentPage = 1
  }

  const resetFeeFilters = () => {
    fee.value.filters = { caseNo: '', status: '', year: '' }
    fee.value.currentPage = 1
  }

  const getFilteredFees = computed(() => {
    const { caseNo, status, year } = fee.value.filters
    return fee.value.list.filter((item) => {
      if (caseNo && !item.caseNo.toLowerCase().includes(caseNo.toLowerCase())) return false
      if (status && item.status !== status) return false
      if (year) {
        const itemYear = (item.payDate || item.caseNo.match(/\((\d{4})\)/)?.[1] || '').substring(0, 4)
        if (itemYear !== year) return false
      }
      return true
    })
  })

  const getPagedFees = computed(() => {
    const start = (fee.value.currentPage - 1) * fee.value.pageSize
    return getFilteredFees.value.slice(start, start + fee.value.pageSize)
  })

  const getFeeYears = computed(() => {
    const years = new Set()
    fee.value.list.forEach((item) => {
      const y = (item.payDate || item.caseNo.match(/\((\d{4})\)/)?.[1] || '').substring(0, 4)
      if (y) years.add(y)
    })
    return Array.from(years).sort((a, b) => b.localeCompare(a))
  })

  const setFeePage = (page) => { fee.value.currentPage = page }
  const setFeePageSize = (size) => { fee.value.pageSize = size; fee.value.currentPage = 1 }

  // ============ 银行账号方法 ============
  const fetchBank = () => Promise.resolve(bank.value)

  const updateBank = (data) => {
    bank.value = { ...bank.value, ...data }
    return Promise.resolve(true)
  }

  // ============ 聘书方法 ============
  const fetchCertificates = () => Promise.resolve(certificates.value)

  const getCertificateStatus = (cert) => {
    const today = new Date().toISOString().substring(0, 10)
    return cert.endDate >= today ? 'valid' : 'expired'
  }

  return {
    basicInfo,
    workUnit,
    resume,
    fee,
    bank,
    certificates,
    // 个人信息
    fetchBasicInfo,
    updateBasicInfo,
    changePassword,
    // 工作单位
    fetchWorkUnit,
    updateWorkUnit,
    // 个人履历
    fetchResume,
    getSortedResume,
    addResumeRecord,
    updateResumeRecord,
    deleteResumeRecord,
    // 酬金单
    fetchFeeList,
    applyFeeFilters,
    resetFeeFilters,
    getFilteredFees,
    getPagedFees,
    getFeeYears,
    setFeePage,
    setFeePageSize,
    // 银行账号
    fetchBank,
    updateBank,
    // 聘书
    fetchCertificates,
    getCertificateStatus,
  }
})
