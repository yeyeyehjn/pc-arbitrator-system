<template>
  <div ref="listRef" class="message-list">
    <MessageBubble
      v-for="msg in messages"
      :key="msg.id"
      :message="msg"
      @fill-editor="$emit('fill-editor', $event)"
      @quote-law="$emit('quote-law', $event)"
    />
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import MessageBubble from './MessageBubble.vue'

const props = defineProps({
  messages: { type: Array, required: true },
})
defineEmits(['fill-editor', 'quote-law'])

const listRef = ref(null)

const scrollToBottom = () => {
  nextTick(() => {
    if (listRef.value) {
      listRef.value.scrollTop = listRef.value.scrollHeight
    }
  })
}

// 新消息自动滚动到底部
watch(
  () => props.messages.length,
  () => scrollToBottom()
)

// pending 状态变化时也滚动
watch(
  () => props.messages.map(m => m.pending).join(''),
  () => scrollToBottom()
)
</script>

<style scoped lang="scss">
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
}
</style>
