<template>
  <div class="consult-detail-view" v-loading="consultStore.loading">
    <!-- 不存在兜底 -->
    <TodoEmptyState v-if="!consultStore.currentDetail" text="咨询案件不存在或已归档" />

    <template v-else>
      <!-- 返回栏 + 标题状态 -->
      <div class="section-card detail-header">
        <div class="header-left">
          <el-button plain size="small" :icon="ArrowLeft" @click="goBack">返回</el-button>
          <span class="detail-title">{{ consultStore.currentDetail.title }}</span>
          <el-tag :type="getStatusConfig(consultStore.currentDetail.status).tagType" size="small">
            {{ getStatusConfig(consultStore.currentDetail.status).label }}
          </el-tag>
        </div>
        <!-- pending 状态操作按钮 -->
        <div v-if="consultStore.currentDetail.status === 'pending'" class="header-actions">
          <el-button type="primary" @click="signDialogVisible = true">回避 / 接受咨询</el-button>
          <el-button type="danger" plain @click="handleExit">退出咨询</el-button>
        </div>
      </div>

      <!-- 区块1：咨询信息 -->
      <ConsultInfo :detail="consultStore.currentDetail" />

      <!-- 区块2：专家回复意见（pending 不显示） -->
      <ConsultOpinion v-if="consultStore.currentDetail.status !== 'pending'" :opinions="consultStore.currentDetail.opinions" />

      <!-- 区块3：发表意见（unreplied/processed 均可发表） -->
      <ConsultEditor
        v-if="consultStore.currentDetail.status !== 'pending'"
        :detail="consultStore.currentDetail"
        @submit-opinion="handleSubmitOpinion"
        @exit="handleExit"
      />
    </template>

    <!-- 签署弹窗 -->
    <SignCommitmentDialog
      v-model:visible="signDialogVisible"
      @signed="handleSigned"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useConsultStore, getStatusConfig } from '@/stores/consult'
import TodoEmptyState from '../shared/TodoEmptyState.vue'
import ConsultInfo from '@/views/cases/components/shared/consult/ConsultInfo.vue'
import ConsultOpinion from '@/views/cases/components/shared/consult/ConsultOpinion.vue'
import ConsultEditor from '@/views/cases/components/shared/consult/ConsultEditor.vue'
import SignCommitmentDialog from '@/views/cases/components/shared/consult/SignCommitmentDialog.vue'

const route = useRoute()
const router = useRouter()
const consultStore = useConsultStore()

const signDialogVisible = ref(false)

const goBack = () => {
  router.push('/todos/consult')
}

const handleSubmitOpinion = async ({ content, attachments }) => {
  await consultStore.submitOpinion(route.params.id, { content, attachments })
  ElMessage.success('意见已提交')
}

const handleSigned = async ({ method, decision }) => {
  await consultStore.submitSign(route.params.id, { method, decision })
  ElMessage.success(decision === 'accept' ? '已接受咨询，请回复意见' : '已回避咨询')
}

const handleExit = async () => {
  await ElMessageBox.confirm('确定退出本次咨询？', '退出咨询', {
    confirmButtonText: '退出咨询',
    cancelButtonText: '取消',
    type: 'warning',
  })
  await consultStore.exitConsult(route.params.id)
  ElMessage.success('已退出咨询')
  goBack()
}

onMounted(() => {
  consultStore.fetchDetail(route.params.id, 'expert')
})
</script>

<style scoped lang="scss">
.detail-header {
  display: flex;
  align-items: center;
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
  .header-actions {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }
}
</style>
