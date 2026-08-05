<template>
  <el-container class="common-layout">
    <el-header class="main-header">
      <div class="header-left">
        <img src="/tu/bt-st.png" alt="Logo" class="logo" />
        <el-icon class="mobile-menu-toggle" @click="drawerVisible = true"><Menu /></el-icon>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="el-menu-demo"
        mode="horizontal"
        :ellipsis="false"
        @select="handleMenuSelect"
      >
        <el-menu-item index="/">首页</el-menu-item>
        <el-menu-item index="/cases">我的案件</el-menu-item>
        <el-menu-item index="/todos">待办事项</el-menu-item>
        <el-menu-item index="/profile">个人中心</el-menu-item>
      </el-menu>
      <div class="header-right">
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99" class="notification-badge">
          <el-icon
            class="notification-icon"
            :size="20"
            aria-label="消息通知"
            role="button"
            tabindex="0"
            @click="goToNotifications"
            @keydown.enter="goToNotifications"
          >
            <Bell />
          </el-icon>
        </el-badge>
        <el-dropdown @command="handleCommand">
          <span class="el-dropdown-link">
            {{ authStore.user?.name || '用户' }} {{ authStore.user?.role || '' }}<el-icon class="el-icon--right"><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="auxiliary">辅助功能</el-dropdown-item>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    <el-main class="main-content-wrapper">
      <div class="main-content-container">
        <router-view />
      </div>
    </el-main>
  </el-container>

  <!-- 移动端抽屉菜单 -->
  <el-drawer
    v-model="drawerVisible"
    direction="ltr"
    size="320px"
    :show-close="false"
    :with-header="false"
    class="mobile-drawer"
  >
    <div class="drawer-header">
      <div class="drawer-avatar" aria-hidden="true">{{ (authStore.user?.name || '用户').charAt(0) }}</div>
      <div class="drawer-user-block">
        <span class="drawer-user-name">{{ authStore.user?.name || '用户' }}</span>
        <span class="drawer-user-role">{{ authStore.user?.role || '' }}</span>
      </div>
      <el-icon
        class="drawer-close"
        aria-label="关闭菜单"
        role="button"
        tabindex="0"
        @click="drawerVisible = false"
        @keydown.enter="drawerVisible = false"
      ><Close /></el-icon>
    </div>
    <el-menu
      :default-active="activeMenu"
      @select="handleDrawerMenuSelect"
    >
      <el-menu-item index="/">
        <el-icon><HomeFilled /></el-icon>
        <span>首页</span>
      </el-menu-item>
      <el-menu-item index="/cases">
        <el-icon><Document /></el-icon>
        <span>我的案件</span>
      </el-menu-item>
      <el-menu-item index="/todos">
        <el-icon><List /></el-icon>
        <span>待办事项</span>
      </el-menu-item>
      <el-menu-item index="/profile">
        <el-icon><User /></el-icon>
        <span>个人中心</span>
      </el-menu-item>
      <el-menu-item index="/auxiliary">
        <el-icon><Reading /></el-icon>
        <span>辅助功能</span>
      </el-menu-item>
      <li class="drawer-divider" role="separator" aria-hidden="true"></li>
      <el-menu-item index="logout" class="logout-item">
        <el-icon><SwitchButton /></el-icon>
        <span>退出登录</span>
      </el-menu-item>
    </el-menu>
  </el-drawer>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowDown, Bell, Menu, Close, HomeFilled, Document, List, User, SwitchButton, Reading } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Mock 未读消息数，待接入接口后替换
const unreadCount = ref(3)
const drawerVisible = ref(false)

function resolveActiveMenu(path) {
  const menuPaths = ['/', '/cases', '/todos', '/profile']
  if (menuPaths.includes(path)) return path
  // 匹配最长前缀
  return menuPaths
    .filter((p) => p !== '/' && path.startsWith(p + '/'))
    .sort((a, b) => b.length - a.length)[0] || '/'
}

const activeMenu = ref(resolveActiveMenu(route.path))

watch(
  () => route.path,
  (newPath) => {
    activeMenu.value = resolveActiveMenu(newPath)
  }
)

const handleMenuSelect = (key) => {
  router.push(key)
}

const handleDrawerMenuSelect = (key) => {
  drawerVisible.value = false
  if (key === 'logout') {
    authStore.logout()
    router.push('/login')
  } else {
    router.push(key)
  }
}

const handleCommand = (command) => {
  if (command === 'logout') {
    authStore.logout()
    router.push('/login')
  } else if (command === 'auxiliary') {
    router.push('/auxiliary')
  }
}

const goToNotifications = () => {
  router.push('/notifications')
}
</script>

<style lang="scss" scoped>
.common-layout {
  min-height: 100vh;
  background-color: var(--el-bg-color-page);
}

.main-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--el-color-white);
  box-shadow: none; /* Ensure no shadow */
  padding: 0 20px; /* Add some padding */

  .header-left {
    display: flex;
    align-items: center;
    .logo {
      height: 32px;
      margin-right: 10px;
    }
    .system-title {
      font-size: 18px;
      font-weight: bold;
      color: var(--el-text-color-primary);
    }
  }

  .el-menu-demo {
    flex-grow: 1;
    justify-content: center;
    border-bottom: none; /* Remove default bottom border */

    .el-menu-item {
      height: 60px;
      line-height: 60px;
      font-size: 16px;
      color: var(--el-text-color-secondary);

      &.is-active {
        color: var(--el-color-primary);
        border-bottom: 2px solid var(--el-color-primary);
      }
      &:not(.is-active):hover {
        color: var(--el-color-primary-light-3);
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;

    .notification-badge {
      display: inline-flex;
      align-items: center;
    }
    .notification-icon {
      cursor: pointer;
      color: var(--el-text-color-regular);
      transition: color 0.2s ease;
      &:hover,
      &:focus-visible {
        color: var(--el-color-primary);
        outline: none;
      }
    }

    .el-dropdown-link {
      cursor: pointer;
      color: var(--el-text-color-regular);
      display: flex;
      align-items: center;
    }
  }
}

.main-content-wrapper {
  padding: 20px;
  .main-content-container {
    max-width: 1440px;
    margin: 0 auto;
  }
}

/* 移动端菜单图标 */
.mobile-menu-toggle {
  display: none;
  font-size: 22px;
  cursor: pointer;
  color: var(--el-text-color-regular);
  margin-left: 10px;
}

/* 响应式：移动端隐藏水平菜单，显示菜单图标 */
@media (max-width: 768px) {
  .main-header {
    .el-menu-demo {
      display: none;
    }
    .mobile-menu-toggle {
      display: flex;
      align-items: center;
    }
    .header-right .el-dropdown-link {
      display: none;
    }
  }

  .main-content-wrapper {
    padding: 12px;
  }
}
</style>

<!-- 非 scoped 样式块：el-drawer 通过 teleport 挂载到 body，scoped 的 data-v 属性不会传递到
     teleport 后的 DOM 节点，导致 :deep() 选择器（编译为 .mobile-drawer[data-v-xxx] ...）
     无法匹配。改用非 scoped 块 + .mobile-drawer 类名限定，确保样式只作用于移动端导航抽屉，
     不影响其他 el-drawer 实例。 -->
<style lang="scss">
.mobile-drawer.el-drawer:not(.is-fullscreen) {
  width: min(320px, 82vw) !important;
}

.mobile-drawer .el-drawer__body {
  padding-top: 0;
  padding-bottom: 0;
  padding-left: 0;
  padding-right: 0;
}

.mobile-drawer .drawer-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px 18px;
  background-color: var(--el-color-primary);
  color: #fff;

  .drawer-avatar {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.18);
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .drawer-user-block {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;

    .drawer-user-name {
      font-size: 16px;
      font-weight: 600;
      line-height: 1.3;
      color: #fff;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .drawer-user-role {
      font-size: 12px;
      line-height: 1.3;
      color: rgba(255, 255, 255, 0.85);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .drawer-close {
    font-size: 20px;
    color: #fff;
    cursor: pointer;
    flex-shrink: 0;

    &:hover,
    &:focus-visible {
      color: rgba(255, 255, 255, 0.7);
      outline: none;
    }
  }
}

.mobile-drawer .el-menu {
  border-right: none;
  padding: 8px 0;
}

.mobile-drawer .el-menu-item {
  height: 52px;
  line-height: 52px;
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  margin: 2px 12px;
  border-radius: 6px;
  padding-left: 16px !important;
  position: relative;
  transition: background-color 0.2s ease, color 0.2s ease;

  .el-icon {
    font-size: 18px;
    margin-right: 12px;
    color: var(--el-text-color-secondary);
    transition: color 0.2s ease;
  }

  &:hover:not(.is-active):not(.logout-item) {
    background-color: #f5f7fa;
    color: var(--el-text-color-primary);

    .el-icon {
      color: var(--el-text-color-primary);
    }
  }

  &.is-active {
    color: var(--el-color-primary);
    font-weight: 600;
    background-color: #f2f5fa;

    .el-icon {
      color: var(--el-color-primary);
    }

    /* 3px 选中态指示器：DESIGN.md §4.6.1 登记的品牌系统例外，与 .todos-sidebar / 统计卡一致 */
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      bottom: 8px;
      width: 3px;
      border-radius: 0 2px 2px 0;
      background-color: var(--el-color-primary);
    }
  }

  &.logout-item {
    color: var(--el-color-danger);

    .el-icon {
      color: var(--el-color-danger);
    }

    &:hover {
      background-color: #fef0f0;
      color: var(--el-color-danger);
    }
  }
}

.mobile-drawer .drawer-divider {
  height: 1px;
  margin: 8px 16px;
  background-color: var(--el-border-color-lighter);
  list-style: none;
}

@media (prefers-reduced-motion: reduce) {
  .mobile-drawer .el-menu-item,
  .mobile-drawer .el-menu-item .el-icon {
    transition: none;
  }
}
</style>
