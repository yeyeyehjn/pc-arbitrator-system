<template>
  <div class="case-filter-wrapper">
    <div class="filter-bar">
      <div class="filter-items" :class="{ collapsed: !expanded }">
        <div class="filter-item">
          <span class="filter-label">案号</span>
          <el-input v-model="filters.caseNo" placeholder="请输入案号" clearable />
        </div>
        <div class="filter-item">
          <span class="filter-label">申请人</span>
          <el-input v-model="filters.applicant" placeholder="请输入申请人" clearable />
        </div>
        <div class="filter-item">
          <span class="filter-label">被申请人</span>
          <el-input v-model="filters.respondent" placeholder="请输入被申请人" clearable />
        </div>
        <div class="filter-item">
          <span class="filter-label">案由</span>
          <el-input v-model="filters.caseReason" placeholder="请输入案由" clearable />
        </div>
        <div class="filter-item">
          <span class="filter-label">办案秘书</span>
          <el-input v-model="filters.secretary" placeholder="请输入办案秘书" clearable />
        </div>
        <template v-if="expanded">
          <div class="filter-item">
            <span class="filter-label">标的区间</span>
            <el-input-number v-model="filters.amountMin" :min="0" placeholder="最小" controls-position="right" style="width: 120px" />
            <span class="amount-separator">-</span>
            <el-input-number v-model="filters.amountMax" :min="0" placeholder="最大" controls-position="right" style="width: 120px" />
          </div>
          <div class="filter-item">
            <span class="filter-label">开庭日期</span>
            <el-date-picker v-model="filters.hearingDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 180px" />
          </div>
          <div class="filter-item">
            <span class="filter-label">类型</span>
            <el-select v-model="filters.caseType" placeholder="全部" clearable style="width: 120px">
              <el-option label="独任" value="solo" />
              <el-option label="首席" value="chief" />
              <el-option label="边裁" value="side" />
            </el-select>
          </div>
          <div class="filter-item">
            <span class="filter-label">结案类型</span>
            <el-select v-model="filters.closedType" placeholder="全部" clearable :disabled="currentStatus === 'active'" style="width: 120px">
              <el-option label="裁决" value="ruling" />
              <el-option label="调解" value="mediation" />
              <el-option label="撤案" value="withdraw" />
            </el-select>
          </div>
        </template>
        <div class="flex-grow"></div>
        <el-button link type="primary" class="toggle-btn" @click="expanded = !expanded">
          {{ expanded ? '收起' : '展开' }}
          <el-icon class="toggle-icon"><component :is="expanded ? ArrowUp : ArrowDown" /></el-icon>
        </el-button>
      </div>

      <!-- 快捷筛选（芯片样式，对齐上方 filter-item 结构） -->
      <div class="filter-item quick-filter">
        <span class="filter-label">快捷筛选</span>
        <el-check-tag
          :checked="quickFilters.major"
          @change="$emit('toggle-quick-filter', 'major')"
        >
          重大案件
        </el-check-tag>
        <el-check-tag
          :checked="quickFilters.expiringSoon"
          @change="$emit('toggle-quick-filter', 'expiringSoon')"
        >
          即将延期
        </el-check-tag>
        <el-check-tag
          :checked="quickFilters.expired"
          @change="$emit('toggle-quick-filter', 'expired')"
        >
          已延期
        </el-check-tag>
      </div>

      <div class="filter-actions">
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue'

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

// 快捷筛选：复用 .filter-item 结构，与上方筛选项对齐
.quick-filter {
  gap: 12px;
  padding-top: 12px;
  margin-top: 4px;
  border-top: 1px dashed var(--el-border-color-lighter);

  :deep(.el-check-tag) {
    font-weight: 400;
    margin-right: 0;
    height: 28px;
    line-height: 26px;
    padding: 0 12px;
    font-size: 12px;
    border-radius: 4px;
    border: 1px solid var(--el-border-color);
    background-color: var(--el-bg-color);
    color: var(--el-text-color-regular);
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      color: var(--el-color-primary-light-3);
    }

    &.is-checked {
      background-color: var(--el-color-primary);
      border-color: var(--el-color-primary);
      color: var(--el-color-white);
    }
  }
}
</style>
