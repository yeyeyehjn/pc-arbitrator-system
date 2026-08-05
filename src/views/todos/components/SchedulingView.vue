<template>
  <div class="scheduling-view">
    <div class="placeholder-box">
      <el-icon class="placeholder-icon"><Calendar /></el-icon>
      <h3 class="placeholder-title">智能约庭功能开发中，敬请期待</h3>
      <p class="placeholder-desc">
        未来将支持自动匹配仲裁员排期、庭审场地空闲时段，<br />
        避开冲突，一键生成排期表。
      </p>
      <el-tag size="small" type="info" effect="plain" class="suggest-label">建议功能 · 后续迭代</el-tag>
    </div>
  </div>
</template>

<script setup>
import { Calendar } from '@element-plus/icons-vue'
</script>

<style scoped lang="scss">
.scheduling-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 200px);

  .placeholder-box {
    text-align: center;
    padding: 60px 40px;

    .placeholder-icon {
      font-size: 72px;
      color: var(--el-color-primary-light-5);
      margin-bottom: 20px;
    }

    .placeholder-title {
      margin: 0 0 12px;
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .placeholder-desc {
      margin: 0 0 20px;
      font-size: 14px;
      line-height: 1.8;
      color: var(--el-text-color-secondary);
    }

    .suggest-label {
      margin-top: 8px;
    }
  }
}
</style>
