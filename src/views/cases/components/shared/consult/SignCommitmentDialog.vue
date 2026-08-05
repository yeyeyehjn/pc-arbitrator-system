<template>
  <el-dialog
    :model-value="visible"
    title="回避 / 接受咨询"
    width="600px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
  >
    <!-- 步骤1：选择确认方式 -->
    <div v-if="step === 'select'" class="step-select">
      <p class="step-tip">请选择确认方式：</p>
      <div class="method-options">
        <div class="method-card" :class="{ active: method === 'online' }" @click="method = 'online'">
          <el-icon><EditPen /></el-icon>
          <span>线上签名（GDCA）</span>
        </div>
        <div class="method-card" :class="{ active: method === 'upload' }" @click="method = 'upload'">
          <el-icon><Upload /></el-icon>
          <span>上传扫描件</span>
        </div>
      </div>
    </div>

    <!-- 步骤2a：线上签名子流程 -->
    <div v-else-if="step === 'online'" class="step-online">
      <div class="commitment-preview">
        <div class="preview-title">声明承诺书</div>
        <div class="preview-body">{{ COMMITMENT_TEXT }}</div>
      </div>
      <div v-if="!onlineSigned" class="online-action">
        <el-button type="primary" :loading="gdcaLoading" @click="handleGdcaSign">
          {{ gdcaLoading ? '正在调起 GDCA 签名…' : '调起 GDCA 电子签名' }}
        </el-button>
      </div>
      <div v-else class="online-signed">
        <el-tag type="success">已完成签名</el-tag>
      </div>
    </div>

    <!-- 步骤2b：上传文件子流程 -->
    <div v-else-if="step === 'upload'" class="step-upload">
      <div class="upload-tip">
        <span>请下载声明承诺书模板，签署后上传扫描件：</span>
        <el-link type="primary" :underline="false" @click="downloadTemplate">下载模板</el-link>
      </div>
      <el-upload
        :file-list="uploadFileList"
        :auto-upload="false"
        :limit="1"
        :on-change="handleUploadChange"
        :on-remove="handleUploadRemove"
        drag
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">将扫描件拖到此处，或<em>点击上传</em></div>
      </el-upload>
    </div>

    <!-- 底部操作 -->
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button v-if="step !== 'select'" @click="backToSelect">返回选择</el-button>
      <el-button
        v-if="step === 'online' && onlineSigned"
        type="warning"
        @click="handleDecision('withdraw')"
      >回避咨询</el-button>
      <el-button
        v-if="step === 'online' && onlineSigned"
        type="primary"
        @click="handleDecision('accept')"
      >接受咨询</el-button>
      <el-button
        v-if="step === 'upload' && uploadFileList.length > 0"
        type="warning"
        @click="handleDecision('withdraw')"
      >回避咨询</el-button>
      <el-button
        v-if="step === 'upload' && uploadFileList.length > 0"
        type="primary"
        @click="handleDecision('accept')"
      >接受咨询</el-button>
      <el-button v-if="step === 'select' && method" type="primary" @click="goToStep">下一步</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { EditPen, Upload, UploadFilled } from '@element-plus/icons-vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
})
const emit = defineEmits(['update:visible', 'signed'])

const COMMITMENT_TEXT = '本人作为专家，郑重声明将独立、公正地出具咨询意见，严格遵守仲裁规则与保密义务，与案件当事人无利益冲突，不私下接触当事人及其代理人。'

const step = ref('select')
const method = ref('')
const gdcaLoading = ref(false)
const onlineSigned = ref(false)
const uploadFileList = ref([])

watch(() => props.visible, (val) => {
  if (val) {
    step.value = 'select'
    method.value = ''
    gdcaLoading.value = false
    onlineSigned.value = false
    uploadFileList.value = []
  }
})

const goToStep = () => {
  step.value = method.value
}
const backToSelect = () => {
  step.value = 'select'
  onlineSigned.value = false
  uploadFileList.value = []
}
const handleClose = () => {
  emit('update:visible', false)
}

const handleGdcaSign = () => {
  gdcaLoading.value = true
  setTimeout(() => {
    gdcaLoading.value = false
    onlineSigned.value = true
  }, 1500)
}

const downloadTemplate = () => {
  const a = document.createElement('a')
  a.href = '/docs/声明承诺书.docx'
  a.download = '声明承诺书.docx'
  a.click()
}

const handleUploadChange = (file, files) => {
  uploadFileList.value = files
}
const handleUploadRemove = (file, files) => {
  uploadFileList.value = files
}

const handleDecision = (decision) => {
  emit('signed', { method: method.value, decision })
  emit('update:visible', false)
}
</script>

<style scoped lang="scss">
.step-select {
  .step-tip {
    font-size: 14px;
    color: var(--el-text-color-regular);
    margin-bottom: 16px;
  }
  .method-options {
    display: flex;
    gap: 16px;
  }
  .method-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 16px;
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
    color: var(--el-text-color-regular);
    .el-icon {
      font-size: 28px;
    }
    &:hover {
      border-color: var(--el-color-primary);
      color: var(--el-color-primary);
    }
    &.active {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
    }
  }
}
.commitment-preview {
  .preview-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 8px;
  }
  .preview-body {
    font-size: 14px;
    line-height: 1.8;
    color: var(--el-text-color-regular);
    background: #f5f7fa;
    padding: 16px;
    border-radius: 4px;
    max-height: 200px;
    overflow-y: auto;
  }
}
.online-action, .online-signed {
  text-align: center;
  margin-top: 16px;
}
.upload-tip {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
