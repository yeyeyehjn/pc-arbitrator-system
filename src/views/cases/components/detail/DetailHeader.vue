<template>
  <div class="detail-header">
    <div class="header-left">
      <el-tooltip v-if="isMajor" content="重大案件（标的 ≥ 1 亿元）" placement="top">
        <span class="major-star">★</span>
      </el-tooltip>
      <span class="case-no">{{ caseInfo.caseNo }}</span>
      <span class="separator">|</span>
      <span class="case-reason">{{ caseInfo.caseReason }}</span>
      <el-tag :type="statusTagType" size="small" class="status-tag">{{ caseInfo.caseStatus }}</el-tag>
      <span class="separator">|</span>
      <span class="meta-text">立案日期：{{ caseInfo.filingDate }}</span>
      <span class="meta-text">办案秘书：{{ caseInfo.secretary }}</span>
      <a
        v-if="caseInfo.secretaryPhone"
        class="meta-link"
        :href="`tel:${caseInfo.secretaryPhone}`"
      >秘书电话：{{ caseInfo.secretaryPhone }}</a>
      <span v-else class="meta-text">秘书电话：—</span>
      <a
        v-if="caseInfo.secretaryEmail"
        class="meta-link"
        :href="`mailto:${caseInfo.secretaryEmail}`"
      >秘书邮箱：{{ caseInfo.secretaryEmail }}</a>
      <span v-else class="meta-text">秘书邮箱：—</span>
    </div>
    <div class="header-right">
      <el-button plain size="small" :icon="ArrowLeft" @click="goBack">返回</el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
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
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
  border-radius: 4px;
  padding: 16px 20px;
  margin-bottom: 16px;

  .header-left {
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

    .meta-text {
      font-size: 12px;
      color: var(--el-text-color-secondary);

      &:not(:last-child) {
        margin-right: 16px;
      }
    }

    .meta-link {
      font-size: 12px;
      color: var(--el-color-primary);
      cursor: pointer;
      text-decoration: none;
      transition: color 0.2s;

      &:not(:last-child) {
        margin-right: 16px;
      }

      &:hover {
        color: var(--el-color-primary-light-3);
        text-decoration: underline;
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
  }
}
</style>
