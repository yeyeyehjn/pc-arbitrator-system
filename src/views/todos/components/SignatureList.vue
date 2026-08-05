<template>
  <div class="signature-list">
    <el-tabs v-model="activeTab" class="signature-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="承诺书签署" name="commitment">
        <SignatureTable
          :data="commitmentList"
          doc-type="承诺书"
          doc-type-tag="primary"
          @sign="openCommitmentDialog"
        />
      </el-tab-pane>
      <el-tab-pane label="笔录签名" name="record">
        <SignatureTable
          :data="recordList"
          doc-type="笔录"
          doc-type-tag="success"
          @sign="openRecordDialog"
        />
      </el-tab-pane>
      <el-tab-pane label="文书签名" name="document">
        <SignatureTable
          :data="documentList"
          doc-type="文书"
          doc-type-tag="warning"
          @sign="handleDocumentSign"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- 承诺书签署弹窗 -->
    <el-dialog
      v-model="commitmentDialogVisible"
      :title="currentDoc?.docTitle || '承诺书签署'"
      width="700px"
      :close-on-click-modal="false"
    >
      <div v-if="!isSigningCommitment" class="commitment-preview">
        <div class="doc-info">
          <p><span class="label">所属案号：</span>{{ currentDoc?.caseNo }}</p>
          <p><span class="label">案由：</span>{{ currentDoc?.caseReason }}</p>
        </div>
        <el-divider />
        <div class="doc-content">{{ currentDoc?.content }}</div>
        <div class="sign-entry" @click="isSigningCommitment = true">
          <el-icon><EditPen /></el-icon>
          <span>点击此处进行签名</span>
        </div>
      </div>
      <div v-else class="commitment-sign">
        <SignaturePad ref="commitmentPadRef" :height="300" />
      </div>
      <template #footer>
        <template v-if="!isSigningCommitment">
          <el-button @click="commitmentDialogVisible = false">取消</el-button>
        </template>
        <template v-else>
          <el-button @click="isSigningCommitment = false">返回</el-button>
          <el-button @click="clearCommitmentPad">清除</el-button>
          <el-button type="primary" @click="confirmCommitmentSign">确认签名</el-button>
        </template>
      </template>
    </el-dialog>

    <!-- 笔录签名弹窗（全屏签名） -->
    <el-dialog
      v-model="recordDialogVisible"
      :title="currentDoc?.docTitle || '笔录签名'"
      width="90%"
      top="3vh"
      :close-on-click-modal="false"
    >
      <div class="record-sign">
        <div class="doc-info">
          <p><span class="label">所属案号：</span>{{ currentDoc?.caseNo }}</p>
          <p><span class="label">案由：</span>{{ currentDoc?.caseReason }}</p>
          <p><span class="label">提交时间：</span>{{ currentDoc?.submitTime }}</p>
        </div>
        <el-divider />
        <SignaturePad ref="recordPadRef" :height="500" />
      </div>
      <template #footer>
        <el-button @click="recordDialogVisible = false">取消</el-button>
        <el-button @click="clearRecordPad">清除</el-button>
        <el-button type="primary" @click="confirmRecordSign">确认签名</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { EditPen } from '@element-plus/icons-vue'
import { useTodoStore } from '@/stores/todo'
import SignaturePad from './shared/SignaturePad.vue'
import SignatureTable from './shared/SignatureTable.vue'

const todoStore = useTodoStore()
const { commitmentList, recordList, documentList } = storeToRefs(todoStore)

const activeTab = ref('commitment')
const currentDoc = ref(null)

// 承诺书签署
const commitmentDialogVisible = ref(false)
const isSigningCommitment = ref(false)
const commitmentPadRef = ref(null)

// 笔录签名
const recordDialogVisible = ref(false)
const recordPadRef = ref(null)

const handleTabChange = () => {
  // 切换 tab 时重置状态
}

// ============ 承诺书 ============
const openCommitmentDialog = (row) => {
  currentDoc.value = row
  isSigningCommitment.value = false
  commitmentDialogVisible.value = true
}

const clearCommitmentPad = () => {
  commitmentPadRef.value?.clear()
}

const confirmCommitmentSign = () => {
  const signature = commitmentPadRef.value?.getSignature()
  if (!signature) {
    ElMessage.warning('请先完成手写签名')
    return
  }
  todoStore.signCommitment(currentDoc.value.id)
  ElMessage.success('承诺书签名成功')
  commitmentDialogVisible.value = false
  isSigningCommitment.value = false
}

// ============ 笔录 ============
const openRecordDialog = (row) => {
  currentDoc.value = row
  recordDialogVisible.value = true
}

const clearRecordPad = () => {
  recordPadRef.value?.clear()
}

const confirmRecordSign = () => {
  const signature = recordPadRef.value?.getSignature()
  if (!signature) {
    ElMessage.warning('请先完成手写签名')
    return
  }
  todoStore.signRecord(currentDoc.value.id)
  ElMessage.success('笔录签名成功')
  recordDialogVisible.value = false
}

// ============ 文书 ============
const handleDocumentSign = () => {
  ElMessage.info('该功能暂未开放，后续实现')
}
</script>

<style scoped lang="scss">
.signature-list {
  .signature-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 16px;
    }
    :deep(.el-tabs__item.is-active) {
      color: var(--el-color-primary);
      font-weight: 600;
    }
    :deep(.el-tabs__active-line) {
      background-color: var(--el-color-primary);
    }
  }
}

.commitment-preview,
.commitment-sign,
.record-sign {
  .doc-info {
    p {
      margin: 8px 0;
      font-size: 14px;
      color: var(--el-text-color-regular);
      .label {
        color: var(--el-text-color-secondary);
        margin-right: 8px;
      }
    }
  }

  .doc-content {
    max-height: 300px;
    overflow-y: auto;
    padding: 12px 16px;
    background-color: #f5f7fa;
    border-radius: 4px;
    font-size: 14px;
    line-height: 1.8;
    color: var(--el-text-color-regular);
    white-space: pre-wrap;
  }
}

.sign-entry {
  margin-top: 20px;
  padding: 24px;
  border: 1px dashed var(--el-border-color);
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  transition: all 0.25s ease;

  .el-icon {
    font-size: 24px;
    margin-right: 8px;
    vertical-align: middle;
  }

  &:hover {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
    background-color: #f2f5fa;
  }
}
</style>
