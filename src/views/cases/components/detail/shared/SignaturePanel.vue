<template>
  <div class="signature-panel">
    <!-- 庭审笔录 -->
    <div class="doc-section">
      <div class="doc-subtitle">庭审笔录</div>
      <el-table :data="docList.records" style="width: 100%">
        <el-table-column prop="title" label="笔录标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="hearingDate" label="庭审日期" min-width="120" />
        <el-table-column prop="submitTime" label="提交时间" min-width="160" />
        <el-table-column label="签名状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.signed ? 'success' : 'warning'" size="small">
              {{ row.signed ? '已签名' : '待签名' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewRecord(row)">查看</el-button>
            <el-button
              type="primary"
              link
              size="small"
              :disabled="row.signed"
              @click="openSignDialog(row)"
            >
              {{ row.signed ? '已签名' : '签名' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 结案文书 -->
    <div class="doc-section">
      <div class="doc-subtitle">结案文书</div>
      <el-table :data="docList.awards" style="width: 100%">
        <el-table-column prop="title" label="文书标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="docType" label="文书类型" min-width="120" />
        <el-table-column prop="submitTime" label="提交时间" min-width="160" />
        <el-table-column label="签名状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.signed ? 'success' : 'warning'" size="small">
              {{ row.signed ? '已签名' : '待签名' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewAward(row)">预览</el-button>
            <el-button
              type="primary"
              link
              size="small"
              :disabled="row.signed"
              @click="openSignDialog(row)"
            >
              {{ row.signed ? '已签名' : '签名' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 笔录查看弹窗 -->
    <el-dialog v-model="viewDialogVisible" :title="currentDoc?.title || '文书查看'" width="70%" top="6vh">
      <div class="doc-preview">
        <div class="preview-placeholder">[文书预览区] {{ currentDoc?.title }}</div>
      </div>
    </el-dialog>

    <!-- 签名弹窗 -->
    <el-dialog
      v-model="signDialogVisible"
      :title="`签名 - ${currentDoc?.title || ''}`"
      width="80%"
      top="5vh"
      :close-on-click-modal="false"
    >
      <div class="sign-area">
        <div class="doc-meta" v-if="currentDoc">
          <p><span class="label">标题：</span>{{ currentDoc.title }}</p>
          <p v-if="currentDoc.hearingDate"><span class="label">庭审日期：</span>{{ currentDoc.hearingDate }}</p>
          <p><span class="label">提交时间：</span>{{ currentDoc.submitTime }}</p>
        </div>
        <el-divider />
        <SignaturePad ref="padRef" :height="400" />
      </div>
      <template #footer>
        <el-button @click="signDialogVisible = false">取消</el-button>
        <el-button @click="clearPad">清除</el-button>
        <el-button type="primary" @click="confirmSign">确认签名</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SignaturePad from '@/views/todos/components/shared/SignaturePad.vue'
import { useCaseDetailStore } from '@/stores/caseDetail'

const props = defineProps({
  docList: {
    type: Object,
    default: () => ({ records: [], awards: [] }),
  },
})

const store = useCaseDetailStore()
const viewDialogVisible = ref(false)
const signDialogVisible = ref(false)
const currentDoc = ref(null)
const padRef = ref(null)

const handleViewRecord = (row) => {
  currentDoc.value = row
  viewDialogVisible.value = true
}

const handleViewAward = (row) => {
  currentDoc.value = row
  viewDialogVisible.value = true
}

const openSignDialog = (row) => {
  if (row.signed) return
  currentDoc.value = row
  signDialogVisible.value = true
}

const clearPad = () => {
  padRef.value?.clear()
}

const confirmSign = () => {
  const signature = padRef.value?.getSignature()
  if (!signature) return
  const ok = store.signDoc(currentDoc.value.id, signature)
  if (ok) {
    signDialogVisible.value = false
  }
}
</script>

<style scoped lang="scss">
.signature-panel {
  .doc-section {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    .doc-subtitle {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-regular);
      position: relative;
      padding-left: 10px;
      margin-bottom: 10px;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 4px;
        bottom: 4px;
        width: 2px;
        background-color: var(--el-color-primary);
      }
    }
  }

  .doc-preview {
    min-height: 400px;

    .preview-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      background-color: #f5f7fa;
      border-radius: 4px;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }

  .sign-area {
    .doc-meta {
      p {
        margin: 6px 0;
        font-size: 14px;
        color: var(--el-text-color-secondary);

        .label {
          color: var(--el-text-color-secondary);
          margin-right: 8px;
        }
      }
    }
  }
}
</style>
