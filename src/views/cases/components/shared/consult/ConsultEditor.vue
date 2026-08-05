<template>
  <div class="section-card consult-editor">
    <div class="section-title">发表意见</div>
    <el-input
      v-model="opinionText"
      type="textarea"
      :rows="5"
      placeholder="请输入回复意见内容…"
    />
    <div class="upload-area">
      <span class="upload-label">
        <el-icon><Paperclip /></el-icon>
        上传附件（法律文书、证据材料）
      </span>
      <el-upload
        :file-list="fileList"
        :auto-upload="false"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
        multiple
      >
        <el-button size="small" plain>选择文件</el-button>
      </el-upload>
    </div>
    <div class="action-bar">
      <el-button type="primary" :loading="submitting" @click="handleSubmit">提交意见</el-button>
      <el-button v-if="detail.status === 'unreplied'" type="danger" plain class="exit-btn" @click="$emit('exit')">退出咨询</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Paperclip } from '@element-plus/icons-vue'

const props = defineProps({
  detail: { type: Object, required: true },
})

const emit = defineEmits(['submit-opinion', 'exit'])

const opinionText = ref('')
const fileList = ref([])
const submitting = ref(false)

watch(() => props.detail, () => {
  opinionText.value = ''
  fileList.value = []
})

const handleFileChange = (file, files) => {
  fileList.value = files
}
const handleFileRemove = (file, files) => {
  fileList.value = files
}

const handleSubmit = () => {
  if (!opinionText.value.trim()) {
    ElMessage.warning('请输入回复意见内容')
    return
  }
  submitting.value = true
  emit('submit-opinion', {
    content: opinionText.value,
    attachments: fileList.value.map(f => ({ name: f.name, url: f.url || f.raw?.url || '#' })),
  })
  setTimeout(() => {
    submitting.value = false
  }, 300)
}
</script>

<style scoped lang="scss">
.consult-editor {
  .upload-area {
    margin: 12px 0;
    .upload-label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-right: 12px;
    }
  }
  .action-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    border-top: 1px solid var(--el-border-color-lighter);
    padding-top: 12px;
    .exit-btn {
      margin-left: auto;
    }
  }
}
</style>
