<template>
  <div class="personal-resume">
    <!-- 5 类履历卡片 -->
    <div v-for="cat in categories" :key="cat.type" class="section-card">
      <div class="section-title-row">
        <div class="section-title">
          {{ cat.label }}
          <span class="title-count">{{ getSortedList(cat.type).length }}</span>
        </div>
        <div class="section-actions">
          <el-button type="primary" plain size="small" @click="handleAdd(cat.type)">
            <el-icon><Plus /></el-icon>
            <span>添加</span>
          </el-button>
        </div>
      </div>

      <!-- 时间轴展示 -->
      <template v-if="getSortedList(cat.type).length">
        <div class="timeline">
          <div
            v-for="(record, idx) in getSortedList(cat.type)"
            :key="record.id"
            class="timeline-item"
            :class="{ 'is-current': isCurrent(cat.type, record) }"
          >
            <!-- 左侧时间轴轴线 + 节点 -->
            <div class="timeline-marker">
              <div class="timeline-dot"></div>
              <div v-if="idx !== getSortedList(cat.type).length - 1" class="timeline-line"></div>
            </div>

            <!-- 右侧内容卡片 -->
            <div class="timeline-content">
              <!-- 第一行：名称 + 时间 + 编辑/删除（最右侧） -->
              <div class="timeline-header">
                <div class="timeline-title-fields">
                  <span
                    v-for="field in getTitleFields(cat.type, record)"
                    :key="field.key"
                    class="title-field"
                  >
                    <span class="title-value">{{ record[field.key] || '-' }}</span>
                  </span>
                </div>
                <div class="timeline-date">
                  <el-icon class="date-icon"><Calendar /></el-icon>
                  <span>{{ formatRecordDate(cat.type, record) }}</span>
                </div>
                <div class="timeline-actions">
                  <el-button type="primary" link size="small" :icon="Edit" @click="handleEdit(cat.type, record)">编辑</el-button>
                  <el-popconfirm
                    title="确定删除该条履历记录？"
                    confirm-button-text="确定"
                    cancel-button-text="取消"
                    @confirm="handleDelete(cat.type, record.id)"
                  >
                    <template #reference>
                      <el-button type="danger" link size="small" :icon="Delete">删除</el-button>
                    </template>
                  </el-popconfirm>
                </div>
              </div>

              <!-- 其余字段（去掉已在标题行显示的字段） -->
              <div v-if="getExtraFields(cat.type).length" class="timeline-body">
                <div
                  v-for="field in getExtraFields(cat.type)"
                  :key="field.key"
                  class="timeline-field"
                >
                  <span class="field-label">{{ field.label }}</span>
                  <span class="field-value">{{ record[field.key] || '-' }}</span>
                </div>
              </div>

              <!-- 附件（chip 形态） -->
              <div v-if="record.attachments && record.attachments.length" class="timeline-attachments">
                <a
                  v-for="(file, fIdx) in record.attachments"
                  :key="fIdx"
                  href="javascript:void(0)"
                  class="attach-chip"
                  @click="handleDownload(file)"
                >
                  <el-icon class="attach-icon"><Document /></el-icon>
                  <span class="attach-name">{{ file.name }}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="table-empty">
        <el-icon class="empty-icon"><FolderOpened /></el-icon>
        <span>暂无履历记录</span>
      </div>
    </div>

    <!-- 增删改弹窗 -->
    <ResumeDialog
      v-model:visible="dialogVisible"
      :record-type="currentType"
      :edit-data="currentEditData"
      @save="handleDialogSave"
      @close="handleDialogClose"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Edit, Delete, Calendar, Document, FolderOpened } from '@element-plus/icons-vue'
import { useProfileStore } from '@/stores/profile'
import ResumeDialog from './resume/ResumeDialog.vue'

const profileStore = useProfileStore()

const categories = [
  { type: 'education', label: '教育背景' },
  { type: 'language', label: '外语能力' },
  { type: 'training', label: '培训/工作经历' },
  { type: 'achievement', label: '主要专业成果' },
  { type: 'workHistory', label: '工作背景信息' },
]

// 各类别展示字段配置
const fieldConfigs = {
  education: [
    { key: 'school', label: '在读院校' },
    { key: 'major', label: '专业' },
    { key: 'education', label: '学历' },
    { key: 'degree', label: '学位' },
  ],
  language: [
    { key: 'language', label: '语种' },
  ],
  training: [
    { key: 'org', label: '单位/机构' },
    { key: 'result', label: '职务/结业情况' },
  ],
  achievement: [
    { key: 'name', label: '成果名称' },
    { key: 'description', label: '描述' },
  ],
  workHistory: [
    { key: 'name', label: '名称' },
    { key: 'description', label: '描述' },
  ],
}

// 各类别第一行标题行显示的字段（名称类字段）
const titleFieldKeys = {
  education: ['school'],
  language: ['language'],
  training: ['org'],
  achievement: ['name'],
  workHistory: ['name'],
}

// 第一行标题字段
const getTitleFields = (type, record) => {
  const keys = titleFieldKeys[type] || []
  return (fieldConfigs[type] || []).filter((f) => keys.includes(f.key))
}

// 剩余字段（已在标题行显示的不再重复）
const getExtraFields = (type) => {
  const keys = titleFieldKeys[type] || []
  return (fieldConfigs[type] || []).filter((f) => !keys.includes(f.key))
}

const getSortedList = (type) => profileStore.getSortedResume(type)

const formatRecordDate = (type, record) => {
  if (type === 'achievement') {
    return record.startDate || '-'
  }
  const start = record.startDate || '-'
  const end = record.endDate || '至今'
  return `${start} ~ ${end}`
}

// 判断是否为当前进行中的记录（无结束日期或结束日期为"至今"）
const isCurrent = (type, record) => {
  if (type === 'achievement') return false
  return !record.endDate || record.endDate === '至今'
}

// 弹窗状态
const dialogVisible = ref(false)
const currentType = ref('education')
const currentEditData = ref(null)

const handleAdd = (type) => {
  currentType.value = type
  currentEditData.value = null
  dialogVisible.value = true
}

const handleEdit = (type, row) => {
  currentType.value = type
  currentEditData.value = { ...row }
  dialogVisible.value = true
}

const handleDialogSave = async ({ type, data, isEdit }) => {
  if (isEdit) {
    await profileStore.updateResumeRecord(type, currentEditData.value.id, data)
  } else {
    await profileStore.addResumeRecord(type, data)
  }
  ElMessage.success(isEdit ? '编辑成功' : '添加成功')
  dialogVisible.value = false
}

const handleDialogClose = () => {
  currentEditData.value = null
}

const handleDelete = async (type, id) => {
  await profileStore.deleteResumeRecord(type, id)
  ElMessage.success('已删除')
}

const handleDownload = (file) => {
  ElMessage.info('下载功能开发中')
}
</script>

<style scoped lang="scss">
.personal-resume {
  // 区块标题计数
  .title-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 18px;
    padding: 0 6px;
    margin-left: 8px;
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-regular);
    background-color: #f4f4f5;
    border-radius: 9px;
    vertical-align: middle;
  }

  .timeline {
    padding: 12px 0 0 0;
  }

  .timeline-item {
    display: flex;
    gap: 20px;
    min-height: 60px;
  }

  .timeline-marker {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    width: 16px;
  }

  // 时间轴节点：默认中性灰，当前项品牌蓝
  .timeline-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: var(--el-text-color-placeholder);
    box-shadow: 0 0 0 3px var(--el-bg-color), 0 0 0 5px var(--el-border-color-light);
    margin-top: 6px;
    flex-shrink: 0;
    transition: background-color 0.25s ease, box-shadow 0.25s ease;
  }

  // 连接线
  .timeline-line {
    width: 2px;
    flex: 1;
    background-color: var(--el-border-color-light);
    margin-top: 2px;
    margin-bottom: 2px;
  }

  // 当前进行中的记录：节点品牌蓝 + 光晕
  .timeline-item.is-current {
    .timeline-dot {
      background-color: var(--el-color-primary);
      box-shadow: 0 0 0 3px var(--el-bg-color), 0 0 0 5px var(--el-color-primary-light-7);
    }
  }

  .timeline-content {
    flex: 1;
    min-width: 0;
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
    margin-bottom: 16px;
    background-color: var(--el-bg-color);
    overflow: hidden;
    transition: box-shadow 0.25s ease, border-color 0.25s ease;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      box-shadow: 0 4px 12px rgba(5, 61, 153, 0.08);
    }
  }


  // 标题行
  .timeline-header {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .timeline-title-fields {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    flex-wrap: wrap;
    min-width: 0;
  }

  .title-field {
    line-height: 1.4;
    min-width: 0;

    .title-value {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  // 日期：图标 + 文字
  .timeline-date {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 400;
    color: var(--el-text-color-secondary);
    line-height: 1.4;
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;

    .date-icon {
      font-size: 14px;
      color: var(--el-color-primary-light-5);
    }
  }

  .timeline-actions {
    display: flex;
    gap: 16px;
    flex-shrink: 0;
    margin-left: auto;
  }

  // 字段网格
  .timeline-body {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px 24px;
    padding: 12px 16px;
  }

  .timeline-field {
    display: flex;
    font-size: 14px;
    line-height: 1.6;
    min-width: 0;

    .field-label {
      color: var(--el-text-color-secondary);
      min-width: 80px;
      flex-shrink: 0;

      &::after {
        content: '：';
      }
    }

    .field-value {
      color: var(--el-text-color-regular);
      flex: 1;
      min-width: 0;
      word-break: break-all;
    }
  }

  // 附件区
  .timeline-attachments {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 14px 16px;
  }

  .attach-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    padding: 5px 10px;
    border-radius: 4px;
    background-color: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    color: var(--el-text-color-regular);
    font-size: 12px;
    line-height: 1.4;
    text-decoration: none;
    transition: border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease;

    .attach-icon {
      font-size: 14px;
      color: var(--el-color-primary-light-5);
      flex-shrink: 0;
    }

    .attach-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &:hover {
      border-color: var(--el-color-primary-light-5);
      color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-9);
      text-decoration: none;

      .attach-icon {
        color: var(--el-color-primary);
      }
    }
  }

  // 空状态
  .table-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 32px 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);

    .empty-icon {
      font-size: 32px;
      color: var(--el-text-color-placeholder);
    }
  }

  @media (max-width: 768px) {
    .timeline-body {
      grid-template-columns: 1fr;
      gap: 4px;
    }

    .timeline-header {
      padding: 12px;
      gap: 8px;
    }

    .timeline-body,
    .timeline-attachments {
      padding-left: 12px;
      padding-right: 12px;
    }

    .title-field .title-value {
      font-size: 14px;
    }

    .timeline-actions {
      gap: 8px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .timeline-dot,
    .timeline-content,
    .attach-chip {
      transition: none;
    }
  }
}
</style>
