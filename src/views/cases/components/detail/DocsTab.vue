<template>
  <div class="docs-tab">
    <!-- 裁决书核阅 -->
    <div class="section-card">
      <div class="section-title">裁决书核阅</div>
      <div class="action-bar">
        <el-upload
          :show-file-list="false"
          :before-upload="handleUpload"
          accept=".doc,.docx,.pdf"
        >
          <el-button type="primary" plain :icon="Upload">上传裁决书</el-button>
        </el-upload>
        <el-button type="primary" :icon="Edit" @click="openEditor">在线编辑</el-button>
        <el-button type="primary" link :icon="Clock" @click="openRecords">查看核阅记录</el-button>
      </div>
      <div class="award-preview">
        <div v-if="!store.award.content" class="empty-tip">暂无裁决书，请上传或在线编辑</div>
        <div v-else class="award-summary">
          <div class="summary-text" v-html="awardExcerpt"></div>
          <el-button type="primary" link size="small" @click="openEditor">查看完整</el-button>
        </div>
      </div>
    </div>

    <!-- 文书签名 -->
    <div class="section-card">
      <div class="section-title">文书签名</div>
      <SignaturePanel :doc-list="store.docs" />
    </div>

    <!-- 在线编辑器 -->
    <AwardEditor
      v-model:visible="editorVisible"
      :content="store.award.content"
      @save="handleSaveAward"
    />

    <!-- 核阅记录抽屉 -->
    <el-drawer v-model="recordsVisible" title="核阅记录" direction="rtl" size="40%">
      <div v-if="store.award.records.length === 0" class="empty-tip">暂无核阅记录</div>
      <div v-else class="records-list">
        <div v-for="record in store.award.records" :key="record.id" class="record-item">
          <div class="record-header">
            <span class="reviewer">{{ record.reviewer }}</span>
            <el-tag :type="record.result === '通过' ? 'success' : 'warning'" size="small">
              {{ record.result }}
            </el-tag>
            <span class="time">{{ record.time }}</span>
          </div>
          <div class="remark">{{ record.remark }}</div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Upload, Edit, Clock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useCaseDetailStore } from '@/stores/caseDetail'
import AwardEditor from './shared/AwardEditor.vue'
import SignaturePanel from './shared/SignaturePanel.vue'

defineProps({
  caseId: {
    type: String,
    default: '',
  },
})

const store = useCaseDetailStore()
const editorVisible = ref(false)
const recordsVisible = ref(false)

const awardExcerpt = computed(() => {
  const html = store.award.content || ''
  // 截取前 200 字符的纯文本作为摘要
  const div = document.createElement('div')
  div.innerHTML = html
  const text = div.innerText || ''
  return text.length > 200 ? text.slice(0, 200) + '…' : text
})

const handleUpload = (file) => {
  // Mock：上传后填入编辑器
  ElMessage.success(`《${file.name}》上传成功，已载入编辑器`)
  store.award.content = '<h2 style="text-align:center">裁决书</h2><p>（从上传文件载入的内容，可在线编辑修改）</p>'
  return false // 阻止真实上传
}

const openEditor = () => {
  editorVisible.value = true
}

const handleSaveAward = (html) => {
  store.saveAwardContent(html)
}

const openRecords = () => {
  recordsVisible.value = true
}
</script>

<style scoped lang="scss">
.docs-tab {
  .action-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }

  .award-preview {
    .empty-tip {
      text-align: center;
      font-size: 14px;
      color: var(--el-text-color-secondary);
      padding: 24px 0;
      background-color: #f5f7fa;
      border-radius: 4px;
    }

    .award-summary {
      .summary-text {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        line-height: 1.8;
        margin-bottom: 8px;
        padding: 12px;
        background-color: #f5f7fa;
        border-radius: 4px;
      }
    }
  }

  .records-list {
    .record-item {
      padding: 12px 0;
      border-bottom: 1px solid var(--el-border-color-lighter);

      &:last-child {
        border-bottom: none;
      }

      .record-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 6px;

        .reviewer {
          font-size: 14px;
          font-weight: 600;
          color: var(--el-text-color-regular);
        }

        .time {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          margin-left: auto;
        }
      }

      .remark {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        padding-left: 4px;
      }
    }
  }

  .empty-tip {
    text-align: center;
    font-size: 14px;
    color: var(--el-text-color-secondary);
    padding: 40px 0;
  }
}
</style>
