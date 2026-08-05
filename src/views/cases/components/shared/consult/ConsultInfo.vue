<template>
  <div class="section-card consult-info">
    <div class="section-title">咨询信息</div>
    <el-descriptions :column="2" border>
      <el-descriptions-item label="咨询专业">
        <el-tag size="small">{{ getSpecialtyLabel(detail.specialty) }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="咨询秘书">{{ detail.secretary }}</el-descriptions-item>
      <el-descriptions-item label="关联案件" :span="2">{{ detail.relatedCaseNo }}</el-descriptions-item>
      <el-descriptions-item label="争议焦点" :span="2">{{ detail.focus }}</el-descriptions-item>
      <el-descriptions-item label="案件审理报告" :span="2">
        <span
          v-if="detail.reportFile?.url"
          class="attachment-chip"
          role="button"
          tabindex="0"
          @click="previewFile(detail.reportFile.url)"
          @keydown.enter="previewFile(detail.reportFile.url)"
        >
          <el-icon class="chip-icon"><Document /></el-icon>
          <span class="chip-name">{{ detail.reportFile.name }}</span>
        </span>
        <span v-else>—</span>
      </el-descriptions-item>
      <el-descriptions-item label="附件" :span="2">
        <template v-if="detail.attachments?.length">
          <span
            v-for="f in detail.attachments"
            :key="f.url"
            class="attachment-chip"
            role="button"
            tabindex="0"
            @click="previewFile(f.url)"
            @keydown.enter="previewFile(f.url)"
          >
            <el-icon class="chip-icon"><Paperclip /></el-icon>
            <span class="chip-name">{{ f.name }}</span>
          </span>
        </template>
        <span v-else>—</span>
      </el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<script setup>
import { Document, Paperclip } from '@element-plus/icons-vue'
import { getSpecialtyLabel } from '@/stores/consult'

defineProps({
  detail: { type: Object, required: true },
})

const previewFile = (url) => window.open(url, '_blank')
</script>

<style scoped lang="scss">
.consult-info {
  .attachment-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px 4px 8px;
    background: var(--el-color-primary-light-9);
    border: 1px solid var(--el-color-primary-light-7);
    border-radius: 16px;
    font-size: 12px;
    color: var(--el-color-primary);
    cursor: pointer;
    transition: all 0.2s ease;
    margin-right: 8px;
    .chip-icon {
      font-size: 14px;
      flex-shrink: 0;
    }
    .chip-name {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    &:hover {
      background: var(--el-color-primary-light-8);
      border-color: var(--el-color-primary-light-5);
    }
    &:focus-visible {
      outline: 2px solid var(--el-color-primary);
      outline-offset: 2px;
    }
  }
}
</style>
