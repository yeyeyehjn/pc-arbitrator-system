<template>
  <div class="case-filter-wrapper">
    <div class="filter-bar">
      <!-- 筛选项区（grid 布局，统一对齐） -->
      <div class="filter-items">
        <div class="filter-item">
          <span class="filter-label">案件年份</span>
          <el-select v-model="filters.caseYear" placeholder="全部" clearable>
            <el-option v-for="y in yearOptions" :key="y" :label="y" :value="y" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">案件编号</span>
          <el-input v-model="filters.caseNo" placeholder="请输入案件编号" clearable />
        </div>
        <div class="filter-item">
          <span class="filter-label">当事人</span>
          <el-input v-model="filters.party" placeholder="申请人/被申请人" clearable />
        </div>
        <div class="filter-item">
          <span class="filter-label">办案秘书</span>
          <el-input v-model="filters.secretary" placeholder="请输入办案秘书" clearable />
        </div>
        <div class="filter-item">
          <span class="filter-label">案由</span>
          <el-input v-model="filters.caseReason" placeholder="请输入案由" clearable />
        </div>
        <template v-if="expanded">
          <div class="filter-item">
            <span class="filter-label">代理人</span>
            <el-input v-model="filters.agent" placeholder="请输入代理人" clearable />
          </div>
          <div class="filter-item">
            <span class="filter-label">仲裁庭</span>
            <el-input v-model="filters.tribunal" placeholder="请输入仲裁庭" clearable />
          </div>
          <div class="filter-item">
            <span class="filter-label">结案方式</span>
            <el-select v-model="filters.closedType" placeholder="全部" clearable :disabled="currentStatus === 'active'">
              <el-option label="裁决" value="ruling" />
              <el-option label="调解" value="mediation" />
              <el-option label="撤回" value="withdraw" />
            </el-select>
          </div>
          <div class="filter-item">
            <span class="filter-label">组庭时间</span>
            <el-date-picker
              v-model="filters.groupDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
            />
          </div>
          <div class="filter-item">
            <span class="filter-label">结案时间</span>
            <el-date-picker
              v-model="filters.closedDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              :disabled="currentStatus === 'active'"
            />
          </div>
          <div class="filter-item">
            <span class="filter-label">标的区间</span>
            <el-input-number v-model="filters.amountMin" :min="0" placeholder="最小" controls-position="right" />
            <span class="amount-separator">-</span>
            <el-input-number v-model="filters.amountMax" :min="0" placeholder="最大" controls-position="right" />
            <span class="amount-unit">万元</span>
          </div>
          <div class="filter-item">
            <span class="filter-label">类型</span>
            <el-select v-model="filters.caseType" placeholder="全部" clearable>
              <el-option label="独任" value="solo" />
              <el-option label="首席" value="chief" />
              <el-option label="边裁" value="side" />
            </el-select>
          </div>
        </template>
      </div>

      <!-- 快捷筛选（复选框样式，对齐上方 filter-item 结构） -->
      <div class="filter-item quick-filter">
        <span class="filter-label">快捷筛选</span>
        <el-checkbox
          :model-value="quickFilters.major"
          @change="$emit('toggle-quick-filter', 'major')"
        >
          <span class="quick-option">
            <el-icon class="quick-icon quick-icon-major"><StarFilled /></el-icon>
            <span>重大案件</span>
          </span>
        </el-checkbox>
        <el-checkbox
          :model-value="quickFilters.expiringSoon"
          @change="$emit('toggle-quick-filter', 'expiringSoon')"
        >
          <span class="quick-option">
            <span class="quick-dot dot-expiring"></span>
            <span>即将延期</span>
          </span>
        </el-checkbox>
        <el-checkbox
          :model-value="quickFilters.expired"
          @change="$emit('toggle-quick-filter', 'expired')"
        >
          <span class="quick-option">
            <span class="quick-dot dot-expired"></span>
            <span>已延期</span>
          </span>
        </el-checkbox>
      </div>

      <!-- 操作区：查询、重置、展开/收起 -->
      <div class="filter-actions">
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button link type="primary" class="toggle-btn" @click="expanded = !expanded">
          {{ expanded ? '收起' : '展开' }}
          <el-icon class="toggle-icon"><component :is="expanded ? ArrowUp : ArrowDown" /></el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown, ArrowUp, StarFilled } from '@element-plus/icons-vue'

const props = defineProps({
  filters: {
    type: Object,
    required: true,
  },
  currentStatus: {
    type: String,
    required: true,
  },
  quickFilters: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['search', 'reset', 'toggle-quick-filter'])

const expanded = ref(false)

// 案件年份选项（近5年）
const currentYear = new Date().getFullYear()
const yearOptions = computed(() => {
  const years = []
  for (let y = currentYear; y >= currentYear - 4; y--) {
    years.push(String(y))
  }
  return years
})

const handleSearch = () => {
  if (props.filters.amountMin != null && props.filters.amountMax != null
      && props.filters.amountMin > props.filters.amountMax) {
    ElMessage.warning('标的区间最小值不能大于最大值')
    return
  }
  emit('search')
}

const handleReset = () => {
  emit('reset')
}
</script>

<style scoped lang="scss">
.case-filter-wrapper {
  margin-bottom: 16px;
}

// 筛选项区：grid 布局，统一宽度对齐
.filter-items {
  display: grid !important;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px 20px;
  align-items: center;
  overflow: visible !important;

  .filter-item {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;

    // 控件撑满列宽，统一宽度
    :deep(.el-input),
    :deep(.el-select),
    :deep(.el-date-editor) {
      width: 100%;
      flex: 1;
    }

    :deep(.el-input-number) {
      flex: 1;
      min-width: 0;
    }

    // 标的区间：两个输入框紧凑排列
    &:has(.el-input-number) {
      :deep(.el-input-number) {
        flex: 1;
        min-width: 0;

        .el-input-number__decrease,
        .el-input-number__increase {
          display: none;
        }

        .el-input__inner {
          padding-left: 8px;
          padding-right: 8px;
          text-align: center;
        }
      }
    }
  }
}

// 快捷筛选
.quick-filter {
  gap: 16px;
  padding-top: 16px;
  margin-top: 20px;
  border-top: 1px dashed var(--el-border-color-lighter);

  :deep(.el-checkbox) {
    margin-right: 0;

    .el-checkbox__label {
      font-size: 14px;
      color: var(--el-text-color-regular);
      padding-left: 8px;
    }
  }

  // 选项前缀图标/圆点，颜色与列表对应语义一致（黄=重大/即将延期，红=已延期）
  .quick-option {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .quick-icon {
    font-size: 14px;
    flex-shrink: 0;

    &.quick-icon-major {
      color: var(--el-color-warning);
    }
  }

  .quick-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;

    &.dot-expiring {
      background-color: var(--el-color-warning);
    }

    &.dot-expired {
      background-color: var(--el-color-danger);
    }
  }
}

// 操作区
.filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;

  .toggle-btn {
    margin-left: 4px;

    .toggle-icon {
      margin-left: 2px;
    }
  }
}

.amount-separator {
  color: var(--el-text-color-secondary);
  margin: 0 4px;
  flex-shrink: 0;
}

.amount-unit {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: 4px;
  flex-shrink: 0;
}

// 响应式：窄屏降为 2 列
@media (max-width: 1200px) {
  .filter-items {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
