<template>
  <div class="work-tab">
    <CaseTodoList :case-id="caseId" @switch-tab="handleSwitchTab" />
    <TemplateDownload :case-id="caseId" />
    <HearingSchedule :case-id="caseId" />
    <AIToolGrid @copy-to-editor="handleCopy" />
  </div>
</template>

<script setup>
import CaseTodoList from './work/CaseTodoList.vue'
import TemplateDownload from './work/TemplateDownload.vue'
import AIToolGrid from './work/AIToolGrid.vue'
import HearingSchedule from './work/HearingSchedule.vue'

defineProps({
  caseId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['switch-tab', 'copy-to-editor'])

const handleSwitchTab = (tabName) => {
  emit('switch-tab', tabName)
}

const handleCopy = () => {
  emit('copy-to-editor')
}
</script>

<style scoped lang="scss">
.work-tab {
  // 各子组件自带 margin-bottom: 16px
}
</style>
