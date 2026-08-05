<template>
  <div class="case-todo-list section-card">
    <div class="section-title">待办事项（本案）</div>
    <div v-if="todos.length === 0" class="empty-wrap">
      <CaseEmptyState text="本案暂无待办事项" />
    </div>
    <div v-else class="todo-list">
      <div v-for="item in todos" :key="item.id" class="todo-item">
        <el-tag :type="item.typeTag" size="small">{{ item.type }}</el-tag>
        <span class="todo-title">{{ item.title }}</span>
        <span class="todo-time">{{ item.submitTime }}</span>
        <el-button type="primary" link size="small" @click="handleProcess(item)">去处理</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useCaseDetailStore } from '@/stores/caseDetail'
import CaseEmptyState from '../../shared/CaseEmptyState.vue'

const props = defineProps({
  caseId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['switch-tab'])
const router = useRouter()
const store = useCaseDetailStore()

const todos = computed(() => store.caseTodos)

const handleProcess = (item) => {
  if (item.type === '延期审批') {
    ElMessage.info('延期审批请在待办中心处理')
    router.push('/todos/center')
    return
  }
  // 笔录签名 / 裁决书核阅 / 文书签名 → 跳转仲裁文书 Tab
  emit('switch-tab', 'docs')
}
</script>

<style scoped lang="scss">
.case-todo-list {
  .empty-wrap {
    padding: 12px 0;
  }

  .todo-list {
    .todo-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 4px;
      transition: background-color 0.2s;

      & + .todo-item {
        margin-top: 4px;
      }

      &:hover {
        background-color: #f5f7fa;
      }

      .todo-title {
        font-size: 14px;
        color: var(--el-text-color-regular);
        flex: 1;
      }

      .todo-time {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}
</style>
