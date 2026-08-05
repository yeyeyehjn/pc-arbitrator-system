<template>
  <div class="hearing-list">
    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" class="hearing-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="待开庭" name="待开庭" />
      <el-tab-pane label="已开庭" name="已开庭" />
    </el-tabs>

    <!-- 筛选项 -->
    <div class="filter-bar">
      <div class="filter-fields">
        <div class="filter-item">
          <span class="filter-label">案号</span>
          <el-input
            v-model="filters.caseNumber"
            placeholder="请输入案号"
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
      <el-table-column prop="caseNumber" label="案号" width="170" />
      <el-table-column prop="caseReason" label="案由" min-width="120" />
      <el-table-column prop="time" label="开庭时间" width="160" />
      <el-table-column prop="location" label="庭室地址" min-width="150" />
      <el-table-column prop="roomUsage" label="庭室用途" width="110" />
      <el-table-column prop="secretary" label="经办秘书" width="100" />
      <el-table-column prop="status" label="状态" width="90" fixed="right">
        <template #default="scope">
          <el-tag :type="scope.row.status === '待开庭' ? 'warning' : 'success'">{{ scope.row.status }}</el-tag>
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

// 全量 Mock 数据
const allData = ref([
  {
    caseNumber: '（2026）沪仲案字第001号',
    caseReason: '买卖合同纠纷',
    time: '2026-07-20 09:30',
    location: '上海仲裁委员会1号庭室',
    roomUsage: '庭审',
    secretary: '李明',
    status: '待开庭',
  },
  {
    caseNumber: '（2026）沪仲案字第002号',
    caseReason: '房屋租赁合同纠纷',
    time: '2026-07-21 14:00',
    location: '上海仲裁委员会2号庭室',
    roomUsage: '庭审',
    secretary: '王芳',
    status: '待开庭',
  },
  {
    caseNumber: '（2026）沪仲案字第003号',
    caseReason: '借款合同纠纷',
    time: '2026-07-15 10:00',
    location: '上海仲裁委员会3号庭室',
    roomUsage: '质证',
    secretary: '李明',
    status: '已开庭',
  },
  {
    caseNumber: '（2026）沪仲案字第004号',
    caseReason: '服务合同纠纷',
    time: '2026-07-16 15:30',
    location: '上海仲裁委员会4号庭室',
    roomUsage: '合议',
    secretary: '张丽',
    status: '待开庭',
  },
  {
    caseNumber: '（2026）沪仲案字第005号',
    caseReason: '建设工程合同纠纷',
    time: '2026-07-22 09:00',
    location: '上海仲裁委员会1号庭室',
    roomUsage: '庭审',
    secretary: '王芳',
    status: '待开庭',
  },
  {
    caseNumber: '（2026）沪仲案字第006号',
    caseReason: '股权转让纠纷',
    time: '2026-07-12 14:00',
    location: '上海仲裁委员会2号庭室',
    roomUsage: '质证',
    secretary: '张丽',
    status: '已开庭',
  },
  {
    caseNumber: '（2026）沪仲案字第007号',
    caseReason: '保险合同纠纷',
    time: '2026-07-23 10:30',
    location: '上海仲裁委员会5号庭室',
    roomUsage: '庭审',
    secretary: '李明',
    status: '待开庭',
  },
  {
    caseNumber: '（2026）沪仲案字第008号',
    caseReason: '劳动争议',
    time: '2026-07-10 09:00',
    location: '上海仲裁委员会3号庭室',
    roomUsage: '合议',
    secretary: '王芳',
    status: '已开庭',
  },
])

const activeTab = ref('待开庭')
const filters = ref({
  caseNumber: '',
  secretary: '',
  date: '',
})

const currentPage = ref(1)
const pageSize = ref(5)

// 按 tab + 筛选条件过滤
const filteredData = computed(() => {
  return allData.value.filter((item) => {
    if (item.status !== activeTab.value) return false
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
  filters.value = { caseNumber: '', secretary: '', date: '' }
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

  .filter-bar {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
    flex-wrap: wrap;
    align-items: center;
    background: transparent;
    padding: 0;

    .filter-fields {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
      flex: 1;
    }
    .filter-actions {
      display: flex;
      gap: 8px;
      align-items: center;
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
