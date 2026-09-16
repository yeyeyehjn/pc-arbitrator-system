<template>
  <div class="calendar-board">
    <!-- 月份切换：置于日历上方 -->
    <div class="month-bar">
      <div class="month-nav">
        <el-button
          class="calendar-nav-btn"
          :icon="ArrowLeft"
          aria-label="上一月"
          @click="selectDate('prev-month')"
        />
        <span class="month-text">{{ monthLabel }}</span>
        <el-button
          class="calendar-nav-btn"
          :icon="ArrowRight"
          aria-label="下一月"
          @click="selectDate('next-month')"
        />
      </div>
      <el-button class="today-btn" @click="goToday">今日</el-button>
    </div>

    <el-calendar v-model="currentDate">
      <template #date-cell="{ data }">
        <div
          class="date-cell"
          :class="{
            'is-hearing': isHearing(data.day),
            'is-past': isHearing(data.day) && isPastDay(data.day),
            'is-selected': data.day === selectedDate,
          }"
          :role="isActiveHearingDay(data.day) ? 'button' : false"
          :tabindex="isActiveHearingDay(data.day) ? 0 : -1"
          :aria-label="isActiveHearingDay(data.day) ? `查看${data.day}开庭安排` : undefined"
          :aria-disabled="isHearing(data.day) && isPastDay(data.day)"
          :aria-pressed="data.day === selectedDate"
          @click="selectDay(data.day)"
          @keydown.enter="selectDay(data.day)"
        >
          <span class="date-day">{{ data.day.split('-').slice(2).join('-') }}</span>
          <span v-if="isHearing(data.day)" class="date-badge">庭</span>
        </div>
      </template>
    </el-calendar>

    <div class="today-summary">
      <h4 class="summary-title">{{ selectedDateLabel }}开庭提醒</h4>
      <div v-if="selectedHearings.length > 0" class="hearing-list">
        <div
            v-for="(item, index) in selectedHearings"
            :key="`${item.date}-${item.caseNumber}-${index}`"
            class="hearing-row"
            role="button"
            tabindex="0"
            :aria-label="`${item.caseNumber} ${item.timeText} ${item.room}`"
            @click="goToCaseDetail(item.caseId)"
            @keydown.enter="goToCaseDetail(item.caseId)"
          >
          <span class="hearing-cell case-number" :title="item.caseNumber">{{ item.caseNumber }}</span>
          <span class="hearing-cell hearing-time">{{ item.timeText }}</span>
          <span class="hearing-cell hearing-room" :title="item.room">{{ item.room }}</span>
        </div>
      </div>
      <div v-else class="empty-task">该日无开庭安排</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

const router = useRouter()

// 跳转到案件详情页
const goToCaseDetail = (caseId) => {
  router.push(`/cases/${caseId}`)
}

const currentDate = ref(new Date())

// 当前月份文案：2026年9月
const monthLabel = computed(
  () => `${currentDate.value.getFullYear()}年${currentDate.value.getMonth() + 1}月`
)

// 月份切换
const selectDate = (type) => {
  const date = new Date(currentDate.value)
  if (type === 'prev-month') {
    date.setMonth(date.getMonth() - 1)
  } else if (type === 'next-month') {
    date.setMonth(date.getMonth() + 1)
  }
  currentDate.value = date
}

// 回到今日：月份与选中日期均回到今天
const goToday = () => {
  currentDate.value = new Date()
  selectedDate.value = today
}

// 开庭案件数据源：含日期、开始/结束时间、庭室
const hearings = ref([
  // === 2026年8月 ===
  { date: '2026-08-12', caseNumber: '（2026）沪仲案字第021号', startTime: '09:00', endTime: '11:30', room: '2号庭室' },
  { date: '2026-08-15', caseNumber: '（2026）沪仲案字第003号', startTime: '10:00', endTime: '12:00', room: '3号庭室' },
  { date: '2026-08-19', caseNumber: '（2026）沪仲案字第024号', startTime: '14:00', endTime: '17:00', room: '5号庭室' },
  { date: '2026-08-22', caseNumber: '（2026）沪仲案字第007号', startTime: '09:30', endTime: '11:00', room: '1号庭室' },
  { date: '2026-08-22', caseNumber: '（2026）沪仲案字第008号', startTime: '15:00', endTime: '16:30', room: '3号庭室' },
  { date: '2026-08-26', caseNumber: '（2026）沪仲案字第026号', startTime: '10:30', endTime: '12:00', room: '4号庭室' },
  { date: '2026-08-28', caseNumber: '（2026）沪仲案字第028号', startTime: '09:00', endTime: '11:00', room: '2号庭室' },
  // === 2026年9月 ===
  { date: '2026-09-02', caseNumber: '（2026）沪仲案字第031号', startTime: '09:30', endTime: '11:00', room: '2号庭室' },
  { date: '2026-09-05', caseNumber: '（2026）沪仲案字第033号', startTime: '14:00', endTime: '16:00', room: '5号庭室' },
  { date: '2026-09-07', caseNumber: '（2026）沪仲案字第001号', startTime: '09:30', endTime: '11:30', room: '1号庭室' },
  { date: '2026-09-07', caseNumber: '（2026）沪仲案字第003号', startTime: '14:00', endTime: '16:00', room: '3号庭室' },
  { date: '2026-09-10', caseNumber: '（2026）沪仲案字第035号', startTime: '09:00', endTime: '11:00', room: '1号庭室' },
  { date: '2026-09-10', caseNumber: '（2026）沪仲案字第036号', startTime: '15:30', endTime: '17:00', room: '4号庭室' },
  { date: '2026-09-14', caseNumber: '（2026）沪仲案字第037号', startTime: '10:00', endTime: '12:00', room: '3号庭室' },
  { date: '2026-09-17', caseNumber: '（2026）沪仲案字第038号', startTime: '14:00', endTime: '15:30', room: '5号庭室' },
  { date: '2026-09-21', caseNumber: '（2026）沪仲案字第039号', startTime: '09:30', endTime: '11:30', room: '2号庭室' },
  { date: '2026-09-24', caseNumber: '（2026）沪仲案字第040号', startTime: '13:30', endTime: '15:00', room: '1号庭室' },
  { date: '2026-09-27', caseNumber: '（2026）沪仲案字第041号', startTime: '09:00', endTime: '11:00', room: '4号庭室' },
  { date: '2026-09-30', caseNumber: '（2026）沪仲案字第042号', startTime: '14:00', endTime: '15:30', room: '3号庭室' },
  // === 2026年10月 ===
  { date: '2026-10-08', caseNumber: '（2026）沪仲案字第043号', startTime: '09:30', endTime: '11:00', room: '2号庭室' },
  { date: '2026-10-13', caseNumber: '（2026）沪仲案字第044号', startTime: '14:00', endTime: '16:30', room: '5号庭室' },
  { date: '2026-10-16', caseNumber: '（2026）沪仲案字第045号', startTime: '10:00', endTime: '12:00', room: '1号庭室' },
  { date: '2026-10-20', caseNumber: '（2026）沪仲案字第046号', startTime: '09:00', endTime: '11:00', room: '3号庭室' },
])

// 今天（YYYY-MM-DD）
const today = new Date().toISOString().slice(0, 10)

// 关联案件 store 可打开详情的案件 id（复用 case-0..case-11，循环映射到各开庭记录）
const W = 12
hearings.value = hearings.value.map((h, i) => ({
  ...h,
  caseId: `case-${i % W}`,
}))

// 开庭日期集合（用于日历标记「庭」）
const hearingDateSet = computed(() => new Set(hearings.value.map((h) => h.date)))

// 当前选中的开庭日期
const selectedDate = ref(
  hearingDateSet.value.has(today)
    ? today
    : hearings.value.slice().sort((a, b) => a.date.localeCompare(b.date))[0]?.date || ''
)
selectedDate.value = selectedDate.value || today

// 判断某日期（YYYY-MM-DD）是否有开庭
const isHearing = (day) => hearingDateSet.value.has(day)

// 判断某日期是否已开庭（早于今天）
const isPastDay = (day) => day < today

// 带开庭标记且可点的日期（未开庭）
const isActiveHearingDay = (day) => isHearing(day) && !isPastDay(day)

// 已选日期的开庭案件
const selectedHearings = computed(() =>
  hearings.value
    .filter((h) => h.date === selectedDate.value)
    .sort((a, b) => (a.startTime < b.startTime ? -1 : 1))
    .map((h) => ({ ...h, timeText: `${h.startTime}-${h.endTime}` }))
)

// 标题文案：今天→"今日开庭提醒"，其他→"9月2日开庭提醒"
const selectedDateLabel = computed(() => {
  if (selectedDate.value === today) return '今日'
  const [, m, d] = selectedDate.value.split('-')
  return `${Number(m)}月${Number(d)}日`
})

// 点击开庭日期
const selectDay = (day) => {
  if (isActiveHearingDay(day)) selectedDate.value = day
}
</script>

<style scoped lang="scss">
.calendar-board {
  .el-calendar {
    --el-calendar-cell-width: 38px;
    :deep(.el-calendar__header) {
      display: none;
    }
    :deep(.el-calendar__body) {
      padding: 0;
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
      background-color: transparent;
    }
    :deep(.el-calendar-table td.is-today .el-calendar-day) {
      color: var(--el-color-primary);
    }
  }

  .month-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0 4px;
    .month-nav {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .month-text {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-regular);
      min-width: 76px;
      text-align: center;
    }
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
      height: 28px;
      padding: 0 12px;
      font-size: 12px;
      border: none;
      background-color: transparent;
      color: var(--el-text-color-regular);
      transition: color 0.2s ease;
      &:hover,
      &:focus-visible {
        color: var(--el-color-primary);
        background-color: transparent;
        outline: none;
      }
      &:focus-visible {
        outline: 2px solid var(--el-color-primary-light-5);
        outline-offset: 1px;
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
    border-radius: 4px;
    cursor: default;
    transition: background-color 0.2s ease, box-shadow 0.2s ease;

    .date-day {
      font-size: 12px;
      color: var(--el-text-color-regular);
    }

    .date-badge {
      position: absolute;
      top: 2px;
      right: 2px;
      font-size: 12px;
      line-height: 1;
      padding: 2px 4px;
      border-radius: 2px;
    }

    &.is-hearing {
      background-color: #ecf5ff;
      cursor: pointer;
      .date-badge {
        color: var(--el-color-primary);
      }
      &:hover,
      &:focus-visible {
        outline: none;
        box-shadow: inset 0 0 0 1px var(--el-color-primary);
      }
    }

    // 已开庭的日期：置灰、不可点击
    &.is-past {
      background-color: var(--el-fill-color-light);
      cursor: default;
      .date-day {
        color: var(--el-text-color-disabled);
      }
      .date-badge {
        color: var(--el-text-color-disabled);
      }
      &:hover,
      &:focus-visible {
        box-shadow: none;
      }
    }

    &.is-selected {
      background-color: var(--el-color-primary);
      .date-day {
        color: #ffffff;
      }
      .date-badge {
        color: #ffffff;
      }
      &:hover {
        box-shadow: none;
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
    }

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

    .empty-task {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      padding: 8px 10px;
    }
  }
}
</style>