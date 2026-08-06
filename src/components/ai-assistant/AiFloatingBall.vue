<template>
  <div
    class="ai-floating-ball"
    :class="{ active: aiStore.visible }"
    role="button"
    tabindex="0"
    aria-label="AI 办案助手"
    @click="aiStore.toggle()"
    @keydown.enter="aiStore.toggle()"
  >
    <img class="ai-icon" :src="iconUrl" alt="AI 办案助手" />
    <span v-if="!aiStore.visible" class="pulse-dot"></span>
  </div>
</template>

<script setup>
import { useAiAssistantStore } from '@/stores/aiAssistant'

const aiStore = useAiAssistantStore()
const iconUrl = `${import.meta.env.BASE_URL}tu/AI-write.png`
</script>

<style scoped lang="scss">
.ai-floating-ball {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6b4fbb, #9254de);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2000;
  box-shadow: 0 4px 12px rgba(107, 79, 187, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  .ai-icon {
    width: 28px;
    height: 28px;
    object-fit: contain;
    pointer-events: none;
  }

  &:hover,
  &:focus-visible {
    transform: scale(1.08);
    box-shadow: 0 6px 16px rgba(107, 79, 187, 0.45);
    outline: none;
  }

  &.active {
    transform: scale(0.92);
    background: linear-gradient(135deg, var(--el-text-color-secondary), var(--el-text-color-placeholder));
  }

  .pulse-dot {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #f56c6c;
    border: 2px solid #fff;
    animation: pulse-ring 2s infinite;
  }
}

@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.6); }
  70% { box-shadow: 0 0 0 8px rgba(245, 108, 108, 0); }
  100% { box-shadow: 0 0 0 0 rgba(245, 108, 108, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .pulse-dot { animation: none; }
  .ai-floating-ball:hover { transform: none; }
}

@media (max-width: 768px) {
  .ai-floating-ball {
    right: 16px;
    bottom: 16px;
    width: 48px;
    height: 48px;
  }
}
</style>
