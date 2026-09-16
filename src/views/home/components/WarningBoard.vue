<template>
  <div class="warning-grid">
    <div
      v-for="(item, index) in warningItems"
      :key="index"
      class="warning-card"
      :class="`is-${item.type}`"
      role="button"
      tabindex="0"
      :aria-label="`${item.title} ${item.value} 件，点击查看案件列表`"
      @click="goToCases(item.status)"
      @keydown.enter="goToCases(item.status)"
    >
      <div class="icon-wrapper">
        <el-icon :size="22"><component :is="item.icon" /></el-icon>
      </div>
      <div class="stat-content">
        <div class="stat-title">{{ item.title }}</div>
        <div class="stat-value">{{ item.value }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Briefcase, AlarmClock, Warning } from '@element-plus/icons-vue'
import { useCaseStore } from '@/stores/case'

const router = useRouter()
const caseStore = useCaseStore()

// 预警看板：在办案件 / 审限即将延期 / 已延期（口径与案件列表统计一致）
const warningItems = computed(() => [
  {
    title: '在办案件',
    value: caseStore.activeList.length,
    icon: Briefcase,
    type: 'active',
    status: 'ongoing',
  },
  {
    title: '审限即将延期',
    value: caseStore.activeSubStats.expiringSoon,
    icon: AlarmClock,
    type: 'expiring',
    status: 'expiring',
  },
  {
    title: '已延期',
    value: caseStore.activeSubStats.expired,
    icon: Warning,
    type: 'expired',
    status: 'overdue',
  },
])

// 跳转到【我的案件】列表并按状态筛选
const goToCases = (status) => {
  router.push(`/cases/list?status=${status}`)
}
</script>

<style scoped lang="scss">
.warning-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.warning-card {
  display: flex;
  align-items: center;
  padding: 16px 18px;
  border-radius: 8px;
  background-color: #ffffff;
  border: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: box-shadow 0.25s ease, border-color 0.25s ease, background-color 0.25s ease;

  &:hover,
  &:focus-visible {
    border-color: var(--el-color-primary-light-7);
    box-shadow: 0 4px 14px rgba(10, 31, 143, 0.1);
    background-color: var(--el-color-primary-light-9);
    outline: none;
  }

  .icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 14px;
    flex-shrink: 0;
    background-color: var(--el-fill-color-light);
  }

  .stat-content {
    display: flex;
    flex-direction: column;
    .stat-title {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-bottom: 6px;
      letter-spacing: 0.3px;
    }
    .stat-value {
      font-size: 22px;
      font-weight: 600;
      line-height: 1;
      color: var(--el-text-color-primary);
      font-family: 'DIN Alternate', 'Helvetica Neue', sans-serif;
    }
  }

  // 图标与数字按预警等级配色
  &.is-active {
    .icon-wrapper {
      color: var(--el-color-primary);
    }
  }
  &.is-expiring {
    .icon-wrapper {
      color: var(--el-color-warning);
      background-color: var(--el-color-warning-light-9);
    }
    .stat-value {
      color: var(--el-color-warning);
    }
  }
  &.is-expired {
    .icon-wrapper {
      color: var(--el-color-danger);
      background-color: var(--el-color-danger-light-9);
    }
    .stat-value {
      color: var(--el-color-danger);
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .warning-card {
    transition: none;
  }
}
</style>
