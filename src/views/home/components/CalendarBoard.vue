<template>
  <div class="calendar-board">
    <el-calendar v-model="currentDate">
      <template #header="{ date }">
        <div class="calendar-header">
          <span class="calendar-title-text">{{ formatCalendarHeader(date) }}</span>
          <div class="header-actions">
            <el-button
              class="calendar-nav-btn"
              :icon="ArrowLeft"
              aria-label="上一月"
              @click="selectDate('prev-month')"
            />
            <el-button
              class="calendar-nav-btn today-btn"
              @click="selectDate('today')"
            >本月</el-button>
            <el-button
              class="calendar-nav-btn"
              :icon="ArrowRight"
              aria-label="下一月"
              @click="selectDate('next-month')"
            />
          </div>
        </div>
      </template>
      <template #date-cell="{ data }">
        <div class="date-cell" :class="{ 'is-selected': isSelected(data.day) }">
          <span class="date-day">{{ data.day.split('-').slice(2).join('-') }}</span>
          <el-badge v-if="hasEvent(data.day)" is-dot type="primary" class="event-dot" />
        </div>
      </template>
    </el-calendar>

    <div class="today-summary">
      <h4 class="summary-title">今日开庭提醒</h4>
      <div v-if="todayHearings.length > 0" class="hearing-list">
        <div
          v-for="(item, index) in todayHearings"
          :key="index"
          class="hearing-row"
          role="button"
          tabindex="0"
        >
          <span class="hearing-cell case-number" :title="item.caseNumber">{{ item.caseNumber }}</span>
          <span class="hearing-cell hearing-time">{{ item.time }}</span>
          <span class="hearing-cell hearing-room" :title="item.room">{{ item.room }}</span>
        </div>
      </div>
      <div v-else class="empty-task">今日无开庭安排</div>

      <h4 class="summary-title summary-title--mt">今日到期案件</h4>
      <ul v-if="todayDueCases.length > 0" class="case-list">
        <li
          v-for="(caseItem, index) in todayDueCases"
          :key="index"
          class="case-item"
          role="button"
          tabindex="0"
        >
          <span class="case-number-text">{{ caseItem.caseNumber }}</span>
        </li>
      </ul>
      <div v-else class="empty-task">暂无到期案件</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

const currentDate = ref(new Date())

// Mock data for events on calendar
const events = ref([
  '2026-07-16', // Today
  '2026-07-20',
  '2026-07-25',
])

const hasEvent = (day) => {
  return events.value.includes(day)
}

// 将 "2026 July" 格式化为 "2026年7月"
const formatCalendarHeader = (dateStr) => {
  const parts = dateStr.split(' ')
  if (parts.length === 2) {
    const year = parts[0]
    const monthMap = {
      'January': '1', 'February': '2', 'March': '3', 'April': '4',
      'May': '5', 'June': '6', 'July': '7', 'August': '8',
      'September': '9', 'October': '10', 'November': '11', 'December': '12'
    }
    const month = monthMap[parts[1]] || parts[1]
    return `${year}年${month}月`
  }
  return dateStr
}

const isSelected = (day) => {
  return day === new Date().toISOString().slice(0, 10)
}

const selectDate = (type) => {
  const date = new Date(currentDate.value)
  if (type === 'prev-month') {
    date.setMonth(date.getMonth() - 1)
  } else if (type === 'next-month') {
    date.setMonth(date.getMonth() + 1)
  } else if (type === 'today') {
    date.setDate(new Date().getDate())
    date.setMonth(new Date().getMonth())
    date.setFullYear(new Date().getFullYear())
  }
  currentDate.value = date
}

// 今日开庭提醒：案号、开庭时间、庭室
const todayHearings = ref([
  {
    caseNumber: '（2026）沪仲案字第001号',
    time: '09:30',
    room: '1号庭室',
  },
  {
    caseNumber: '（2026）沪仲案字第003号',
    time: '14:00',
    room: '3号庭室',
  },
])

// 今日到期案件：只显示案号
const todayDueCases = ref([
  { caseNumber: '（2026）沪仲案字第001号' },
  { caseNumber: '（2026）沪仲案字第007号' },
])
</script>

<style scoped lang="scss">
.calendar-board {
  .el-calendar {
    --el-calendar-cell-width: 38px; // Adjust cell width for compactness
    :deep(.el-calendar__header) {
      padding: 0;
      border-bottom: none;
      margin-bottom: 0;
    }
    :deep(.el-calendar__body) {
      padding: 10px 0;
    }
    :deep(.el-calendar__button-group) {
      display: none; // Hide default buttons
    }
    :deep(.el-calendar__title) {
      font-size: 16px;
      font-weight: bold;
      color: var(--el-text-color-primary);
    }
    :deep(.el-calendar-day) {
      height: 38px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
    }
    :deep(.el-calendar-table thead th) {
      padding: 5px 0;
      font-weight: normal;
      color: var(--el-text-color-secondary);
    }
    :deep(.el-calendar-table td.is-selected .el-calendar-day) {
      background-color: var(--el-color-primary-light-9);
      border-radius: 4px;
    }
    :deep(.el-calendar-table .el-calendar-day:hover) {
      background-color: var(--el-color-primary-light-9);
      border-radius: 4px;
    }
  }

  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    .calendar-title-text {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-regular);
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      .calendar-nav-btn {
        padding: 0;
        height: 28px;
        min-width: 28px;
        border: none;
        background-color: transparent;
        color: var(--el-text-color-regular);
        transition: all 0.2s ease;
        &:hover {
          color: var(--el-color-primary);
          background-color: var(--el-color-primary-light-9);
        }
        &:focus-visible {
          outline: 2px solid var(--el-color-primary-light-5);
          outline-offset: 1px;
        }
      }
      .today-btn {
        padding: 0 10px;
        font-size: 12px;
      }
    }
  }

  .date-cell {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;

    .date-day {
      font-size: 12px;
      color: var(--el-text-color-regular);
    }

    .event-dot {
      position: absolute;
      bottom: -8px;
      :deep(.el-badge__content.is-dot) {
        height: 6px;
        width: 6px;
        right: 0px;
        top: 0px;
      }
    }
  }

  .today-summary {
    margin-top: 10px;
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-lighter);

    .summary-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-regular);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      &::before {
        content: '';
        display: inline-block;
        width: 3px;
        height: 14px;
        background-color: var(--el-color-primary);
        border-radius: 2px;
        margin-right: 8px;
      }
      &--mt {
        margin-top: 14px;
      }
    }

    // 今日开庭提醒：表格式三列
    .hearing-list {
      background-color: #F5F7FA;
      border-radius: 4px;
      overflow: hidden;
    }
    .hearing-row {
      display: flex;
      align-items: center;
      padding: 8px 10px;
      border-bottom: 1px solid #ffffff;
      transition: background-color 0.2s ease;
      cursor: pointer;
      &:last-child {
        border-bottom: none;
      }
      &:hover,
      &:focus-visible {
        background-color: var(--el-color-primary-light-9);
        outline: none;
      }
      .hearing-cell {
        font-size: 12px;
        color: var(--el-text-color-regular);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .case-number {
        flex: 0 0 45%;
        color: var(--el-text-color-regular);
      }
      .hearing-time {
        flex: 0 0 25%;
        color: var(--el-text-color-regular);
      }
      .hearing-room {
        flex: 1;
        color: var(--el-text-color-regular);
      }
    }

    // 今日到期案件：仅案号
    .case-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .case-item {
      display: flex;
      align-items: center;
      padding: 6px 10px;
      font-size: 12px;
      color: var(--el-text-color-regular);
      border-radius: 4px;
      margin-bottom: 4px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      .case-number-text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      &::before {
        content: '';
        display: inline-block;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background-color: var(--el-color-danger);
        margin-right: 8px;
        flex-shrink: 0;
      }
      &:hover,
      &:focus-visible {
        background-color: var(--el-color-primary-light-9);
        outline: none;
      }
    }

    .empty-task {
      font-size: 12px;
      color: var(--el-text-color-regular);
      padding: 8px 10px;
    }
  }
}
</style>
