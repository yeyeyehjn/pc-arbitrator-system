<template>
  <div class="discussion-tab">
    <ChatPanel mode="embedded" :case-id="caseId" :case-no="caseNo" />
  </div>
</template>

<script setup>
import ChatPanel from '@/components/chat/ChatPanel.vue'

defineProps({
  caseId: {
    type: String,
    default: '',
  },
  caseNo: {
    type: String,
    default: '',
  },
})
</script>

<style scoped lang="scss">
.discussion-tab {
  height: 500px;
  display: flex;
  flex-direction: column;
}
</style>
