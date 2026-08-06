<template>
  <div class="case-cards">
    <div v-for="(item, idx) in payload.items" :key="idx" class="case-card">
      <div class="case-card-header">
        <span class="case-no">{{ item.caseNo }}</span>
        <el-tag :type="item.tag === '指导' ? 'primary' : 'success'" size="small" effect="light">
          {{ item.tag }}
        </el-tag>
      </div>
      <div class="case-meta">
        <span v-if="item.reason">{{ item.reason }}</span>
        <span v-if="item.amount"> · 标的 {{ item.amount }} 万元</span>
        <span v-if="item.hearingDate"> · {{ item.hearingDate }}</span>
      </div>
      <div class="case-focus">
        <span class="focus-label">{{ item.focusLabel }}：</span>
        <span class="focus-text">{{ item.focus }}</span>
      </div>
      <a :href="`https://www.pkulaw.com`" target="_blank" rel="noopener" class="case-link">
        查看判决书 ›
      </a>
    </div>
  </div>
</template>

<script setup>
defineProps({
  payload: { type: Object, required: true },
})
</script>

<style scoped lang="scss">
.case-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.case-card {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;

  .case-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 4px;

    .case-no {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }
  }

  .case-meta {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
  }

  .case-focus {
    font-size: 13px;
    line-height: 1.6;
    color: #606266;
    margin-bottom: 8px;

    .focus-label {
      font-weight: 600;
      color: #303133;
    }
  }

  .case-link {
    font-size: 12px;
    color: #053d99;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
}
</style>
