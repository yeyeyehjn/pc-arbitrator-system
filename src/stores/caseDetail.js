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
    // 反请求和答辩
    counterClaims: {
      // 1. 反请求事实和理由
      factsAndReasons: {
        text: '被申请人于 2025 年 4 月 28 日提出反请求：因申请人所供部分货物质量不符合合同约定标准，导致被申请人生产线停工整改，产生直接经济损失。被申请人已收货物中第 5、6 批次经检验存在性能指标偏差，与合同约定的质量标准不符，申请人应承担相应违约责任并赔偿损失。',
        attachments: [{ name: '反请求申请书.pdf' }],
      },
      // 2. 反请求列表
      claimList: [
        { id: 'ccl-1', content: '责令申请人退还第 5、6 批次货款人民币 82 万元' },
        { id: 'ccl-2', content: '责令申请人赔偿停产损失人民币 20 万元' },
        { id: 'ccl-3', content: '反请求仲裁费用由申请人承担' },
      ],
      // 3. 反请求答辩意见（申请人的答辩，多条）
      defenseList: [
        {
          id: 'cdf-1',
          respondent: '上海宏图贸易有限公司（申请人）',
          content: '第 5、6 批次货物出厂时均附合格证，且被申请人收货时未在合同约定检验期内提出书面异议，应视为质量合格。',
          files: [{ name: '反请求答辩状.pdf' }],
        },
        {
          id: 'cdf-2',
          respondent: '上海宏图贸易有限公司（申请人）',
          content: '停产损失与货物质量之间的因果关系缺乏证据支持，损失金额计算依据不足。',
          files: [],
        },
      ],
    },
    evidence: {
      applicant: {
        notice: { name: '质证通知（申请人）.pdf', uploadTime: '2026-06-10 15:00', uploader: '刘秘书' },
        catalog: [
          { id: 'ct-a1', name: '买卖合同', form: '合同', pages: 6, submitDate: '2026-03-15' },
          { id: 'ct-a2', name: '送货单（8 份）', form: '单据', pages: 16, submitDate: '2026-03-15' },
          { id: 'ct-a3', name: '对账单', form: '财务', pages: 4, submitDate: '2026-03-15' },
        ],
        list: [
          {
            id: 'ev-a1',
            name: '买卖合同',
            content: '双方于2025年3月10日签订《买卖合同》，约定申请人供货、被申请人付款，合同总金额350万元，分8批交付。',
            files: [
              { id: 'f-a1-1', name: '合同.pdf', fileType: 'pdf' },
              { id: 'f-a1-2', name: '签章页.jpg', fileType: 'image' },
              { id: 'f-a1-3', name: '补充协议.pdf', fileType: 'pdf' },
            ],
            challenge: {
              challenger: '李律师（被申请人代理人）',
              reason: '对真实性无异议，对关联性有异议，证据与本案货款争议关联不足。',
              opinionFiles: [{ id: 'of-a1-1', name: '质证意见书.pdf', fileType: 'pdf' }],
            },
          },
          {
            id: 'ev-a2',
            name: '送货单（8 份）',
            content: '申请人于2025年3月15日至4月20日分8批交付货物，每批均有被申请人签收的送货单，载明货物名称、数量、金额。',
            files: [
              { id: 'f-a2-1', name: '送货单01.pdf', fileType: 'pdf' },
              { id: 'f-a2-2', name: '送货单02.pdf', fileType: 'pdf' },
              { id: 'f-a2-3', name: '送货单03.pdf', fileType: 'pdf' },
              { id: 'f-a2-4', name: '送货单04.pdf', fileType: 'pdf' },
              { id: 'f-a2-5', name: '送货单05.pdf', fileType: 'pdf' },
              { id: 'f-a2-6', name: '送货单06.pdf', fileType: 'pdf' },
              { id: 'f-a2-7', name: '送货单07.pdf', fileType: 'pdf' },
              { id: 'f-a2-8', name: '送货单08.pdf', fileType: 'pdf' },
            ],
            challenge: null,
          },
          {
            id: 'ev-a3',
            name: '对账单',
            content: '双方于2025年5月10日对账确认，截至对账日被申请人累计欠付货款280万元，对账单经双方盖章确认。',
            files: [
              { id: 'f-a3-1', name: '对账单.pdf', fileType: 'pdf' },
              { id: 'f-a3-2', name: '往来明细.xlsx', fileType: 'excel' },
            ],
            challenge: {
              challenger: '李律师（被申请人代理人）',
              reason: '对账单金额有误，未包含退货抵扣部分，欠付金额应以实际退货核算为准。',
              opinionFiles: [{ id: 'of-a3-1', name: '质证意见（对账单）.pdf', fileType: 'pdf' }],
            },
          },
        ],
      },
      respondent: {
        notice: { name: '质证通知（被申请人）.pdf', uploadTime: '2026-06-10 15:00', uploader: '刘秘书' },
        catalog: [
          { id: 'ct-b1', name: '质量检测报告', form: '鉴定', pages: 10, submitDate: '2026-06-12' },
          { id: 'ct-b2', name: '维修费用清单', form: '财务', pages: 3, submitDate: '2026-06-12' },
        ],
        list: [
          {
            id: 'ev-b1',
            name: '质量检测报告',
            content: '被申请人委托检测机构对第5、6批次货物进行检测，报告载明两项性能指标偏差，与合同约定不符。',
            files: [{ id: 'f-b1-1', name: '质量检测报告.pdf', fileType: 'pdf' }],
            challenge: {
              challenger: '张律师（申请人代理人）',
              reason: '检测系单方委托，送检样品未经双方封样确认，检测标准与合同约定不一致。',
              opinionFiles: [{ id: 'of-b1-1', name: '质证意见（检测报告）.pdf', fileType: 'pdf' }],
            },
          },
          {
            id: 'ev-b2',
            name: '维修费用清单',
            content: '被申请人主张因货物质量问题产生维修费用，提交维修费用清单及相关票据。',
            files: [
              { id: 'f-b2-1', name: '维修费用清单.pdf', fileType: 'pdf' },
              { id: 'f-b2-2', name: '维修发票.pdf', fileType: 'pdf' },
            ],
            challenge: null,
          },
        ],
      },
      tribunal: {
        notice: null,
        catalog: [{ id: 'ct-t1', name: '往来账户交易明细', form: '财务', pages: 8, submitDate: '2026-07-02' }],
        list: [
          {
            id: 'ev-t1',
            name: '往来账户交易明细',
            content: '仲裁庭依职权向银行调取的双方往来账户交易明细，用于核实货款支付与退还款项情况。',
            files: [{ id: 'f-t1-1', name: '往来账户交易明细.pdf', fileType: 'pdf' }],
            challenge: null,
          },
        ],
      },
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
      // 秘书上传的裁决书草稿文件信息
      file: {
        name: '裁决书草稿（(2026)沪仲第1001号）.docx',
        updater: '刘秘书',
        updateTime: '2026-09-10 14:30',
      },
      content:
        '<h2 style="text-align:center">上海仲裁委员会裁决书</h2><p>（2026）沪仲第1001号</p><p><strong>申请人：</strong>上海宏图贸易有限公司</p><p><strong>被申请人：</strong>上海远东物流有限公司</p><p>申请人上海宏图贸易有限公司与被申请人上海远东物流有限公司因买卖合同纠纷一案，本会根据双方签订的《买卖合同》中的仲裁条款受理……</p><p>（此处为裁决书正文草稿，可在线编辑修改）</p>',
      // 历史版本（倒序：最新在前）
      versions: [
        { id: 'v2', versionNo: 'V2', fileName: '裁决书草稿（(2026)沪仲第1001号）.docx', updater: '刘秘书', updateTime: '2026-09-10 14:30' },
        { id: 'v1', versionNo: 'V1', fileName: '裁决书草稿（初稿）.docx', updater: '刘秘书', updateTime: '2026-09-02 09:15' },
      ],
      // 核阅流转记录（attachments 为该环节附件，可下载）
      flowRecords: [
        {
          id: 'f-1',
          stage: '提交核阅',
          operator: '刘秘书',
          time: '2026-09-10 14:30',
          remark: '裁决书草稿已上传，庭审笔录已同步，请核阅。',
          attachments: ['裁决书草稿（(2026)沪仲第1001号）.docx', '庭审笔录_20260910.pdf'],
        },
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
  const counterClaims = ref({})
  const evidence = ref({
    applicant: { notice: null, catalog: [], list: [] },
    respondent: { notice: null, catalog: [], list: [] },
    tribunal: { notice: null, catalog: [], list: [] },
  })
  const attachments = ref([])
  const caseTodos = ref([])
  const hearings = ref([])
  const award = ref({ file: {}, content: '', versions: [], flowRecords: [] })
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
    counterClaims.value = detail.counterClaims
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

  // 当前仲裁员（Mock 登录用户）
  const CURRENT_ARBITRATOR = '张三（仲裁员）'

  const formatNow = () => {
    const d = new Date()
    const p = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
  }

  const saveAwardContent = (html) => {
    if (!html || !html.trim()) {
      ElMessage.warning('裁决书内容不能为空')
      return false
    }
    award.value.content = html
    const now = formatNow()
    award.value.file = {
      name: award.value.file?.name || '裁决书.docx',
      updater: CURRENT_ARBITRATOR,
      updateTime: now,
    }
    // 追加历史版本（新版本在前）
    const nextNo = `V${award.value.versions.length + 1}`
    award.value.versions.unshift({
      id: `v-${Date.now()}`,
      versionNo: nextNo,
      fileName: award.value.file.name,
      updater: CURRENT_ARBITRATOR,
      updateTime: now,
    })
    award.value.flowRecords.push({
      id: `f-${Date.now()}`,
      stage: '编辑保存',
      operator: CURRENT_ARBITRATOR,
      time: now,
      remark: '在线编辑裁决书并保存',
      attachments: [],
    })
    ElMessage.success('裁决书已保存')
    return true
  }

  // 下载秘书上传的裁决书草稿（Mock）
  const downloadAwardDraft = () => {
    ElMessage.success(`《${award.value.file?.name || '裁决书草稿'}》下载已开始`)
  }

  // 上传文书：更新裁决书文件信息并追加流转记录
  const submitAwardDoc = (payload = {}) => {
    const { fileName, closingType, reminderTarget, reminderContent, otherFiles = [] } = payload
    const now = formatNow()
    if (fileName) {
      award.value.file = { name: fileName, updater: CURRENT_ARBITRATOR, updateTime: now }
      award.value.versions.unshift({
        id: `v-${Date.now()}`,
        versionNo: `V${award.value.versions.length + 1}`,
        fileName,
        updater: CURRENT_ARBITRATOR,
        updateTime: now,
      })
    }
    const remarkParts = [`结案类型：${closingType}`]
    if (otherFiles.length) remarkParts.push(`其他附件 ${otherFiles.length} 份`)
    if (reminderContent) remarkParts.push(`提醒：${reminderContent}`)
    award.value.flowRecords.push({
      id: `f-${Date.now()}`,
      stage: '上传文书',
      operator: CURRENT_ARBITRATOR,
      time: now,
      remark: `已提交文书并提醒${reminderTarget || '经办秘书'}，${remarkParts.join('，')}`,
      attachments: [...otherFiles],
    })
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

  // 结案文书签名（确认弹框流程，无需手写签名板）
  const signAwardDoc = (docId) => {
    const awardDoc = docs.value.awards.find((d) => d.id === docId)
    if (!awardDoc) return false
    if (awardDoc.signed) {
      ElMessage.info('该文书已签名')
      return false
    }
    awardDoc.signed = true
    return true
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
    counterClaims,
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
    downloadAwardDraft,
    submitAwardDoc,
    signDoc,
    signAwardDoc,
    downloadTemplate,
    runAITool,
  }
})
