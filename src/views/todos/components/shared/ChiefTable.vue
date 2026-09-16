<template>
  <div class="chief-table">
    <!-- 筛选区 -->
    <div class="filter-bar">
      <div class="filter-items" :class="{ collapsed: isCollapsed }">
        <div class="filter-item">
          <span class="filter-label">案件年份</span>
          <el-select v-model="filters.caseYear" placeholder="全部" clearable>
            <el-option v-for="y in yearOptions" :key="y" :label="y" :value="y" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">案件编号</span>
          <el-input v-model="filters.caseNo" placeholder="案件编号" clearable :prefix-icon="Search" />
        </div>
        <div class="filter-item">
          <span class="filter-label">当事人</span>
          <el-input v-model="filters.party" placeholder="当事人" clearable />
        </div>
        <div class="filter-item">
          <span class="filter-label">立案秘书</span>
          <el-select v-model="filters.secretary" placeholder="立案秘书" clearable>
            <el-option v-for="s in secretaryOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">状态</span>
          <el-select v-model="filters.status" placeholder="状态" clearable>
            <el-option label="未选定" value="未选定" />
            <el-option label="已选定" value="已选定" />
          </el-select>
        </div>
      </div>
      <div class="filter-actions">
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button link @click="isCollapsed = !isCollapsed">
          {{ isCollapsed ? '展开' : '收起' }}
          <el-icon class="toggle-icon"><ArrowDown v-if="isCollapsed" /><ArrowUp v-else /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 表格区域 -->
    <div class="table-section">
      <div class="table-title"><span>案件列表&nbsp;&nbsp;<span class="title-count">共 {{ filteredData.length }} 条</span></span></div>
      <el-table
        :data="pagedData"
        style="width: 100%"
      >
        <el-table-column prop="caseNo" label="案件编号" min-width="170" fixed="left">
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="goToCaseDetail(row)">{{ row.caseNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="边裁" min-width="200">
          <template #default="{ row }">
            <div class="contact-cell">
              <span class="contact-name">{{ row.sideArbitrator?.name }}</span>
              <span class="contact-meta">{{ row.sideArbitrator?.phone }}</span>
              <span class="contact-meta">{{ row.sideArbitrator?.email }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="立案秘书" min-width="160">
          <template #default="{ row }">
            <div class="contact-cell">
              <span class="contact-name">{{ row.secretary?.name }}</span>
              <span class="contact-meta">{{ row.secretary?.phone }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="$emit('select', row)">选择</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <TodoEmptyState text="暂无选择首席仲裁员事项" />
        </template>
      </el-table>

      <!-- 分页 -->
      <div v-if="filteredData.length > 0" class="pagination-bar">
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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import TodoEmptyState from './TodoEmptyState.vue'

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['select'])

const router = useRouter()
const filters = ref({ caseYear: '', caseNo: '', party: '', secretary: '', status: '' })
const isCollapsed = ref(true)
const currentPage = ref(1)
const pageSize = ref(5)

// 案件年份选项（近5年）
const currentYear = new Date().getFullYear()
const yearOptions = computed(() => {
  const years = []
  for (let y = currentYear; y >= currentYear - 4; y--) {
    years.push(String(y))
  }
  return years
})

const secretaryOptions = computed(() => Array.from(new Set(props.data.map((i) => i.secretary?.name).filter(Boolean))))

const filteredData = computed(() => {
  return props.data.filter((item) => {
    if (filters.value.status && item.status !== filters.value.status) return false
    if (filters.value.caseYear) {
      const yearMatch = item.caseNo.match(/[（(](\d{4})[）)]/)
      if ((yearMatch ? yearMatch[1] : '') !== filters.value.caseYear) return false
    }
    if (filters.value.caseNo && !item.caseNo.includes(filters.value.caseNo)) return false
    if (filters.value.party && !item.applicant.includes(filters.value.party) && !item.respondent.includes(filters.value.party)) return false
    if (filters.value.secretary && item.secretary?.name !== filters.value.secretary) return false
    return true
  })
})

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const handleSearch = () => { currentPage.value = 1 }
const handleReset = () => { filters.value = { caseYear: '', caseNo: '', party: '', secretary: '', status: '' }; currentPage.value = 1 }

const goToCaseDetail = () => router.push('/cases')
</script>

<style scoped lang="scss">
.chief-table {
  // 联系方式单元格：姓名加粗在上，电话/邮箱灰色小字在下
  .contact-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
    line-height: 1.5;

    .contact-name {
      font-weight: 500;
      color: var(--el-text-color-secondary);
    }

    .contact-meta {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      word-break: break-all;
    }
  }
}
</style>
