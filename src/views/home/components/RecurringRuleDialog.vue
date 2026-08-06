<template>
  <el-dialog
    :model-value="visible"
    title="周期规则管理"
    width="560px"
    :close-on-click-modal="false"
    append-to-body
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="recurring-rule-dialog">
      <!-- 已设置规则列表 -->
      <div class="form-label">已设置规则（{{ store.recurringRules.length }}）</div>

      <div v-if="store.recurringRules.length === 0" class="empty-state">
        <el-icon class="empty-icon"><Calendar /></el-icon>
        <div class="empty-text">暂无周期规则</div>
        <div class="empty-tip">可在下方新增规则</div>
      </div>

      <div v-else class="rule-list">
        <div
          v-for="rule in store.recurringRules"
          :key="rule.id"
          class="rule-item"
        >
          <!-- 只读展示 -->
          <template v-if="editingId !== rule.id">
            <div class="rule-info">
              <div class="rule-title">
                每周{{ getWeekdayLabel(rule.weekday) }} · {{ getPeriodLabel(rule.period) }}不可用
              </div>
              <div class="rule-desc">
                {{ rule.reason || '无事由' }}
              </div>
            </div>
            <div class="rule-actions">
              <el-button text size="small" @click="startEdit(rule)">编辑</el-button>
              <el-button text size="small" type="danger" @click="handleDelete(rule)">删除</el-button>
            </div>
          </template>

          <!-- 编辑表单（inline 替换） -->
          <div v-else class="rule-edit-form">
            <div class="edit-fields">
              <el-select v-model="editForm.weekday" size="small" style="width: 90px">
                <el-option
                  v-for="opt in WEEKDAY_OPTIONS"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
              <el-select v-model="editForm.period" size="small" style="width: 90px">
                <el-option
                  v-for="opt in PERIOD_OPTIONS"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
              <el-input
                v-model="editForm.reason"
                size="small"
                placeholder="事由（选填）"
                maxlength="50"
                style="flex: 1"
              />
            </div>
            <div class="edit-actions">
              <el-button size="small" @click="cancelEdit">取消</el-button>
              <el-button size="small" type="primary" @click="saveEdit(rule.id)">保存</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 新增表单 -->
      <div class="add-form">
        <div class="add-form-title">+ 新增周期规则</div>
        <div class="add-fields">
          <el-select v-model="addForm.weekday" size="small" style="width: 90px">
            <el-option
              v-for="opt in WEEKDAY_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-select v-model="addForm.period" size="small" style="width: 90px">
            <el-option
              v-for="opt in PERIOD_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-input
            v-model="addForm.reason"
            size="small"
            placeholder="事由（选填）"
            maxlength="50"
            style="flex: 1"
          />
          <el-button size="small" type="primary" @click="handleAdd">添加</el-button>
        </div>
      </div>

      <!-- 说明 -->
      <div class="form-tip">
        <strong>说明：</strong>周期规则会自动应用到日历未来日期。已设置的单日状态不受规则变更影响。
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar } from '@element-plus/icons-vue'
import { useCalendarStore } from '@/stores/calendar'

defineProps({
  visible: { type: Boolean, default: false },
})
defineEmits(['update:visible'])

const store = useCalendarStore()

// 选项常量
const WEEKDAY_OPTIONS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 0, label: '周日' },
]
const PERIOD_OPTIONS = [
  { value: 'AM', label: '上午' },
  { value: 'PM', label: '下午' },
  { value: 'ALL', label: '全天' },
]

const getWeekdayLabel = (v) => WEEKDAY_OPTIONS.find(o => o.value === v)?.label || ''
const getPeriodLabel = (v) => PERIOD_OPTIONS.find(o => o.value === v)?.label || ''

// 新增表单
const addForm = ref({ weekday: 1, period: 'PM', reason: '' })

// 编辑状态：editingId 非 null 时表示正在编辑某条
const editingId = ref(null)
const editForm = ref({ weekday: 1, period: 'PM', reason: '' })

// 新增
const handleAdd = () => {
  if (store.isRuleDuplicate(addForm.value.weekday, addForm.value.period)) {
    ElMessage.error('该星期同时段已有规则')
    return
  }
  store.addRecurringRule({
    weekday: addForm.value.weekday,
    period: addForm.value.period,
    reason: addForm.value.reason,
  })
  ElMessage.success('规则已添加')
  addForm.value = { weekday: 1, period: 'PM', reason: '' }
}

// 进入编辑
const startEdit = (rule) => {
  editingId.value = rule.id
  editForm.value = {
    weekday: rule.weekday,
    period: rule.period,
    reason: rule.reason || '',
  }
}

// 取消编辑
const cancelEdit = () => {
  editingId.value = null
}

// 保存编辑
const saveEdit = (id) => {
  if (store.isRuleDuplicate(editForm.value.weekday, editForm.value.period, id)) {
    ElMessage.error('该星期同时段已有规则')
    return
  }
  store.updateRecurringRule(id, editForm.value)
  ElMessage.success('规则已更新')
  editingId.value = null
}

// 删除
const handleDelete = async (rule) => {
  try {
    await ElMessageBox.confirm(
      `确认删除"每周${getWeekdayLabel(rule.weekday)} · ${getPeriodLabel(rule.period)}不可用"规则？`,
      '删除周期规则',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
    store.deleteRecurringRule(rule.id)
    ElMessage.success('规则已删除')
  } catch (e) {
    // 用户取消
  }
}
</script>

<style scoped lang="scss">
.recurring-rule-dialog {
  .form-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
  }

  .empty-state {
    text-align: center;
    padding: 24px 0;
    background: var(--el-fill-color-light);
    border-radius: 4px;
    margin-bottom: 16px;

    .empty-icon {
      font-size: 32px;
      color: var(--el-text-color-placeholder);
      margin-bottom: 8px;
    }
    .empty-text {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
    .empty-tip {
      font-size: 10px;
      color: var(--el-text-color-placeholder);
      margin-top: 4px;
    }
  }

  .rule-list {
    margin-bottom: 16px;
  }
  .rule-item {
    background: var(--el-fill-color-light);
    padding: 10px 12px;
    border-radius: 4px;
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .rule-info {
      .rule-title {
        font-size: 12px;
        color: var(--el-text-color-primary);
        font-weight: 600;
      }
      .rule-desc {
        font-size: 10px;
        color: var(--el-text-color-secondary);
        margin-top: 2px;
      }
    }
    .rule-actions {
      display: flex;
      gap: 4px;
    }

    .rule-edit-form {
      width: 100%;
      .edit-fields {
        display: flex;
        gap: 6px;
        margin-bottom: 8px;
      }
      .edit-actions {
        display: flex;
        justify-content: flex-end;
        gap: 6px;
      }
    }
  }

  .add-form {
    border: 1px dashed var(--el-color-primary);
    border-radius: 4px;
    padding: 12px;
    background: var(--el-color-primary-light-9);

    .add-form-title {
      font-size: 12px;
      color: var(--el-color-primary);
      font-weight: 600;
      margin-bottom: 10px;
    }
    .add-fields {
      display: flex;
      gap: 6px;
      align-items: center;
    }
  }

  .form-tip {
    margin-top: 12px;
    padding: 8px 10px;
    background: var(--el-color-primary-light-9);
    border-radius: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
  }
}
</style>
