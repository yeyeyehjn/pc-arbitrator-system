<template>
  <div class="todo-stats-grid">
    <div
      v-for="(item, index) in todoItems"
      :key="index"
      class="todo-stat-card"
      role="button"
      tabindex="0"
      @click="goToTodoDetail(item.path)"
      @keydown.enter="goToTodoDetail(item.path)"
    >
      <div class="icon-wrapper">
        <el-icon :size="22"><component :is="item.icon" /></el-icon>
        <span v-if="item.urgent" class="urgent-dot" aria-label="紧急"></span>
      </div>
      <div class="stat-content">
        <div class="stat-title">{{ item.title }}</div>
        <div class="stat-value">{{ item.value }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Document,
  Edit,
  Finished,
  MessageBox,
  Calendar,
  Management
} from '@element-plus/icons-vue'

const router = useRouter()

// Mock 数据：path 待接入真实路由后按业务模块区分
const todoItems = ref([
  {
    title: '总待办',
    value: 12,
    icon: Management,
    path: '/todos'
  },
  {
    title: '待签承诺书',
    value: 3,
    icon: Document,
    path: '/todos/signature'
  },
  {
    title: '待签笔录',
    value: 5,
    icon: Edit,
    path: '/todos/signature'
  },
  {
    title: '待审批延期',
    value: 1,
    icon: Calendar,
    path: '/todos/center'
  },
  {
    title: '待签文书',
    value: 2,
    icon: Finished,
    path: '/todos/signature',
    urgent: true
  },
  {
    title: '待草拟裁决书',
    value: 1,
    icon: MessageBox,
    path: '/todos/center'
  },
])

const goToTodoDetail = (path) => {
  router.push(path)
}
</script>

<style scoped lang="scss">
.todo-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.todo-stat-card {
  display: flex;
  align-items: center;
  padding: 16px 18px;
  border-radius: 8px;
  background-color: #ffffff;
  border: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: box-shadow 0.25s ease, border-color 0.25s ease, background-color 0.25s ease;

  &:hover,
  &:focus-visible {
    border-color: var(--el-color-primary-light-7);
    box-shadow: 0 4px 14px rgba(5, 61, 153, 0.1);
    background-color: var(--el-color-primary-light-9);
    outline: none;
  }

  .icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 14px;
    flex-shrink: 0;
    background-color: var(--el-fill-color-light);
    color: var(--el-color-primary);
    position: relative;
  }

  .urgent-dot {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--el-color-danger);
    border: 2px solid #ffffff;
  }

  .stat-content {
    display: flex;
    flex-direction: column;
    .stat-title {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-bottom: 6px;
      letter-spacing: 0.3px;
    }
    .stat-value {
      font-size: 22px;
      font-weight: 600;
      line-height: 1;
      color: var(--el-text-color-primary);
      font-family: 'DIN Alternate', 'Helvetica Neue', sans-serif;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .todo-stat-card {
    transition: none;
  }
}
</style>
