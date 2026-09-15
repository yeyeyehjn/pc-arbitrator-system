import { reactive } from 'vue'

// 提交主体 -> 目录分组 id 的映射
const SUBMITTER_TO_GROUP = {
  all: null, applicant: 'applicant', respondent: 'respondent',
  tribunal: 'tribunal', attachment: 'attachment',
}

// 材料组合筛选：提交主体 / 文件类型 / 提交日期区间
export function useMaterialFilters() {
  const filters = reactive({ submitter: 'all', fileType: 'all', dateRange: '' })

  const resetFilters = () => {
    filters.submitter = 'all'
    filters.fileType = 'all'
    filters.dateRange = ''
  }

  // 单个材料项是否命中文件类型 + 日期区间（提交主体由调用方按分组过滤）
  const matchesItem = (item) => {
    if (filters.fileType !== 'all' && (item.fileType || '').toLowerCase() !== filters.fileType) return false
    if (filters.dateRange && item.submitDate && item.submitDate !== '暂无') {
      const [s, e] = filters.dateRange
      if (s && item.submitDate < s) return false
      if (e && item.submitDate > e) return false
    }
    return true
  }

  // 按分组过滤 + 组内材料条件过滤，剔除空组
  const filteredGroups = (groups) =>
    groups
      .filter((g) => (filters.submitter === 'all' ? true : g.id === SUBMITTER_TO_GROUP[filters.submitter]))
      .map((g) => ({ ...g, items: g.items.filter(matchesItem) }))
      .filter((g) => g.items.length > 0)

  const groupIdFromSubmitter = (v) => SUBMITTER_TO_GROUP[v] || null

  return { filters, resetFilters, filteredGroups, groupIdFromSubmitter }
}