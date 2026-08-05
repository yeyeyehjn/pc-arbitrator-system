import { defineStore } from 'pinia'
import { ref } from 'vue'

// 分类枚举（含「全部」用于筛选按钮组）
export const AWARD_CATEGORYS = [
  { value: 'all', label: '全部' },
  { value: 'finance', label: '金融借款类' },
  { value: 'private', label: '民间借贷类' },
  { value: 'construction', label: '建设工程类' },
]

// 审理指引 Mock（6 条，覆盖多场景，g5 无附件验证「—」兜底）
const MOCK_GUIDELINES = [
  { id: 'g1', title: '建设工程施工合同纠纷审理指引', remark: '适用于建设工程类案件的审理参考', fileUrl: '/mock/guideline-construction.pdf', fileName: '建设工程审理指引.pdf', fileSize: '1.2MB', updatedAt: '2026-07-20' },
  { id: 'g2', title: '民间借贷纠纷案件审理要点', remark: '含利率上限与证据认定要点', fileUrl: '/mock/guideline-private.pdf', fileName: '民间借贷审理要点.pdf', fileSize: '0.9MB', updatedAt: '2026-06-15' },
  { id: 'g3', title: '金融借款合同纠纷审理指引', remark: '', fileUrl: '/mock/guideline-finance.pdf', fileName: '金融借款审理指引.pdf', fileSize: '1.0MB', updatedAt: '2026-07-01' },
  { id: 'g4', title: '仲裁程序操作规程', remark: '立案至结案全流程指引', fileUrl: '/mock/guideline-procedure.pdf', fileName: '仲裁程序操作规程.pdf', fileSize: '1.5MB', updatedAt: '2026-05-10' },
  { id: 'g5', title: '庭审驾驭与询问技巧', remark: '', fileUrl: '', fileName: '', fileSize: '', updatedAt: '2026-04-18' },
  { id: 'g6', title: '裁决书撰写规范', remark: '附通用模板与常见问题', fileUrl: '/mock/guideline-writing.pdf', fileName: '裁决书撰写规范.pdf', fileSize: '0.8MB', updatedAt: '2026-07-25' },
]

// 裁决书及案例 Mock（9 条，三类各 3 条；a6 无附件验证「—」兜底）
const MOCK_AWARD_CASES = [
  { id: 'a1', title: '某银行与某公司金融借款合同纠纷案', caseReason: '金融借款合同纠纷', remark: '典型利率认定案例', category: 'finance', fileUrl: '/mock/award-finance-1.pdf', fileName: '金融借款案例一.pdf', fileSize: '2.1MB', updatedAt: '2026-07-10' },
  { id: 'a2', title: '某信托与某集团金融借款纠纷案', caseReason: '金融借款合同纠纷', remark: '', category: 'finance', fileUrl: '/mock/award-finance-2.pdf', fileName: '金融借款案例二.pdf', fileSize: '1.8MB', updatedAt: '2026-06-22' },
  { id: 'a3', title: '某消费金融公司与王某借款案', caseReason: '金融借款合同纠纷', remark: '小额贷款利率上限', category: 'finance', fileUrl: '/mock/award-finance-3.pdf', fileName: '金融借款案例三.pdf', fileSize: '1.3MB', updatedAt: '2026-05-30' },
  { id: 'a4', title: '张某与李某民间借贷纠纷案', caseReason: '民间借贷纠纷', remark: '现金交付举证责任', category: 'private', fileUrl: '/mock/award-private-1.pdf', fileName: '民间借贷案例一.pdf', fileSize: '1.1MB', updatedAt: '2026-07-15' },
  { id: 'a5', title: '王某与赵某民间借贷纠纷案', caseReason: '民间借贷纠纷', remark: '', category: 'private', fileUrl: '/mock/award-private-2.pdf', fileName: '民间借贷案例二.pdf', fileSize: '0.9MB', updatedAt: '2026-06-08' },
  { id: 'a6', title: '某公司与刘某民间借贷纠纷案', caseReason: '民间借贷纠纷', remark: '夫妻共同债务认定', category: 'private', fileUrl: '', fileName: '', fileSize: '', updatedAt: '2026-04-20' },
  { id: 'a7', title: '某建筑公司与某开发公司建设工程施工合同纠纷案', caseReason: '建设工程施工合同纠纷', remark: '工程款结算争议', category: 'construction', fileUrl: '/mock/award-construction-1.pdf', fileName: '建设工程案例一.pdf', fileSize: '2.5MB', updatedAt: '2026-07-22' },
  { id: 'a8', title: '某施工队与某集团建设工程纠纷案', caseReason: '建设工程施工合同纠纷', remark: '', category: 'construction', fileUrl: '/mock/award-construction-2.pdf', fileName: '建设工程案例二.pdf', fileSize: '2.0MB', updatedAt: '2026-06-18' },
  { id: 'a9', title: '某装饰公司与某酒店建设工程合同纠纷案', caseReason: '建设工程施工合同纠纷', remark: '质量保修金返还', category: 'construction', fileUrl: '/mock/award-construction-3.pdf', fileName: '建设工程案例三.pdf', fileSize: '1.7MB', updatedAt: '2026-05-12' },
]

// 仲裁员须知 Mock（5 条；n5 无附件验证「—」兜底）
const MOCK_NOTICES = [
  { id: 'n1', title: '仲裁员行为规范', remark: '仲裁员履职基本准则', fileUrl: '/mock/notice-code.pdf', fileName: '仲裁员行为规范.pdf', fileSize: '0.6MB', updatedAt: '2026-07-01' },
  { id: 'n2', title: '回避制度须知', remark: '回避情形与申请流程', fileUrl: '/mock/notice-avoidance.pdf', fileName: '回避制度须知.pdf', fileSize: '0.4MB', updatedAt: '2026-06-01' },
  { id: 'n3', title: '保密义务告知书', remark: '', fileUrl: '/mock/notice-confidential.pdf', fileName: '保密义务告知书.pdf', fileSize: '0.3MB', updatedAt: '2026-05-01' },
  { id: 'n4', title: '仲裁员酬金与税务须知', remark: '酬金发放与个税说明', fileUrl: '/mock/notice-fee.pdf', fileName: '仲裁员酬金须知.pdf', fileSize: '0.5MB', updatedAt: '2026-04-01' },
  { id: 'n5', title: '庭审纪律与着装要求', remark: '', fileUrl: '', fileName: '', fileSize: '', updatedAt: '2026-03-15' },
]

export const useAuxiliaryStore = defineStore('auxiliary', () => {
  // 审理指引列表
  const guidelines = ref([])
  // 裁决书及案例列表
  const awardCases = ref([])
  // 仲裁员须知列表
  const notices = ref([])
  // 加载态
  const loading = ref(false)

  // 拉取各列表（mock 同步赋值，预留 async 接口形态）
  async function fetchGuidelines() {
    loading.value = true
    guidelines.value = MOCK_GUIDELINES
    loading.value = false
  }
  async function fetchAwardCases() {
    loading.value = true
    awardCases.value = MOCK_AWARD_CASES
    loading.value = false
  }
  async function fetchNotices() {
    loading.value = true
    notices.value = MOCK_NOTICES
    loading.value = false
  }

  return {
    guidelines,
    awardCases,
    notices,
    loading,
    fetchGuidelines,
    fetchAwardCases,
    fetchNotices,
  }
})
