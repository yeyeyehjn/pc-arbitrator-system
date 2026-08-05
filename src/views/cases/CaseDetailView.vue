<template>
  <div class="case-detail-view" v-loading="store.loading">
    <!-- 案件不存在的兜底 -->
    <CaseEmptyState v-if="!store.caseInfo.id" text="案件不存在或已归档">
      <el-button type="primary" @click="goBack">返回案件列表</el-button>
    </CaseEmptyState>

    <template v-else>
      <!-- 头部常驻区 -->
      <DetailHeader :case-info="store.caseInfo" @back="goBack" />

      <!-- Tab 导航 -->
      <el-tabs v-model="store.activeTab" class="detail-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="办案" name="work">
          <WorkTab :case-id="store.currentCaseId" @switch-tab="handleSwitchTab" @copy-to-editor="handleCopyToEditor" />
        </el-tab-pane>
        <el-tab-pane label="案情及当事人材料" name="info">
          <InfoTab :case-info="store.caseInfo" :parties="store.parties" :claims="store.claims" :evidence="store.evidence" :attachments="store.attachments" />
        </el-tab-pane>
        <el-tab-pane label="仲裁文书" name="docs">
          <DocsTab :case-id="store.currentCaseId" />
        </el-tab-pane>
        <el-tab-pane label="电子送达" name="service">
          <ServiceTab :services="store.services" />
        </el-tab-pane>
      </el-tabs>
    </template>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useCaseDetailStore } from '@/stores/caseDetail'
import CaseEmptyState from './components/shared/CaseEmptyState.vue'
import DetailHeader from './components/detail/DetailHeader.vue'
import WorkTab from './components/detail/WorkTab.vue'
import InfoTab from './components/detail/InfoTab.vue'
import DocsTab from './components/detail/DocsTab.vue'
import ServiceTab from './components/detail/ServiceTab.vue'

const route = useRoute()
const router = useRouter()
const store = useCaseDetailStore()

const goBack = () => {
  router.push('/cases')
}

const handleTabChange = (tabName) => {
  store.switchTab(tabName)
}

const handleSwitchTab = (tabName) => {
  store.switchTab(tabName)
}

const handleCopyToEditor = () => {
  ElMessage.success('已复制，请到仲裁文书 Tab 粘贴')
  store.switchTab('docs')
}

const loadDetail = (caseId) => {
  if (caseId) {
    store.fetchCaseDetail(caseId)
  }
}

onMounted(() => {
  loadDetail(route.params.id)
})

watch(
  () => route.params.id,
  (newId) => {
    loadDetail(newId)
  }
)
</script>

<style scoped lang="scss">
.case-detail-view {
  padding-bottom: 20px;
  min-height: 60vh;
}

.detail-tabs {
  background-color: #ffffff;
  border-radius: 4px;
  padding: 0 20px 20px;

  :deep(.el-tabs__header) {
    margin-bottom: 16px;
  }

  :deep(.el-tabs__item) {
    font-size: 14px;
    height: 48px;
    line-height: 48px;
  }

  :deep(.el-tabs__active-bar) {
    background-color: var(--el-color-primary);
  }

  :deep(.el-tabs__item.is-active) {
    color: var(--el-color-primary);
    font-weight: 600;
  }
}
</style>
