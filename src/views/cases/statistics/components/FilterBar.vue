<template>
  <div class="filter-bar">
    <!-- 桌面端：完整筛选条 -->
    <div class="filter-bar-desktop">
      <div class="filter-bar-header">
        <h2 class="filter-title">数据统计</h2>
        <span class="range-summary">{{ store.rangeSummary }}</span>
      </div>
      <div class="filter-bar-body">
        <el-radio-group
          :model-value="store.preset || ''"
          class="preset-group"
          @change="handlePresetChange"
        >
          <el-radio-button value="year">今年</el-radio-button>
          <el-radio-button value="halfYear">近半年</el-radio-button>
          <el-radio-button value="threeMonths">近三个月</el-radio-button>
        </el-radio-group>

        <div class="date-range">
          <el-date-picker
            v-model="localStartDate"
            type="date"
            placeholder="起始日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            class="date-picker"
            @change="handleDateChange"
          />
          <span class="date-separator">~</span>
          <el-date-picker
            v-model="localEndDate"
            type="date"
            placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            class="date-picker"
            @change="handleDateChange"
          />
        </div>

        <el-button
          link
          type="primary"
          class="clear-btn"
          @click="handleClear"
        >
          <el-icon class="clear-icon"><RefreshLeft /></el-icon>
          <span>清除筛选</span>
        </el-button>
      </div>
    </div>

    <!-- 移动端：筛选摘要条 + 展开抽屉 -->
    <div class="filter-bar-mobile">
      <div class="filter-summary" @click="drawerVisible = true">
        <div class="summary-text">
          <span class="summary-label">筛选：</span>
          <span class="summary-value">{{ mobileSummaryText }}</span>
        </div>
        <el-icon class="expand-icon"><ArrowDown /></el-icon>
      </div>

      <el-drawer
        v-model="drawerVisible"
        title="筛选条件"
        direction="btt"
        size="90%"
        class="filter-drawer"
      >
        <div class="drawer-content">
          <div class="drawer-section">
            <div class="drawer-label">快捷筛选</div>
            <el-radio-group
              :model-value="store.preset || ''"
              class="preset-group"
              @change="handlePresetChange"
            >
              <el-radio-button value="year">今年</el-radio-button>
              <el-radio-button value="halfYear">近半年</el-radio-button>
              <el-radio-button value="threeMonths">近三个月</el-radio-button>
            </el-radio-group>
          </div>

          <div class="drawer-section">
            <div class="drawer-label">自定义日期范围</div>
            <div class="date-range-vertical">
              <el-date-picker
                v-model="localStartDate"
                type="date"
                placeholder="起始日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                @change="handleDateChange"
              />
              <span class="date-separator">~</span>
              <el-date-picker
                v-model="localEndDate"
                type="date"
                placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                @change="handleDateChange"
              />
            </div>
          </div>

          <div class="drawer-actions">
            <el-button @click="drawerVisible = false">取消</el-button>
            <el-button type="primary" @click="confirmMobileFilter">确认</el-button>
          </div>
        </div>
      </el-drawer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { RefreshLeft, ArrowDown } from '@element-plus/icons-vue'
import { useStatisticsStore } from '@/stores/statistics'

const store = useStatisticsStore()

const localStartDate = ref(store.dateRange.start)
const localEndDate = ref(store.dateRange.end)
const drawerVisible = ref(false)

// 同步 store → local
watch(
  () => store.dateRange,
  (range) => {
    localStartDate.value = range.start
    localEndDate.value = range.end
  },
  { deep: true }
)

// 预设切换
const handlePresetChange = (value) => {
  store.setPreset(value)
}

// 自定义日期变更
const handleDateChange = () => {
  if (localStartDate.value && localEndDate.value) {
    store.setCustomRange(localStartDate.value, localEndDate.value)
  }
}

// 清除筛选
const handleClear = () => {
  store.clearFilters()
}

// 移动端确认
const confirmMobileFilter = () => {
  handleDateChange()
  drawerVisible.value = false
}

// 移动端摘要文案
const mobileSummaryText = computed(() => {
  const presetMap = { year: '今年', halfYear: '近半年', threeMonths: '近三个月' }
  if (store.preset && presetMap[store.preset]) {
    return `${presetMap[store.preset]} · ${store.rangeSummary || ''}`
  }
  return store.rangeSummary || '请选择日期范围'
})
</script>

<style scoped lang="scss">
.filter-bar {
  background-color: var(--el-bg-color);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid var(--el-border-color-lighter);
}

// 桌面端
.filter-bar-desktop {
  display: block;

  .filter-bar-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 16px;

    .filter-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .range-summary {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .filter-bar-body {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;

    .preset-group {
      :deep(.el-radio-button__inner) {
        font-size: 12px;
        padding: 8px 16px;
      }
    }

    .date-range {
      display: flex;
      align-items: center;
      gap: 8px;

      .date-picker {
        width: 160px;

        :deep(.el-input__wrapper) {
          font-size: 12px;
        }
      }

      .date-separator {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }

    .clear-btn {
      margin-left: auto;
      font-size: 12px;

      .clear-icon {
        margin-right: 4px;
      }
    }
  }
}

// 移动端
.filter-bar-mobile {
  display: none;
}

.filter-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: var(--el-fill-color-light);
  border-radius: 6px;
  cursor: pointer;

  .summary-text {
    display: flex;
    align-items: baseline;
    gap: 4px;
    overflow: hidden;

    .summary-label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      flex-shrink: 0;
    }

    .summary-value {
      font-size: 12px;
      color: var(--el-text-color-regular);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .expand-icon {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    flex-shrink: 0;
  }
}

.filter-drawer {
  .drawer-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 8px 0;
  }

  .drawer-section {
    .drawer-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      margin-bottom: 12px;
    }
  }

  .date-range-vertical {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .date-separator {
      text-align: center;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .drawer-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 16px;
  }
}

// 响应式：≤768px 切换为移动端抽屉
@media (max-width: 768px) {
  .filter-bar-desktop {
    display: none;
  }

  .filter-bar-mobile {
    display: block;
  }
}
</style>
