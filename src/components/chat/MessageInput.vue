<template>
  <div class="message-input">
    <div class="input-container" :class="{ 'is-focused': isFocused }">
      <button class="attach-btn" @click="triggerFileInput" aria-label="上传附件">
        <el-icon :size="18"><Paperclip /></el-icon>
      </button>
      <textarea
        ref="textareaRef"
        v-model="text"
        class="input-textarea"
        placeholder="输入消息，回车发送..."
        rows="1"
        @keydown.enter="handleEnter"
        @keydown.shift.enter="handleShiftEnter"
        @input="autoResize"
        @focus="isFocused = true"
        @blur="isFocused = false"
      ></textarea>
      <button
        class="send-btn"
        :class="{ 'is-disabled': !text.trim() }"
        :disabled="!text.trim()"
        @click="sendText"
        aria-label="发送"
      >
        <el-icon :size="16"><Promotion /></el-icon>
      </button>
    </div>
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
import { Paperclip, Promotion } from '@element-plus/icons-vue'

const emit = defineEmits(['send'])

const text = ref('')
const textareaRef = ref(null)
const fileInputRef = ref(null)
const isFocused = ref(false)

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
  padding: 10px 12px 12px;
  background: linear-gradient(180deg, #fafbfc 0%, #fff 100%);
  border-top: 1px solid #f0f2f5;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  background: #f4f6fa;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  padding: 4px 4px 4px 6px;
  transition: all 0.25s ease;

  &.is-focused {
    background: #fff;
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 3px rgba(5, 61, 153, 0.08);
  }
}

/* 附件按钮 */
.attach-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
  transition: all 0.2s ease;

  &:hover {
    background: #e8edf8;
    color: var(--el-color-primary);
  }
}

/* 输入框 */
.input-textarea {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
  font-family: inherit;
  background: transparent;
  padding: 6px 4px;
  max-height: 100px;
  overflow-y: auto;
  color: var(--el-text-color-primary);

  &::placeholder {
    color: #b8bcc4;
  }

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 2px;
  }
}

/* 发送按钮 */
.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: #fff;
  flex-shrink: 0;
  background: linear-gradient(135deg, #053d99 0%, #0a5cb8 100%);
  box-shadow: 0 2px 6px rgba(5, 61, 153, 0.25);
  transition: all 0.2s ease;

  &:hover:not(.is-disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(5, 61, 153, 0.3);
  }

  &:active:not(.is-disabled) {
    transform: translateY(0);
  }

  &.is-disabled {
    background: #c0c4cc;
    box-shadow: none;
    cursor: not-allowed;
  }
}
</style>
