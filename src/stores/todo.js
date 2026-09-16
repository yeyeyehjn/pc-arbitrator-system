import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 通用案件字段生成器（Mock 数据辅助）
const createCaseBase = (idx, overrides = {}) => ({
  caseNo: `(2026)沪仲第${String(1000 + idx).padStart(4, '0')}号`,
  caseReason: ['买卖合同纠纷', '股权转让纠纷', '建设工程施工合同纠纷', '借款合同纠纷', '房屋租赁合同纠纷'][idx % 5],
  applicant: ['上海宏图贸易有限公司', '李明华', '北京科瑞科技有限公司', '王秀英', '深圳市鹏程建筑集团'][idx % 5],
  respondent: ['上海远东物流有限公司', '张伟强', '北京恒盛投资集团', '陈建国', '深圳市宏基建材有限公司'][idx % 5],
  amount: [1200000, 580000, 3500000, 86000, 4200000][idx % 5],
  secretary: ['刘秘书', '陈秘书', '王秘书', '赵秘书', '周秘书'][idx % 5],
  tribunal: ['张三', '张三、李四、王五', '李四', '王五、张三、赵六'][idx % 4],
  caseStatus: ['审理中', '已组庭', '待开庭', '审理中', '已开庭'][idx % 5],
  submitTime: `2026-07-${String(10 + idx).padStart(2, '0')} 09:30`,
  ...overrides,
})

export const useTodoStore = defineStore('todo', () => {
  // ============ 状态 ============
  // 签名列表 - 承诺书
  const commitmentList = ref([
    {
      id: 'c1',
      ...createCaseBase(0, {
        docTitle: '仲裁员声明承诺书',
        content: '本人作为本案仲裁员，郑重声明：将严格遵守《仲裁法》及相关规定，秉公裁决，不徇私情……（承诺书正文略）',
        arbitratorName: '张三',
        arbitratorPhone: '138 0000 0000',
        arbitratorWorkUnit: '上海仲裁委员会',
        applicants: [
          { name: '上海宏图贸易有限公司', orgCode: '91330100MA2XXXXX', agent: '李四', address: '杭州市西湖区某某路123号' },
        ],
        respondents: [
          { name: '上海远东物流有限公司', orgCode: '91310000MA1XXXXX', agent: '王五', address: '上海市浦东新区某某路789号' },
        ],
      }),
    },
    {
      id: 'c2',
      ...createCaseBase(2, {
        docTitle: '仲裁员声明承诺书',
        content: '本人作为本案仲裁员，郑重声明：将严格遵守《仲裁法》及相关规定，秉公裁决……',
        arbitratorName: '张三',
        arbitratorPhone: '138 0000 0000',
        arbitratorWorkUnit: '上海仲裁委员会',
        applicants: [
          { name: '北京科瑞科技有限公司', orgCode: '91110100MA2YYYYY', agent: '赵六', address: '北京市海淀区某某路456号' },
        ],
        respondents: [
          { name: '北京恒盛投资集团', orgCode: '91110100MA1ZZZZZ', agent: '钱七', address: '北京市朝阳区某某大道789号' },
        ],
      }),
    },
    {
      id: 'c3',
      ...createCaseBase(4, {
        docTitle: '仲裁员声明承诺书',
        content: '本人作为本案仲裁员，郑重声明：将严格遵守《仲裁法》及相关规定……',
        arbitratorName: '张三',
        arbitratorPhone: '138 0000 0000',
        arbitratorWorkUnit: '上海仲裁委员会',
        applicants: [
          { name: '深圳市鹏程建筑集团', orgCode: '91440300MA2AAAAA', agent: '孙八', address: '深圳市福田区某某路100号' },
        ],
        respondents: [
          { name: '深圳市宏基建材有限公司', orgCode: '91440300MA1BBBBB', agent: '周九', address: '深圳市南山区某某大道200号' },
        ],
      }),
    },
  ])

  // 签名列表 - 笔录
  const recordList = ref([
    { id: 'r1', ...createCaseBase(1, { docTitle: '开庭笔录（第一次）', fileUrl: '/mock/record-r1.pdf', content: '时间：2026年7月15日 上午9:30\n地点：第三仲裁庭\n申请人：上海宏图贸易有限公司\n被申请人：上海远东物流有限公司\n……（笔录正文略）' }) },
    { id: 'r2', ...createCaseBase(3, { docTitle: '开庭笔录（第一次）', fileUrl: '/mock/record-r2.pdf', content: '时间：2026年7月14日 下午14:00\n地点：第一仲裁庭\n……' }) },
  ])

  // 签名列表 - 文书（caseId 对应 case store 的案件 id，用于跳转案件详情）
  const documentList = ref([
    { id: 'd1', ...createCaseBase(0, { docTitle: '案件受理通知书', caseId: 'case-0' }) },
    { id: 'd2', ...createCaseBase(2, { docTitle: '组庭通知书', caseId: 'case-2' }) },
  ])

  // 待办中心 - 延期办理
  const extensionList = ref([
    {
      id: 'e1',
      ...createCaseBase(0),
      groupDate: '2026-06-15',
      deadline: '2026-09-15',
      remainDays: 62,
      isSuspended: false,
      extensionCount: 1,
      extensionReason: '因申请人需补充关键证据材料，申请延期 30 天',
      extensionDays: 30,
      status: '待审批',
      applyStatus: '审批中',
      extensionTerm: '延期 30 天（至 2026-09-15）',
      remark: '证据补充期间请保持沟通',
      approvalFlow: [
        { submitter: '刘秘书', approver: '张三（本人）', opinion: '', approvalTime: '', approvalRemark: '待当前仲裁员审批', done: false },
      ],
    },
    {
      id: 'e2',
      ...createCaseBase(2),
      groupDate: '2026-05-20',
      deadline: '2026-08-20',
      remainDays: 36,
      isSuspended: true,
      extensionCount: 2,
      extensionReason: '被申请人提出管辖权异议，正在处理中，申请延期 45 天',
      extensionDays: 45,
      status: '待审批',
      applyStatus: '审批中',
      extensionTerm: '延期 45 天（至 2026-08-20）',
      remark: '管辖权异议裁定后请及时反馈',
      approvalFlow: [
        { submitter: '王秘书', approver: '李四（首席仲裁员）', opinion: '同意延期', approvalTime: '2026-05-18 10:15', approvalRemark: '异议处理期间准予延期', done: true },
        { submitter: '李四（首席仲裁员）', approver: '张三（本人）', opinion: '', approvalTime: '', approvalRemark: '待当前仲裁员审批', done: false },
      ],
    },
    {
      id: 'e3',
      ...createCaseBase(1),
      groupDate: '2026-06-02',
      deadline: '2026-09-02',
      remainDays: 49,
      isSuspended: false,
      extensionCount: 1,
      extensionReason: '申请人申请庭外和解，申请延期 15 天',
      extensionDays: 15,
      status: '已审批',
      applyStatus: '已完成',
      extensionTerm: '延期 15 天（至 2026-09-02）',
      remark: '和解协议签订后恢复审理',
      approvalFlow: [
        { submitter: '陈秘书', approver: '张三（本人）', opinion: '同意延期', approvalTime: '2026-07-20 16:40', approvalRemark: '延期后请及时告知当事人' },
      ],
    },
    {
      id: 'e4',
      ...createCaseBase(4),
      groupDate: '2026-04-10',
      deadline: '2026-07-10',
      remainDays: 0,
      isSuspended: false,
      extensionCount: 3,
      extensionReason: '关键证人长期出差无法到庭，申请延期 60 天',
      extensionDays: 60,
      status: '已审批',
      applyStatus: '已完成',
      extensionTerm: '延期 60 天（至 2026-07-10）',
      remark: '已协调线上作证方案',
      approvalFlow: [
        { submitter: '周秘书', approver: '李四（首席仲裁员）', opinion: '同意延期', approvalTime: '2026-06-05 11:20', approvalRemark: '建议同步调整开庭安排', done: true },
        { submitter: '李四（首席仲裁员）', approver: '张三（本人）', opinion: '同意延期', approvalTime: '2026-06-06 09:05', approvalRemark: '', done: true },
      ],
    },
  ])

  // 待办中心 - 选择首席仲裁员（首席候选仲裁员名册）
  const chiefCandidates = ref([
    { name: '王建国', gender: '男', education: '法学博士', expertise: '建设工程、房地产' },
    { name: '李文静', gender: '女', education: '法学硕士', expertise: '公司股权、并购重组' },
    { name: '陈志远', gender: '男', education: '法学博士', expertise: '国际贸易、海事海商' },
    { name: '赵美琳', gender: '女', education: '法学硕士', expertise: '金融证券、私募基金' },
    { name: '孙浩然', gender: '男', education: '法学学士', expertise: '买卖合同、债务纠纷' },
    { name: '周雅芳', gender: '女', education: '法学博士', expertise: '知识产权、技术转让' },
    { name: '吴俊杰', gender: '男', education: '法学硕士', expertise: '劳动人事、社保纠纷' },
    { name: '郑晓东', gender: '男', education: '法学博士', expertise: '保险理赔、侵权责任' },
    { name: '林慧敏', gender: '女', education: '法学硕士', expertise: '房屋租赁、物业管理' },
    { name: '徐国安', gender: '男', education: '法学学士', expertise: '借款担保、民间借贷' },
  ])

  // 待办中心 - 选择首席仲裁员
  const chiefList = ref([
    {
      id: 'ch1',
      ...createCaseBase(1),
      status: '未选定',
      sideArbitrator: { name: '李文澜', phone: '137 0211 2233', email: 'liwenlan@shac.org.cn' },
      secretary: { name: '陈秘书', phone: '021-5292 1001' },
      selectedChiefs: [],
    },
    {
      id: 'ch2',
      ...createCaseBase(4),
      status: '未选定',
      sideArbitrator: { name: '周慕云', phone: '136 5566 7788', email: 'zhoumuyun@shac.org.cn' },
      secretary: { name: '周秘书', phone: '021-5292 1002' },
      selectedChiefs: [],
    },
    {
      id: 'ch3',
      ...createCaseBase(2),
      status: '已选定',
      sideArbitrator: { name: '孙若溪', phone: '135 3344 5566', email: 'sunruoxi@shac.org.cn' },
      secretary: { name: '王秘书', phone: '021-5292 1003' },
      selectedChiefs: [{ name: '陈志远', gender: '男', education: '法学博士', expertise: '国际贸易、海事海商' }],
    },
  ])

  // 裁决书核阅（caseId 对应 case store 的案件 id，用于跳转案件详情-仲裁文书）
  const reviewList = ref([
    {
      id: 'rv1',
      ...createCaseBase(0, { caseId: 'case-0', caseYear: '2026', closingType: '裁决', reviewStatus: '待核阅' }),
    },
    {
      id: 'rv2',
      ...createCaseBase(1, {
        caseId: 'case-1',
        caseYear: '2026',
        caseNo: '(2026)沪仲第1001号',
        closingType: '调解',
        reviewStatus: '待核阅',
        submitTime: '2026-07-12 10:20',
      }),
    },
    {
      id: 'rv3',
      ...createCaseBase(2, {
        caseId: 'case-2',
        caseYear: '2026',
        caseNo: '(2026)沪仲第1002号',
        closingType: '撤回',
        reviewStatus: '已核阅',
        submitTime: '2026-07-08 15:45',
      }),
    },
    {
      id: 'rv4',
      ...createCaseBase(3, {
        caseId: 'case-3',
        caseYear: '2025',
        caseNo: '(2025)沪仲第1003号',
        closingType: '裁决',
        reviewStatus: '待核阅',
        submitTime: '2026-07-05 09:10',
      }),
    },
    {
      id: 'rv5',
      ...createCaseBase(4, {
        caseId: 'case-4',
        caseYear: '2025',
        caseNo: '(2025)沪仲第1004号',
        closingType: '调解',
        reviewStatus: '已核阅',
        submitTime: '2026-06-28 14:30',
      }),
    },
    {
      id: 'rv6',
      ...createCaseBase(5, {
        caseId: 'case-5',
        caseYear: '2026',
        caseNo: '(2026)沪仲第1005号',
        closingType: '裁决',
        reviewStatus: '待核阅',
        submitTime: '2026-07-02 11:05',
      }),
    },
    {
      id: 'rv7',
      ...createCaseBase(6, {
        caseId: 'case-6',
        caseYear: '2025',
        caseNo: '(2025)沪仲第1006号',
        closingType: '撤回',
        reviewStatus: '待核阅',
        submitTime: '2026-06-25 16:50',
      }),
    },
  ])

  // ============ 计算属性 ============
  const counts = computed(() => ({
    signature: commitmentList.value.length + recordList.value.length + documentList.value.length,
    center: extensionList.value.filter((item) => item.status === '待审批').length + chiefList.value.length,
    review: reviewList.value.filter((item) => item.reviewStatus === '待核阅').length,
  }))

  // ============ 方法 ============
  const fetchAllCounts = () => {
    // Mock：直接返回 computed counts，真实环境调用 API
    return counts.value
  }

  // 签名操作
  const signCommitment = (id) => {
    commitmentList.value = commitmentList.value.filter((item) => item.id !== id)
  }

  const signRecord = (id) => {
    recordList.value = recordList.value.filter((item) => item.id !== id)
  }

  const signDocument = (id) => {
    documentList.value = documentList.value.filter((item) => item.id !== id)
  }

  // 延期审批（审批后标记为已审批，保留在"已审批"列表中可查看详情）
  const formatNow = () => {
    const d = new Date()
    const p = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
  }

  const markExtensionApproved = (item, payload = {}) => {
    const flow = item.approvalFlow || []
    // 原位更新最后一个待审批节点（即当前仲裁员节点），避免同一审批人"待审批/已审批"并列
    const pendingNode = [...flow].reverse().find((n) => !n.done)
    if (pendingNode) {
      pendingNode.done = true
      pendingNode.opinion = payload.opinion || (payload.result === '退回上一级' ? '退回上一级' : '同意延期')
      pendingNode.approvalTime = formatNow()
      pendingNode.approvalRemark = payload.result === '退回上一级'
        ? '已退回上一级'
        : (payload.nextApprover ? `已转交下级审批人：${payload.nextApprover}` : '')
    } else {
      // 兜底：无待审批节点时追加（正常流程不会走到）
      const lastSubmitter = flow.length ? flow[flow.length - 1].submitter : item.secretary
      flow.push({
        submitter: lastSubmitter,
        approver: '张三（本人）',
        opinion: payload.opinion || '同意延期',
        approvalTime: formatNow(),
        approvalRemark: payload.nextApprover ? `已转交下级审批人：${payload.nextApprover}` : '',
        done: true,
      })
    }
    item.status = '已审批'
    // 申请状态：无下级审批人且非退回则办结；否则流程仍在流转
    item.applyStatus = (payload.result === '退回上一级' || payload.nextApprover) ? '审批中' : '已完成'
    if (payload.result === '同意' && payload.nextApprover) {
      item.approvalFlow.push({
        submitter: '张三（本人）',
        approver: payload.nextApprover,
        opinion: '',
        approvalTime: '',
        approvalRemark: '待下级审批',
        done: false,
      })
    }
  }

  const approveExtension = (id, payload = {}) => {
    const item = extensionList.value.find((i) => i.id === id)
    if (item) markExtensionApproved(item, payload)
  }

  const approveBatch = (ids, payload = {}) => {
    const idSet = new Set(ids)
    extensionList.value.forEach((item) => {
      if (idSet.has(item.id)) markExtensionApproved(item, payload)
    })
  }

  // 选择首席：确认后标记为已选定并保存名单（支持删除后重新选定）
  const selectChief = (id, chiefs = []) => {
    const item = chiefList.value.find((i) => i.id === id)
    if (item) {
      item.status = '已选定'
      item.selectedChiefs = chiefs
    }
  }

  // 裁决书核阅：提交文书后将对应案件标记为已核阅（行保留，供列表按状态筛选查看）
  const markReviewed = (caseId) => {
    const item = reviewList.value.find((i) => i.caseId === caseId)
    if (item) item.reviewStatus = '已核阅'
  }

  return {
    // 状态
    commitmentList,
    recordList,
    documentList,
    extensionList,
    chiefList,
    chiefCandidates,
    reviewList,
    counts,
    // 方法
    fetchAllCounts,
    signCommitment,
    signRecord,
    signDocument,
    approveExtension,
    approveBatch,
    selectChief,
    markReviewed,
  }
})
