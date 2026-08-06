<template>
  <div class="message-bubble" :class="message.role">
    <!-- AI 头像 -->
    <div v-if="message.role === 'assistant'" class="bubble-avatar">AI</div>

    <div class="bubble-content-wrapper">
      <!-- 文本内容 -->
      <div class="bubble-text" v-if="message.content">{{ message.content }}</div>

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
import LegalCards from './LegalCards.vue'
import CaseCards from './CaseCards.vue'
import DraftPreview from './DraftPreview.vue'
import GuideSteps from './GuideSteps.vue'
import SummaryCard from './SummaryCard.vue'

defineProps({
  message: { type: Object, required: true },
})
defineEmits(['fill-editor', 'quote-law'])
</script>

<style scoped lang="scss">
.message-bubble {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;

  &.user {
    justify-content: flex-end;

    .bubble-text {
      background-color: #053d99;
      color: #fff;
      border-radius: 12px 12px 2px 12px;
    }
  }

  &.assistant {
    .bubble-text {
      background-color: #fff;
      color: #303133;
      border: 1px solid #e4e7ed;
      border-radius: 12px 12px 12px 2px;
    }
  }
}

.bubble-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #053d99, #3a6bb5);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;

  &.user-avatar {
    background: linear-gradient(135deg, #053d99, #3a6bb5);
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
  border: 1px solid #e4e7ed;
  border-radius: 12px 12px 12px 2px;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #c0c4cc;
    animation: dot-pulse 1.4s infinite ease-in-out;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
  .pending-text {
    font-size: 13px;
    color: #909399;
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
