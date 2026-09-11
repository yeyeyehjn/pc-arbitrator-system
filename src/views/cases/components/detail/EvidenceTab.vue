<template>
  <div class="evidence-tab">
    <div class="evidence-layout">
      <!-- 左侧竖向侧栏 -->
      <aside class="evidence-sidebar">
        <div
          v-for="type in types"
          :key="type.key"
          class="sidebar-item"
          :class="{ active: activeType === type.key }"
          @click="activeType = type.key"
        >
          <span class="item-label">{{ type.label }}</span>
          <span v-if="listCount(type.key)" class="item-badge">{{ listCount(type.key) }}</span>
        </div>
      </aside>

      <!-- 右侧内容区 -->
      <div class="evidence-content">
        <div class="content-toolbar">
          <span class="content-title">{{ currentLabel }}</span>
          <el-button size="small" :icon="Reading" @click="openMaterialReader">材料阅览</el-button>
        </div>

        <!-- 质证通知 -->
        <div class="section-card">
          <div class="section-title">质证通知</div>
          <div v-if="current.notice" class="notice-file">
            <span class="file-chip"><el-icon><Document /></el-icon></span>
            <span class="file-name">{{ current.notice.name }}</span>
            <span class="file-divider" />
            <span class="file-meta">{{ current.notice.uploadTime }}</span>
            <span class="file-divider" />
            <span class="file-meta">上传人：{{ current.notice.uploader }}</span>
            <el-button class="file-action" link size="small" :icon="Download" @click="downloadFile(current.notice)">下载</el-button>
          </div>
          <div v-else class="empty-tip">暂无质证通知</div>
        </div>

        <!-- 证据目录 -->
        <div class="section-card">
          <div class="section-title-row">
            <span class="section-title">证据目录</span>
            <div class="section-actions">
              <el-button size="small" :icon="Download" @click="downloadCatalog">下载目录文件</el-button>
            </div>
          </div>
          <el-table v-if="current.catalog && current.catalog.length" :data="current.catalog" style="width: 100%">
            <el-table-column label="序号" width="64">
              <template #default="{ $index }">{{ $index + 1 }}</template>
            </el-table-column>
            <el-table-column prop="name" label="证据名称" min-width="200" show-overflow-tooltip />
            <el-table-column prop="form" label="证据形式" width="100" />
            <el-table-column prop="pages" label="页数" width="80" align="center" />
            <el-table-column prop="submitDate" label="提交日期" width="120" />
          </el-table>
          <div v-else class="empty-tip">暂无证据目录</div>
        </div>

        <!-- 证据清单 -->
        <div class="section-card">
          <div class="section-title">证据清单</div>
          <EvidenceList :list="current.list || []" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Document, Download, Reading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useCaseDetailStore } from '@/stores/caseDetail'
import EvidenceList from './shared/EvidenceList.vue'

defineProps({
  caseId: {
    type: String,
    default: '',
  },
})

const store = useCaseDetailStore()
const route = useRoute()
const router = useRouter()

const types = [
  { key: 'applicant', label: '申请人证据' },
  { key: 'respondent', label: '被申请人证据' },
  { key: 'tribunal', label: '仲裁庭依职权调取证据' },
]
const activeType = ref('applicant')

const evidence = computed(() => store.evidence || {})
const current = computed(
  () => evidence.value[activeType.value] || { notice: null, catalog: [], list: [] },
)
const currentLabel = computed(
  () => types.find((t) => t.key === activeType.value)?.label || '',
)

// 侧栏徽标条数：有证据条数才返回 >0
const listCount = (key) => {
  const typeData = evidence.value[key]
  return (typeData && typeData.list && typeData.list.length) || 0
}

const openMaterialReader = () => {
  const caseId = route.params.id
  const url = router.resolve(`/cases/${caseId}/material-reader`).href
  window.open(url, '_blank')
}

const downloadFile = (file) => {
  ElMessage.success(`《${file.name}》下载已开始`)
}

const downloadCatalog = () => {
  ElMessage.success(`《${currentLabel.value}·证据目录》下载已开始`)
}
</script>

<style scoped lang="scss">
.evidence-tab {
  .evidence-layout {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  // ============ 左侧竖向侧栏（复用 .todos-sidebar 选中态系统元素） ============
  .evidence-sidebar {
    width: 200px;
    flex-shrink: 0;
    background-color: #ffffff;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    padding: 12px 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;

    .sidebar-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 9px 12px;
      border-radius: 6px;
      font-size: 14px;
      color: var(--el-text-color-secondary);
      cursor: pointer;
      transition: background-color 0.2s;

      .item-label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .item-badge {
        flex-shrink: 0;
        min-width: 18px;
        height: 18px;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 5px;
        font-size: 10px;
        background-color: #f2f5fa;
        color: var(--el-text-color-secondary);
      }

      &:hover {
        background-color: #fafafa;

        .item-label {
          color: var(--el-color-primary-light-3);
        }
      }

      &.active {
        background-color: #f2f5fa;
        color: var(--el-color-primary);
        font-weight: 600;

        /* 选中态 3px 竖条：DESIGN.md §4.6.1 登记的选中态系统元素 */
        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          border-radius: 0 2px 2px 0;
          background-color: var(--el-color-primary);
        }

        .item-badge {
          background-color: #e6e9f4;
          color: var(--el-color-primary);
        }
      }
    }
  }

  // ============ 右侧内容区 ============
  .evidence-content {
    flex: 1;
    min-width: 0;

    .content-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      .content-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-regular);
      }
    }
  }

  // 质证通知文件条（复用 DocsTab award-file-info 语言）
  .notice-file {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding: 10px 16px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;

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
    }

    .file-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-color-primary);
      line-height: 28px;
    }

    .file-divider {
      width: 1px;
      height: 12px;
      background-color: var(--el-border-color);
      flex-shrink: 0;
    }

    .file-meta {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      line-height: 28px;
    }

    .file-action {
      padding: 0 2px;
      height: 28px;
      color: var(--el-text-color-regular);

      &:hover,
      &:focus {
        color: var(--el-color-primary);
      }
    }
  }

  .empty-tip {
    text-align: center;
    font-size: 14px;
    color: var(--el-text-color-secondary);
    padding: 24px 0;
  }
}

// ============ 移动端（≤768px）：侧栏折叠为顶部横向分类 ============
@media (max-width: 768px) {
  .evidence-tab {
    .evidence-layout {
      flex-direction: column;
      gap: 12px;
    }

    .evidence-sidebar {
      width: 100%;
      flex-direction: row;
      flex-wrap: wrap;
      border: none;
      padding: 0;

      .sidebar-item {
        padding: 6px 14px;
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 999px;

        &.active::before {
          display: none;
        }
      }
    }
  }
}
</style>
