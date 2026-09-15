import { ref } from 'vue'
import { ElMessage } from 'element-plus'

// 序列号生成器，保证 id 唯一
let qSeq = 1

// 划词/批注「引用」清单管理（程度1：仅收录 + 复制带出）
export function useQuoteList() {
  const quoteList = ref([])
  const addQuote = (info) => quoteList.value.push({ id: `q-${qSeq++}`, ...info, createdAt: Date.now() })
  const removeQuote = (id) => { quoteList.value = quoteList.value.filter((x) => x.id !== id) }
  const copyQuote = async (item) => {
    const text = `【${item.caseNo}】${item.materialName} 第${item.page}页：${item.excerpt}`
    try { await navigator.clipboard.writeText(text); ElMessage.success('已复制引用') }
    catch { ElMessage.warning('复制失败，请手动选择复制') }
  }
  return { quoteList, addQuote, removeQuote, copyQuote }
}