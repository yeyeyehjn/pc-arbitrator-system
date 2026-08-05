<template>
  <div class="home-view">
    <el-row :gutter="20" class="dashboard-row">
      <el-col :xs="24" :sm="24" :md="16">
        <!-- Left Column: Core Business Flow -->
        <el-card shadow="hover" class="dashboard-card mb-20">
          <template #header>
            <div class="card-header">
              <div class="card-title">
                <span>待办中心</span>
              </div>
            </div>
          </template>
          <TodoStats />
        </el-card>

        <el-card shadow="hover" class="dashboard-card mb-20">
          <template #header>
            <div class="card-header">
              <div class="card-title">
                <span>近期开庭</span>
              </div>
              <el-link type="primary" :underline="false">查看全部</el-link>
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
                <span>日程安排</span>
              </div>
            </div>
          </template>
          <CalendarBoard />
        </el-card>

        <el-card shadow="hover" class="dashboard-card mb-20">
          <template #header>
            <div class="card-header">
              <div class="card-title">
                <span>法律检索</span>
              </div>
            </div>
          </template>
          <LegalSearch />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import TodoStats from './components/TodoStats.vue'
import HearingList from './components/HearingList.vue'
// 右列非首屏组件懒加载，减小首屏 bundle
const CalendarBoard = defineAsyncComponent(() => import('./components/CalendarBoard.vue'))
const LegalSearch = defineAsyncComponent(() => import('./components/LegalSearch.vue'))
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
  transition: box-shadow 0.25s ease, transform 0.25s ease;

  &:hover {
    box-shadow: 0 6px 20px rgba(5, 61, 153, 0.08);
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
      letter-spacing: 0.5px;
    }
  }
  .mb-20 {
    margin-bottom: 20px;
  }
}
</style>
