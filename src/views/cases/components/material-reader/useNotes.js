import { ref } from 'vue'

// 序列号生成器，保证 id 唯一
let nSeq = 1

// 材料级笔记 + 划词批注管理
export function useNotes() {
  const notes = ref([])
  const annotations = ref([])

  const addNote = (materialId, page, content) => {
    if (!content?.trim()) return
    notes.value.push({ id: `n-${nSeq++}`, materialId, page, content, createdAt: Date.now() })
  }
  const removeNote = (id) => { notes.value = notes.value.filter((x) => x.id !== id) }

  const addAnnotation = (a) => annotations.value.push({ id: `a-${nSeq++}`, ...a })
  const toggleHighlight = (materialId, sel) => {
    const existing = annotations.value.findIndex(
      (x) => x.materialId === materialId && x.startOffset === sel.startOffset && x.endOffset === sel.endOffset,
    )
    if (existing >= 0) { annotations.value.splice(existing, 1); return }
    addAnnotation({ materialId, page: 1, startOffset: sel.startOffset, endOffset: sel.endOffset, text: sel.text, highlight: true, comment: '', pinned: false })
  }
  const removeAnnotation = (id) => { annotations.value = annotations.value.filter((x) => x.id !== id) }

  const notesForMaterial = (id) => notes.value.filter((x) => x.materialId === id)
  const annotationsForMaterial = (id) => annotations.value.filter((x) => x.materialId === id)

  return { notes, annotations, addNote, removeNote, addAnnotation, toggleHighlight, removeAnnotation, notesForMaterial, annotationsForMaterial }
}