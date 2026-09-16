<template>
  <div class="detail-header">
    <div class="header-left">
      <!-- 第一行：案件标识 -->
      <div class="header-main">
        <el-tooltip v-if="isMajor" content="重大案件（标的 ≥ 1 亿元）" placement="top">
          <span class="major-star">★</span>
        </el-tooltip>
        <span class="case-no">{{ caseInfo.caseNo }}</span>
        <span class="separator">|</span>
        <span class="case-reason">{{ caseInfo.caseReason }}</span>
        <el-tag :type="statusTagType" size="small" class="status-tag">{{ caseInfo.caseStatus }}</el-tag>
      </div>
      <!-- 案件信息：分栏栅格 -->
      <div class="case-info">
        <div class="info-item">
          <span class="info-label">立案日期</span>
          <span class="info-value">{{ formatDate(caseInfo.filingDate) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">组庭日期</span>
          <span class="info-value">{{ formatDate(caseInfo.groupDate) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">案件审限</span>
          <span class="info-value">
            <template v-if="caseInfo.deadline">
              {{ formatDate(caseInfo.deadline) }}
              <span v-if="remainDaysClass" :class="remainDaysClass">（{{ remainDaysText }}）</span>
            </template>
            <template v-else>暂无</template>
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">标的</span>
          <span class="info-value">{{ amountText }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">仲裁庭</span>
          <span class="info-value">{{ caseInfo.tribunal || '暂无' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">办案秘书</span>
          <span class="info-value">
            {{ caseInfo.secretary || '暂无' }}
            <a
              v-if="caseInfo.secretaryPhone"
              class="meta-link"
              :href="`tel:${caseInfo.secretaryPhone}`"
            ><el-icon :size="12"><Phone /></el-icon>{{ caseInfo.secretaryPhone }}</a>
            <a
              v-if="caseInfo.secretaryEmail"
              class="meta-link"
              :href="`mailto:${caseInfo.secretaryEmail}`"
            ><el-icon :size="12"><Message /></el-icon>{{ caseInfo.secretaryEmail }}</a>
          </span>
        </div>
      </div>
    </div>
    <div class="header-right">
      <el-button plain size="small" :icon="ArrowLeft" @click="goBack">返回</el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Phone, Message } from '@element-plus/icons-vue'
import { MAJOR_AMOUNT_THRESHOLD } from '@/stores/caseDetail'

const props = defineProps({
  caseInfo: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['back'])
const router = useRouter()

const isMajor = computed(() => (props.caseInfo.amount || 0) >= MAJOR_AMOUNT_THRESHOLD)

// 统一日期显示格式：兼容 "2026/09/15"、"2026-09-15"，统一输出 "YYYY-MM-DD"
const formatDate = (val) => {
  if (!val) return '暂无'
  const s = String(val).trim()
  if (!s) return '暂无'
  const m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  return s
}

// store 中 amount 单位为万元，展示时加 ¥ 前缀与“万元”单位并加千分位
const amountText = computed(() => {
  const amount = props.caseInfo.amount
  if (amount === undefined || amount === null) return '暂无'
  return `¥ ${amount.toLocaleString('zh-CN')} 万元`
})

// 审限剩余天数文案（与案件列表的展示规则一致）
const remainDaysText = computed(() => {
  const days = props.caseInfo.remainDays
  if (days === undefined || days === null) return ''
  return days < 0 ? '已延期' : `剩余 ${days} 天`
})

// 审限剩余天数高亮：≤15 天黄色预警，已延期红色
const remainDaysClass = computed(() => {
  const days = props.caseInfo.remainDays
  if (days === undefined || days === null) return ''
  if (days < 0) return 'days-expired'
  if (days <= 15) return 'days-expiring'
  return ''
})

const statusTagType = computed(() => {
  const map = {
    审理中: 'primary',
    已组庭: 'info',
    待开庭: 'warning',
    已开庭: 'success',
    已结案: 'success',
  }
  return map[props.caseInfo.caseStatus] || 'info'
})

const goBack = () => {
  emit('back')
  router.push('/cases')
}
</script>

<style scoped lang="scss">
.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  background-color: #ffffff;
  border-radius: 4px;
  padding: 16px 20px;
  margin-bottom: 16px;

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  .header-main {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;

    .major-star {
      color: #f7ba0a;
      font-size: 16px;
      line-height: 1;
      margin-right: 4px;
    }

    .case-no {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-regular);
    }

    .separator {
      color: #dcdfe6;
      margin: 0 12px;
    }

    .case-reason {
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }

    .status-tag {
      margin-left: 8px;
    }
  }

  // 案件信息分栏栅格：3 列 × 2 行，label 上、value 下
  .case-info {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px 24px;
    margin-top: 4px;

    .info-item {
      display: flex;
      align-items: baseline;
      gap: 8px;
      min-width: 0;
    }

    .info-label {
      flex-shrink: 0;
      width: 76px;
      font-size: 14px;
      color: var(--el-text-color-secondary);
      text-align: left;
    }

    .info-value {
      font-size: 14px;
      color: var(--el-text-color-regular);
      display: inline-flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px 8px;
      white-space: nowrap;
    }

    .meta-link {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      font-size: 14px;
      color: var(--el-color-primary);
      cursor: pointer;
      text-decoration: none;
      transition: color 0.2s;

      .el-icon {
        flex-shrink: 0;
      }

      &:hover {
        color: var(--el-color-primary-light-3);
        text-decoration: underline;
      }
    }

    // 审限剩余天数语义色（与案件列表规则一致）
    .days-expiring {
      color: var(--el-color-warning);
      font-weight: 600;
    }

    .days-expired {
      color: var(--el-color-danger);
      font-weight: 600;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
}

// ============ 移动端（≤768px）：信息栅格收拢为单列，允许换行 ============
@media (max-width: 768px) {
  .detail-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;

    .case-info {
      grid-template-columns: 1fr;
      gap: 6px 0;
    }

    .info-value {
      white-space: normal;
    }

    .header-right {
      width: 100%;

      .el-button {
        width: 100%;
      }
    }
  }
}
</style>
