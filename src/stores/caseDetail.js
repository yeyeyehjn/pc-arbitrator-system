import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { mockRunAITool } from '@/views/cases/components/detail/work/aiMockResults'

// 重大案件阈值：标的 ≥ 1 亿元 = 10000 万元
export const MAJOR_AMOUNT_THRESHOLD = 10000

// Mock：根据案件 ID 生成详情数据
function buildMockCaseDetail(caseId) {
  return {
    caseInfo: {
      id: caseId,
      caseNo: '(2026)沪仲第1001号',
      caseReason: '买卖合同纠纷',
      caseStatus: '审理中',
      filingDate: '2026-03-15',
      secretary: '刘秘书',
      secretaryPhone: '021-58888888',
      secretaryEmail: 'liu@gzac.org',
      tribunal: '张三（独任）',
      groupDate: '2026-03-20',
      hearingDate: '2026-09-15 14:00',
      deadline: '2026/09/15',
      remainDays: 47,
      isSuspended: false,
      extensionCount: 1,
      amount: 3500, // 万元（重大案件示例，> 10000 也会触发星标）
    },
    parties: {
      applicants: [
        {
          id: 'app-1',
          type: 'enterprise',
          name: '上海宏图贸易有限公司',
          nationality: '中国',
          idType: '统一社会信用代码',
          idNumber: '91310115MA****1234',
          phone: '138****1234',
          email: 'hongtu@example.com',
          address: '上海市浦东新区张江路 100 号',
          certificate: '营业执照.pdf',
          agents: [
            {
              id: 'agt-1',
              agentType: '律师',
              nationality: '中国',
              name: '张律师',
              firm: '上海市 XX 律师事务所',
              idType: '身份证',
              idNumber: '310***********1234',
              phone: '137****5678',
              email: 'zhang@xxlaw.com',
              principal: '上海宏图贸易有限公司',
              authority: '一般授权',
              powerOfAttorney: '授权委托书.pdf',
              firmLetter: '所函.pdf',
              licenseCopy: '律师证复印件.pdf',
            },
            {
              id: 'agt-2',
              agentType: '员工代理',
              nationality: '中国',
              name: '王助理',
              firm: '上海宏图贸易有限公司',
              idType: '身份证',
              idNumber: '310***********5678',
              phone: '136****9012',
              email: 'wang@hongtu.com',
              principal: '上海宏图贸易有限公司',
              authority: '一般授权',
              powerOfAttorney: '授权委托书.pdf',
              firmLetter: '在职证明.pdf',
              licenseCopy: '—',
            },
          ],
        },
        {
          id: 'app-2',
          type: 'natural',
          name: '李明',
          nationality: '中国',
          idType: '身份证',
          idNumber: '310***********9012',
          phone: '139****0001',
          email: 'liming@example.com',
          address: '上海市黄浦区南京东路 200 号',
          idFront: '身份证人像面.jpg',
          idBack: '身份证国徽面.jpg',
          agents: [],
        },
      ],
      respondents: [
        {
          id: 'res-1',
          type: 'enterprise',
          name: '上海远东物流有限公司',
          nationality: '中国',
          idType: '统一社会信用代码',
          idNumber: '91310112MA****5678',
          phone: '139****3456',
          email: 'yuandong@example.com',
          address: '上海市闵行区莘庄工业区 XX 号',
          certificate: '营业执照.pdf',
          agents: [
            {
              id: 'agt-3',
              agentType: '律师',
              nationality: '中国',
              name: '李律师',
              firm: '上海市 YY 律师事务所',
              idType: '身份证',
              idNumber: '310***********3456',
              phone: '135****3456',
              email: 'li@yylaw.com',
              principal: '上海远东物流有限公司',
              authority: '特殊授权',
              powerOfAttorney: '授权委托书.pdf',
              firmLetter: '所函.pdf',
              licenseCopy: '律师证复印件.pdf',
            },
          ],
        },
      ],
    },
    claims: {
      // 1. 仲裁条款约定情况
      arbitrationClause: {
        text: '双方于 2025 年 3 月 10 日签订的《买卖合同》第十二条约定："凡因本合同引起的或与本合同有关的任何争议，均提交上海仲裁委员会按其现行仲裁规则进行仲裁。仲裁裁决是终局的，对双方均有约束力。"',
        attachments: [{ name: '买卖合同（含仲裁条款）.pdf' }],
      },
      // 2. 合同签订主体及签章情况
      contractSign: {
        text: '合同由申请人上海宏图贸易有限公司（甲方）与被申请人上海远东物流有限公司（乙方）签订，双方均加盖公司公章，法定代表人或授权代表签字齐全。',
        attachments: [{ name: '合同签章页扫描件.pdf' }],
      },
      // 3. 事实和理由
      factsAndReasons: {
        text: '2025 年 3 月 10 日，申请人与被申请人签订《买卖合同》，约定申请人向被申请人供应货物，合同总金额 350 万元。申请人依约于 2025 年 3 月 15 日至 4 月 20 日分 8 批供货，均有送货单签收。被申请人收货后未按约定支付货款，经多次催告仍拒不支付。被申请人虽主张质量问题，但在收货时未在约定检验期内提出异议，且其检测报告系单方委托，程序与标准均不符合合同约定。被申请人的行为已构成违约，应承担支付货款及违约金的违约责任。',
        attachments: [{ name: '仲裁申请书.pdf' }],
      },
      // 4. 请求列表
      claimList: [
        { id: 'cl-1', content: '责令被申请人支付货款人民币 350 万元' },
        { id: 'cl-2', content: '责令被申请人支付违约金人民币 35 万元' },
        { id: 'cl-3', content: '仲裁费用由被申请人承担' },
      ],
      // 5. 答辩意见（多条）
      defenseList: [
        {
          id: 'df-1',
          respondent: '上海远东物流有限公司（被申请人）',
          content: '被申请人确认收到货物，但主张货物存在质量问题，申请人未按合同约定提供符合质量标准的产品，故拒付货款有正当理由。',
          files: [{ name: '答辩状.pdf' }],
        },
        {
          id: 'df-2',
          respondent: '上海远东物流有限公司（被申请人）',
          content: '违约金计算方式过高，请求依法调整。',
          files: [],
        },
      ],
    },
    evidence: {
      applicant: [
        { id: 'ev-a1', name: '买卖合同', type: '合同', submitDate: '2026-03-15', fileType: 'pdf' },
        { id: 'ev-a2', name: '送货单（8 份）', type: '单据', submitDate: '2026-03-15', fileType: 'pdf' },
        { id: 'ev-a3', name: '对账单', type: '财务', submitDate: '2026-03-15', fileType: 'image' },
      ],
      respondent: [
        { id: 'ev-b1', name: '质量检测报告', type: '鉴定', submitDate: '2026-06-12', fileType: 'pdf' },
        { id: 'ev-b2', name: '维修费用清单', type: '财务', submitDate: '2026-06-12', fileType: 'image' },
      ],
    },
    attachments: [
      { id: 'at-1', name: '组庭通知书', type: '程序文书', submitDate: '2026-03-20', fileType: 'pdf' },
      { id: 'at-2', name: '延期申请表', type: '程序文书', submitDate: '2026-05-10', fileType: 'pdf' },
    ],
    caseTodos: [
      { id: 'todo-1', type: '笔录签名', typeTag: 'primary', title: '第一次庭审笔录签名请求', submitTime: '2026-09-16 10:00', target: 'docs' },
      { id: 'todo-2', type: '裁决书核阅', typeTag: 'success', title: '裁决书草稿核阅', submitTime: '2026-09-20 14:30', target: 'docs' },
      { id: 'todo-3', type: '文书签名', typeTag: 'warning', title: '结案文书签名', submitTime: '2026-09-22 09:00', target: 'docs' },
    ],
    hearings: [
      { id: 'h-1', date: '2026-09-15 14:00', type: '第一次开庭', location: '第三庭室 · 上海市浦东新区世纪大道 100 号' },
      { id: 'h-2', date: '2026-08-10 09:30', type: '庭前会议', location: '第二庭室 · 上海市浦东新区世纪大道 100 号' },
    ],
    award: {
      content:
        '<h2 style="text-align:center">上海仲裁委员会裁决书</h2><p>（2026）沪仲第1001号</p><p><strong>申请人：</strong>上海宏图贸易有限公司</p><p><strong>被申请人：</strong>上海远东物流有限公司</p><p>申请人上海宏图贸易有限公司与被申请人上海远东物流有限公司因买卖合同纠纷一案，本会根据双方签订的《买卖合同》中的仲裁条款受理……</p><p>（此处为裁决书正文草稿，可在线编辑修改）</p>',
      records: [
        { id: 'r-1', reviewer: '办案秘书-刘', time: '2026-09-18 10:00', result: '退回', remark: '请补充事实认定部分证据引用' },
        { id: 'r-2', reviewer: '仲裁员-张三', time: '2026-09-19 15:30', result: '通过', remark: '已补充，同意定稿' },
      ],
    },
    docs: {
      records: [
        { id: 'doc-1', title: '第一次庭审笔录', hearingDate: '2026-09-15', submitTime: '2026-09-16 10:00', signed: false },
        { id: 'doc-2', title: '第二次庭审笔录', hearingDate: '2026-09-22', submitTime: '2026-09-23 10:00', signed: true },
      ],
      awards: [
        { id: 'awd-1', title: '裁决书（草稿）', docType: '裁决书', submitTime: '2026-09-20 14:30', signed: false },
        { id: 'awd-2', title: '结案决定书', docType: '结案文书', submitTime: '2026-09-25 09:00', signed: false },
      ],
    },
    services: [
      { id: 'sv-1', serviceType: '立案送达', address: '138****1234', method: '短信', status: '已送达', readStatus: '已读（2026-03-16 09:12）', serviceTime: '2026-03-15 16:00' },
      { id: 'sv-2', serviceType: '立案送达', address: 'xxx@xx.com', method: 'Email', status: '已送达', readStatus: '已读（2026-03-16 10:30）', serviceTime: '2026-03-15 16:05' },
      { id: 'sv-3', serviceType: '组庭送达', address: '139****3456', method: '短信', status: '已送达', readStatus: '未读', serviceTime: '2026-03-20 14:00' },
      { id: 'sv-4', serviceType: '开庭送达', address: '139****3456', method: '短信', status: '待送达', readStatus: '—', serviceTime: '—' },
      { id: 'sv-5', serviceType: '开庭送达', address: 'xxx@xx.com', method: 'Email', status: '送达失败', readStatus: '—', serviceTime: '2026-09-01 10:00' },
    ],
  }
}

export const useCaseDetailStore = defineStore('caseDetail', () => {
  // ============ 状态 ============
  const currentCaseId = ref('')
  const caseInfo = ref({})
  const parties = ref({ applicants: [], respondents: [] })
  const claims = ref({})
  const evidence = ref({ applicant: [], respondent: [] })
  const attachments = ref([])
  const caseTodos = ref([])
  const hearings = ref([])
  const award = ref({ content: '', records: [] })
  const docs = ref({ records: [], awards: [] })
  const services = ref([])

  const activeTab = ref('work')
  const loading = ref(false)

  // ============ 方法 ============
  const fetchCaseDetail = (caseId) => {
    loading.value = true
    currentCaseId.value = caseId
    // Mock：同步填充
    const detail = buildMockCaseDetail(caseId)
    caseInfo.value = detail.caseInfo
    parties.value = detail.parties
    claims.value = detail.claims
    evidence.value = detail.evidence
    attachments.value = detail.attachments
    caseTodos.value = detail.caseTodos
    hearings.value = detail.hearings
    award.value = detail.award
    docs.value = detail.docs
    services.value = detail.services
    loading.value = false
  }

  const switchTab = (tabKey) => {
    activeTab.value = tabKey
  }

  const saveAwardContent = (html) => {
    if (!html || !html.trim()) {
      ElMessage.warning('裁决书内容不能为空')
      return false
    }
    award.value.content = html
    ElMessage.success('裁决书已保存')
    return true
  }

  const signDoc = (docId, signatureData) => {
    if (!signatureData) {
      ElMessage.warning('请先完成签名')
      return false
    }
    // 更新笔录签名状态
    const record = docs.value.records.find((d) => d.id === docId)
    if (record) {
      if (record.signed) {
        ElMessage.info('该文书已签名')
        return false
      }
      record.signed = true
      ElMessage.success('签名成功')
      return true
    }
    // 更新结案文书签名状态
    const awardDoc = docs.value.awards.find((d) => d.id === docId)
    if (awardDoc) {
      if (awardDoc.signed) {
        ElMessage.info('该文书已签名')
        return false
      }
      awardDoc.signed = true
      ElMessage.success('签名成功')
      return true
    }
    return false
  }

  const downloadTemplate = (templateName) => {
    ElMessage.success(`模板《${templateName}》下载已开始`)
  }

  const runAITool = async (toolKey) => {
    return await mockRunAITool(toolKey)
  }

  return {
    // 状态
    currentCaseId,
    caseInfo,
    parties,
    claims,
    evidence,
    attachments,
    caseTodos,
    hearings,
    award,
    docs,
    services,
    activeTab,
    loading,
    // 方法
    fetchCaseDetail,
    switchTab,
    saveAwardContent,
    signDoc,
    downloadTemplate,
    runAITool,
  }
})
