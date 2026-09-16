<template>
  <div class="todo-center">
    <el-tabs v-model="activeTab" class="center-tabs">
      <el-tab-pane label="延期办理" name="extension">
        <ExtensionTable
          :data="extensionList"
          @approve="openApproveDialog"
          @detail="openDetailDialog"
          @batch-approve="handleBatchApprove"
        />
      </el-tab-pane>
      <el-tab-pane label="选择首席" name="chief">
        <ChiefTable :data="chiefList" @select="openChiefDialog" />
      </el-tab-pane>
    </el-tabs>

    <!-- 延期审批/详情弹窗 -->
    <el-dialog
      v-model="approveDialogVisible"
      :title="dialogMode === 'approve' ? '延期审批' : '延期办理详情'"
      width="760px"
      :close-on-click-modal="false"
    >
      <div class="extension-dialog">
        <!-- 案件基本信息 -->
        <div class="dialog-section">
          <div class="section-title">案件基本信息</div>
          <div class="case-no-row">
            <span class="case-no">{{ currentRow?.caseNo }}</span>
            <el-tag v-if="(currentRow?.extensionCount ?? 0) > 0" size="small" type="info">已延期 {{ currentRow.extensionCount }} 次</el-tag>
            <el-tag v-else size="small" type="info">首次申请延期</el-tag>
          </div>
          <div class="desc-grid">
            <div class="desc-item">
              <span class="desc-label">申请人</span>
              <span class="desc-value">{{ currentRow?.applicant }}</span>
            </div>
            <div class="desc-item">
              <span class="desc-label">被申请人</span>
              <span class="desc-value">{{ currentRow?.respondent }}</span>
            </div>
            <div class="desc-item">
              <span class="desc-label">案由</span>
              <span class="desc-value">{{ currentRow?.caseReason }}</span>
            </div>
          </div>
        </div>

        <!-- 申请信息 -->
        <div class="dialog-section">
          <div class="section-title">申请信息</div>
          <div class="desc-grid">
            <div class="desc-item">
              <span class="desc-label">状态</span>
              <span class="desc-value">
                <el-tag v-if="currentRow?.applyStatus === '已完成'" type="success" size="small">已完成</el-tag>
                <el-tag v-else type="warning" size="small">审批中</el-tag>
              </span>
            </div>
            <div class="desc-item">
              <span class="desc-label">延期期限</span>
              <span class="desc-value">{{ currentRow?.extensionTerm || '暂无' }}</span>
            </div>
            <div class="desc-item desc-item-full">
              <span class="desc-label">延期原因</span>
              <span class="desc-value">{{ currentRow?.extensionReason || '暂无' }}</span>
            </div>
            <div class="desc-item desc-item-full">
              <span class="desc-label">备注</span>
              <span class="desc-value">{{ currentRow?.remark || '暂无' }}</span>
            </div>
          </div>
        </div>

        <!-- 审批流程（经典 OA 审批流） -->
        <div class="dialog-section">
          <div class="section-title">审批流程</div>
          <div class="oa-flow">
            <template v-if="(currentRow?.approvalFlow || []).length">
              <div v-for="(node, idx) in currentRow?.approvalFlow || []" :key="idx" class="oa-node">
                <div class="oa-node-main">
                  <div class="oa-node-icon" :class="node.done ? 'is-done' : 'is-pending'">
                    <el-icon :size="14"><Check v-if="node.done" /><Clock v-else /></el-icon>
                  </div>
                  <div class="oa-node-content">
                    <div class="oa-node-head">
                      <!-- 第一级为呈批人（发起人），后续节点为审批人 -->
                      <span class="oa-node-name">{{ idx === 0 ? '呈批人：' : '审批人：' }}{{ idx === 0 ? node.submitter : node.approver }}</span>
                      <el-tag size="small" :type="node.done ? 'success' : 'warning'">
                        {{ node.done ? '已审批' : '待审批' }}
                      </el-tag>
                      <!-- 意见紧随状态标签右侧 -->
                      <span v-if="node.done && node.opinion" class="oa-node-opinion">意见：{{ node.opinion }}</span>
                      <span class="oa-node-time">{{ node.approvalTime || '待审批' }}</span>
                    </div>
                    <!-- 待审批节点仅保留状态；已审批节点仅展示备注 -->
                    <div v-if="node.done" class="oa-node-detail">
                      <p><span class="detail-label">备注：</span>{{ node.approvalRemark || '暂无' }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="oa-flow-empty">暂无审批记录</div>
          </div>
        </div>

        <!-- 审批操作（仅待审批可操作） -->
        <div v-if="dialogMode === 'approve'" class="dialog-section">
          <div class="section-title">审批操作</div>
          <el-form label-width="100px" label-position="left">
            <el-form-item label="审批结果" required>
              <el-radio-group v-model="approveForm.result">
                <el-radio value="同意">同意</el-radio>
                <el-radio value="退回上一级">退回上一级</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="审批意见" required>
              <el-input
                v-model="approveForm.opinion"
                type="textarea"
                :rows="3"
                maxlength="200"
                show-word-limit
                placeholder="请输入审批意见"
              />
            </el-form-item>
            <el-form-item label="下级审批人" :required="approveForm.result === '同意'">
              <el-select
                v-model="approveForm.nextApprover"
                placeholder="请选择下级审批人"
                clearable
                :disabled="approveForm.result === '退回上一级'"
                style="width: 100%"
              >
                <el-option v-for="arb in arbitratorOptions" :key="arb" :label="arb" :value="arb" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <template v-if="dialogMode === 'approve'">
          <el-button @click="approveDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitApprove">提交审批</el-button>
        </template>
        <el-button v-else @click="approveDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 选择首席弹窗 -->
    <ChiefSelectDialog
      v-model="chiefDialogVisible"
      :row="currentRow"
      @confirm="handleChiefConfirm"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTodoStore } from '@/stores/todo'
import ExtensionTable from './shared/ExtensionTable.vue'
import ChiefTable from './shared/ChiefTable.vue'
import ChiefSelectDialog from './shared/ChiefSelectDialog.vue'

const todoStore = useTodoStore()
const { extensionList, chiefList } = storeToRefs(todoStore)

const activeTab = ref('extension')
const currentRow = ref(null)

// 延期审批 / 详情
const approveDialogVisible = ref(false)
const dialogMode = ref('approve') // approve: 审批（待审批） | detail: 详情（已审批）
// 审批结果默认置空：延期属重大决定，不允许无意识默认同意
const approveForm = ref({ result: '', opinion: '', nextApprover: '' })

const openApproveDialog = (row) => {
  currentRow.value = row
  dialogMode.value = 'approve'
  approveForm.value = { result: '', opinion: '', nextApprover: '' }
  approveDialogVisible.value = true
}

const openDetailDialog = (row) => {
  currentRow.value = row
  dialogMode.value = 'detail'
  approveDialogVisible.value = true
}

const handleSubmitApprove = () => {
  if (!approveForm.value.result) {
    ElMessage.warning('请选择审批结果')
    return
  }
  if (!approveForm.value.opinion.trim()) {
    ElMessage.warning('请输入审批意见')
    return
  }
  if (approveForm.value.result === '同意' && !approveForm.value.nextApprover) {
    ElMessage.warning('请选择下级审批人')
    return
  }
  const { result, opinion, nextApprover } = approveForm.value
  const summary = [
    `审批结果：${result}`,
    `审批意见：${opinion}`,
    result === '同意' && nextApprover ? `下级审批人：${nextApprover}` : '',
  ].filter(Boolean).join('\n')
  ElMessageBox.confirm(`请确认本次审批：\n${summary}`, '审批确认', {
    confirmButtonText: '确认提交',
    cancelButtonText: '返回修改',
    type: 'warning',
  })
    .then(() => {
      todoStore.approveExtension(currentRow.value.id, { ...approveForm.value })
      ElMessage.success(result === '同意' ? '已同意延期申请' : '已退回上一级')
      approveDialogVisible.value = false
    })
    .catch(() => {})
}

const handleBatchApprove = (rows) => {
  ElMessageBox.confirm(`确认一键同意 ${rows.length} 项延期申请？`, '批量同意确认', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      const ids = rows.map((r) => r.id)
      todoStore.approveBatch(ids, { result: '同意', opinion: '同意延期申请（一键同意）' })
      ElMessage.success(`已批量同意 ${rows.length} 项延期申请`)
    })
    .catch(() => {})
}

// 选择首席
const chiefDialogVisible = ref(false)
// 延期审批弹窗「下级审批人」选项
const arbitratorOptions = ['李四 仲裁员', '王五 仲裁员', '赵六 仲裁员', '钱七 仲裁员']

const openChiefDialog = (row) => {
  currentRow.value = row
  chiefDialogVisible.value = true
}

const handleChiefConfirm = (chiefs) => {
  todoStore.selectChief(currentRow.value.id, chiefs)
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

.extension-dialog {
  .dialog-section {
    margin-bottom: 20px;

    // 区块间以 hairline 分隔，增强审批流较长时的归属感
    & + .dialog-section {
      padding-top: 20px;
      border-top: 1px solid var(--el-border-color-lighter);
    }

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    margin-bottom: 12px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  // 案号行：加粗黑字 + 延期次数标签（案号为区块内强调，低于区块标题层级）
  .case-no-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    .case-no {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      letter-spacing: 0.2px;
    }
  }

  // 白底描述列表：label 灰色小字在上，值黑色在下，两列网格
  .desc-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 24px;
    row-gap: 16px;
  }

  .desc-item {
    min-width: 0;

    &.desc-item-full {
      grid-column: 1 / -1;
    }
  }

  .desc-label {
    display: block;
    margin-bottom: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .desc-value {
    display: block;
    font-size: 14px;
    color: #303133;
    line-height: 1.5;
    word-break: break-all;
  }

  // 经典 OA 审批流：图标节点 + 竖线连接，白底无卡片
  .oa-flow {
    .oa-node {
      position: relative;
      padding-bottom: 20px;

      &:last-child {
        padding-bottom: 0;
      }

      // 连接线：位于图标圆心下方，延伸至下一节点
      &::after {
        content: '';
        position: absolute;
        left: 11px;
        top: 32px;
        bottom: 0;
        width: 2px;
        background-color: var(--el-border-color-lighter);
      }

      &:last-child::after {
        display: none;
      }
    }

    .oa-node-main {
      position: relative;
      z-index: 1;
      display: flex;
      gap: 12px;
    }

    .oa-node-icon {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      &.is-done {
        background-color: var(--el-color-success);
        color: #fff;
      }

      &.is-pending {
        background-color: #fff;
        border: 1px solid var(--el-color-warning);
        color: var(--el-color-warning);
      }
    }

    .oa-node-content {
      flex: 1;
      min-width: 0;
    }

    .oa-node-head {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 24px;
    }

    .oa-node-name {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }

    // 意见紧随状态标签右侧，长文本省略防止挤压时间
    .oa-node-opinion {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .oa-node-time {
      margin-left: auto;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .oa-node-detail {
      margin-top: 8px;

      p {
        margin: 4px 0;
        font-size: 14px;
        line-height: 1.5;
        color: #303133;
      }

      .detail-label {
        color: var(--el-text-color-secondary);
      }
    }

    .oa-flow-empty {
      padding: 16px 0;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
