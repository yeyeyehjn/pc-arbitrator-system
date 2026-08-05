<template>
  <div class="consult-detail-view" v-loading="consultStore.loading">
    <!-- 不存在兜底 -->
    <CaseEmptyState v-if="!consultStore.currentDetail" text="咨询记录不存在" />

    <template v-else>
      <!-- 返回栏 + 标题 -->
      <div class="section-card detail-header">
        <div class="header-left">
          <el-button plain size="small" :icon="ArrowLeft" @click="goBack">返回</el-button>
          <span class="detail-title">{{ consultStore.currentDetail.title }}</span>
          <el-tag size="small">{{ getSpecialtyLabel(consultStore.currentDetail.specialty) }}</el-tag>
        </div>
        <div class="header-meta">
          关联案件：{{ consultStore.currentDetail.relatedCaseNo }}
        </div>
      </div>

      <!-- 区块1：咨询信息 -->
      <ConsultInfo :detail="consultStore.currentDetail" />

      <!-- 区块2：专家回复意见（申请人查看的核心内容） -->
      <ConsultOpinion :opinions="consultStore.currentDetail.opinions" />
    </template>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useConsultStore, getSpecialtyLabel } from '@/stores/consult'
import CaseEmptyState from '../shared/CaseEmptyState.vue'
import ConsultInfo from '../shared/consult/ConsultInfo.vue'
import ConsultOpinion from '../shared/consult/ConsultOpinion.vue'

const route = useRoute()
const router = useRouter()
const consultStore = useConsultStore()

const goBack = () => {
  router.push('/cases/consult')
}

onMounted(() => {
  consultStore.fetchDetail(route.params.id, 'applicant')
})
</script>

<style scoped lang="scss">
.detail-header {
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    .detail-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
  .header-meta {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 8px;
  }
}
</style>
