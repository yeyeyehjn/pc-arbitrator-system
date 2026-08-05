<template>
  <div class="template-download section-card">
    <div class="section-title">文书辅助工具</div>
    <div class="select-row">
      <!-- <span class="select-label">结案文书模板</span> -->
      <el-select
        v-model="selectedClosing"
        placeholder="请选择结案文书模板"
        filterable
        clearable
        class="template-select"
        @change="handleDownloadClosing"
      >
        <el-option
          v-for="tpl in closingTemplates"
          :key="tpl.name"
          :label="tpl.name"
          :value="tpl.name"
        />
      </el-select>
      <!-- <span class="select-label">程序文书模板</span> -->
      <el-select
        v-model="selectedProcedure"
        placeholder="请选择程序文书模板"
        filterable
        clearable
        class="template-select"
        @change="handleDownloadProcedure"
      >
        <el-option
          v-for="tpl in procedureTemplates"
          :key="tpl.name"
          :label="tpl.name"
          :value="tpl.name"
        />
      </el-select>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCaseDetailStore } from '@/stores/caseDetail'

const store = useCaseDetailStore()
const selectedClosing = ref('')
const selectedProcedure = ref('')

const closingTemplates = [
  { name: '裁决书草稿' },
  { name: '撤案决定书草稿' },
  { name: '调解决定书草稿' },
]

const procedureTemplates = [
  { name: '延期裁决书呈批表' },
  { name: '延期结案申请书' },
]

const handleDownloadClosing = (name) => {
  if (!name) return
  store.downloadTemplate(name)
  selectedClosing.value = ''
}

const handleDownloadProcedure = (name) => {
  if (!name) return
  store.downloadTemplate(name)
  selectedProcedure.value = ''
}
</script>

<style scoped lang="scss">
.template-download {
  .select-row {
    display: flex;
    align-items: center;
    gap: 12px;

    .select-label {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-secondary);
      flex-shrink: 0;
      text-align: left;
    }

    .template-select {
      width: 220px;
    }
  }
}
</style>
