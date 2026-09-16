<template>
  <div class="home-view">
    <el-row :gutter="20" class="dashboard-row">
      <el-col :xs="24" :sm="24" :md="16">
        <!-- Left Column: Core Business Flow -->
        <el-card shadow="hover" class="dashboard-card mb-20">
          <template #header>
            <div class="card-header">
              <div class="card-title">
                <span>待办中心<template v-if="todoTotal > 0">（{{ todoTotal }}）</template></span>
              </div>
            </div>
          </template>
          <TodoStats @total-change="handleTodoTotalChange" />
        </el-card>

        <el-card shadow="hover" class="dashboard-card mb-20">
          <template #header>
            <div class="card-header">
              <div class="card-title">
                <span>预警看板</span>
              </div>
            </div>
          </template>
          <WarningBoard />
        </el-card>

        <el-card v-if="hearingVisible" shadow="hover" class="dashboard-card mb-20">
          <template #header>
            <div class="card-header">
              <div class="card-title">
                <span>待开庭</span>
              </div>
              <el-link type="primary" :underline="false" @click="router.push('/cases/list')">查看全部</el-link>
            </div>
          </template>
          <HearingList />
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="8">
        <!-- Right Column: Auxiliary Tools -->
        <el-card shadow="hover" class="dashboard-card mb-20">
          <template #header>
            <div class="card-header">
              <div class="card-title">
                <span>开庭日历</span>
              </div>
              <el-link type="primary" :underline="false" @click="handleShowHearing">查看更多</el-link>
            </div>
          </template>
          <CalendarBoard />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import TodoStats from './components/TodoStats.vue'
import WarningBoard from './components/WarningBoard.vue'
import HearingList from './components/HearingList.vue'

const router = useRouter()
// 待办中心总数（由 TodoStats 通过 total-change 事件上报）
const todoTotal = ref(0)
const handleTodoTotalChange = (val) => {
  todoTotal.value = val ?? 0
}
// 待开庭模块默认隐藏，由开庭日历「查看更多」触发显示
const hearingVisible = ref(false)
const handleShowHearing = () => {
  hearingVisible.value = true
}
// 右列非首屏组件懒加载，减小首屏 bundle
const CalendarBoard = defineAsyncComponent(() => import('./components/CalendarBoard.vue'))
</script>

<style scoped lang="scss">
.home-view {
  // padding: 20px 0;
}

.dashboard-row {
  margin-bottom: 20px;
  // 窄屏下右列堆叠到下方时增加上间距
  @media (max-width: 991px) {
    .el-col + .el-col {
      margin-top: 20px;
    }
  }
}

.dashboard-card {
  margin-bottom: 20px;
  border: none;
  transition: box-shadow 0.25s ease;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    box-shadow: 0 6px 20px rgba(10, 31, 143, 0.08);
  }

  :deep(.el-card__header) {
    padding: 16px 20px;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
  :deep(.el-card__body) {
    padding: 20px;
  }
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .card-title {
    display: flex;
    align-items: center;
    gap: 10px;

    &::before {
      content: '';
      width: 3px;
      height: 16px;
      background-color: var(--el-color-primary);
      border-radius: 2px;
      flex-shrink: 0;
    }
    span {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .dashboard-card {
    transition: none;
  }
}
</style>
