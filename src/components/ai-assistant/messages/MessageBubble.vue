<template>
  <div class="message-bubble" :class="message.role">
    <!-- AI 头像 -->
    <div v-if="message.role === 'assistant'" class="bubble-avatar" role="img" aria-label="AI" :style="{ backgroundImage: `url('${aiAvatar}'), linear-gradient(135deg, #6b4fbb, #9254de)` }"></div>

    <div class="bubble-content-wrapper">
      <!-- 文本内容 -->
      <div class="bubble-text" v-if="shownText">{{ shownText }}</div>

      <!-- pending 态 -->
      <div v-if="message.pending" class="bubble-pending">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="pending-text">AI 思考中…</span>
      </div>

      <!-- 产物卡片 -->
      <div v-if="message.cards && message.cards.length" class="bubble-cards">
        <template v-for="(card, idx) in message.cards" :key="idx">
          <LegalCards
            v-if="card.type === 'legal'"
            :payload="card.payload"
            @quote="$emit('quote-law', $event)"
          />
          <CaseCards
            v-else-if="card.type === 'case'"
            :payload="card.payload"
          />
          <DraftPreview
            v-else-if="card.type === 'draft'"
            :payload="card.payload"
            @fill-editor="$emit('fill-editor', $event)"
          />
          <GuideSteps
            v-else-if="card.type === 'guide'"
            :payload="card.payload"
          />
          <SummaryCard
            v-else-if="card.type === 'summary'"
            :payload="card.payload"
          />
        </template>
      </div>
    </div>

    <!-- 用户头像 -->
    <div v-if="message.role === 'user'" class="bubble-avatar user-avatar">我</div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import LegalCards from './LegalCards.vue'
import CaseCards from './CaseCards.vue'
import DraftPreview from './DraftPreview.vue'
import GuideSteps from './GuideSteps.vue'
import SummaryCard from './SummaryCard.vue'

const props = defineProps({
  message: { type: Object, required: true },
})
const emit = defineEmits(['fill-editor', 'quote-law', 'type-tick'])

// AI 头像图片：必须拼接 BASE_URL（vite base 为 /pc-arbitrator-system/）
const aiAvatar = `${import.meta.env.BASE_URL}tu/AI-write.png`

// ============ 打字机效果（AI 回复逐字显示） ============
const displayText = ref('')
let typeTimer = null
// 组件挂载时已存在的内容（历史消息 / 欢迎语直接显示，不做打字机）
const initialContent = props.message.content

// 无障碍降级：系统开启减少动态效果时直接显示全文
const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

watch(
  () => props.message.content,
  (val, old) => {
    if (props.message.role !== 'assistant' || !val) {
      displayText.value = val || ''
      return
    }
    // 挂载时已有内容（历史消息 / 欢迎语）：直接显示
    if (val === initialContent) {
      displayText.value = val
      return
    }
    // 新回复：逐字显示（content 从空填充为完整回复）
    if (prefersReducedMotion || old) {
      displayText.value = val
      return
    }
    let i = 0
    displayText.value = ''
    typeTimer = setInterval(() => {
      i += 2
      displayText.value = val.slice(0, i)
      emit('type-tick')
      if (i >= val.length) {
        clearInterval(typeTimer)
        typeTimer = null
      }
    }, 30)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (typeTimer) clearInterval(typeTimer)
})

// 用户消息直接显示全文；AI 消息显示打字进度
const shownText = computed(() =>
  props.message.role === 'user' ? props.message.content : displayText.value
)
</script>

<style scoped lang="scss">
.message-bubble {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;

  &.user {
    justify-content: flex-end;

    .bubble-text {
      background: linear-gradient(135deg, #6b4fbb, #9254de);
      color: #fff;
      border-radius: 12px 12px 2px 12px;
    }
  }

  &.assistant {
    .bubble-text {
      background-color: #fff;
      color: var(--el-text-color-regular);
      border: 1px solid var(--el-border-color-light);
      border-radius: 12px 12px 12px 2px;
    }
  }
}

.bubble-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  &.user-avatar {
    background: linear-gradient(135deg, #6b4fbb, #9254de);
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.bubble-content-wrapper {
  max-width: calc(100% - 40px);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bubble-text {
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.bubble-pending {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 14px;
  background-color: #fff;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px 12px 12px 2px;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--el-text-color-placeholder);
    animation: dot-pulse 1.4s infinite ease-in-out;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
  .pending-text {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-left: 4px;
  }
}

@keyframes dot-pulse {
  0%, 80%, 100% { opacity: 0.3; }
  40% { opacity: 1; }
}

.bubble-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (prefers-reduced-motion: reduce) {
  .dot { animation: none; opacity: 0.6; }
}
</style>
