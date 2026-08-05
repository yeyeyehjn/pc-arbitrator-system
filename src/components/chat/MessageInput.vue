<template>
  <div class="message-input">
    <el-icon class="attach-btn" :size="18" @click="triggerFileInput"><Paperclip /></el-icon>
    <textarea
      ref="textareaRef"
      v-model="text"
      class="input-textarea"
      placeholder="输入消息..."
      rows="1"
      @keydown.enter="handleEnter"
      @keydown.shift.enter="handleShiftEnter"
      @input="autoResize"
    ></textarea>
    <el-button
      type="primary"
      size="small"
      :disabled="!text.trim()"
      @click="sendText"
    >发送</el-button>
    <input
      ref="fileInputRef"
      type="file"
      style="display: none"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Paperclip } from '@element-plus/icons-vue'

const emit = defineEmits(['send'])

const text = ref('')
const textareaRef = ref(null)
const fileInputRef = ref(null)

// 发送文本消息
const sendText = () => {
  const content = text.value.trim()
  if (!content) return
  if (content.length > 1000) {
    ElMessage.warning('消息不能超过1000字')
    return
  }
  emit('send', { type: 'text', content, attachments: [] })
  text.value = ''
  nextTick(() => autoResize())
}

// 回车发送
const handleEnter = (e) => {
  e.preventDefault()
  sendText()
}

// Shift+回车换行（默认行为，无需阻止）
const handleShiftEnter = () => {
  // 默认行为即可
}

// 附件选择
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  const sizeMB = (file.size / 1024 / 1024).toFixed(1)
  emit('send', {
    type: 'file',
    content: `上传了 ${file.name}`,
    attachments: [{ name: file.name, url: '#mock', size: `${sizeMB}MB` }],
  })
  // 重置 input 以便重复选择同一文件
  e.target.value = ''
}

// textarea 自适应高度
const autoResize = () => {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 100) + 'px'
}
</script>

<style scoped lang="scss">
.message-input {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  background-color: #fff;
}

.attach-btn {
  cursor: pointer;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
  padding: 4px;

  &:hover {
    color: var(--el-color-primary);
  }
}

.input-textarea {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
  font-family: inherit;
  background-color: #f2f5fa;
  border-radius: 4px;
  padding: 6px 10px;
  max-height: 100px;
  overflow-y: auto;

  &::placeholder {
    color: var(--el-text-color-placeholder);
  }
}
</style>
