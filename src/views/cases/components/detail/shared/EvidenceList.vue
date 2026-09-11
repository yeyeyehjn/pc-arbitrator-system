<template>
  <div class="evidence-list">
    <!-- 统计筛选条 -->
    <div class="list-toolbar">
      <span class="toolbar-count">共 <b>{{ list.length }}</b> 项</span>
      <span v-if="challengedCount" class="toolbar-challenged">{{ challengedCount }} 项有质证</span>
      <div class="toolbar-filters">
        <el-check-tag
          v-for="f in filters"
          :key="f.value"
          :checked="filter === f.value"
          @change="setFilter(f.value)"
        >{{ f.label }}</el-check-tag>
      </div>
    </div>

    <!-- 空状态 -->
    <CaseEmptyState v-if="!filteredList.length" text="暂无证据清单" />

    <!-- 展开式表格 -->
    <el-table v-else :data="filteredList" row-key="id" style="width: 100%">
      <el-table-column type="expand">
        <template #default="{ row }">
          <div class="expand-body">
            <div class="expand-content">
              <div class="content-label">证据内容</div>
              <div class="content-text">{{ row.content || '暂无证据内容' }}</div>
            </div>
            <div v-if="row.challenge" class="challenge-card">
              <span class="challenge-tag">质证</span>
              <div class="challenge-line">
                <span class="challenge-label">质证人：</span>
                <span>{{ row.challenge.challenger }}</span>
              </div>
              <div class="challenge-line">
                <span class="challenge-label">质证理由：</span>
                <span>{{ row.challenge.reason }}</span>
              </div>
              <div v-if="row.challenge.opinionFiles?.length" class="challenge-line">
                <span class="challenge-label">质证意见附件：</span>
                <span
                  v-for="f in row.challenge.opinionFiles"
                  :key="f.id"
                  class="attach-chip"
                  :title="f.name"
                  @click="previewFile(f)"
                >
                  <el-icon><Document /></el-icon>
                  <span class="chip-name">{{ f.name }}</span>
                </span>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="编号" width="64">
        <template #default="{ $index }">
          <span class="index-no" :class="{ has-challenge: filteredList[$index]?.challenge }">{{ $index + 1 }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="name" label="证据名称" min-width="160" show-overflow-tooltip />

      <el-table-column label="证据附件" min-width="240">
        <template #default="{ row }">
          <div class="attach-wrap">
            <span
              v-for="f in row.files"
              :key="f.id"
              class="attach-chip"
              :title="f.name"
              @click="previewFile(f)"
            >
              <el-icon><Document /></el-icon>
              <span class="chip-name">{{ f.name }}</span>
              <el-icon class="chip-download" @click.stop="downloadFile(f)"><Download /></el-icon>
            </span>
            <span v-if="!row.files?.length" class="none-text">无</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="质证" width="90" align="center">
        <template #default="{ row }">
          <span v-if="row.challenge" class="challenge-badge">有质证</span>
          <span v-else class="none-text">无</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 预览弹窗 -->
    <el-dialog v-model="previewVisible" :title="currentFile?.name || '文件预览'" width="60%" top="8vh">
      <div class="preview-content">
        <div v-if="currentFile?.fileType === 'image'" class="preview-placeholder">[图片预览区] {{ currentFile?.name }}</div>
        <div v-else-if="currentFile?.fileType === 'pdf'" class="preview-placeholder">[PDF 预览区] {{ currentFile?.name }}</div>
        <div v-else class="preview-placeholder">该文件类型暂不支持在线预览</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Download } from '@element-plus/icons-vue'
import CaseEmptyState from '../../shared/CaseEmptyState.vue'

const props = defineProps({
  list: {
    type: Array,
    default: () => [],
  },
})

const filter = ref('all')
const filters = [
  { value: 'all', label: '全部' },
  { value: 'challenged', label: '有质证' },
  { value: 'plain', label: '无质证' },
]

const challengedCount = computed(() => props.list.filter((i) => i.challenge).length)

const filteredList = computed(() => {
  if (filter.value === 'all') return props.list
  return props.list.filter((i) => (filter.value === 'challenged') === !!i.challenge)
})

const setFilter = (v) => {
  filter.value = v
}

const previewVisible = ref(false)
const currentFile = ref(null)

const previewFile = (file) => {
  currentFile.value = file
  previewVisible.value = true
}

const downloadFile = (file) => {
  ElMessage.success(`《${file.name}》下载已开始`)
}
</script>

<style scoped lang="scss">
.evidence-list {
  .list-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    background-color: #fafafa;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    padding: 8px 12px;
    margin-bottom: 8px;
    flex-wrap: wrap;

    .toolbar-count {
      font-size: 12px;
      color: var(--el-text-color-secondary);

      b {
        color: #00296b;
      }
    }

    .toolbar-challenged {
      font-size: 12px;
      color: #b45309;

      b {
        color: #b45309;
      }
    }

    .toolbar-filters {
      margin-left: auto;
      display: flex;
      gap: 6px;
    }
  }

  /* 附件 chips：浅蓝底 + 主题蓝字 */
  .attach-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
  }

  .attach-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background-color: #f2f5fa;
    border: 1px solid #d8ddf0;
    border-radius: 4px;
    padding: 2px 8px;
    color: var(--el-color-primary);
    font-size: 12px;
    cursor: pointer;
    max-width: 100%;

    .chip-name {
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .chip-download {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      flex-shrink: 0;

      &:hover {
        color: var(--el-color-primary);
      }
    }

    &:hover {
      background-color: #e7e9f4;
      border-color: var(--el-color-primary-light-5);
    }
  }

  /* 展开行 */
  .expand-body {
    margin: 0 12px 8px 64px;
    border: 1px solid #f5d9a0;
    border-radius: 6px;
    background-color: #fffdf7;
    padding: 10px 12px;

    .expand-content {
      margin-bottom: 8px;

      .content-label {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-bottom: 2px;
      }

      .content-text {
        font-size: 14px;
        color: var(--el-text-color-regular);
        line-height: 1.6;
      }
    }

    .challenge-card {
      border-top: 1px dashed #f5d9a0;
      padding-top: 8px;

      .challenge-tag {
        display: inline-block;
        background-color: var(--app-color-accent);
        color: #ffffff;
        border-radius: 3px;
        padding: 1px 6px;
        font-size: 10px;
        font-weight: 600;
        margin-bottom: 6px;
      }

      .challenge-line {
        display: flex;
        align-items: baseline;
        gap: 4px;
        font-size: 12px;
        color: var(--el-text-color-regular);
        line-height: 1.6;
        flex-wrap: wrap;

        .challenge-label {
          color: var(--el-text-color-secondary);
          flex-shrink: 0;
        }
      }
    }
  }

  .index-no {
    font-size: 14px;
    color: var(--el-text-color-secondary);

    &.has-challenge {
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }

  .challenge-badge {
    display: inline-block;
    background-color: #fff7e6;
    color: #b45309;
    border: 1px solid #f5d9a0;
    border-radius: 3px;
    padding: 1px 6px;
    font-size: 10px;
    white-space: nowrap;
  }

  .none-text {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }

  .preview-content {
    min-height: 300px;

    .preview-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      background-color: #f5f7fa;
      border-radius: 4px;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
