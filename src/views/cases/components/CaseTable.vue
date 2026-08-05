<template>
  <div class="table-section">
    <!-- 标题栏 -->
    <div class="table-title">
      <span class="title-text">
        {{ currentStatus === 'active' ? '在办案件' : '已结案件' }}
        <span class="title-count">共 {{ total }} 条</span>
      </span>
    </div>

    <!-- 表格 -->
    <el-table
      :data="data"
      v-loading="loading"
      style="width: 100%"
      :row-class-name="rowClassName"
    >
      <el-table-column prop="caseNo" label="案件编号" min-width="180">
        <template #default="{ row }">
          <div class="case-no-cell">
            <el-tooltip
              v-if="row.amount >= MAJOR_AMOUNT_THRESHOLD"
              content="重大案件：标的 ≥ 1 亿元"
              placement="top"
              :trigger="['hover', 'focus']"
            >
              <el-icon
                class="major-star"
                tabindex="0"
                role="img"
                aria-label="重大案件：标的 ≥ 1 亿元"
              ><StarFilled /></el-icon>
            </el-tooltip>
            <el-link
              type="primary"
              :underline="false"
              :class="getCaseNoClass(row)"
              @click="goToCaseDetail(row)"
            >
              {{ row.caseNo }}
            </el-link>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="applicant" label="申请人" min-width="140" show-overflow-tooltip />
      <el-table-column prop="respondent" label="被申请人" min-width="140" show-overflow-tooltip />
      <el-table-column prop="caseReason" label="案由" min-width="140" show-overflow-tooltip />
      <el-table-column prop="amount" label="标的（万元）" min-width="120" align="right">
        <template #default="{ row }">
          <span :class="{ 'amount-major': row.amount >= MAJOR_AMOUNT_THRESHOLD }">
            {{ formatAmount(row.amount) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="secretary" label="办案秘书" min-width="100" />
      <el-table-column prop="tribunal" label="仲裁庭" min-width="180" show-overflow-tooltip />
      <el-table-column prop="groupDate" label="组庭日期" min-width="120" />
      <el-table-column prop="hearingDate" label="开庭日期" min-width="120" />
      <el-table-column label="案件审限" min-width="240">
        <template #default="{ row }">
          <div class="deadline-cell">
            <div class="deadline-row">
              <span class="deadline-date">{{ row.deadline }}</span>
              <span class="deadline-days" :class="getDaysClass(row)">
                {{ row.remainDays < 0 ? '已延期' : `剩余 ${row.remainDays} 天` }}
              </span>
            </div>
            <div v-if="row.isSuspended || row.extensionCount > 0" class="deadline-tags">
              <el-tag v-if="row.isSuspended" size="small" type="info" effect="light">已中止</el-tag>
              <el-tag v-if="row.extensionCount > 0" size="small" type="warning" effect="light">
                延期 {{ row.extensionCount }} 次
              </el-tag>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="案件状态" min-width="100">
        <template #default="{ row }">
          <el-tag
            v-if="currentStatus === 'closed' && row.closedType"
            size="small"
            :type="getClosedTypeTag(row.closedType).type"
          >
            {{ getClosedTypeTag(row.closedType).label }}
          </el-tag>
          <el-tag v-else size="small" :type="getStatusTagType(row.caseStatus)">{{ row.caseStatus }}</el-tag>
        </template>
      </el-table-column>
      <template #empty>
        <CaseEmptyState :text="hasActiveFilters ? '暂无匹配数据' : '暂无案件数据'">
          <el-button v-if="hasActiveFilters" type="primary" @click="emit('reset-filters')">清除筛选</el-button>
        </CaseEmptyState>
      </template>
    </el-table>

    <!-- 分页 -->
    <div v-if="total > 0" class="pagination-bar">
      <el-pagination
        v-model:current-page="innerCurrentPage"
        v-model:page-size="innerPageSize"
        :page-sizes="[5, 10, 20]"
        :total="total"
        layout="total, prev, pager, next, sizes"
        background
        small
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { StarFilled } from '@element-plus/icons-vue'
import CaseEmptyState from './shared/CaseEmptyState.vue'
import { MAJOR_AMOUNT_THRESHOLD } from '@/stores/case'

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  currentStatus: {
    type: String,
    required: true,
  },
  total: {
    type: Number,
    default: 0,
  },
  hasActiveFilters: {
    type: Boolean,
    default: false,
  },
  currentPage: {
    type: Number,
    default: 1,
  },
  pageSize: {
    type: Number,
    default: 10,
  },
})

const emit = defineEmits(['update:currentPage', 'update:pageSize', 'reset-filters'])

const router = useRouter()

const innerCurrentPage = computed({
  get: () => props.currentPage,
  set: (val) => emit('update:currentPage', val),
})

const innerPageSize = computed({
  get: () => props.pageSize,
  set: (val) => emit('update:pageSize', val),
})

// 千分位格式化
const formatAmount = (val) => {
  if (val == null) return '-'
  return val.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

// 案号高亮 class
const getCaseNoClass = (row) => {
  if (row.isSuspended) return ''
  if (row.remainDays < 0) return 'case-no-expired'
  if (row.remainDays > 0 && row.remainDays <= 15) return 'case-no-expiring'
  return ''
}

// 审限天数高亮 class
const getDaysClass = (row) => {
  if (row.isSuspended) return ''
  if (row.remainDays < 0) return 'days-expired'
  if (row.remainDays > 0 && row.remainDays <= 15) return 'days-expiring'
  return ''
}

// 状态标签类型（黄色留给「审限紧迫」语义，状态 tag 不使用 warning）
const getStatusTagType = (status) => {
  const typeMap = {
    '审理中': 'primary',
    '已组庭': 'info',
    '待开庭': 'info',
    '已开庭': 'success',
    '已结案': 'success',
  }
  return typeMap[status] || 'info'
}

// 已结案件的结案类型标签
const closedTypeConfig = {
  ruling:     { label: '裁决', type: 'primary' },
  mediation:  { label: '调解', type: 'success' },
  withdraw:   { label: '撤案', type: 'info' },
}
const getClosedTypeTag = (closedType) => {
  return closedTypeConfig[closedType] || { label: closedType || '-', type: 'info' }
}

const rowClassName = ({ row }) => {
  if (row.amount >= MAJOR_AMOUNT_THRESHOLD) return 'row-major'
  return ''
}

const goToCaseDetail = (row) => {
  router.push(`/cases/${row.id}`)
}
</script>

<style scoped lang="scss">
.case-no-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

// 重大案件星星标签
.major-star {
  color: var(--el-color-warning);
  font-size: 14px;
  flex-shrink: 0;
  cursor: help;

  &:focus-visible {
    outline: 2px solid var(--el-color-primary-dark-2);
    outline-offset: 2px;
    border-radius: 2px;
  }
}

// 重大案件标的金额样式
:deep(.amount-major) {
  color: var(--el-color-warning);
  font-weight: 600;
}



.deadline-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .deadline-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }

  .deadline-date {
    color: var(--el-text-color-secondary);
  }

  .deadline-days {
    color: var(--el-text-color-secondary);

    &.days-expiring {
      color: var(--el-color-warning);
      font-weight: 600;
    }

    &.days-expired {
      color: var(--el-color-danger);
      font-weight: 600;
    }
  }

  .deadline-tags {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }
}

// 案号高亮样式（常驻，与筛选无关）
:deep(.case-no-expiring) {
  color: var(--el-color-warning) !important;
}

:deep(.case-no-expired) {
  color: var(--el-color-danger) !important;
}


</style>
