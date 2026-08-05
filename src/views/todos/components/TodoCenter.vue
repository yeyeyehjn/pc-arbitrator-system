<template>
  <div class="todo-center">
    <el-tabs v-model="activeTab" class="center-tabs">
      <el-tab-pane label="延期办理" name="extension">
        <ExtensionTable
          :data="extensionList"
          @approve="openApproveDialog"
          @batch-approve="handleBatchApprove"
        />
      </el-tab-pane>
      <el-tab-pane label="选择首席" name="chief">
        <ChiefTable :data="chiefList" @select="openChiefDialog" />
      </el-tab-pane>
    </el-tabs>

    <!-- 延期审批弹窗 -->
    <el-dialog
      v-model="approveDialogVisible"
      title="延期审批"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="approve-form">
        <p><span class="label">案号：</span>{{ currentRow?.caseNo }}</p>
        <p><span class="label">案由：</span>{{ currentRow?.caseReason }}</p>
        <p><span class="label">申请人：</span>{{ currentRow?.applicant }}</p>
        <p><span class="label">被申请人：</span>{{ currentRow?.respondent }}</p>
        <el-divider />
        <div class="reason-block">
          <span class="label">延期原因：</span>
          <div class="reason-content">{{ currentRow?.extensionReason }}</div>
        </div>
        <p class="days-line"><span class="label">申请延期天数：</span><strong>{{ currentRow?.extensionDays }} 天</strong></p>
      </div>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleApprove('reject')">驳回</el-button>
        <el-button type="primary" @click="handleApprove('approve')">同意</el-button>
      </template>
    </el-dialog>

    <!-- 选择首席弹窗 -->
    <el-dialog
      v-model="chiefDialogVisible"
      title="选择首席仲裁员"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="chief-form">
        <p><span class="label">案号：</span>{{ currentRow?.caseNo }}</p>
        <p><span class="label">案由：</span>{{ currentRow?.caseReason }}</p>
        <el-divider />
        <el-form label-width="100px" label-position="left">
          <el-form-item label="首席仲裁员">
            <el-select v-model="selectedChief" placeholder="请选择首席仲裁员" style="width: 100%">
              <el-option v-for="arb in arbitratorOptions" :key="arb" :label="arb" :value="arb" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="chiefDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleChiefConfirm">确认选择</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTodoStore } from '@/stores/todo'
import ExtensionTable from './shared/ExtensionTable.vue'
import ChiefTable from './shared/ChiefTable.vue'

const todoStore = useTodoStore()
const { extensionList, chiefList } = storeToRefs(todoStore)

const activeTab = ref('extension')
const currentRow = ref(null)

// 延期审批
const approveDialogVisible = ref(false)
const openApproveDialog = (row) => {
  currentRow.value = row
  approveDialogVisible.value = true
}

const handleApprove = (action) => {
  todoStore.approveExtension(currentRow.value.id, action)
  ElMessage.success(action === 'approve' ? '已同意延期申请' : '已驳回延期申请')
  approveDialogVisible.value = false
}

const handleBatchApprove = (rows) => {
  ElMessageBox.confirm(`确认一键同意 ${rows.length} 项延期申请？`, '批量同意确认', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      const ids = rows.map((r) => r.id)
      todoStore.approveBatch(ids, 'approve')
      ElMessage.success(`已批量同意 ${rows.length} 项延期申请`)
    })
    .catch(() => {})
}

// 选择首席
const chiefDialogVisible = ref(false)
const selectedChief = ref('')
const arbitratorOptions = ['李四 仲裁员', '王五 仲裁员', '赵六 仲裁员', '钱七 仲裁员']

const openChiefDialog = (row) => {
  currentRow.value = row
  selectedChief.value = ''
  chiefDialogVisible.value = true
}

const handleChiefConfirm = () => {
  if (!selectedChief.value) {
    ElMessage.warning('请选择首席仲裁员')
    return
  }
  todoStore.selectChief(currentRow.value.id, { chief: selectedChief.value })
  ElMessage.success('首席仲裁员选择成功')
  chiefDialogVisible.value = false
}
</script>

<style scoped lang="scss">
.center-tabs {
  :deep(.el-tabs__item.is-active) {
    color: var(--el-color-primary);
    font-weight: 600;
  }
  :deep(.el-tabs__active-line) {
    background-color: var(--el-color-primary);
  }
}

.approve-form,
.chief-form {
  p {
    margin: 10px 0;
    font-size: 14px;
    color: var(--el-text-color-regular);
    .label {
      color: var(--el-text-color-secondary);
      margin-right: 8px;
    }
  }

  .reason-block {
    margin: 12px 0;
    .reason-content {
      margin-top: 8px;
      padding: 12px 16px;
      background-color: #f5f7fa;
      border-radius: 4px;
      line-height: 1.8;
      color: var(--el-text-color-regular);
    }
  }

  .days-line strong {
    color: var(--el-color-primary);
    font-size: 16px;
  }
}
</style>
