import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'

export const SPECIALTIES = [
  { value: 'finance',      label: '金融投资' },
  { value: 'offline',      label: '线下会议' },
  { value: 'hklaw',        label: '港澳法律' },
  { value: 'construction', label: '建设工程' },
]

export const STATUS_CONFIG = [
  { value: 'pending',    label: '待处理',     tagType: 'warning' },
  { value: 'unreplied',  label: '未回复意见', tagType: 'success' },
  { value: 'processed',  label: '已处理',     tagType: 'info' },
]

export const getSpecialtyLabel = (val) => SPECIALTIES.find(s => s.value === val)?.label || val
export const getStatusConfig = (val) => STATUS_CONFIG.find(s => s.value === val) || STATUS_CONFIG[2]

const MOCK_EXPERT_LIST = [
  {
    id: 'ec1', title: '关于某建设工程纠纷的专家咨询', secretary: '张秘书', specialty: 'construction', status: 'pending',
    relatedCaseNo: '(2026)沪仲第1001号', focus: '工程款结算标准及违约金计算方式存在争议，涉及合同条款解释与实际履约行为冲突',
    reportFile: { name: '案件审理报告.pdf', url: '/mock/report-ec1.pdf' },
    attachments: [{ name: '证据清单.pdf', url: '/mock/evidence-ec1.pdf' }, { name: '鉴定意见.pdf', url: '/mock/appraisal-ec1.pdf' }],
    opinions: [], createdAt: '2026-07-28',
  },
  {
    id: 'ec2', title: '金融借款合同利率合规性咨询', secretary: '陈秘书', specialty: 'finance', status: 'pending',
    relatedCaseNo: '(2026)沪仲第1002号', focus: '借款利率是否超过法定上限，复利计算方式合规性认定',
    reportFile: { name: '案件审理报告.pdf', url: '/mock/report-ec2.pdf' },
    attachments: [{ name: '借款合同.pdf', url: '/mock/loan-ec2.pdf' }],
    opinions: [], createdAt: '2026-07-25',
  },
  {
    id: 'ec3', title: '港澳法律适用问题咨询', secretary: '王秘书', specialty: 'hklaw', status: 'unreplied',
    relatedCaseNo: '(2026)沪仲第1003号', focus: '跨境合同纠纷法律适用选择条款效力认定',
    reportFile: { name: '案件审理报告.pdf', url: '/mock/report-ec3.pdf' },
    attachments: [{ name: '涉外合同.pdf', url: '/mock/contract-ec3.pdf' }],
    opinions: [], createdAt: '2026-07-20',
  },
  {
    id: 'ec4', title: '线下会议纠纷处理方案咨询', secretary: '刘秘书', specialty: 'offline', status: 'unreplied',
    relatedCaseNo: '(2026)沪仲第1004号', focus: '会议纪要效力认定与补充协议冲突处理',
    reportFile: { name: '案件审理报告.pdf', url: '/mock/report-ec4.pdf' },
    attachments: [{ name: '会议纪要.pdf', url: '/mock/minutes-ec4.pdf' }],
    opinions: [], createdAt: '2026-07-18',
  },
  {
    id: 'ec5', title: '建设工程质量保修金返还争议咨询', secretary: '张秘书', specialty: 'construction', status: 'processed',
    relatedCaseNo: '(2026)沪仲第1005号', focus: '保修期满后质量保修金返还条件是否成就',
    reportFile: { name: '案件审理报告.pdf', url: '/mock/report-ec5.pdf' },
    attachments: [{ name: '竣工验收报告.pdf', url: '/mock/acceptance-ec5.pdf' }],
    opinions: [
      { replier: '李明', content: '经审查，本案质量保修期已满，且被申请人未提供有效证据证明保修期内存在质量问题。建议支持申请人返还保修金的请求，违约金按合同约定标准计算。', attachments: [{ name: '专家意见附件-类似案例.pdf', url: '/mock/expert-ec5.pdf' }], submittedAt: '2026-07-15 14:30' },
      { replier: '李明', content: '补充意见：关于违约金的起算时间，应以保修期满次日为准，而非被申请人主张的竣工验收日期。', attachments: [], submittedAt: '2026-07-16 09:20' },
    ], createdAt: '2026-07-10',
  },
  {
    id: 'ec6', title: '金融借款担保责任范围咨询', secretary: '陈秘书', specialty: 'finance', status: 'processed',
    relatedCaseNo: '(2026)沪仲第1006号', focus: '连带保证人责任范围是否及于违约金',
    reportFile: { name: '案件审理报告.pdf', url: '/mock/report-ec6.pdf' },
    attachments: [{ name: '担保合同.pdf', url: '/mock/guarantee-ec6.pdf' }],
    opinions: [
      { replier: '王华', content: '根据《民法典》第六百八十八条，连带保证人责任范围依约定；本案担保合同明确约定"担保范围包括主债权及违约金"，故保证人责任及于违约金。', attachments: [], submittedAt: '2026-07-08 10:15' },
    ], createdAt: '2026-07-01',
  },
]

// 为 ac1 生成多条意见以验证分页效果
const _ac1Opinions = Array.from({ length: 12 }, (_, i) => ({
  replier: i % 3 === 0 ? '陈大文' : i % 3 === 1 ? '林秀英' : '赵建国',
  content: `针对本案工程变更后价款调整方法的第${i + 1}条补充意见：根据《建设工程司法解释》相关规定，结合实际履约情况，价款调整应参照签约时当地建设行政主管部门发布的计价标准。本案中签证单已经双方授权代表签认，应作为价款调整的依据。`,
  attachments: i % 4 === 0 ? [{ name: `补充材料${i + 1}.pdf`, url: `/mock/supplement-ac1-${i + 1}.pdf` }] : [],
  submittedAt: `2026-07-${String(10 + i).padStart(2, '0')} ${String(9 + (i % 8)).padStart(2, '0')}:30`,
}))

const MOCK_APPLICANT_LIST = [
  {
    id: 'ac1', title: '我的建设工程纠纷专家咨询', secretary: '张秘书', specialty: 'construction',
    relatedCaseNo: '(2026)沪仲第2001号', focus: '工程变更后价款调整方法争议',
    reportFile: { name: '案件审理报告.pdf', url: '/mock/report-ac1.pdf' },
    attachments: [{ name: '变更签证.pdf', url: '/mock/visa-ac1.pdf' }],
    opinions: _ac1Opinions, createdAt: '2026-07-15',
  },
  {
    id: 'ac2', title: '金融借款利率合规咨询', secretary: '陈秘书', specialty: 'finance',
    relatedCaseNo: '(2026)沪仲第2002号', focus: '逾期利息与违约金并存时上限认定',
    reportFile: { name: '案件审理报告.pdf', url: '/mock/report-ac2.pdf' },
    attachments: [{ name: '借款合同.pdf', url: '/mock/loan-ac2.pdf' }],
    opinions: [
      { replier: '陈大文', content: '逾期利息与违约金并存的，总和超过合同成立时一年期贷款市场报价利率四倍的部分不予支持。', attachments: [{ name: 'LPR历史数据.pdf', url: '/mock/lpr-ac2.pdf' }], submittedAt: '2026-07-18 11:30' },
    ], createdAt: '2026-07-10',
  },
  {
    id: 'ac3', title: '港澳法律适用咨询', secretary: '王秘书', specialty: 'hklaw',
    relatedCaseNo: '(2026)沪仲第2003号', focus: '涉港合同法律适用选择条款效力',
    reportFile: { name: '案件审理报告.pdf', url: '/mock/report-ac3.pdf' },
    attachments: [{ name: '涉外合同.pdf', url: '/mock/contract-ac3.pdf' }],
    opinions: [
      { replier: '林秀英', content: '当事人协议选择适用法律的条款有效，但不得规避我国强制性法律规定。涉及外汇管制的部分应适用内地法律。', attachments: [], submittedAt: '2026-07-12 09:45' },
    ], createdAt: '2026-07-05',
  },
  {
    id: 'ac4', title: '线下会议纪要效力咨询', secretary: '刘秘书', specialty: 'offline',
    relatedCaseNo: '(2026)沪仲第2004号', focus: '未经全体签字的会议纪要是否具有合同效力',
    reportFile: { name: '案件审理报告.pdf', url: '/mock/report-ac4.pdf' },
    attachments: [{ name: '会议纪要.pdf', url: '/mock/minutes-ac4.pdf' }],
    opinions: [
      { replier: '赵建国', content: '会议纪要经双方授权代表签字即具有合同效力，未经全体与会人员签字不影响已签字部分的效力，但需证明签字人具有相应授权。', attachments: [{ name: '授权委托书.pdf', url: '/mock/auth-ac4.pdf' }], submittedAt: '2026-07-08 14:20' },
      { replier: '赵建国', content: '补充意见：若无法证明签字人获得明确授权，可依据表见代理规则主张效力，但需相对方善意且无重大过失。', attachments: [], submittedAt: '2026-07-09 10:00' },
    ], createdAt: '2026-06-28',
  },
  {
    id: 'ac5', title: '建设工程结算争议咨询', secretary: '张秘书', specialty: 'construction',
    relatedCaseNo: '(2026)沪仲第2005号', focus: '施工合同无效后已完工程价款结算依据',
    reportFile: { name: '案件审理报告.pdf', url: '/mock/report-ac5.pdf' },
    attachments: [{ name: '竣工验收报告.pdf', url: '/mock/acceptance-ac5.pdf' }],
    opinions: [
      { replier: '陈大文', content: '施工合同无效但工程验收合格的，可参照合同约定结算工程价款；实际履约行为与合同约定冲突时，以实际履行为准。', attachments: [{ name: '类似案例汇编.pdf', url: '/mock/cases-ac5.pdf' }], submittedAt: '2026-07-03 15:50' },
    ], createdAt: '2026-06-20',
  },
]

export const useConsultStore = defineStore('consult', () => {
  const expertList = ref([])
  const applicantList = ref([])
  const loading = ref(false)
  const currentDetail = ref(null)

  const pendingCount = computed(() =>
    expertList.value.filter(i => i.status !== 'processed').length
  )

  async function fetchExpertList(filters = {}) {
    loading.value = true
    let list = [...MOCK_EXPERT_LIST]
    const { title, secretary, specialty, status } = filters
    if (title) list = list.filter(i => i.title.includes(title.trim()))
    if (secretary) list = list.filter(i => i.secretary.includes(secretary.trim()))
    if (specialty) list = list.filter(i => i.specialty === specialty)
    if (status) {
      if (status === 'pending') list = list.filter(i => i.status === 'pending' || i.status === 'unreplied')
      else list = list.filter(i => i.status === status)
    }
    expertList.value = list
    loading.value = false
  }

  async function fetchApplicantList(filters = {}) {
    loading.value = true
    let list = [...MOCK_APPLICANT_LIST]
    const { title, secretary, specialty } = filters
    if (title) list = list.filter(i => i.title.includes(title.trim()))
    if (secretary) list = list.filter(i => i.secretary.includes(secretary.trim()))
    if (specialty) list = list.filter(i => i.specialty === specialty)
    applicantList.value = list
    loading.value = false
  }

  async function fetchDetail(id, mode) {
    loading.value = true
    const source = mode === 'expert' ? MOCK_EXPERT_LIST : MOCK_APPLICANT_LIST
    const found = source.find(i => i.id === id)
    // 深拷贝，避免直接修改 Mock 常量
    currentDetail.value = found ? JSON.parse(JSON.stringify(found)) : null
    loading.value = false
  }

  function submitSign(id, { method, decision }) {
    const item = expertList.value.find(i => i.id === id)
    if (!item) return
    if (decision === 'accept') {
      item.status = 'unreplied'
    } else {
      item.status = 'processed'
    }
    if (currentDetail.value?.id === id) currentDetail.value = { ...item }
  }

  function submitOpinion(id, { content, attachments }) {
    const item = expertList.value.find(i => i.id === id)
    if (!item) return
    if (!item.opinions) item.opinions = []
    const authStore = useAuthStore()
    item.opinions.push({
      replier: authStore.user?.name || '当前用户',
      content,
      attachments: attachments || [],
      submittedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    })
    item.status = 'processed'
    if (currentDetail.value?.id === id) currentDetail.value = { ...item }
  }

  function exitConsult(id) {
    const item = expertList.value.find(i => i.id === id)
    if (!item) return
    item.status = 'processed'
    if (currentDetail.value?.id === id) currentDetail.value = { ...item }
  }

  return {
    expertList, applicantList, loading, currentDetail, pendingCount,
    fetchExpertList, fetchApplicantList, fetchDetail,
    submitSign, submitOpinion, exitConsult,
  }
})
