<template>
  <div class="notifications-view">
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-fields">
        <div class="filter-item">
          <span class="filter-label">消息状态</span>
          <el-select v-model="filters.status" placeholder="全部" clearable>
            <el-option label="未读" value="unread" />
            <el-option label="已读" value="read" />
          </el-select>
        </div>
      </div>
      <div class="filter-actions">
        <el-button type="primary" plain @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </div>

    <!-- 列表 -->
    <div class="table-section">
      <div class="table-title">
        <span>消息通知列表</span>
        <el-link type="primary" :underline="false" @click="markAllAsRead">全部标为已读</el-link>
      </div>

      <el-table :data="pagedData" style="width: 100%">
        <el-table-column prop="content" label="消息内容" min-width="320">
          <template #default="scope">
            <div class="message-content" :class="{ 'is-unread': !scope.row.read }">
              <el-badge is-dot :hidden="scope.row.read" class="unread-dot" />
              <span>{{ scope.row.content }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="sender" label="推送人" width="140" />
        <el-table-column prop="time" label="推送时间" width="180" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button
              v-if="!scope.row.read"
              type="primary"
              link
              size="small"
              @click="markAsRead(scope.row)"
            >标为已读</el-button>
            <span v-else class="read-text">已读</span>
          </template>
        </el-table-column>
        <template #empty>
          <div class="table-empty">
            <el-icon :size="32" color="#C0C4CC"><Bell /></el-icon>
            <p>暂无消息通知</p>
          </div>
        </template>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="filteredData.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
          small
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Bell } from '@element-plus/icons-vue'

// Mock 数据：待接入接口后替换
const notifications = ref([
  {
    content: '您有一个新的仲裁案件（案件号：2026沪仲案字第005号）待处理',
    sender: '系统',
    time: '2026-07-29 09:25',
    read: false,
  },
  {
    content: '您提交的案件（2026沪仲案字第003号）延期申请已通过',
    sender: '审批管理员',
    time: '2026-07-29 08:30',
    read: false,
  },
  {
    content: '系统维护通知：仲裁平台将于今日 23:00 - 次日 01:00 进行维护',
    sender: '系统',
    time: '2026-07-28 18:00',
    read: true,
  },
  {
    content: '您有一个新的仲裁案件（案件号：2026沪仲案字第006号）待处理',
    sender: '系统',
    time: '2026-07-14 10:15',
    read: false,
  },
  {
    content: '案件（2026沪仲案字第002号）裁决书已被退回，请及时修改',
    sender: '审批管理员',
    time: '2026-07-12 14:40',
    read: true,
  },
])

const filters = ref({
  status: '',
})

const currentPage = ref(1)
const pageSize = ref(10)

const filteredData = computed(() => {
  if (!filters.value.status) return notifications.value
  const isUnread = filters.value.status === 'unread'
  return notifications.value.filter((n) => n.read !== isUnread)
})

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const handleSearch = () => {
  currentPage.value = 1
}

const handleReset = () => {
  filters.value.status = ''
  currentPage.value = 1
}

const markAsRead = (row) => {
  row.read = true
}

const markAllAsRead = () => {
  notifications.value.forEach((n) => (n.read = true))
}
</script>

<style scoped lang="scss">
.notifications-view {
  .filter-bar {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    align-items: flex-end;

    .filter-fields {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
      flex: 1;
    }
    .filter-item {
      display: flex;
      align-items: center;
      gap: 8px;
      .el-select {
        width: 180px;
      }
    }
    .filter-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      padding-left: 16px;
      border-left: 1px solid var(--el-border-color-lighter);
    }
  }

  .table-section {
    margin-top: 16px;

    .table-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 16px;
    }

    .message-content {
      display: flex;
      align-items: center;
      gap: 8px;

      .unread-dot {
        flex-shrink: 0;
      }
      span {
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        color: var(--el-text-color-regular);
      }
      &.is-unread span {
        color: var(--el-text-color-primary);
        font-weight: 500;
      }
    }

    .read-text {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .table-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 0;
      color: var(--el-text-color-regular);
      p {
        margin: 8px 0 0;
        font-size: 12px;
      }
    }
  }
}
</style>
