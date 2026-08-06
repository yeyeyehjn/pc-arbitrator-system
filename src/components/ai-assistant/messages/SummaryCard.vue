<template>
  <div class="summary-card">
    <div class="summary-header">
      <span class="summary-case-no">{{ payload.caseNo }}</span>
      <el-tag size="small" type="info" effect="light">{{ payload.reason }}</el-tag>
      <el-tag size="small" type="warning" effect="light">{{ payload.status }}</el-tag>
    </div>
    <div class="summary-body">
      <div class="summary-row">
        <span class="label">标的金额</span>
        <span class="value">{{ payload.amount }} 万元</span>
      </div>
      <div class="summary-row">
        <span class="label">申请人</span>
        <span class="value">{{ payload.parties.applicants.join('、') }}</span>
      </div>
      <div class="summary-row">
        <span class="label">被申请人</span>
        <span class="value">{{ payload.parties.respondents.join('、') }}</span>
      </div>
      <div class="summary-row">
        <span class="label">请求摘要</span>
        <span class="value">{{ payload.claimSummary }}</span>
      </div>
      <div class="summary-row">
        <span class="label">当前进度</span>
        <span class="value">{{ payload.progress }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  payload: { type: Object, required: true },
})
</script>

<style scoped lang="scss">
.summary-card {
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  overflow: hidden;

  .summary-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background-color: #f5f7fa;

    .summary-case-no {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-regular);
    }
  }

  .summary-body {
    padding: 8px 12px;
  }

  .summary-row {
    display: flex;
    padding: 6px 0;
    border-bottom: 1px solid #f5f5f5;
    font-size: 14px;
    line-height: 1.6;

    &:last-child { border-bottom: none; }

    .label {
      flex-shrink: 0;
      width: 70px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
    .value {
      flex: 1;
      color: var(--el-text-color-regular);
    }
  }
}
</style>
