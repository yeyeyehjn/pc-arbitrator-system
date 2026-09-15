import { reactive } from 'vue'

// 捕获文本选中选区，供浮动工具条定位与划线标注
export function useTextSelection() {
  const selection = reactive({
    active: false, text: '', startOffset: 0, endOffset: 0,
    paragraphId: '', x: 0, y: 0,
  })

  // 从选区起始节点向上找带 data-para 的段落元素
  const getParagraphId = (node) => {
    const p = node && node.nodeType === 1 ? node : node?.parentElement
    return p && p.dataset?.para ? p.dataset.para : ''
  }

  const onSelect = (containerEl) => {
    const sel = window.getSelection()
    const text = sel?.toString().trim() || ''
    if (!text || !containerEl) { selection.active = false; return }
    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    selection.active = true
    selection.text = text
    selection.startOffset = range.startOffset
    selection.endOffset = range.endOffset
    selection.paragraphId = getParagraphId(range.startContainer)
    selection.x = rect.left
    selection.y = rect.top
  }

  const clearSelection = () => {
    selection.active = false
    selection.text = ''
  }

  const onKeydown = (e) => {
    if (e.key === 'Escape') clearSelection()
  }

  return { selection, onSelect, clearSelection, onKeydown }
}