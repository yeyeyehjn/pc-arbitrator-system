<template>
  <div class="ongoing-cases-card section-card">
    <div class="card-header">
      <span class="title-bar"></span>
      <h3 class="card-title">在办案件情况</h3>
    </div>

    <CaseEmptyState v-if="!data" text="暂无数据" />

    <template v-else>
      <!-- 汇总行 -->
      <div class="summary-row">
        <span class="summary-label">在办合计</span>
        <span class="summary-value">{{ totalCount }}<span class="summary-unit"> 件</span></span>
      </div>

      <!-- 双格 -->
      <div class="card-grid">
        <div
          class="stat-cell"
          role="button"
          tabindex="0"
          :aria-label="`在办案件 ${data.ongoingCount} 件，点击查看列表`"
          @click="$emit('navigate', { status: 'ongoing' })"
          @keydown.enter="$emit('navigate', { status: 'ongoing' })"
        >
          <div class="stat-label">在办数</div>
          <div class="stat-value">
            {{ data.ongoingCount }}<span class="stat-unit"> 件</span>
          </div>
          <div class="stat-desc">正在审理中</div>
        </div>

        <div
          class="stat-cell"
          :class="{ 'stat-cell-danger': data.overdueCount > 0 }"
          role="button"
          tabindex="0"
          :aria-label="overdueAriaLabel"
          @click="$emit('navigate', { status: 'overdue' })"
          @keydown.enter="$emit('navigate', { status: 'overdue' })"
        >
          <el-icon v-if="data.overdueCount > 0" class="warning-icon"><Warning /></el-icon>
          <div class="stat-label">已延期数</div>
          <div class="stat-value">
            {{ data.overdueCount }}<span class="stat-unit"> 件</span>
          </div>
          <div class="stat-desc">{{ data.overdueCount > 0 ? '需关注审限' : '暂无延期' }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Warning } from '@element-plus/icons-vue'
import CaseEmptyState from '../../components/shared/CaseEmptyState.vue'

const props = defineProps({
  data: {
    type: Object,
    default: null,
  },
})

defineEmits(['navigate'])

// 在办合计 = 在办数 + 已延期数（已延期属于在办的子集，但合计展示更直观）
const totalCount = computed(() => {
  if (!props.data) return 0
  return props.data.ongoingCount || 0
})

const overdueAriaLabel = computed(() => {
  const count = props.data?.overdueCount || 0
  const base = `已延期案件 ${count} 件，点击查看列表`
  return count > 0 ? `${base}，存在审限风险` : base
})
</script>

<style scoped lang="scss">
.ongoing-cases-card {
  display: flex;
  flex-direction: column;

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;

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
  }

  // 汇总行
  .summary-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 10px 14px;
    margin-bottom: 12px;
    background-color: var(--el-color-primary-light-9);
    border-radius: 8px;

    .summary-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-color-secondary);
    }

    .summary-value {
      font-size: 20px;
      font-weight: 800;
      color: var(--el-color-primary);
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.02em;

      .summary-unit {
        font-size: 12px;
        font-weight: 500;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .card-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    flex: 1; // 撑满剩余高度
  }

  .stat-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 18px 14px;
    background-color: var(--el-fill-color-light);
    border: 1px solid transparent;
    border-radius: 10px;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease;
    position: relative;

    &:hover {
      background-color: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary-light-7);
    }

    &:focus-visible {
      outline: 2px solid var(--el-color-primary);
      outline-offset: 2px;
    }

    .stat-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-color-secondary);
      line-height: 1;
    }

    .stat-value {
      font-size: 40px;
      font-weight: 800;
      color: var(--el-color-primary);
      line-height: 1.1;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.03em;
      margin: 4px 0;

      .stat-unit {
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-secondary);
      }
    }

    .stat-desc {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      line-height: 1;
    }

    .warning-icon {
      position: absolute;
      top: 10px;
      right: 10px;
      font-size: 16px;
      color: var(--el-color-danger);
      animation: pulse-warning 2s ease-in-out infinite;
    }

    &.stat-cell-danger {
      background-color: var(--el-color-danger-light-9);

      &:hover {
        background-color: var(--el-color-danger-light-8);
        border-color: var(--el-color-danger-light-7);
      }

      .stat-value {
        color: var(--el-color-danger);
      }
    }
  }
}

@keyframes pulse-warning {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.15); }
}

// 移动端
@media (max-width: 767px) {
  .ongoing-cases-card {
    .stat-cell {
      padding: 14px 12px;

      .stat-value {
        font-size: 32px;
      }
    }
  }
}

// 无障碍：尊重减少动画偏好
@media (prefers-reduced-motion: reduce) {
  .warning-icon {
    animation: none;
  }
  .stat-cell {
    transition: none;
  }
}
</style>
