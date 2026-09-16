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
              v-if="!row.signed"
              type="primary"
              link
              size="small"
              @click="openSignDialog(row)"
            >
              签名
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 结案文书：区分未签名 / 已签名 -->
    <div class="doc-section">
      <div class="doc-subtitle">结案文书</div>
      <el-tabs v-model="awardTab" class="award-tabs">
        <el-tab-pane :label="`未签名(${unsignedAwards.length})`" name="unsigned" />
        <el-tab-pane :label="`已签名(${signedAwards.length})`" name="signed" />
      </el-tabs>
      <el-table :data="filteredAwards" style="width: 100%">
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
              v-if="!row.signed"
              type="primary"
              link
              size="small"
              @click="confirmAwardSign(row)"
            >
              签名
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
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
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

// ============ 结案文书：未签名 / 已签名 tab ============
const awardTab = ref('unsigned')
const unsignedAwards = computed(() => props.docList.awards.filter((d) => !d.signed))
const signedAwards = computed(() => props.docList.awards.filter((d) => d.signed))
const filteredAwards = computed(() =>
  awardTab.value === 'signed' ? signedAwards.value : unsignedAwards.value
)

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

// 结案文书签名：确认弹框 → 确认后标记已签名
const confirmAwardSign = (row) => {
  ElMessageBox.confirm('请确认是否对本次结案文书予以电子签名确认。', '签名确认', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      const ok = store.signAwardDoc(row.id)
      if (ok) {
        // 当前条目已签名，若处于"未签名"tab 会自动移出列表
        ElMessage.success('签名完成')
      }
    })
    .catch(() => {})
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

    .award-tabs {
      margin-bottom: 4px;

      :deep(.el-tabs__header) {
        margin-bottom: 10px;
      }

      :deep(.el-tabs__item) {
        font-size: 14px;
        height: 40px;
        line-height: 40px;
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
