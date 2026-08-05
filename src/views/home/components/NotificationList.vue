<template>
  <div class="notification-list">
    <!-- 状态筛选 -->
    <el-tabs v-model="activeTab" class="notification-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="全部" name="全部" />
      <el-tab-pane label="未读" name="未读" />
      <el-tab-pane label="已读" name="已读" />
    </el-tabs>

    <div
      v-for="(notification, index) in pagedNotifications"
      :key="index"
      class="notification-item"
      :class="{ 'is-unread': !notification.read }"
      role="button"
      tabindex="0"
      @click="handleItemClick(notification)"
      @keydown.enter="handleItemClick(notification)"
    >
      <div class="notification-content">
        <el-badge is-dot :hidden="notification.read" class="mr-5" />
        <span class="notification-title">{{ notification.title }}</span>
      </div>
      <span class="notification-time">{{ notification.time }}</span>
    </div>
    <div v-if="filteredNotifications.length === 0" class="empty-notification">
      暂无新消息
    </div>

    <!-- 分页 -->
    <div v-if="filteredNotifications.length > 0" class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[5, 10, 20]"
        :total="filteredNotifications.length"
        layout="total, prev, pager, next"
        background
        small
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const notifications = ref([
  {
    title: '您有一个新的仲裁案件（案件号：2026沪仲案字第005号）待处理',
    time: '5分钟前',
    read: false,
  },
  {
    title: '您提交的案件（2026沪仲案字第003号）延期申请已通过',
    time: '1小时前',
    read: false,
  },
  {
    title: '系统维护通知：仲裁平台将于今日23:00-次日01:00进行维护',
    time: '昨日',
    read: true,
  },
  {
    title: '您有一个新的仲裁案件（案件号：2026沪仲案字第006号）待处理',
    time: '2026-07-14',
    read: false,
  },
])

const activeTab = ref('全部')
const currentPage = ref(1)
const pageSize = ref(5)

// 按状态筛选
const filteredNotifications = computed(() => {
  if (activeTab.value === '全部') return notifications.value
  if (activeTab.value === '未读') return notifications.value.filter((n) => !n.read)
  return notifications.value.filter((n) => n.read)
})

const pagedNotifications = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredNotifications.value.slice(start, start + pageSize.value)
})

const handleTabChange = () => {
  currentPage.value = 1
}

const handleItemClick = (notification) => {
  if (!notification.read) {
    notification.read = true
  }
}

const markAllAsRead = () => {
  notifications.value.forEach(n => (n.read = true))
}

const clearCache = () => {
  notifications.value = []
  console.log('缓存已清除')
}

defineExpose({
  markAllAsRead,
  clearCache,
})
</script>

<style scoped lang="scss">
.notification-list {
  padding: 0 10px;
  .notification-tabs {
    margin-bottom: 8px;
    :deep(.el-tabs__header) {
      margin-bottom: 0;
    }
    :deep(.el-tabs__nav-wrap::after) {
      height: 1px;
      background-color: var(--el-border-color-lighter);
    }
    :deep(.el-tabs__item) {
      font-size: 14px;
      height: 38px;
      line-height: 38px;
    }
  }
  .notification-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 10px;
    margin: 0 -10px;
    border-radius: 6px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    transition: background-color 0.2s ease;
    cursor: pointer;

    &:last-child {
      border-bottom: none;
    }
    &:hover,
    &:focus-visible {
      background-color: #F5F7FA;
      outline: none;
    }
    &.is-unread .notification-title {
      color: var(--el-text-color-primary);
      font-weight: 600;
    }

    .notification-content {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
      .notification-title {
        font-size: 14px;
        color: var(--el-text-color-regular);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
    .notification-time {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      flex-shrink: 0;
      margin-left: 12px;
    }
  }
  .empty-notification {
    text-align: center;
    color: var(--el-text-color-regular);
    padding: 30px 0;
    font-size: 12px;
  }
  .pagination-wrapper {
    display: flex;
    justify-content: flex-start;
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
  .mr-5 {
    margin-right: 8px;
  }
}
</style>
