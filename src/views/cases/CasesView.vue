<template>
  <div class="cases-view">
    <aside class="todos-sidebar" :class="{ collapsed: !sidebarExpanded }">
      <div class="sidebar-title" @click="toggleSidebar">
        <span v-show="sidebarExpanded">我的案件</span>
        <el-icon class="toggle-icon"><Fold v-if="sidebarExpanded" /><Expand v-else /></el-icon>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        :collapse="!sidebarExpanded"
        @select="handleMenuSelect"
      >
        <el-menu-item index="/cases/list">
          <el-icon><Document /></el-icon>
          <span>我的案件</span>
        </el-menu-item>
        <el-menu-item index="/cases/statistics">
          <el-icon><TrendCharts /></el-icon>
          <span>数据统计</span>
        </el-menu-item>
        <el-menu-item index="/cases/consult">
          <el-icon><ChatLineRound /></el-icon>
          <span>申请专家咨询案件</span>
        </el-menu-item>
      </el-menu>
    </aside>
    <section class="cases-content">
      <!-- 移动端抽屉式导航（全局通用组件） -->
      <MobileNavDrawer
        :items="navItems"
        :active-menu="activeMenu"
        drawer-title="我的案件"
        @select="handleMenuSelect"
      />

      <!-- 页面内容 -->
      <div class="page-body">
        <router-view />
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Document, TrendCharts, ChatLineRound, Fold, Expand } from '@element-plus/icons-vue'
import MobileNavDrawer from '@/components/MobileNavDrawer.vue'

const route = useRoute()
const router = useRouter()

const sidebarExpanded = ref(true)

const navItems = [
  { label: '我的案件', value: '/cases/list', icon: Document },
  { label: '数据统计', value: '/cases/statistics', icon: TrendCharts },
  { label: '申请专家咨询案件', value: '/cases/consult', icon: ChatLineRound },
]

const toggleSidebar = () => {
  sidebarExpanded.value = !sidebarExpanded.value
}

const activeMenu = computed(() => route.path)

const handleMenuSelect = (key) => {
  router.push(key)
}
</script>

<style scoped lang="scss">
.cases-view {
  display: flex;
  min-height: calc(100vh - 100px);
  margin: -20px;
}

.cases-content {
  flex: 1;
  padding: 20px;
  background-color: var(--el-bg-color-page);
  overflow: auto;
}

// 移动端布局
@media (max-width: 768px) {
  .cases-view {
    flex-direction: column;
  }

  .todos-sidebar {
    display: none;
  }

  .cases-content {
    padding: 0;
  }

  .page-body {
    padding: 16px;
  }
}
</style>
