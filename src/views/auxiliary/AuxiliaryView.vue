<template>
  <div class="section-card auxiliary-view">
    <h1 class="page-title">辅助功能</h1>
    <el-tabs v-model="activeTab" class="auxiliary-tabs">
      <el-tab-pane label="审理指引" name="guideline">
        <GuidelineList />
      </el-tab-pane>
      <el-tab-pane label="裁决书及案例" name="award">
        <AwardCaseList />
      </el-tab-pane>
      <el-tab-pane label="仲裁员须知" name="notice">
        <NoticeList />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuxiliaryStore } from '@/stores/auxiliary'
import GuidelineList from './components/GuidelineList.vue'
import AwardCaseList from './components/AwardCaseList.vue'
import NoticeList from './components/NoticeList.vue'

const store = useAuxiliaryStore()
const activeTab = ref('guideline')

onMounted(() => {
  store.fetchGuidelines()
  store.fetchAwardCases()
  store.fetchNotices()
})
</script>

<style scoped lang="scss">
.auxiliary-view {
  .page-title {
    margin: 0 0 16px;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .auxiliary-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 16px;
    }
    :deep(.el-tabs__item) {
      font-size: 14px;
      height: 48px;
      line-height: 48px;
    }
    :deep(.el-tabs__item.is-active) {
      color: var(--el-color-primary);
      font-weight: 600;
    }
    :deep(.el-tabs__active-bar) {
      background-color: var(--el-color-primary);
    }
  }
}
</style>
