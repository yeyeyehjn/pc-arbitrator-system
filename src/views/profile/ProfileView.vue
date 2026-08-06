<template>
  <div class="profile-view">
    <aside class="todos-sidebar" :class="{ collapsed: !sidebarExpanded }">
      <div class="sidebar-title" @click="toggleSidebar">
        <span v-show="sidebarExpanded">个人中心</span>
        <el-icon class="toggle-icon"><Fold v-if="sidebarExpanded" /><Expand v-else /></el-icon>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        :collapse="!sidebarExpanded"
        @select="handleMenuSelect"
      >
        <el-menu-item index="/profile/info">
          <el-icon><User /></el-icon>
          <span>个人信息</span>
        </el-menu-item>
        <el-menu-item index="/profile/work">
          <el-icon><OfficeBuilding /></el-icon>
          <span>工作单位</span>
        </el-menu-item>
        <el-menu-item index="/profile/resume">
          <el-icon><Document /></el-icon>
          <span>个人履历</span>
        </el-menu-item>
        <el-menu-item index="/profile/bank">
          <el-icon><CreditCard /></el-icon>
          <span>银行账号信息</span>
        </el-menu-item>
        <el-menu-item index="/profile/certificate">
          <el-icon><Medal /></el-icon>
          <span>仲裁员聘书</span>
        </el-menu-item>
        <el-menu-item index="/profile/fee">
          <el-icon><Money /></el-icon>
          <span>酬金单</span>
        </el-menu-item>
      </el-menu>
    </aside>
    <section class="profile-content">
      <!-- 移动端抽屉式导航（全局通用组件） -->
      <MobileNavDrawer
        :items="navItems"
        :active-menu="activeMenu"
        drawer-title="个人中心"
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
import { User, OfficeBuilding, Document, Money, CreditCard, Medal, Fold, Expand } from '@element-plus/icons-vue'
import MobileNavDrawer from '@/components/MobileNavDrawer.vue'

const route = useRoute()
const router = useRouter()

const sidebarExpanded = ref(true)

const navItems = [
  { label: '个人信息', value: '/profile/info', icon: User },
  { label: '工作单位', value: '/profile/work', icon: OfficeBuilding },
  { label: '个人履历', value: '/profile/resume', icon: Document },
  { label: '银行账号信息', value: '/profile/bank', icon: CreditCard },
  { label: '仲裁员聘书', value: '/profile/certificate', icon: Medal },
  { label: '酬金单', value: '/profile/fee', icon: Money },
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
.profile-view {
  display: flex;
  min-height: calc(100vh - 100px);
  margin: -20px;
}

.profile-content {
  flex: 1;
  min-width: 0; // flex 子项可收缩，防止内部长内容撑开整个布局链
  padding: 20px;
  background-color: var(--el-bg-color-page);
  overflow: auto;

  // 个人中心模块：去掉 section-card 最外层边框
  :deep(.section-card) {
    border: none !important;
    min-width: 0; // 卡片内长内容（身份证号/邮箱等）可收缩，避免溢出
  }
}

// 移动端布局
@media (max-width: 768px) {
  .profile-view {
    flex-direction: column;
  }

  .todos-sidebar {
    display: none;
  }

  .profile-content {
    padding: 0;
  }

  .page-body {
    padding: 16px;
  }
}
</style>
