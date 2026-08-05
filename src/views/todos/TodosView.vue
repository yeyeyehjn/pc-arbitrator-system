<template>
  <div class="todos-view">
    <aside class="todos-sidebar" :class="{ collapsed: !sidebarExpanded }">
      <div class="sidebar-title" @click="toggleSidebar">
        <span v-show="sidebarExpanded">待办事项</span>
        <el-icon class="toggle-icon"><Fold v-if="sidebarExpanded" /><Expand v-else /></el-icon>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        :collapse="!sidebarExpanded"
        @select="handleMenuSelect"
      >
        <el-menu-item index="/todos/signature">
          <el-icon><EditPen /></el-icon>
          <span>签名列表</span>
          <el-badge
            v-if="todoStore.counts.signature > 0"
            :value="todoStore.counts.signature"
            class="menu-badge"
          />
        </el-menu-item>
        <el-menu-item index="/todos/center">
          <el-icon><List /></el-icon>
          <span>待办中心</span>
          <el-badge
            v-if="todoStore.counts.center > 0"
            :value="todoStore.counts.center"
            class="menu-badge"
          />
        </el-menu-item>
        <el-menu-item index="/todos/review">
          <el-icon><Document /></el-icon>
          <span>裁决书核阅列表</span>
          <el-badge
            v-if="todoStore.counts.review > 0"
            :value="todoStore.counts.review"
            class="menu-badge"
          />
        </el-menu-item>
        <el-menu-item index="/todos/scheduling">
          <el-icon><Calendar /></el-icon>
          <span>智能约庭</span>
          <span class="suggest-tag">[建议]</span>
        </el-menu-item>
        <el-menu-item index="/todos/consult">
          <el-icon><ChatDotRound /></el-icon>
          <span>专家咨询案件</span>
          <el-badge
            v-if="consultStore.pendingCount > 0"
            :value="consultStore.pendingCount"
            class="menu-badge"
          />
        </el-menu-item>
      </el-menu>
    </aside>
    <section class="todos-content">
      <!-- 移动端抽屉式导航（全局通用组件） -->
      <MobileNavDrawer
        :items="navItems"
        :active-menu="activeMenu"
        drawer-title="待办事项"
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { EditPen, List, Document, Calendar, ChatDotRound, Fold, Expand } from '@element-plus/icons-vue'
import { useTodoStore } from '@/stores/todo'
import { useConsultStore } from '@/stores/consult'
import MobileNavDrawer from '@/components/MobileNavDrawer.vue'

const route = useRoute()
const router = useRouter()
const todoStore = useTodoStore()
const consultStore = useConsultStore()

const sidebarExpanded = ref(true)

const navItems = computed(() => [
  { label: '签名列表', value: '/todos/signature', icon: EditPen, badge: todoStore.counts.signature },
  { label: '待办中心', value: '/todos/center', icon: List, badge: todoStore.counts.center },
  { label: '裁决书核阅列表', value: '/todos/review', icon: Document, badge: todoStore.counts.review },
  { label: '智能约庭', value: '/todos/scheduling', icon: Calendar },
])

const toggleSidebar = () => {
  sidebarExpanded.value = !sidebarExpanded.value
}

const activeMenu = computed(() => route.path)

const handleMenuSelect = (key) => {
  router.push(key)
}

onMounted(() => {
  todoStore.fetchAllCounts()
  consultStore.fetchExpertList()
})
</script>

<style scoped lang="scss">
.todos-view {
  display: flex;
  min-height: calc(100vh - 100px);
  margin: -20px;
}

.todos-content {
  flex: 1;
  padding: 20px;
  background-color: var(--el-bg-color-page);
  overflow: auto;
}

// 移动端布局
@media (max-width: 768px) {
  .todos-view {
    flex-direction: column;
  }

  .todos-sidebar {
    display: none;
  }

  .todos-content {
    padding: 0;
  }

  .page-body {
    padding: 16px;
  }
}
</style>
