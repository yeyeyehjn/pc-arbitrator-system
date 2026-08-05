<template>
  <!-- 移动端顶栏：汉堡按钮 + 当前模块标题 -->
  <div class="mobile-nav-bar">
    <button class="hamburger-btn" @click="drawerVisible = true" aria-label="打开菜单">
      <el-icon><Menu /></el-icon>
    </button>
    <span class="mobile-nav-title">{{ currentTitle }}</span>
  </div>

  <!-- 移动端抽屉式导航 -->
  <el-drawer
    v-model="drawerVisible"
    direction="ltr"
    size="75%"
    :with-header="false"
    class="mobile-nav-drawer"
  >
    <div class="drawer-content">
      <div class="drawer-header">
        <span class="drawer-title">{{ drawerTitle }}</span>
        <button class="drawer-close" @click="drawerVisible = false" aria-label="关闭">
          <el-icon><Close /></el-icon>
        </button>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="drawer-menu"
        @select="handleSelect"
      >
        <el-menu-item
          v-for="item in items"
          :key="item.value"
          :index="item.value"
        >
          <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
          <el-badge
            v-if="item.badge && item.badge > 0"
            :value="item.badge"
            class="menu-badge"
          />
        </el-menu-item>
      </el-menu>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Menu, Close } from '@element-plus/icons-vue'

const props = defineProps({
  // 菜单项：[{ label, value, icon, badge? }]
  items: {
    type: Array,
    required: true,
  },
  // 当前激活菜单 index（路由 path）
  activeMenu: {
    type: String,
    required: true,
  },
  // 抽屉标题
  drawerTitle: {
    type: String,
    default: '导航菜单',
  },
})

const emit = defineEmits(['select'])

const drawerVisible = ref(false)

const currentTitle = computed(() => {
  const matched = props.items.find((item) => props.activeMenu.startsWith(item.value))
  return matched ? matched.label : (props.items[0]?.label || '')
})

const handleSelect = (key) => {
  emit('select', key)
  drawerVisible.value = false
}
</script>

<style lang="scss">
/* ========== 全局移动端抽屉导航样式规范 ========== */
/* 桌面端隐藏，仅 ≤768px 显示 */

// 桌面端：隐藏顶栏
.mobile-nav-bar {
  display: none;
}
@media (max-width: 768px) {
  .mobile-nav-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background-color: #ffffff;
    border-bottom: 1px solid #ebeef5;
    position: sticky;
    top: 0;
    z-index: 10;

    .hamburger-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 8px;
      background-color: #f5f7fa;
      color: #303133;
      font-size: 20px;
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:active {
        background-color: #e4e7ed;
      }
    }

    .mobile-nav-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }
}

/* 抽屉内部样式（非 scoped，覆盖 el-drawer） */
.mobile-nav-drawer {
  .el-drawer__body {
    padding: 0;
  }

  .drawer-content {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;

    .drawer-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }

    .drawer-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 8px;
      background-color: #f5f7fa;
      color: #606266;
      font-size: 18px;
      cursor: pointer;

      &:active {
        background-color: #e4e7ed;
      }
    }
  }

  .drawer-menu {
    flex: 1;
    border-right: none;
    padding: 8px 0;

    .el-menu-item {
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

      .menu-badge {
        margin-left: 8px;
      }

      &:hover:not(.is-active) {
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

        // 3px 选中态指示器（与全局 MainLayout 抽屉、统计卡一致）
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
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .mobile-nav-drawer .el-menu-item,
  .mobile-nav-drawer .el-menu-item .el-icon {
    transition: none;
  }
}
</style>
