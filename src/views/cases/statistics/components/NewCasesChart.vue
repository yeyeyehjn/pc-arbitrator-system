<template>
  <div class="new-cases-chart section-card">
    <div class="card-header">
      <div class="title-group">
        <span class="title-bar"></span>
        <h3 class="card-title">新收案件情况</h3>
      </div>
      <span v-if="data" class="card-total">共 {{ data.total }} 件</span>
    </div>

    <CaseEmptyState v-if="!data || data.total === 0" text="该时段暂无新收案件" />

    <div v-else class="chart-body">
      <!-- ECharts 环形图容器 -->
      <div
        ref="chartRef"
        class="chart-container"
        role="img"
        :aria-label="chartAriaLabel"
      ></div>

      <!-- 图例三块 -->
      <div class="legend-list">
        <div
          v-for="(seg, idx) in data.segments"
          :key="seg.type"
          class="legend-item"
          :class="{ 'legend-hover': hoverIndex === idx }"
          role="button"
          tabindex="0"
          :aria-label="`${seg.label} ${seg.count} 件，占比 ${(seg.ratio * 100).toFixed(1)}%，点击查看列表`"
          @click="emitNavigate(seg.type)"
          @keydown.enter="emitNavigate(seg.type)"
          @mouseenter="setHover(idx)"
          @mouseleave="setHover(-1)"
        >
          <span class="legend-dot" :style="{ '--dot-color': getSegColor(seg.colorVar) }"></span>
          <span class="legend-name">{{ seg.label }}</span>
          <span class="legend-count">{{ seg.count }}</span>
          <span class="legend-ratio">{{ (seg.ratio * 100).toFixed(1) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import * as echarts from '@/utils/echarts'
import CaseEmptyState from '../../components/shared/CaseEmptyState.vue'

const props = defineProps({
  data: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['navigate'])

// 解析 CSS 变量（ECharts 配置在 JS 中无法直接使用 var()）
const getCssVar = (name, fallback = '') => {
  if (typeof window === 'undefined') return fallback
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return val || fallback
}

// 由语义键解析为实际颜色值（供模板图例点和 ECharts 共用）
const getSegColor = (colorVar) => getCssVar(colorVar, '#409eff')

const chartRef = ref(null)
const hoverIndex = ref(-1)
let chartInstance = null
let resizeObserver = null

const chartAriaLabel = computed(() => {
  if (!props.data) return '新收案件情况环形图'
  const segments = props.data.segments
    .map((s) => `${s.label} ${s.count} 件，占比 ${(s.ratio * 100).toFixed(1)}%`)
    .join('；')
  return `新收案件环形图，共 ${props.data.total} 件，其中 ${segments}`
})

const emitNavigate = (role) => {
  emit('navigate', { role })
}

const setHover = (idx) => {
  hoverIndex.value = idx
  if (chartInstance) {
    if (idx >= 0) {
      chartInstance.dispatchAction({
        type: 'highlight',
        seriesIndex: 0,
        dataIndex: idx,
      })
    } else {
      chartInstance.dispatchAction({ type: 'downplay' })
    }
  }
}

const buildOption = (data) => {
  return {
    aria: {
      enabled: true,
      decal: {
        show: false, // 关闭装饰图案，保持图表纯净
      },
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: getCssVar('--el-bg-color', '#fff'),
      borderColor: getCssVar('--el-border-color-light', '#e4e7ed'),
      textStyle: {
        color: getCssVar('--el-text-color-primary', '#303133'),
        fontSize: 12,
      },
      formatter: (params) => {
        return `${params.name} · ${params.value} 件 · ${params.percent.toFixed(1)}%`
      },
    },
    series: [
      {
        name: '新收案件',
        type: 'pie',
        radius: ['52%', '76%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: getCssVar('--el-bg-color', '#fff'),
          borderWidth: 3,
        },
        label: {
          show: true,
          position: 'center',
          formatter: () => {
            return `{total|${data.total}}\n{unit|件}`
          },
          rich: {
            total: {
              fontSize: 28,
              fontWeight: 700,
              color: getCssVar('--el-text-color-primary', '#303133'),
              lineHeight: 36,
              letterSpacing: -0.5,
            },
            unit: {
              fontSize: 12,
              color: getCssVar('--el-text-color-secondary', '#909399'),
              lineHeight: 18,
              letterSpacing: 1,
            },
          },
        },
        emphasis: {
          scale: true,
          scaleSize: 6,
          label: {
            show: true,
            position: 'center',
            formatter: (params) => {
              return `{total|${params.value}}\n{unit|${params.name}}`
            },
          },
          itemStyle: {
            shadowBlur: 16,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.18)',
          },
        },
        data: data.segments.map((seg) => ({
          name: seg.label,
          value: seg.count,
          itemStyle: { color: getSegColor(seg.colorVar) },
        })),
      },
    ],
  }
}

onMounted(() => {
  if (chartRef.value && props.data) {
    chartInstance = echarts.init(chartRef.value, null, { renderer: 'svg' })
    chartInstance.setOption(buildOption(props.data))

    chartInstance.on('click', (params) => {
      const seg = props.data.segments[params.dataIndex]
      if (seg) emitNavigate(seg.type)
    })

    chartInstance.on('mouseover', (params) => {
      hoverIndex.value = params.dataIndex
    })

    chartInstance.on('mouseout', () => {
      hoverIndex.value = -1
    })

    resizeObserver = new ResizeObserver(() => chartInstance?.resize())
    resizeObserver.observe(chartRef.value)
  }
})

watch(
  () => props.data,
  (newData) => {
    if (chartInstance && newData) {
      chartInstance.setOption(buildOption(newData))
    } else if (!chartInstance && chartRef.value && newData) {
      chartInstance = echarts.init(chartRef.value, null, { renderer: 'svg' })
      chartInstance.setOption(buildOption(newData))
      resizeObserver = new ResizeObserver(() => chartInstance?.resize())
      resizeObserver.observe(chartRef.value)
    }
  },
  { deep: true }
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<style scoped lang="scss">
.new-cases-chart {
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

    .card-total {
      font-size: 14px;
      color: var(--el-text-color-regular);
      font-variant-numeric: tabular-nums;
    }
  }

  .chart-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .chart-container {
    width: 100%;
    height: 220px;
  }

  .legend-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover,
    &.legend-hover {
      background-color: var(--el-fill-color);
    }

    &:focus-visible {
      outline: 2px solid var(--el-color-primary);
      outline-offset: 2px;
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      background-color: var(--dot-color, var(--el-color-primary));
      box-shadow: 0 0 0 0 var(--dot-color, var(--el-color-primary));
    }

    &:hover .legend-dot,
    &.legend-hover .legend-dot {
      transform: scale(1.25);
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--dot-color, var(--el-color-primary)) 20%, transparent);
    }

    .legend-name {
      font-size: 14px;
      color: var(--el-text-color-regular);
      flex-shrink: 0;
    }

    .legend-count {
      font-size: 14px;
      font-weight: 700;
      color: var(--el-text-color-primary);
      font-variant-numeric: tabular-nums;
    }

    .legend-ratio {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      font-variant-numeric: tabular-nums;
      margin-left: auto;
    }
  }
}

// 移动端
@media (max-width: 767px) {
  .new-cases-chart {
    .chart-container {
      height: 180px;
    }

    .legend-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
  }
}
</style>
