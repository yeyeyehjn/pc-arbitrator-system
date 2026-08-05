<template>
  <div class="section-card consult-opinion">
    <div class="section-title">
      <span>专家回复意见</span>
      <span v-if="opinions && opinions.length" class="opinion-count">{{ opinions.length }} 条</span>
    </div>

    <template v-if="opinions && opinions.length > 0">
      <div class="opinion-timeline">
        <div
          v-for="(item, idx) in pagedOpinions"
          :key="item.submittedAt + item.replier + idx"
          class="opinion-item"
        >
          <!-- 左侧时间线节点 -->
          <div class="opinion-marker">
            <div class="marker-avatar" :style="{ background: getAvatarColor(item.replier) }">
              {{ item.replier?.charAt(0) || '?' }}
            </div>
            <div v-if="idx < pagedOpinions.length - 1" class="marker-line" />
          </div>

          <!-- 右侧内容 -->
          <div class="opinion-body">
            <div class="opinion-header">
              <span class="replier">{{ item.replier }}</span>
              <span class="submitted-at">{{ item.submittedAt }}</span>
            </div>
            <div class="opinion-content">{{ item.content }}</div>
            <div v-if="item.attachments && item.attachments.length" class="opinion-attachments">
              <span
                v-for="f in item.attachments"
                :key="f.url"
                class="attachment-chip"
                role="button"
                tabindex="0"
                @click="previewFile(f.url)"
                @keydown.enter="previewFile(f.url)"
              >
                <svg class="chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
                <span class="chip-name">{{ f.name }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="opinions.length > pageSize" class="pagination-bar">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="opinions.length"
          layout="total, prev, pager, next, sizes"
          background
          small
        />
      </div>
    </template>

    <!-- 空状态 -->
    <div v-else class="opinion-empty">
      <div class="empty-illustration">
        <svg viewBox="0 0 120 100" fill="none">
          <rect x="20" y="28" width="80" height="56" rx="6" stroke="currentColor" stroke-width="1.5" opacity="0.3" />
          <path d="M35 48h50M35 58h50M35 68h30" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.25" />
          <circle cx="95" cy="72" r="16" fill="var(--el-color-primary-light-9)" stroke="var(--el-color-primary)" stroke-width="1.5" />
          <path d="M89 72l4 4 8-8" stroke="var(--el-color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <span class="empty-text">暂无回复意见</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  opinions: { type: Array, default: () => [] },
})

const currentPage = ref(1)
const pageSize = ref(10)

const pagedOpinions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return props.opinions.slice(start, start + pageSize.value)
})

const AVATAR_COLORS = [
  '#053d99', '#3a6bb5', '#0d6e5a', '#5b4a8a', '#8c5e2e', '#2c6e63',
]
const colorCache = {}
const getAvatarColor = (name) => {
  if (!name) return AVATAR_COLORS[0]
  if (!colorCache[name]) {
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    colorCache[name] = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
  }
  return colorCache[name]
}

const previewFile = (url) => window.open(url, '_blank')
</script>

<style scoped lang="scss">
.consult-opinion {
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    .opinion-count {
      font-size: 12px;
      font-weight: 400;
      color: var(--el-text-color-secondary);
      background: var(--el-fill-color-light);
      padding: 2px 8px;
      border-radius: 10px;
    }
  }

  /* —— 时间线 —— */
  .opinion-timeline {
    display: flex;
    flex-direction: column;
  }

  .opinion-item {
    display: flex;
    gap: 16px;
    padding-bottom: 20px;

    /* 左侧标记列 */
    .opinion-marker {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-shrink: 0;
      .marker-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
        color: #fff;
        flex-shrink: 0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      }
      .marker-line {
        flex: 1;
        width: 2px;
        min-height: 16px;
        background: linear-gradient(to bottom, var(--el-border-color) 0%, var(--el-border-color-lighter) 100%);
        margin-top: 4px;
        border-radius: 1px;
      }
    }

    /* 右侧内容 */
    .opinion-body {
      flex: 1;
      min-width: 0;
      padding-bottom: 0;
    }

    .opinion-header {
      display: flex;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 8px;
      .replier {
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        line-height: 1;
      }
      .submitted-at {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        line-height: 1;
      }
    }

    .opinion-content {
      font-size: 14px;
      line-height: 1.85;
      color: var(--el-text-color-regular);
      background: var(--el-fill-color-light);
      padding: 14px 16px;
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 8px;
      white-space: pre-wrap;
    }

    .opinion-attachments {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
      .attachment-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px 4px 8px;
        background: var(--el-color-primary-light-9);
        border: 1px solid var(--el-color-primary-light-7);
        border-radius: 16px;
        font-size: 12px;
        color: var(--el-color-primary);
        cursor: pointer;
        transition: all 0.2s ease;
        .chip-icon {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
        }
        .chip-name {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        &:hover,
        &:focus-visible {
          background: var(--el-color-primary-light-8);
          border-color: var(--el-color-primary-light-5);
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        }
        &:focus-visible {
          outline: 2px solid var(--el-color-primary);
          outline-offset: 2px;
        }
      }
    }

    /* 悬停高亮 */
    &:hover .opinion-content {
      border-color: var(--el-color-primary-light-5);
    }
  }

  /* 最后一个不显示底部间距 */
  .opinion-item:last-child {
    padding-bottom: 0;
  }

  /* —— 空状态 —— */
  .opinion-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px 0 28px;
    .empty-illustration {
      width: 120px;
      height: 100px;
      color: var(--el-color-primary-light-5);
      margin-bottom: 4px;
      svg {
        width: 100%;
        height: 100%;
      }
    }
    .empty-text {
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
