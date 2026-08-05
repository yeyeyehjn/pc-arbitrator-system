<template>
  <div class="top-causes-chart section-card">
    <div class="card-header">
      <div class="title-group">
        <span class="title-bar"></span>
        <h3 class="card-title">办理案件 Top5 案由</h3>
      </div>
      <span class="card-subtitle">按组庭时间统计</span>
    </div>

    <CaseEmptyState v-if="!data || !data.causes || data.causes.length === 0" text="该时段暂无案件" />

    <ul v-else class="cause-list" role="list">
      <li
        v-for="(item, idx) in data.causes"
        :key="item.rank"
        class="cause-row"
        :class="`rank-${idx + 1}`"
        role="link"
        tabindex="0"
        :aria-label="`第 ${item.rank} 名：${item.name}，${item.count} 件，占比 ${(item.ratio * 100).toFixed(1)}%，点击查看列表`"
        @click="$emit('navigate', { cause: item.name })"
        @keydown.enter="$emit('navigate', { cause: item.name })"
      >
        <div class="row-header">
          <span class="cause-name">{{ item.name }}</span>
          <span class="cause-stats">
            <span class="cause-count">{{ item.count }}件</span>
            <span class="cause-sep">·</span>
            <span class="cause-ratio">占比{{ (item.ratio * 100).toFixed(1) }}%</span>
          </span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-filled"
            :style="{ width: getProgressPercent(item.count) + '%' }"
          ></div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import CaseEmptyState from '../../components/shared/CaseEmptyState.vue'

const props = defineProps({
  data: {
    type: Object,
    default: null,
  },
})

defineEmits(['navigate'])

// 以第 1 名案件数为基准（100%），其余按比例
const maxCount = computed(() => {
  if (!props.data?.causes?.length) return 1
  return Math.max(...props.data.causes.map((c) => c.count), 1)
})

const getProgressPercent = (count) => {
  return Math.round((count / maxCount.value) * 100)
}
</script>

<style scoped lang="scss">
.top-causes-chart {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    .title-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    // 蓝色竖条装饰
    .title-bar {
      width: 4px;
      height: 16px;
      background-color: var(--el-color-primary);
      border-radius: 9999px;
      flex-shrink: 0;
    }

    .card-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      letter-spacing: 0.01em;
    }

    .card-subtitle {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .cause-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .cause-row {
    cursor: pointer;
    padding: 4px 0;
    transition: opacity 0.2s ease;

    &:hover {
      .cause-name {
        color: var(--el-color-primary);
      }
    }

    &:focus-visible {
      outline: 2px solid var(--el-color-primary);
      outline-offset: 4px;
      border-radius: 4px;
    }

    .row-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 6px;

      .cause-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-primary);
        transition: color 0.2s ease;
        min-width: 0;
        word-break: break-word;
      }

      .cause-stats {
        display: inline-flex;
        align-items: baseline;
        gap: 4px;
        text-align: right;
        font-size: 12px;
        font-variant-numeric: tabular-nums;
        flex-shrink: 0;

        .cause-count {
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

        .cause-sep {
          color: var(--el-text-color-placeholder);
        }

        .cause-ratio {
          color: var(--el-text-color-secondary);
        }
      }
    }

    .progress-bar {
      width: 100%;
      height: 6px;
      background-color: var(--el-fill-color-light);
      border-radius: 9999px;
      overflow: hidden;

      .progress-filled {
        height: 100%;
        border-radius: 9999px;
        transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      }
    }

    // 按排名配色（蓝/琥珀/绿/亮蓝/玫红）
    &.rank-1 .progress-filled { background-color: var(--el-color-primary); }
    &.rank-2 .progress-filled { background-color: var(--el-color-warning); }
    &.rank-3 .progress-filled { background-color: var(--el-color-success); }
    &.rank-4 .progress-filled { background-color: #4780ff; }
    &.rank-5 .progress-filled { background-color: var(--el-color-danger-light-3); }
  }
}

// 移动端
@media (max-width: 767px) {
  .top-causes-chart {
    .cause-list {
      gap: 12px;
    }

    .cause-row {
      .row-header {
        gap: 8px;

        .cause-name {
          font-size: 13px;
        }

        .cause-stats {
          font-size: 11px;
        }
      }
    }
  }
}

// 无障碍：尊重减少动画偏好
@media (prefers-reduced-motion: reduce) {
  .progress-filled {
    transition: none;
  }
  .cause-row {
    transition: none;
  }
}
</style>
