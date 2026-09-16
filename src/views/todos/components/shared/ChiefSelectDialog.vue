<template>
  <el-dialog
    :model-value="modelValue"
    title="选择首席仲裁员"
    width="760px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:modelValue', $event)"
    @open="initDialog"
  >
    <div class="chief-select-dialog">
      <!-- 联系信息 -->
      <div class="dialog-section">
        <div class="section-title">联系信息</div>
        <div class="desc-grid">
          <div class="desc-item">
            <span class="desc-label">案件编号</span>
            <span class="desc-value">{{ row?.caseNo }}</span>
          </div>
          <div class="desc-item">
            <span class="desc-label">仲裁员姓名</span>
            <span class="desc-value">{{ row?.sideArbitrator?.name }}</span>
          </div>
          <div class="desc-item">
            <span class="desc-label">联系电话</span>
            <span class="desc-value">{{ row?.sideArbitrator?.phone }}</span>
          </div>
          <div class="desc-item">
            <span class="desc-label">邮箱</span>
            <span class="desc-value">{{ row?.sideArbitrator?.email }}</span>
          </div>
        </div>
      </div>

      <!-- 选择首席 -->
      <div class="dialog-section">
        <div class="section-title">选择首席</div>
        <el-input
          v-model="keyword"
          class="candidate-search"
          placeholder="搜索姓名 / 专长领域"
          clearable
          :prefix-icon="Search"
        />
        <el-table :data="pagedCandidates" class="candidate-table" max-height="280">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="name" label="姓名" min-width="90" />
          <el-table-column prop="gender" label="性别" width="60" align="center" />
          <el-table-column prop="education" label="学历" min-width="100" />
          <el-table-column prop="expertise" label="专长领域" min-width="160" show-overflow-tooltip />
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row: candidate }">
              <el-button v-if="isSelected(candidate)" type="info" link disabled>已选定</el-button>
              <el-button v-else-if="isFull" type="info" link disabled>已满</el-button>
              <el-button v-else type="primary" link @click="handlePick(candidate)">选定</el-button>
            </template>
          </el-table-column>
          <template #empty>
            <div class="candidate-empty">未找到匹配的仲裁员</div>
          </template>
        </el-table>

        <!-- 名册分页（左下方） -->
        <div v-if="filteredCandidates.length > 0" class="pagination-bar">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[5, 10]"
            :total="filteredCandidates.length"
            layout="total, prev, pager, next, sizes"
            background
            small
          />
        </div>

        <!-- 选择名单：可删除后重新选定 -->
        <div class="selected-panel">
          <span class="selected-label">选择名单</span>
          <div class="selected-tags">
            <template v-if="selectedList.length">
              <el-tag
                v-for="(item, idx) in selectedList"
                :key="item.name"
                closable
                @close="handleRemove(idx)"
              >
                {{ idx + 1 }}. {{ item.name }}（{{ item.expertise }}）
              </el-tag>
            </template>
            <span v-else class="selected-empty">请从上方列表中选定首席仲裁员，支持删除后重新选定</span>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确认选择</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useTodoStore } from '@/stores/todo'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  row: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const todoStore = useTodoStore()
const { chiefCandidates } = storeToRefs(todoStore)

const keyword = ref('')
const selectedList = ref([])
const currentPage = ref(1)
const pageSize = ref(5)

// 打开弹窗时初始化：回显已选名单，清空搜索并回到第一页
const initDialog = () => {
  keyword.value = ''
  currentPage.value = 1
  const initial = props.row?.selectedChiefs || []
  selectedList.value = initial.map((item) => ({ ...item }))
}

const filteredCandidates = computed(() => {
  const kw = keyword.value.trim()
  if (!kw) return chiefCandidates.value
  return chiefCandidates.value.filter(
    (item) => item.name.includes(kw) || item.expertise.includes(kw)
  )
})

// 名册分页
const pagedCandidates = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredCandidates.value.slice(start, start + pageSize.value)
})

// 搜索条件变化时回到第一页
watch(filteredCandidates, () => {
  currentPage.value = 1
})

const isSelected = (candidate) => selectedList.value.some((item) => item.name === candidate.name)

// 首席仲裁员仅限选定 1 位
const isFull = computed(() => selectedList.value.length >= 1)

const handlePick = (candidate) => {
  if (isFull.value) {
    ElMessage.warning('最多只能选定 1 位首席仲裁员，请先删除已选名单中的仲裁员')
    return
  }
  selectedList.value.push({ ...candidate })
}

const handleRemove = (idx) => {
  selectedList.value.splice(idx, 1)
}

const handleConfirm = () => {
  if (selectedList.value.length === 0) {
    ElMessage.warning('请先选定首席仲裁员')
    return
  }
  emit('confirm', selectedList.value.map((item) => ({ ...item })))
}
</script>

<style scoped lang="scss">
.chief-select-dialog {
  .dialog-section {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    margin-bottom: 12px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  // 联系信息：label 灰色小字在上，值黑色在下，两列网格
  .desc-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 24px;
    row-gap: 14px;
  }

  .desc-item {
    min-width: 0;
  }

  .desc-label {
    display: block;
    margin-bottom: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .desc-value {
    display: block;
    font-size: 14px;
    color: #303133;
    line-height: 1.5;
    word-break: break-all;
  }

  .candidate-search {
    width: 260px;
    margin-bottom: 12px;
  }

  .candidate-empty {
    padding: 24px 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  // 选择名单
  .selected-panel {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-top: 16px;
    padding: 12px 16px;
    background-color: var(--el-fill-color-light);
    border-radius: 6px;

    .selected-label {
      flex-shrink: 0;
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-regular);
      line-height: 24px;
    }

    .selected-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .el-tag {
        font-size: 14px;
      }
    }

    .selected-empty {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      line-height: 24px;
    }
  }
}
</style>
