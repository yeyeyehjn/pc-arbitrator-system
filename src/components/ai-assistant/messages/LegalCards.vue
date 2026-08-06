<template>
  <div class="legal-cards">
    <div v-for="(item, idx) in payload.items" :key="idx" class="legal-card">
      <div class="legal-card-header">
        <span class="legal-name">{{ item.name }}</span>
        <el-tag :type="relevanceTag(item.relevance)" size="small" effect="light">
          {{ item.relevance }}关联
        </el-tag>
      </div>
      <p class="legal-snippet">{{ item.snippet }}</p>
      <div class="legal-actions">
        <a :href="`https://www.pkulaw.com`" target="_blank" rel="noopener" class="legal-link">
          查看原文 ›
        </a>
        <el-button
          v-if="item.relevance === '高'"
          class="legal-quote-btn"
          text
          size="small"
          type="primary"
          @click="$emit('quote', item)"
        >
          引用到文书
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  payload: { type: Object, required: true },
})
defineEmits(['quote'])

const relevanceTag = (relevance) => {
  if (relevance === '高') return 'danger'
  if (relevance === '中') return 'warning'
  return 'info'
}
</script>

<style scoped lang="scss">
.legal-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legal-card {
  background-color: #f7f5ff;
  border-radius: 4px;
  padding: 12px;

  .legal-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;

    .legal-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-regular);
    }
  }

  .legal-snippet {
    font-size: 14px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
    margin: 0 0 8px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .legal-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .legal-link {
      font-size: 12px;
      color: #6b4fbb;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }
  }
}
</style>
