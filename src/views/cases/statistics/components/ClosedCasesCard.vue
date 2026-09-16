<template>
  <div class="closed-cases-card section-card">
    <div class="card-header">
      <span class="title-bar"></span>
      <h3 class="card-title">办结案件情况</h3>
    </div>

    <CaseEmptyState v-if="!data" text="暂无数据" />

    <template v-else>
      <!-- 总数行：左侧标签+数字，右侧同比 -->
      <div
        class="total-cell"
        role="button"
        tabindex="0"
        :aria-label="totalAriaLabel"
        @click="$emit('navigate', { closedType: 'all' })"
        @keydown.enter="$emit('navigate', { closedType: 'all' })"
      >
        <div class="total-left">
          <div class="total-icon">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="total-info">
            <div class="total-label">办结数</div>
            <div class="total-value">
              {{ data.total }}<span class="total-unit"> 件</span>
            </div>
          </div>
        </div>
        <div class="yoy-tag" :class="yoyClass(data.totalYoY)">
          <span v-if="data.totalYoY === null">无同比</span>
          <span v-else-if="data.totalYoY === 0">持平</span>
          <span v-else>{{ data.totalYoY > 0 ? '▲' : '▼' }} {{ Math.abs(data.totalYoY).toFixed(1) }}%</span>
        </div>
      </div>

      <!-- 分项卡片 -->
      <div class="breakdown-grid">
        <div
          v-for="item in data.breakdown"
          :key="item.type"
          class="breakdown-cell"
          :class="`breakdown-${item.type}`"
          role="button"
          tabindex="0"
          :aria-label="getBreakdownAriaLabel(item)"
          @click="$emit('navigate', { closedType: item.type })"
          @keydown.enter="$emit('navigate', { closedType: item.type })"
        >
          <div class="breakdown-label">{{ item.label }}</div>
          <div class="breakdown-value">{{ (item.rate * 100).toFixed(1) }}%</div>
          <!-- mini 进度条：可视化百分比 -->
          <div class="mini-bar">
            <div class="mini-filled" :style="{ width: (item.rate * 100) + '%' }"></div>
          </div>
          <div class="yoy-tag" :class="yoyClass(item.yoy)">
            <span v-if="item.yoy === null">无同比</span>
            <span v-else-if="item.yoy === 0">持平</span>
            <span v-else>{{ item.yoy > 0 ? '▲' : '▼' }} {{ Math.abs(item.yoy).toFixed(1) }}%</span>
          </div>
        </div>
      </div>

      <!-- 底部弹性区：卡片与同行卡片等高时产生的剩余空间，装饰光环锚定其右下角 -->
      <div class="card-footer" aria-hidden="true">
        <svg class="card-decor" viewBox="0 0 140 140" preserveAspectRatio="xMaxYMax meet">
          <defs>
            <radialGradient id="closedDecorOrb" cx="38%" cy="32%" r="65%">
              <stop offset="0%" stop-color="#0a1f8f" stop-opacity="0.14" />
              <stop offset="55%" stop-color="#0a1f8f" stop-opacity="0.04" />
              <stop offset="100%" stop-color="#0a1f8f" stop-opacity="0" />
            </radialGradient>
          </defs>
          <circle cx="70" cy="70" r="52" fill="url(#closedDecorOrb)" class="decor-breathe" />
          <circle cx="70" cy="70" r="58" fill="none" stroke="#0a1f8f" stroke-opacity="0.16" />
          <g class="decor-spin-rev">
            <path d="M 70 14 A 56 56 0 0 0 14 70" fill="none" stroke="#2f7bff" stroke-opacity="0.6" stroke-width="1.5" stroke-linecap="round" />
            <circle cx="14" cy="70" r="3" fill="#22d3ee" />
          </g>
          <circle cx="70" cy="70" r="42" fill="none" stroke="#0a1f8f" stroke-opacity="0.28" stroke-dasharray="3 6" />
          <path d="M 58 70 L 67 79 L 84 61" fill="none" stroke="#0a1f8f" stroke-opacity="0.55" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="94" cy="46" r="2.5" fill="#d4a017" />
        </svg>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { CircleCheck } from '@element-plus/icons-vue'
import CaseEmptyState from '../../components/shared/CaseEmptyState.vue'

const props = defineProps({
  data: {
    type: Object,
    default: null,
  },
})

defineEmits(['navigate'])

// 同比涨跌 CSS class
const yoyClass = (yoy) => {
  if (yoy === null || yoy === 0) return 'yoy-neutral'
  return yoy > 0 ? 'yoy-up' : 'yoy-down'
}

const totalAriaLabel = computed(() => {
  if (!props.data) return ''
  const { total, totalYoY } = props.data
  if (totalYoY === null) return `办结数 ${total} 件，无同比数据`
  if (totalYoY === 0) return `办结数 ${total} 件，同比持平`
  return `办结数 ${total} 件，同比${totalYoY > 0 ? '上涨' : '下跌'} ${Math.abs(totalYoY).toFixed(1)}%`
})

const getBreakdownAriaLabel = (item) => {
  const rate = (item.rate * 100).toFixed(1)
  if (item.yoy === null) return `${item.label} ${rate}%，无同比数据，对应 ${item.count} 件`
  if (item.yoy === 0) return `${item.label} ${rate}%，同比持平，对应 ${item.count} 件`
  return `${item.label} ${rate}%，同比${item.yoy > 0 ? '上涨' : '下跌'} ${Math.abs(item.yoy).toFixed(1)}%，对应 ${item.count} 件`
}
</script>

<style scoped lang="scss">
.closed-cases-card {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: none;
  border-radius: 0;

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

  // 总数行
  .total-cell {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background-color: var(--el-fill-color-light);
    border: 1px solid transparent;
    border-radius: 10px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease;

    &:hover {
      background-color: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary-light-7);
    }

    &:focus-visible {
      outline: 2px solid var(--el-color-primary);
      outline-offset: 2px;
    }

    .total-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .total-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background-color: var(--el-color-primary);
      border-radius: 8px;
      color: #fff;
      font-size: 18px;
      flex-shrink: 0;
    }

    .total-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .total-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--el-text-color-secondary);
      line-height: 1;
    }

    .total-value {
      font-size: 24px;
      font-weight: 800;
      color: var(--el-text-color-primary);
      line-height: 1.1;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.02em;

      .total-unit {
        font-size: 12px;
        font-weight: 500;
        color: var(--el-text-color-secondary);
      }
    }
  }

  // 分项卡片
  .breakdown-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .breakdown-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px 8px;
    background-color: var(--el-fill-color-light);
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease;

    &:hover {
      border-color: var(--hover-color, var(--el-color-primary-light-5));
      background-color: var(--hover-bg, var(--el-color-primary-light-9));
    }

    &:focus-visible {
      outline: 2px solid var(--el-color-primary);
      outline-offset: 2px;
    }

    // 各分项配色
    &.breakdown-arbitration {
      --hover-color: var(--el-color-primary-light-5);
      --hover-bg: var(--el-color-primary-light-9);
      --value-color: var(--el-color-primary);
      --bar-color: var(--el-color-primary);
    }
    &.breakdown-mediation {
      --hover-color: var(--el-color-warning-light-5);
      --hover-bg: var(--el-color-warning-light-9);
      --value-color: var(--el-color-warning);
      --bar-color: var(--el-color-warning);
    }
    &.breakdown-withdrawal {
      --hover-color: #b37feb;
      --hover-bg: #f9f0ff;
      --value-color: #722ed1;
      --bar-color: #722ed1;
    }

    .breakdown-label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      line-height: 1;
    }

    .breakdown-value {
      font-size: 20px;
      font-weight: 800;
      color: var(--value-color, var(--el-color-primary));
      line-height: 1.2;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.02em;
    }

    // mini 进度条
    .mini-bar {
      width: 100%;
      height: 4px;
      background-color: var(--el-fill-color);
      border-radius: 9999px;
      overflow: hidden;
      margin: 2px 0;

      .mini-filled {
        height: 100%;
        background-color: var(--bar-color, var(--el-color-primary));
        border-radius: 9999px;
        transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      }
    }
  }

  // 同比标签
  .yoy-tag {
    font-size: 12px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    line-height: 1;

    &.yoy-up {
      color: var(--el-color-success);
    }

    &.yoy-down {
      color: var(--el-color-danger);
    }

    &.yoy-neutral {
      color: var(--el-text-color-secondary);
    }
  }

  // 底部弹性区：等高对齐后的剩余空间，装饰置于其中，结构上不会遮挡统计模块
  .card-footer {
    flex: 1;
    min-height: 0;
    position: relative;
  }
}

// 几何数据光环装饰：默认隐藏，仅桌面端展示（移动端不受影响）
.card-decor {
  display: none;
}

@media (min-width: 768px) {
  .card-decor {
    display: block;
    position: absolute;
    right: 2px; // 与上方统计模块右边缘对齐（= 卡片内边距）
    bottom: 8px;
    width: 104px;
    height: 104px;
    max-width: 100%;
    max-height: 100%;
    pointer-events: none;
    user-select: none;
  }
}

// 光环动效：缓慢反向旋转 + 呼吸
.decor-spin-rev {
  transform-origin: 70px 70px;
  animation: decor-rotate-rev 22s linear infinite;
}

.decor-breathe {
  transform-origin: 70px 70px;
  animation: decor-breathe 4s ease-in-out infinite;
}

@keyframes decor-rotate-rev {
  to { transform: rotate(-360deg); }
}

@keyframes decor-breathe {
  0%, 100% { opacity: 0.75; }
  50% { opacity: 1; }
}

// 移动端
@media (max-width: 767px) {
  .closed-cases-card {
    .total-cell {
      padding: 12px;

      .total-icon {
        width: 32px;
        height: 32px;
        font-size: 16px;
      }

      .total-value {
        font-size: 20px;
      }
    }

    .breakdown-grid {
      gap: 8px;
    }

    .breakdown-cell {
      padding: 12px 6px;

      .breakdown-value {
        font-size: 18px;
      }
    }
  }
}

// 无障碍：尊重减少动画偏好
@media (prefers-reduced-motion: reduce) {
  .total-cell,
  .breakdown-cell {
    transition: none;
  }
  .mini-filled {
    transition: none;
  }
  .decor-spin-rev,
  .decor-breathe {
    animation: none;
  }
}
</style>
