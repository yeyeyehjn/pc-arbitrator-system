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
      <el-button v-if="filteredList.length" link type="primary" class="toggle-all-btn" @click="toggleAll">
        <el-icon class="toggle-all-icon">
          <ArrowDownBold v-if="!allExpanded" />
          <ArrowUpBold v-else />
        </el-icon>
        {{ allExpanded ? '收起全部' : '展开全部' }}
      </el-button>
    </div>

    <!-- 空状态 -->
    <CaseEmptyState v-if="!filteredList.length" text="暂无证据清单" />

    <!-- 展开式表格 -->
    <el-table v-else ref="tableRef" :data="filteredList" row-key="id" style="width: 100%">
      <el-table-column type="expand">
        <template #default="{ row }">
          <div class="expand-body">
            <div class="expand-content">
              <div class="content-label">证据内容</div>
              <div class="content-text">{{ row.content || '暂无证据内容' }}</div>
            </div>
            <!-- 附件：桌面在附件列展示，移动端隐藏附件列后在此展示 -->
            <div v-if="row.files && row.files.length" class="expand-attachments">
              <div class="content-label">证据附件</div>
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
              </div>
            </div>
            <div v-if="row.challenge" class="challenge-card">
              <div class="challenge-head">
                <span class="challenge-tag">质证</span>
                <span
                  v-for="item in threeNatures"
                  :key="item.key"
                  class="nature-tag"
                  :class="row.challenge[item.key] === '异议' ? 'is-disputed' : 'is-confirmed'"
                >{{ item.label }}：{{ row.challenge[item.key] || '确认' }}</span>
              </div>
              <div class="challenge-line">
                <span class="challenge-label">质证人：</span>
                <span>{{ row.challenge.challenger }}</span>
              </div>
              <div class="challenge-line">
                <span class="challenge-label">质证理由：</span>
                <span>{{ row.challenge.reason }}</span>
              </div>
              <div v-if="row.challenge && row.challenge.opinionFiles && row.challenge.opinionFiles.length" class="challenge-line">
                <span class="challenge-label">答辩文件：</span>
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
          <span class="index-no" :class="{ 'has-challenge': filteredList[$index] && filteredList[$index].challenge }">{{ $index + 1 }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="name" label="证据名称" :min-width="isMobile ? 76 : 120" show-overflow-tooltip />

      <!-- 附件列：移动端不渲染（附件信息在展开行查看），避免隐藏列残留宽度撑爆表格 -->
      <el-table-column v-if="!isMobile" label="证据附件" min-width="240" class-name="attach-col">
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
            <span v-if="!row.files || !row.files.length" class="none-text">无</span>
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
    <el-dialog v-model="previewVisible" :title="(currentFile && currentFile.name) || '文件预览'" width="60%" top="8vh">
      <div class="preview-content">
        <div v-if="currentFile && currentFile.fileType === 'image'" class="preview-placeholder">[图片预览区] {{ currentFile.name }}</div>
        <div v-else-if="currentFile && currentFile.fileType === 'pdf'" class="preview-placeholder">[PDF 预览区] {{ currentFile.name }}</div>
        <div v-else class="preview-placeholder">该文件类型暂不支持在线预览</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Download, ArrowDownBold, ArrowUpBold } from '@element-plus/icons-vue'
import CaseEmptyState from '../../shared/CaseEmptyState.vue'

const props = defineProps({
  list: {
    type: Array,
    default: () => [],
  },
})

// 移动端断点：附件列不渲染，名称列收窄
const isMobile = ref(false)
let mq = null
if (typeof window !== 'undefined' && window.matchMedia) {
  mq = window.matchMedia('(max-width: 768px)')
  isMobile.value = mq.matches
  const onChange = (e) => {
    isMobile.value = e.matches
  }
  mq.addEventListener('change', onChange)
  onBeforeUnmount(() => mq.removeEventListener('change', onChange))
}

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
  // 切换筛选后收起全部，避免残留展开状态造成误读
  collapseAll()
}

// ============ 展开全部 / 收起全部 ============
const tableRef = ref()
const allExpanded = ref(false)

const collapseAll = () => {
  if (!tableRef.value) return
  filteredList.value.forEach((row) => tableRef.value.toggleRowExpansion(row, false))
  allExpanded.value = false
}

const toggleAll = () => {
  const target = !allExpanded.value
  filteredList.value.forEach((row) => tableRef.value.toggleRowExpansion(row, target))
  allExpanded.value = target
}

// 质证三性核对维度
const threeNatures = [
  { key: 'authenticity', label: '真实性' },
  { key: 'legality', label: '合法性' },
  { key: 'relevance', label: '关联性' },
]

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
  // 展开行高度突变时禁用浏览器滚动锚定，避免页面滚动位置自动跳变造成抖动
  overflow-anchor: none;

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

      // 筛选 chips 字重统一为 400（含选中态）
      :deep(.el-check-tag),
      :deep(.el-check-tag.is-checked) {
        font-weight: 400;
      }
    }

    .toggle-all-btn {
      margin-left: 10px;
      font-size: 12px;

      .toggle-all-icon {
        font-size: 12px;
      }
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
    // background-color: #f2f5fa;
    // border: 1px solid #d8ddf0;
    // border-radius: 4px;
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

    // 附件块：桌面附件在附件列展示，此处隐藏
    .expand-attachments {
      display: none;

      .content-label {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-bottom: 6px;
      }
    }

    .challenge-card {
      border-top: 1px dashed #f5d9a0;
      padding-top: 8px;
      margin-top: 8px;

      .challenge-head {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
        flex-wrap: wrap;

        .challenge-tag {
          display: inline-block;
          background-color: var(--app-color-accent);
          color: #ffffff;
          border-radius: 3px;
          padding: 1px 6px;
          font-size: 10px;
          font-weight: 600;
        }

        .nature-tag {
          display: inline-block;
          border-radius: 3px;
          padding: 1px 6px;
          font-size: 10px;
          border: 1px solid;

          &.is-confirmed {
            background-color: #f0f9eb;
            color: #67c23a;
            border-color: #c2e7b0;
          }

          &.is-disputed {
            background-color: #fff7e6;
            color: #b45309;
            border-color: #f5d9a0;
          }
        }
      }

      .challenge-line {
        display: flex;
        align-items: baseline;
        font-size: 12px;
        color: var(--el-text-color-regular);
        line-height: 1.6;
        flex-wrap: wrap;

        .challenge-label {
          width: 80px;
          flex-shrink: 0;
          text-align: left;
          color: var(--el-text-color-secondary);
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

// ============ 移动端（≤768px）：工具栏换行、表格容器内横向滚动 ============
@media (max-width: 768px) {
  .evidence-list {
    .list-toolbar {
      flex-wrap: wrap;
      row-gap: 8px;

      .toolbar-filters {
        margin-left: 0;
      }

      .toggle-all-btn {
        margin-left: auto;
      }
    }

    // 展开行缩进收窄，适配小屏
    .expand-body {
      margin-left: 12px;

      // 附件列已隐藏，展开行内展示附件
      .expand-attachments {
        display: block;
      }
    }

    // 移动端：附件列已由 v-if 移除，编号/名称/质证三列一屏内全部可见
    overflow-x: auto;

    :deep(.el-table) {
      width: 100%;
    }

    // 附件 chips 收紧，降低窄列内垂直堆叠的行高
    .attach-chip {
      padding: 1px 6px;

      .chip-name {
        max-width: 120px;
      }
    }
  }
}
</style>
