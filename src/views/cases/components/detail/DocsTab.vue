<template>
  <div class="docs-tab">
    <!-- 裁决书核阅（子模块：裁决书 / 核阅流转记录 / 上传文书） -->
    <div class="section-card">
      <div class="section-title-row">
        <span class="section-title">裁决书核阅</span>
        <div class="section-actions">
          <el-button type="primary" :icon="Upload" @click="openUploadDialog">上传文书</el-button>
        </div>
      </div>

      <!-- 子模块 1：裁决书（文件信息条：图标芯片 + 文件名链接 + 中性文字操作 + 更新人 + 历史版本） -->
      <div class="award-file-info">
        <span class="file-chip" :class="{ empty: !store.award.file?.name }">
          <el-icon><Document /></el-icon>
        </span>
        <template v-if="store.award.file?.name">
          <el-link type="primary" :underline="false" class="file-name" @click="openEditor">{{ store.award.file.name }}</el-link>
          <span class="file-divider" />
          <el-button class="file-action" link size="small" :icon="Edit" @click="openEditor">编辑</el-button>
          <el-button class="file-action" link size="small" :icon="Download" @click="store.downloadAwardDraft()">下载</el-button>
          <span class="file-divider" />
          <span class="file-meta">更新人：{{ store.award.file.updater }}</span>
          <span class="file-divider" />
          <el-button class="file-action" link size="small" :icon="Clock" @click="versionsVisible = true">历史版本</el-button>
        </template>
        <span v-else class="file-name empty">暂无裁决书草稿</span>
      </div>

      <el-divider class="review-divider" />

      <!-- 子模块 2：核阅流转记录（时间线卡片） -->
      <div class="flow-header-row">
        <span class="flow-title">核阅流转记录</span>
        <span class="flow-count">共 {{ store.award.flowRecords?.length || 0 }} 条流转记录</span>
      </div>

      <div v-if="!store.award.flowRecords?.length" class="empty-tip">暂无流转记录</div>
      <div v-else class="flow-timeline">
        <div v-for="record in store.award.flowRecords" :key="record.id" class="flow-node">
          <div class="flow-avatar">{{ avatarChar(record.operator) }}</div>
          <div class="flow-item">
            <div class="flow-item-header">
              <span class="operator">{{ record.operator }}</span>
              <span class="action">{{ stageText(record.stage) }}</span>
              <span class="time">{{ record.time }}</span>
            </div>
            <div class="remark">{{ record.remark }}</div>
            <div v-if="record.attachments?.length" class="flow-attachments">
              <div
                v-for="file in record.attachments"
                :key="file"
                class="attach-chip"
                @click="downloadAttachment(file)"
              >
                <el-icon><Document /></el-icon>
                <span class="name">{{ file }}</span>
                <el-icon class="download-icon"><Download /></el-icon>
              </div>
            </div>
          </div>
        </div>
        <!-- 待处理节点：该案仍处于待核阅状态时展示 -->
        <div v-if="pendingReview" class="flow-node pending">
          <div class="flow-avatar pending-avatar">
            <el-icon class="is-loading"><Loading /></el-icon>
          </div>
          <p class="pending-text">等待仲裁员核阅...</p>
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

    <!-- 子模块 3：上传文书（弹窗） -->
    <el-dialog
      v-model="uploadVisible"
      title="上传文书"
      width="600px"
      :close-on-click-modal="false"
      class="upload-dialog"
    >
      <el-form class="upload-form" label-width="80px">
        <el-form-item label="提醒对象" required>
          <el-select v-model="uploadForm.reminderTarget" placeholder="请选择提醒对象" style="width: 100%">
            <el-option v-for="s in secretaryOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="提醒内容" required>
          <el-input
            v-model="uploadForm.reminderContent"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="请输入提醒内容..."
          />
        </el-form-item>
        <el-form-item label="裁决书附件" required>
          <div class="upload-block">
            <el-upload
              class="award-upload"
              drag
              :show-file-list="false"
              :auto-upload="false"
              accept=".doc,.docx,.pdf"
              :on-change="handleAwardFileChange"
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">点击或拖拽文件至此上传</div>
              <template #tip>
                <div class="el-upload__tip">支持 Word / PDF 格式</div>
              </template>
            </el-upload>
            <div v-if="awardFileName" class="selected-file">
              <el-icon><Document /></el-icon>
              <span class="name">{{ awardFileName }}</span>
              <el-button link type="primary" @click="removeAwardFile">删除</el-button>
            </div>
            <div class="upload-hint">首次核阅需上传裁决书，上传后可在线编辑该文件</div>
          </div>
        </el-form-item>
        <el-form-item label="结案类型">
          <el-radio-group v-model="uploadForm.closingType">
            <el-radio value="裁决">裁决</el-radio>
            <el-radio value="调解">调解</el-radio>
            <el-radio value="撤回">撤回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="其他附件">
          <el-upload
            class="other-upload"
            drag
            multiple
            v-model:file-list="otherFileList"
            :auto-upload="false"
            accept=".doc,.docx,.pdf,.jpg,.jpeg,.png"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">点击或拖拽文件至此上传</div>
            <template #tip>
              <div class="el-upload__tip">支持 PDF / Word / 图片等格式</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitAward">确认上传</el-button>
      </template>
    </el-dialog>

    <!-- 历史版本（弹窗：卡片列表，当前版本高亮） -->
    <el-dialog v-model="versionsVisible" title="历史版本" width="700px">
      <div v-if="store.award.versions?.length" class="version-list">
        <div
          v-for="(v, i) in store.award.versions"
          :key="v.id"
          class="version-item"
          :class="{ current: i === 0 }"
        >
          <div class="version-icon"><el-icon><Document /></el-icon></div>
          <div class="version-info">
            <div class="name">{{ v.fileName }}</div>
            <div class="meta">更新人：{{ v.updater }} · {{ v.updateTime }}</div>
          </div>
          <el-tag v-if="i === 0" type="primary" size="small">当前版本</el-tag>
          <el-button type="primary" link :icon="Download" @click="handleDownloadVersion(v)">下载</el-button>
        </div>
      </div>
      <div v-else class="empty-tip">暂无历史版本</div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Upload, Edit, Download, Clock, Document, Loading, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useCaseDetailStore } from '@/stores/caseDetail'
import { useTodoStore } from '@/stores/todo'
import AwardEditor from './shared/AwardEditor.vue'
import SignaturePanel from './shared/SignaturePanel.vue'

const props = defineProps({
  caseId: {
    type: String,
    default: '',
  },
})

const store = useCaseDetailStore()
const todoStore = useTodoStore()
const editorVisible = ref(false)
const versionsVisible = ref(false)
const uploadVisible = ref(false)

// 该案在待办列表中的核阅状态：待核阅时时间线末尾展示等待节点
const pendingReview = computed(() => {
  if (!props.caseId) return false
  const item = todoStore.reviewList.find((i) => i.caseId === props.caseId)
  return item?.reviewStatus === '待核阅'
})

// 头像字符：按角色取字（秘书/仲裁员），其余取姓名首字
const avatarChar = (operator) => {
  if (operator.includes('秘书')) return '秘'
  if (operator.includes('仲裁员')) return '仲'
  return operator.charAt(0)
}

// 流转环节展示文案
const stageText = (stage) => ({ 提交核阅: '发起核阅' }[stage] || stage)

// ============ 上传文书 ============
const uploadForm = ref({
  reminderTarget: '',
  reminderContent: '',
  closingType: '裁决',
})
const awardFileName = ref('')
const otherFileList = ref([])

// 提醒对象选项：默认显示经办秘书
const secretaryOptions = computed(() => {
  const secretary = store.caseInfo?.secretary
  const others = ['刘秘书', '陈秘书', '王秘书', '赵秘书', '周秘书'].filter((s) => s !== secretary)
  return secretary ? [secretary, ...others] : others
})

// 案件数据加载后初始化默认提醒对象
watch(
  () => store.caseInfo?.secretary,
  (val) => {
    if (val && !uploadForm.value.reminderTarget) uploadForm.value.reminderTarget = val
  },
  { immediate: true }
)

const openUploadDialog = () => {
  uploadVisible.value = true
}

const handleAwardFileChange = (file) => {
  if (file?.raw) awardFileName.value = file.name
}

const removeAwardFile = () => {
  awardFileName.value = ''
}

const handleSubmitAward = () => {
  if (!uploadForm.value.reminderTarget) {
    ElMessage.warning('请选择提醒对象')
    return
  }
  if (!uploadForm.value.reminderContent.trim()) {
    ElMessage.warning('请输入提醒内容')
    return
  }
  if (!awardFileName.value) {
    ElMessage.warning('请上传裁决书附件')
    return
  }
  store.submitAwardDoc({
    fileName: awardFileName.value,
    closingType: uploadForm.value.closingType,
    reminderTarget: uploadForm.value.reminderTarget,
    reminderContent: uploadForm.value.reminderContent.trim(),
    otherFiles: otherFileList.value.map((f) => f.name),
  })
  // 同步待办列表：该案裁决书核阅状态置为已核阅
  if (props.caseId) todoStore.markReviewed(props.caseId)
  ElMessage.success('文书已提交，核阅完成')
  uploadVisible.value = false
  // 重置表单（提醒对象回到默认经办秘书）
  uploadForm.value.reminderContent = ''
  uploadForm.value.closingType = '裁决'
  awardFileName.value = ''
  otherFileList.value = []
}

// ============ 裁决书编辑 / 版本 / 附件下载 ============
const openEditor = () => {
  editorVisible.value = true
}

const handleSaveAward = (html) => {
  store.saveAwardContent(html)
}

const handleDownloadVersion = (row) => {
  ElMessage.success(`《${row.fileName}》（${row.versionNo}）下载已开始`)
}

const downloadAttachment = (file) => {
  ElMessage.success(`《${file}》下载已开始`)
}
</script>

<style scoped lang="scss">
.docs-tab {
  .award-file-info {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding: 10px 16px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;

    /* 白底图标芯片：呼应 stat-card 图标容器语言，浮于灰底条上 */
    .file-chip {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 6px;
      background-color: var(--el-bg-color);
      color: var(--el-color-primary);
      font-size: 14px;
      flex-shrink: 0;

      &.empty {
        color: var(--el-text-color-placeholder);
      }
    }

    .file-name {
      font-size: 14px;
      font-weight: 500;

      &.empty {
        font-weight: 400;
        color: var(--el-text-color-secondary);
      }
    }

    /* 分组分隔线：文件名 | 操作 | 更新人 | 历史版本 */
    .file-divider {
      width: 1px;
      height: 12px;
      background-color: var(--el-border-color);
      flex-shrink: 0;
    }

    /* 中性文字操作：静置石墨色，悬停才转主题蓝，收敛整条蓝色密度 */
    .file-action {
      padding: 0 2px;
      color: var(--el-text-color-regular);

      &:hover,
      &:focus {
        color: var(--el-color-primary);
      }
    }

    .file-meta {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    /* 按钮间距统一由 gap 控制，覆盖 el-button 相邻默认 margin */
    .el-button + .el-button {
      margin-left: 0;
    }

    /* 垂直居中：el-link/文字/按钮高度不一导致视觉基线偏移，
       统一按 28px 行高（与图标芯片等高）对齐 */
    .file-name,
    .file-meta {
      line-height: 28px;
    }

    :deep(.file-name.el-link) {
      height: 28px;
    }

    .file-action.el-button {
      height: 28px;
    }
  }

  .review-divider {
    margin: 16px 0;
  }

  .flow-header-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 16px;

    .flow-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-regular);
    }

    .flow-count {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  // 时间线：头像节点 + 中性连线 + 全边框卡片（不用左色条）
  .flow-timeline {
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: 19px;
      top: 8px;
      bottom: 8px;
      width: 2px;
      background-color: var(--el-border-color-lighter);
    }
  }

  .flow-node {
    position: relative;
    padding-left: 56px;
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    .flow-avatar {
      position: absolute;
      left: 0;
      top: 0;
      z-index: 1;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background-color: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      font-size: 14px;
      font-weight: 600;
      /* 用底色描边遮住身后连线，形成圆点嵌线效果 */
      box-shadow: 0 0 0 4px var(--el-bg-color);
    }

    .pending-avatar {
      background-color: var(--el-fill-color);
      color: var(--el-text-color-secondary);
    }

    .pending-text {
      padding-top: 12px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      font-style: italic;
    }

    .flow-item {
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 8px;
      padding: 12px 16px;
      background-color: var(--el-bg-color);

      .flow-item-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;

        .operator {
          font-size: 14px;
          font-weight: 600;
          color: var(--el-text-color-regular);
        }

        .action {
          font-size: 14px;
          color: var(--el-text-color-regular);
        }

        .time {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          margin-left: auto;
        }
      }

      .remark {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        line-height: 1.5;
        margin-bottom: 8px;
      }

      .flow-attachments {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .attach-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        background-color: var(--el-fill-color-light);
        border: 1px dashed var(--el-border-color);
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        color: var(--el-text-color-secondary);

        .name {
          max-width: 220px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .download-icon {
          &:hover {
            color: var(--el-color-primary);
          }
        }

        &:hover {
          background-color: var(--el-fill-color);
        }
      }
    }
  }

  .empty-tip {
    text-align: center;
    font-size: 14px;
    color: var(--el-text-color-secondary);
    padding: 24px 0;
  }

  // 上传弹窗：拖拽区铺满
  .award-upload,
  .other-upload {
    width: 100%;

    :deep(.el-upload-dragger) {
      width: 100%;
      padding: 20px 0;
    }
  }

  .upload-block {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;

    .upload-hint {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .selected-file {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--el-text-color-regular);

    .name {
      max-width: 320px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  // 历史版本弹窗：卡片列表
  .version-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 60vh;
    overflow-y: auto;

    .version-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 8px;

      &.current {
        background-color: var(--el-color-primary-light-9);
        border-color: var(--el-color-primary-light-7);
      }

      .version-icon {
        width: 40px;
        height: 40px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        background-color: var(--el-fill-color-light);
        color: var(--el-color-primary);
        font-size: 16px;
      }

      .version-info {
        flex: 1;
        min-width: 0;

        .name {
          font-size: 14px;
          font-weight: 600;
          color: var(--el-text-color-regular);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .meta {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          margin-top: 4px;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .docs-tab {
    .section-title-row {
      flex-wrap: wrap;
      gap: 8px;
    }

    /* 窄屏换行后分隔线失去分组意义，隐藏避免折行处出现孤立竖线 */
    .award-file-info .file-divider {
      display: none;
    }

    .flow-node {
      padding-left: 48px;

      .flow-avatar {
        width: 32px;
        height: 32px;
      }
    }

    .flow-timeline::before {
      left: 15px;
    }
  }
}
</style>
