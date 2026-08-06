<template>
  <el-drawer
    v-model="aiStore.visible"
    direction="rtl"
    :size="drawerWidth"
    :with-header="false"
    class="ai-assistant-drawer"
    @open="onDrawerOpen"
  >
    <div class="ai-drawer-container">
      <!-- ① 头部 -->
      <div class="ai-drawer-header">
        <div class="header-left">
          <div class="ai-avatar" role="img" aria-label="AI 办案助手" :style="{ backgroundImage: `url('${aiAvatar}'), linear-gradient(135deg, #6b4fbb, #9254de)` }"></div>
          <div class="header-titles">
            <span class="header-title">AI 办案助手</span>
            <span class="header-status"><span class="status-dot"></span> 在线</span>
          </div>
        </div>
        <div class="header-actions">
          <el-tooltip content="新会话" placement="bottom" :show-after="300">
            <el-icon class="header-btn" role="button" tabindex="0" aria-label="新会话"
              @click="aiStore.newSession()" @keydown.enter="aiStore.newSession()"><RefreshRight /></el-icon>
          </el-tooltip>
          <el-tooltip content="历史记录" placement="bottom" :show-after="300">
            <el-icon class="header-btn header-btn-disabled" aria-label="历史记录（开发中）"><Clock /></el-icon>
          </el-tooltip>
          <el-tooltip content="关闭" placement="bottom" :show-after="300">
            <el-icon class="header-btn" role="button" tabindex="0" aria-label="关闭"
              @click="aiStore.close()" @keydown.enter="aiStore.close()"><Close /></el-icon>
          </el-tooltip>
        </div>
      </div>

      <!-- ② 案件上下文条 -->
      <ContextBar />

      <!-- ③ 对话流 -->
      <MessageList
        :messages="aiStore.messages"
        @fill-editor="handleFillEditor"
      />

      <!-- ④ 快捷指令 -->
      <QuickCommands />

      <!-- ⑤ 输入区 -->
      <div class="ai-input-area">
        <div class="input-row">
          <el-input
            ref="inputRef"
            v-model="inputText"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 4 }"
            placeholder="输入您的问题，按 Enter 发送，Shift+Enter 换行,AI 助手仅供参考"
            maxlength="2000"
            resize="none"
            @keydown="handleKeydown"
          />
          <el-button
            class="send-btn"
            type="primary"
            :icon="Promotion"
            :disabled="!inputText.trim()"
            @click="handleSend"
          />
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Promotion, RefreshRight, Clock, Close } from '@element-plus/icons-vue'
import { useAiAssistantStore } from '@/stores/aiAssistant'
import { useCaseDetailStore } from '@/stores/caseDetail'
import MessageList from './messages/MessageList.vue'
import ContextBar from './ContextBar.vue'
import QuickCommands from './QuickCommands.vue'

const route = useRoute()
const aiStore = useAiAssistantStore()
const caseStore = useCaseDetailStore()

// AI 头像图片：必须拼接 BASE_URL（vite base 为 /pc-arbitrator-system/）
const aiAvatar = `${import.meta.env.BASE_URL}tu/AI-write.png`

const inputText = ref('')
const inputRef = ref(null)

const drawerWidth = computed(() => {
  return window.innerWidth <= 768 ? '100%' : '70%'
})

// 回车发送 / Shift+回车换行
const handleKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

const handleSend = () => {
  const text = inputText.value.trim()
  if (!text) return
  aiStore.sendMessage(text)
  inputText.value = ''
}

const handleFillEditor = (draftPayload) => {
  aiStore.fillIntoEditor(draftPayload)
}

// 抽屉打开时恢复会话
const onDrawerOpen = () => {
  aiStore.restoreSession()
}

// 案件上下文联动：监听路由 + caseDetail store
const updateContext = () => {
  if (route.path.startsWith('/cases/') && caseStore.currentCaseId && caseStore.caseInfo?.caseNo) {
    const claims = caseStore.claims?.claimList?.map(c => c.content) || []
    const hearing = caseStore.hearings?.[0]
    aiStore.setContext(caseStore.currentCaseId, {
      id: caseStore.currentCaseId,
      caseNo: caseStore.caseInfo.caseNo,
      reason: caseStore.caseInfo.case_reason,
      status: caseStore.caseInfo.caseStatus,
      amount: caseStore.caseInfo.amount,
      parties: caseStore.parties,
      claims,
      hearingDate: hearing?.date,
      hearingLocation: hearing?.location,
      progress: hearing
        ? `${caseStore.caseInfo.caseStatus}，待开庭（${hearing.date}）`
        : caseStore.caseInfo.caseStatus,
    })
  } else {
    aiStore.clearContext()
  }
}

onMounted(() => {
  updateContext()
})

watch(
  () => caseStore.currentCaseId,
  () => updateContext()
)

watch(
  () => route.path,
  () => updateContext()
)
</script>

<style scoped lang="scss">
.ai-drawer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.ai-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;

    .ai-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      flex-shrink: 0;
    }

    .header-titles {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .header-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-regular);
      }
      .header-status {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        display: flex;
        align-items: center;
        gap: 4px;

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #67c23a;
        }
      }
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;

    .header-btn {
      font-size: 16px;
      color: var(--el-text-color-secondary);
      cursor: pointer;
      border-radius: 6px;
      transition: color 0.2s ease, background-color 0.2s ease;

      &:hover,
      &:focus-visible {
        color: #6b4fbb;
        background-color: rgba(107, 79, 187, 0.08);
        outline: none;
      }

      &.header-btn-disabled {
        opacity: 0.45;
        cursor: not-allowed;
        &:hover { color: var(--el-text-color-secondary); background-color: transparent; }
      }
    }
  }
}

.ai-input-area {
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;

  .input-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;

    :deep(.el-textarea__inner) {
      border-radius: 8px;
      font-size: 14px;
      padding: 8px 12px;
      resize: none;
    }

    .send-btn {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      padding: 0;
      background: linear-gradient(135deg, #6b4fbb, #9254de);
      border-color: #6b4fbb;
    }
  }
}
</style>

<!-- 非 scoped：el-drawer teleport 到 body，scoped 不生效 -->
<style lang="scss">
.ai-assistant-drawer.el-drawer {
  .el-drawer__body {
    padding: 0;
  }
}
</style>
