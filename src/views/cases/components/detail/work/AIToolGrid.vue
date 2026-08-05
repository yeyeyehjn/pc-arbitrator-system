<template>
  <div class="ai-tool-grid section-card">
    <div class="section-title">AI 辅助工具</div>
    <div class="tool-grid">
      <div
        v-for="tool in tools"
        :key="tool.key"
        class="tool-card"
        @click="handleOpen(tool)"
      >
        <el-icon class="tool-icon"><component :is="tool.icon" /></el-icon>
        <div class="tool-name">{{ tool.name }}</div>
        <div class="tool-desc">{{ tool.desc }}</div>
      </div>
    </div>

    <AIToolDrawer
      v-model:visible="drawerVisible"
      :tool-key="currentToolKey"
      @copy-to-editor="handleCopy"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { MagicStick, Document, Connection, Aim, Reading } from '@element-plus/icons-vue'
import AIToolDrawer from './AIToolDrawer.vue'

const emit = defineEmits(['copy-to-editor'])

const drawerVisible = ref(false)
const currentToolKey = ref('')

const tools = [
  { key: 'awardCheck', name: '裁决书AI辅助自查', desc: '合规性与逻辑性自查', icon: MagicStick },
  { key: 'materialSummary', name: '案件材料摘要', desc: '自动汇总材料要点', icon: Document },
  { key: 'factAnalysis', name: '案件事实梳理', desc: '梳理事实脉络', icon: Connection },
  { key: 'focusPoints', name: '争议焦点归纳', desc: '提炼双方争议焦点', icon: Aim },
  { key: 'legalRules', name: '高频法条与规则库', desc: '推荐相关法条与规则', icon: Reading },
]

const handleOpen = (tool) => {
  currentToolKey.value = tool.key
  drawerVisible.value = true
}

const handleCopy = () => {
  emit('copy-to-editor')
}
</script>

<style scoped lang="scss">
.ai-tool-grid {
  .tool-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;

    .tool-card {
      background-color: #ffffff;
      border: 1px solid var(--el-border-color-light);
      border-radius: 4px;
      padding: 16px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--el-color-primary);
        box-shadow: 0 2px 8px rgba(5, 61, 153, 0.1);
      }

      .tool-icon {
        font-size: 28px;
        color: var(--el-color-primary);
        margin-bottom: 8px;
      }

      .tool-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-regular);
        margin-bottom: 4px;
      }

      .tool-desc {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}
</style>
