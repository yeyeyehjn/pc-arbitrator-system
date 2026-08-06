<template>
  <el-tooltip content="AI 办案助手" placement="bottom" :show-after="300">
    <div
      class="ai-icon-btn"
      :class="{ active: aiStore.visible }"
      role="button"
      tabindex="0"
      aria-label="AI 办案助手"
      @click="aiStore.toggle()"
      @keydown.enter="aiStore.toggle()"
    >
      <img class="ai-icon icon-default" :src="iconDefault" alt="AI 办案助手" />
      <img class="ai-icon icon-hover" :src="iconHover" alt="AI 办案助手" />
    </div>
  </el-tooltip>
</template>

<script setup>
import { useAiAssistantStore } from '@/stores/aiAssistant'

const aiStore = useAiAssistantStore()

// 图标：正常态 / hover 态
const iconDefault = `${import.meta.env.BASE_URL}tu/AI-top.png`
const iconHover = `${import.meta.env.BASE_URL}tu/AI-top-hover.png`
</script>

<style scoped lang="scss">
.ai-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  cursor: pointer;
  position: relative;

  .ai-icon {
    width: 24px;
    height: 24px;
    object-fit: contain;
    pointer-events: none;
    position: absolute;
    transition: opacity 0.2s ease;
  }

  .icon-hover {
    opacity: 0;
  }

  &:hover,
  &:focus-visible,
  &.active {
    outline: none;

    .icon-default {
      opacity: 0;
    }

    .icon-hover {
      opacity: 1;
    }
  }
}

/* 移动端隐藏顶栏 AI 图标（随顶栏菜单一起隐藏） */
@media (max-width: 768px) {
  .ai-icon-btn {
    display: none;
  }
}
</style>
