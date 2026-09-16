<template>
  <div class="hearing-list">
    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" class="hearing-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="今日开庭" name="today" />
      <el-tab-pane label="待开庭" name="pending" />
    </el-tabs>

    <!-- 筛选项（复用全局 .filter-bar 规范，控件统一 180px 宽） -->
    <div class="filter-bar">
      <div class="filter-items">
        <div class="filter-item">
          <span class="filter-label">案件年份</span>
          <el-select v-model="filters.caseYear" placeholder="全部" clearable>
            <el-option v-for="y in yearOptions" :key="y" :label="y" :value="y" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">案件编号</span>
          <el-input
            v-model="filters.caseNumber"
            placeholder="请输入案件编号"
            clearable
            :prefix-icon="Search"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">经办秘书</span>
          <el-input
            v-model="filters.secretary"
            placeholder="请输入经办秘书"
            clearable
            :prefix-icon="User"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">开庭时间</span>
          <el-date-picker
            v-model="filters.date"
            type="date"
            placeholder="选择开庭时间"
            clearable
            value-format="YYYY-MM-DD"
          />
        </div>
      </div>
      <div class="filter-actions">
        <el-button type="primary" plain @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-table :data="pagedData" style="width: 100%">
      <el-table-column prop="caseNumber" label="案件编号" width="190" />
      <el-table-column prop="caseReason" label="案由" min-width="120" />
      <el-table-column prop="time" label="开庭时间" width="160" />
      <el-table-column prop="location" label="庭室地址" min-width="150" />
      <el-table-column prop="roomUsage" label="庭室用途" width="110" />
      <el-table-column prop="secretary" label="经办秘书" width="100" />
      <el-table-column prop="arbitrators" label="仲裁庭" min-width="140" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="90" fixed="right">
        <template #default="scope">
          <el-tag :type="scope.row.isToday ? 'danger' : 'warning'">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <template #empty>
        <div class="table-empty">
          <el-icon :size="32" color="#C0C4CC"><Search /></el-icon>
          <p>未找到匹配的开庭记录</p>
        </div>
      </template>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[5, 10, 20]"
        :total="filteredData.length"
        layout="total, prev, pager, next, sizes"
        background
        small
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search, User } from '@element-plus/icons-vue'

// 今日日期 YYYY-MM-DD
const today = new Date().toISOString().slice(0, 10)

// 全量 Mock 数据（统一为"待开庭"状态，按开庭日期区分今日/待开庭）
const allData = ref([
  {
    caseNumber: '（2026）沪仲案字第001号',
    caseReason: '买卖合同纠纷',
    time: `${today} 09:30`,
    location: '上海仲裁委员会1号庭室',
    roomUsage: '庭审',
    secretary: '李明',
    arbitrators: '陈志远、刘建华、王晓明',
    status: '待开庭',
    isToday: true,
  },
  {
    caseNumber: '（2026）沪仲案字第002号',
    caseReason: '房屋租赁合同纠纷',
    time: `${today} 14:00`,
    location: '上海仲裁委员会2号庭室',
    roomUsage: '庭审',
    secretary: '王芳',
    arbitrators: '张敏、李国强',
    status: '待开庭',
    isToday: true,
  },
  {
    caseNumber: '（2026）沪仲案字第003号',
    caseReason: '借款合同纠纷',
    time: '2026-08-15 10:00',
    location: '上海仲裁委员会3号庭室',
    roomUsage: '质证',
    secretary: '李明',
    arbitrators: '陈志远、赵雅琴、孙建军',
    status: '待开庭',
    isToday: false,
  },
  {
    caseNumber: '（2026）沪仲案字第004号',
    caseReason: '服务合同纠纷',
    time: '2026-08-16 15:30',
    location: '上海仲裁委员会4号庭室',
    roomUsage: '合议',
    secretary: '张丽',
    arbitrators: '刘建华、周慧敏',
    status: '待开庭',
    isToday: false,
  },
  {
    caseNumber: '（2026）沪仲案字第005号',
    caseReason: '建设工程合同纠纷',
    time: '2026-08-18 09:00',
    location: '上海仲裁委员会1号庭室',
    roomUsage: '庭审',
    secretary: '王芳',
    arbitrators: '王晓明、陈志远、赵雅琴',
    status: '待开庭',
    isToday: false,
  },
  {
    caseNumber: '（2026）沪仲案字第006号',
    caseReason: '股权转让纠纷',
    time: '2026-08-20 14:00',
    location: '上海仲裁委员会2号庭室',
    roomUsage: '质证',
    secretary: '张丽',
    arbitrators: '李国强、孙建军',
    status: '待开庭',
    isToday: false,
  },
  {
    caseNumber: '（2026）沪仲案字第007号',
    caseReason: '保险合同纠纷',
    time: '2026-08-22 10:30',
    location: '上海仲裁委员会5号庭室',
    roomUsage: '庭审',
    secretary: '李明',
    arbitrators: '张敏、刘建华、周慧敏',
    status: '待开庭',
    isToday: false,
  },
  {
    caseNumber: '（2026）沪仲案字第008号',
    caseReason: '劳动争议',
    time: '2026-08-25 09:00',
    location: '上海仲裁委员会3号庭室',
    roomUsage: '合议',
    secretary: '王芳',
    arbitrators: '赵雅琴、王晓明',
    status: '待开庭',
    isToday: false,
  },
])

const activeTab = ref('today')
const filters = ref({
  caseYear: '',
  caseNumber: '',
  secretary: '',
  date: '',
})

// 案件年份选项（近5年）
const currentYear = new Date().getFullYear()
const yearOptions = computed(() => {
  const years = []
  for (let y = currentYear; y >= currentYear - 4; y--) {
    years.push(String(y))
  }
  return years
})

const currentPage = ref(1)
const pageSize = ref(5)

// 按 tab + 筛选条件过滤
// today: 今日开庭（开庭日期 = 今日）
// pending: 待开庭（开庭日期 ≠ 今日，统一为待开庭状态）
const filteredData = computed(() => {
  return allData.value.filter((item) => {
    // tab 区分
    if (activeTab.value === 'today' && !item.isToday) return false
    if (activeTab.value === 'pending' && item.isToday) return false
    // 常规筛选
    if (filters.value.caseYear) {
      const yearMatch = item.caseNumber.match(/[（(](\d{4})[）)]/)
      if ((yearMatch ? yearMatch[1] : '') !== filters.value.caseYear) return false
    }
    if (filters.value.caseNumber && !item.caseNumber.includes(filters.value.caseNumber)) return false
    if (filters.value.secretary && !item.secretary.includes(filters.value.secretary)) return false
    if (filters.value.date && !item.time.startsWith(filters.value.date)) return false
    return true
  })
})

// 当前页数据
const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const handleTabChange = () => {
  currentPage.value = 1
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleReset = () => {
  filters.value = { caseYear: '', caseNumber: '', secretary: '', date: '' }
  currentPage.value = 1
}
</script>

<style scoped lang="scss">
.hearing-list {
  .hearing-tabs {
    margin-bottom: 12px;
    :deep(.el-tabs__header) {
      margin-bottom: 0;
    }
  }

  // 复用全局 .filter-bar 筛选规范（控件统一 180px 宽）；
  // 卡片内嵌场景：去除白底内边距；筛选项与按钮共享同一换行流，
  // 按钮跟在最后一行筛选项之后（右侧），不单独占行
  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    background: transparent;
    padding: 0;

    .filter-items {
      display: contents;
    }

    .filter-actions {
      margin-top: 0;
      margin-left: auto;
      gap: 8px;
      padding-left: 16px;
      border-left: 1px solid var(--el-border-color-lighter);
    }
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
</style>
