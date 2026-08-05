<template>
  <div class="hearing-schedule section-card">
    <div class="section-title">庭审排期</div>
    <div v-if="hearings.length === 0" class="empty-wrap">
      <CaseEmptyState text="本案暂未排期" />
    </div>
    <div v-else class="hearing-list">
      <div
        v-for="(item, idx) in hearings"
        :key="item.id"
        class="hearing-item"
        :class="{ highlight: idx === 0 }"
      >
        <div class="hearing-date">{{ item.date }}</div>
        <div class="hearing-type">
          <el-tag :type="idx === 0 ? 'primary' : 'info'" size="small">{{ item.type }}</el-tag>
        </div>
        <div class="hearing-location">{{ item.location }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCaseDetailStore } from '@/stores/caseDetail'
import CaseEmptyState from '../../shared/CaseEmptyState.vue'

const store = useCaseDetailStore()
const hearings = computed(() => store.hearings)
</script>

<style scoped lang="scss">
.hearing-schedule {
  .empty-wrap {
    padding: 12px 0;
  }

  .hearing-list {
    .hearing-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px;
      border-radius: 4px;
      transition: background-color 0.2s;

      & + .hearing-item {
        margin-top: 4px;
      }

      &:not(.highlight):hover {
        background-color: #f5f7fa;
      }

      &.highlight {
        background-color: #f2f5fa;
        margin-bottom: 4px;
      }

      .hearing-date {
        font-size: 14px;
        color: var(--el-text-color-regular);
        white-space: nowrap;
      }

      .hearing-location {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        flex: 1;
      }
    }
  }
}
</style>
