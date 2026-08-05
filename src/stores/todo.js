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
    { id: 'c1', ...createCaseBase(0, { docTitle: '仲裁员声明承诺书', content: '本人作为本案仲裁员，郑重声明：将严格遵守《仲裁法》及相关规定，秉公裁决，不徇私情……（承诺书正文略）' }) },
    { id: 'c2', ...createCaseBase(2, { docTitle: '仲裁员声明承诺书', content: '本人作为本案仲裁员，郑重声明：将严格遵守《仲裁法》及相关规定，秉公裁决……' }) },
    { id: 'c3', ...createCaseBase(4, { docTitle: '仲裁员声明承诺书', content: '本人作为本案仲裁员，郑重声明：将严格遵守《仲裁法》及相关规定……' }) },
  ])

  // 签名列表 - 笔录
  const recordList = ref([
    { id: 'r1', ...createCaseBase(1, { docTitle: '开庭笔录（第一次）', content: '时间：2026年7月15日 上午9:30\n地点：第三仲裁庭\n申请人：上海宏图贸易有限公司\n被申请人：上海远东物流有限公司\n……（笔录正文略）' }) },
    { id: 'r2', ...createCaseBase(3, { docTitle: '开庭笔录（第一次）', content: '时间：2026年7月14日 下午14:00\n地点：第一仲裁庭\n……' }) },
  ])

  // 签名列表 - 文书
  const documentList = ref([
    { id: 'd1', ...createCaseBase(0, { docTitle: '案件受理通知书' }) },
    { id: 'd2', ...createCaseBase(2, { docTitle: '组庭通知书' }) },
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
    },
  ])

  // 待办中心 - 选择首席仲裁员
  const chiefList = ref([
    { id: 'ch1', ...createCaseBase(1), groupDate: '-', deadline: '待组庭', remainDays: '-', isSuspended: false, extensionCount: 0 },
    { id: 'ch2', ...createCaseBase(4), groupDate: '-', deadline: '待组庭', remainDays: '-', isSuspended: false, extensionCount: 0 },
  ])

  // 裁决书核阅
  const reviewList = ref([
    {
      id: 'rv1',
      ...createCaseBase(0),
      submitter: '刘秘书',
      awardContent: '上海仲裁委员会裁决书\n\n(2026)沪仲第1000号\n\n申请人：上海宏图贸易有限公司……\n被申请人：上海远东物流有限公司……\n\n经审理查明：……（裁决书正文略）\n\n裁决如下：\n一、被申请人向申请人支付货款人民币120万元；\n二、仲裁费用由被申请人承担。',
    },
  ])

  // ============ 计算属性 ============
  const counts = computed(() => ({
    signature: commitmentList.value.length + recordList.value.length + documentList.value.length,
    center: extensionList.value.length + chiefList.value.length,
    review: reviewList.value.length,
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

  // 延期审批
  const approveExtension = (id, action) => {
    extensionList.value = extensionList.value.filter((item) => item.id !== id)
  }

  const approveBatch = (ids, action) => {
    const idSet = new Set(ids)
    extensionList.value = extensionList.value.filter((item) => !idSet.has(item.id))
  }

  // 选择首席
  const selectChief = (id, data) => {
    chiefList.value = chiefList.value.filter((item) => item.id !== id)
  }

  // 裁决书核阅
  const reviewAward = (id, action) => {
    reviewList.value = reviewList.value.filter((item) => item.id !== id)
  }

  return {
    // 状态
    commitmentList,
    recordList,
    documentList,
    extensionList,
    chiefList,
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
    reviewAward,
  }
})
