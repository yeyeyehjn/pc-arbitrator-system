<template>
  <div class="statistics-view">
    <!-- 筛选配置区 -->
    <FilterBar />

    <!-- 加载态遮罩 -->
    <div v-if="store.isLoading" class="loading-overlay" role="status" aria-live="polite">
      <div class="loading-indicator">
        <span class="loading-dot"></span>
        <span class="loading-text">统计中</span>
      </div>
    </div>

    <!-- 错误态 -->
    <div v-if="store.error" class="error-state">
      <CaseEmptyState text="暂无统计数据">
        <el-button type="primary" @click="store.loadAll()">重试</el-button>
      </CaseEmptyState>
    </div>

    <!-- 图表区网格 -->
    <div v-else class="statistics-grid">
      <!-- 块1：新收案件情况（环形图） -->
      <NewCasesChart
        class="grid-item new-cases-chart"
        :data="store.newCasesData"
        @navigate="handleNavigate($event)"
      />

      <!-- 块2：在办案件情况（双格指标卡片） -->
      <OngoingCasesCard
        class="grid-item ongoing-cases-card"
        :data="store.ongoingCasesData"
        @navigate="handleNavigate($event)"
      />

      <!-- 块3：办结案件情况（1+3 指标卡片） -->
      <ClosedCasesCard
        class="grid-item closed-cases-card"
        :data="store.closedCasesData"
        @navigate="handleNavigate($event)"
      />

      <!-- 块4：办理案件 Top5 案由（横向进度条） -->
      <TopCausesChart
        class="grid-item top-causes-chart"
        :data="store.topCausesData"
        @navigate="handleNavigate($event)"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStatisticsStore } from '@/stores/statistics'
import FilterBar from './components/FilterBar.vue'
import NewCasesChart from './components/NewCasesChart.vue'
import OngoingCasesCard from './components/OngoingCasesCard.vue'
import ClosedCasesCard from './components/ClosedCasesCard.vue'
import TopCausesChart from './components/TopCausesChart.vue'
import CaseEmptyState from '../components/shared/CaseEmptyState.vue'

const route = useRoute()
const router = useRouter()
const store = useStatisticsStore()

// 防抖工具
const debounce = (fn, delay) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// 初始化：从 URL 读取筛选状态
const initFromUrl = () => {
  const { start, end, preset } = route.query
  if (preset && ['year', 'halfYear', 'threeMonths'].includes(preset)) {
    store.setPreset(preset)
  } else if (start && end) {
    store.setCustomRange(start, end)
  } else {
    store.setPreset('year')
  }
}

// store 变化 → 更新 URL
const syncToUrl = watch(
  () => store.dateRange,
  (range) => {
    router.replace({
      query: {
        ...route.query,
        start: range.start || undefined,
        end: range.end || undefined,
        preset: store.preset || undefined,
      },
    })
  },
  { deep: true }
)

// store 变化 → 重新加载数据（防抖 300ms）
const debouncedLoad = debounce(() => store.loadAll(), 300)
watch(
  () => store.dateRange,
  () => {
    debouncedLoad()
  },
  { deep: true }
)

// 处理图板点击跳转：携带当前筛选日期范围
const handleNavigate = (payload) => {
  const { start, end } = store.dateRange
  router.push({
    path: '/cases/list',
    query: {
      ...payload,
      startDate: start,
      endDate: end,
    },
  })
}

onMounted(() => {
  initFromUrl()
  store.loadAll()
})
</script>

<style scoped lang="scss">
.statistics-view {
  position: relative;
  padding-bottom: 20px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 8px;

  .loading-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background-color: var(--el-bg-color);
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

    .loading-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--el-color-primary);
      animation: pulse 1.2s ease-in-out infinite;
    }

    .loading-text {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.4;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

.error-state {
  padding: 60px 0;
}

.statistics-grid {
  display: grid;
  gap: 20px;

  // 桌面端 ≥992px：3 上 + 1 下（块4满宽）
  @media (min-width: 992px) {
    grid-template-columns: repeat(3, 1fr);
    grid-template-areas:
      'new ongoing closed'
      'top top top';

    .new-cases-chart { grid-area: new; }
    .ongoing-cases-card { grid-area: ongoing; }
    .closed-cases-card { grid-area: closed; }
    .top-causes-chart { grid-area: top; }
  }

  // 平板 768-991px：2 列
  @media (min-width: 768px) and (max-width: 991px) {
    grid-template-columns: repeat(2, 1fr);
    grid-template-areas:
      'new ongoing'
      'closed closed'
      'top top';

    .new-cases-chart { grid-area: new; }
    .ongoing-cases-card { grid-area: ongoing; }
    .closed-cases-card { grid-area: closed; }
    .top-causes-chart { grid-area: top; }
  }

  // 移动端 ≤767px：单列堆叠
  @media (max-width: 767px) {
    grid-template-columns: 1fr;
    gap: 16px;

    .new-cases-chart { grid-area: auto; }
    .ongoing-cases-card { grid-area: auto; }
    .closed-cases-card { grid-area: auto; }
    .top-causes-chart { grid-area: auto; }
  }
}

// 无障碍：prefers-reduced-motion 关闭脉冲动画
@media (prefers-reduced-motion: reduce) {
  .loading-dot {
    animation: none;
    opacity: 1;
  }
}
</style>
