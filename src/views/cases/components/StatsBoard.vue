<template>
  <div class="stats-board">
    <!-- 在办案件卡片 -->
    <div
      class="stat-card"
      :class="{ active: currentStatus === 'active' }"
      role="button"
      tabindex="0"
      :aria-pressed="currentStatus === 'active'"
      aria-label="切换到在办案件"
      @click="$emit('switch-status', 'active')"
      @keydown.enter.space.prevent="$emit('switch-status', 'active')"
    >
      <div class="stat-main">
        <div class="stat-icon-wrap">
          <el-icon class="stat-icon"><Briefcase /></el-icon>
        </div>
        <div class="stat-text">
          <span class="stat-title">在办案件</span>
          <span class="stat-number">{{ stats.active }}</span>
        </div>
      </div>
      <div class="sub-stats">
        <span class="sub-stat-item normal">
          <span class="sub-label">审限正常</span>
          <span class="sub-value">{{ activeSubStats.normal }}</span>
        </span>
        <span class="sub-divider"></span>
        <span class="sub-stat-item expiring">
          <span class="sub-label">即将延期</span>
          <span class="sub-value">{{ activeSubStats.expiringSoon }}</span>
        </span>
        <span class="sub-divider"></span>
        <span class="sub-stat-item expired">
          <span class="sub-label">已延期</span>
          <span class="sub-value">{{ activeSubStats.expired }}</span>
        </span>
      </div>
    </div>

    <!-- 已结案件卡片 -->
    <div
      class="stat-card"
      :class="{ active: currentStatus === 'closed' }"
      role="button"
      tabindex="0"
      :aria-pressed="currentStatus === 'closed'"
      aria-label="切换到已结案件"
      @click="$emit('switch-status', 'closed')"
      @keydown.enter.space.prevent="$emit('switch-status', 'closed')"
    >
      <div class="stat-main">
        <div class="stat-icon-wrap">
          <el-icon class="stat-icon"><FolderChecked /></el-icon>
        </div>
        <div class="stat-text">
          <span class="stat-title">已结案件</span>
          <span class="stat-number">{{ stats.closed }}</span>
        </div>
      </div>
      <div class="sub-stats">
        <span class="sub-stat-item ruling">
          <span class="sub-label">裁决</span>
          <span class="sub-value">{{ closedSubStats.ruling }}</span>
        </span>
        <span class="sub-divider"></span>
        <span class="sub-stat-item mediation">
          <span class="sub-label">调解</span>
          <span class="sub-value">{{ closedSubStats.mediation }}</span>
        </span>
        <span class="sub-divider"></span>
        <span class="sub-stat-item withdraw">
          <span class="sub-label">撤案</span>
          <span class="sub-value">{{ closedSubStats.withdraw }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Briefcase, FolderChecked } from '@element-plus/icons-vue'

defineProps({
  stats: {
    type: Object,
    required: true,
  },
  currentStatus: {
    type: String,
    required: true,
  },
  activeSubStats: {
    type: Object,
    default: () => ({ normal: 0, expiringSoon: 0, expired: 0 }),
  },
  closedSubStats: {
    type: Object,
    default: () => ({ ruling: 0, mediation: 0, withdraw: 0 }),
  },
})

defineEmits(['switch-status'])
</script>

<style scoped lang="scss">
.stats-board {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  flex: 1;
  padding: 20px;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  &:not(.active):hover {
    border-color: var(--el-color-primary-light-7);
    box-shadow: 0 4px 14px rgba(5, 61, 153, 0.1);
    background-color: var(--el-color-primary-light-9);
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 2px;
  }

  &.active {
    background-color: var(--el-fill-color-light);
    border-color: var(--el-color-primary);

    .stat-title,
    .stat-number {
      color: var(--el-color-primary);
    }

    .stat-icon-wrap {
      background-color: var(--el-color-primary-light-9);

      .stat-icon {
        color: var(--el-color-primary);
      }
    }
  }

  // 主信息行：图标容器 + 标题/数字垂直堆叠
  .stat-main {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  .stat-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background-color: var(--el-fill-color-light);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background-color 0.2s ease;

    .stat-icon {
      font-size: 20px;
      color: var(--el-text-color-secondary);
      transition: color 0.2s ease;
    }
  }

  .stat-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .stat-title {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    font-weight: 500;
    line-height: 1.4;
  }

  .stat-number {
    font-size: 28px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    line-height: 1;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }

  // 子统计行：纯文本 + 数字（位于主统计右侧）
  .sub-stats {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  .sub-stat-item {
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
    font-size: 12px;
    line-height: 1;

    .sub-label {
      color: var(--el-text-color-secondary);
    }

    .sub-value {
      font-weight: 600;
      color: var(--el-text-color-primary);
      font-variant-numeric: tabular-nums;
    }

    // 在办案件子统计数字配色
    &.normal .sub-value { color: var(--el-color-success); }
    &.expiring .sub-value { color: var(--el-color-warning); }
    &.expired .sub-value { color: var(--el-color-danger); }

    // 已结案件子统计数字配色
    &.ruling .sub-value { color: var(--el-color-primary); }
    &.mediation .sub-value { color: var(--el-color-success); }
    &.withdraw .sub-value { color: var(--el-text-color-secondary); }
  }

  .sub-divider {
    width: 1px;
    height: 12px;
    background-color: var(--el-border-color);
    flex-shrink: 0;
  }
}
</style>
