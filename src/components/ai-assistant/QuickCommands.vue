<template>
  <div class="quick-commands">
    <button
      v-for="cmd in commands"
      :key="cmd.key"
      class="quick-cmd"
      :disabled="aiStore.loading"
      @click="handleClick(cmd.key)"
    >
      {{ cmd.label }}
    </button>
  </div>
</template>

<script setup>
import { useAiAssistantStore } from '@/stores/aiAssistant'

const aiStore = useAiAssistantStore()

const commands = [
  { key: 'guide', label: '操作指引' },
  { key: 'legal', label: '查法条' },
  { key: 'draft', label: '草拟裁决书' },
  { key: 'summary', label: '案件摘要' },
]

const handleClick = (cmd) => {
  if (!aiStore.loading) {
    aiStore.runQuickCommand(cmd)
  }
}
</script>

<style scoped lang="scss">
.quick-commands {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 16px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.quick-cmd {
  padding: 4px 12px;
  border: 1px solid #053d99;
  border-radius: 12px;
  background-color: #fff;
  color: #053d99;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background-color: #053d99;
    color: #fff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
