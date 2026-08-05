<template>
  <el-drawer
    v-model="drawerVisibleComputed"
    :title="result?.title || 'AI 工具结果'"
    direction="rtl"
    size="40%"
    @open="loadResult"
  >
    <div v-loading="loading" class="drawer-content">
      <div v-if="loading" class="loading-tip">AI 分析中…</div>
      <template v-else-if="result">
        <!-- 自查清单型 -->
        <template v-if="result.type === 'checklist'">
          <div v-for="(item, idx) in result.items" :key="idx" class="check-item">
            <el-tag :type="item.status === 'pass' ? 'success' : 'warning'" size="small">
              {{ item.status === 'pass' ? '通过' : '警告' }}
            </el-tag>
            <div class="check-body">
              <div class="check-title">{{ item.item }}</div>
              <div class="check-detail">{{ item.detail }}</div>
            </div>
          </div>
        </template>

        <!-- 列表型 -->
        <template v-else-if="result.type === 'list'">
          <ul class="result-list">
            <li v-for="(item, idx) in result.items" :key="idx">{{ item }}</li>
          </ul>
        </template>

        <!-- 时间轴型 -->
        <template v-else-if="result.type === 'timeline'">
          <el-timeline>
            <el-timeline-item v-for="(item, idx) in result.items" :key="idx" :timestamp="item.date" placement="top">
              {{ item.event }}
            </el-timeline-item>
          </el-timeline>
        </template>

        <!-- 编号列表型 -->
        <template v-else-if="result.type === 'numbered'">
          <ol class="result-list numbered">
            <li v-for="(item, idx) in result.items" :key="idx">{{ item }}</li>
          </ol>
        </template>

        <!-- 法条型 -->
        <template v-else-if="result.type === 'legal'">
          <div v-for="(item, idx) in result.items" :key="idx" class="legal-item">
            <div class="legal-name">
              {{ item.name }}
              <el-tag size="small" :type="relevanceType(item.relevance)" class="relevance-tag">{{ item.relevance }}关联</el-tag>
            </div>
            <div class="legal-content">{{ item.content }}</div>
          </div>
        </template>
      </template>
    </div>
    <template #footer>
      <el-button type="primary" :disabled="loading || !result" @click="handleCopy">复制到裁决书编辑器</el-button>
    </template>
  </el-drawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCaseDetailStore } from '@/stores/caseDetail'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  toolKey: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:visible', 'copy-to-editor'])

const store = useCaseDetailStore()
const loading = ref(false)
const result = ref(null)

// 直接代理 props.visible，避免双重 ref 同步问题
const drawerVisibleComputed = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

// 当抽屉打开（visible 由 false 变 true）时加载结果
watch(
  () => props.visible,
  (val) => {
    if (val && props.toolKey) {
      loadResult()
    }
  }
)

const loadResult = async () => {
  if (!props.toolKey) return
  loading.value = true
  result.value = null
  try {
    result.value = await store.runAITool(props.toolKey)
  } finally {
    loading.value = false
  }
}

const relevanceType = (relevance) => {
  if (relevance === '高') return 'danger'
  if (relevance === '中') return 'warning'
  return 'info'
}

const handleCopy = () => {
  emit('copy-to-editor')
}
</script>

<style scoped lang="scss">
.drawer-content {
  min-height: 200px;

  .loading-tip {
    text-align: center;
    color: var(--el-text-color-secondary);
    font-size: 14px;
    padding: 40px 0;
  }

  .result-list {
    padding-left: 20px;
    color: var(--el-text-color-regular);
    font-size: 14px;
    line-height: 1.9;

    &.numbered {
      list-style: decimal;
    }

    li {
      margin-bottom: 8px;
    }
  }

  .check-item {
    display: flex;
    gap: 10px;
    padding: 12px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:last-child {
      border-bottom: none;
    }

    .check-body {
      flex: 1;

      .check-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-regular);
        margin-bottom: 4px;
      }

      .check-detail {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        line-height: 1.6;
      }
    }
  }

  .legal-item {
    padding: 12px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:last-child {
      border-bottom: none;
    }

    .legal-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-regular);
      margin-bottom: 4px;

      .relevance-tag {
        margin-left: 8px;
      }
    }

    .legal-content {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      line-height: 1.7;
    }
  }
}
</style>
