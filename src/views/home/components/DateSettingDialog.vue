<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="480px"
    :close-on-click-modal="false"
    append-to-body
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="date-setting-dialog">
      <!-- 当日状态 -->
      <div class="form-section">
        <div class="form-label">当日状态</div>
        <el-radio-group v-model="form.status" class="status-group">
          <el-radio-button value="available">可用</el-radio-button>
          <el-radio-button value="unavailable">不可用</el-radio-button>
          <el-radio-button value="partial">部分不可用</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 时段设置（仅 partial 时显示） -->
      <div v-if="form.status === 'partial'" class="form-section segment-section">
        <div class="form-label">时段设置</div>
        <div class="segment-grid">
          <div class="segment-card">
            <div class="segment-title">上午 09:00-12:00</div>
            <div class="segment-toggle">
              <el-radio-group v-model="segments.am" size="small">
                <el-radio-button :value="true">可用</el-radio-button>
                <el-radio-button :value="false">不可用</el-radio-button>
              </el-radio-group>
            </div>
          </div>
          <div class="segment-card">
            <div class="segment-title">下午 14:00-18:00</div>
            <div class="segment-toggle">
              <el-radio-group v-model="segments.pm" size="small">
                <el-radio-button :value="true">可用</el-radio-button>
                <el-radio-button :value="false">不可用</el-radio-button>
              </el-radio-group>
            </div>
          </div>
        </div>
      </div>

      <!-- 事由 -->
      <div class="form-section">
        <div class="form-label">事由（选填）</div>
        <el-input
          v-model="form.reason"
          maxlength="50"
          placeholder="如：出差、其他开庭、个人事务"
        />
      </div>

      <!-- 周期规则影响提示 -->
      <div v-if="recurringHint" class="recurring-hint">
        <strong>提示：</strong>{{ recurringHint }}
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <span
          v-if="store.hasDaySlot(date)"
          class="clear-link"
          @click="handleClear"
        >清除单日设置</span>
        <span v-else></span>
        <div class="footer-actions">
          <el-button @click="$emit('update:visible', false)">取消</el-button>
          <el-button
            type="primary"
            :loading="saving"
            @click="handleSave"
          >保存</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCalendarStore } from '@/stores/calendar'

const props = defineProps({
  visible: { type: Boolean, default: false },
  date: { type: String, default: '' },
})

const emit = defineEmits(['update:visible', 'saved'])

const store = useCalendarStore()

const dialogTitle = computed(() => {
  if (!props.date) return '设置日期状态'
  const d = new Date(props.date)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`
})

// 表单状态
const form = ref({
  status: 'available',
  reason: '',
})
const segments = ref({ am: true, pm: false })

// 周期规则影响提示
const recurringHint = computed(() => {
  if (!props.date) return ''
  // 查周期规则是否影响该日期
  const weekday = new Date(props.date).getDay()
  const rules = store.recurringRules.filter(r => r.weekday === weekday)
  if (rules.length === 0) return ''
  const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const parts = rules.map(r => {
    const periodText = r.period === 'ALL' ? '全天' : r.period === 'AM' ? '上午' : '下午'
    return `${periodText}不可用`
  })
  return `该日期受周期规则影响（${weekdayNames[weekday]}${parts.join('、')}）。当前设置将覆盖周期规则。`
})

// 弹窗打开时初始化表单
watch(
  () => props.visible,
  (val) => {
    if (val && props.date) {
      if (store.hasDaySlot(props.date)) {
        // 已有单日设置：回填
        const existing = store.daySlots.find(s => s.date === props.date)
        form.value.status = existing.status
        form.value.reason = existing.reason || ''
        if (existing.status === 'partial' && existing.segments) {
          const am = existing.segments.find(s => s.period === 'AM')
          const pm = existing.segments.find(s => s.period === 'PM')
          segments.value.am = am ? am.available : true
          segments.value.pm = pm ? pm.available : false
        }
      } else {
        // 无单日设置：默认值（参考周期规则）
        const status = store.getDayStatus(props.date)
        form.value.status = status.status === 'available' ? 'available' : status.status
        form.value.reason = status.reason || ''
        if (status.status === 'partial' && status.segments) {
          const am = status.segments.find(s => s.period === 'AM')
          const pm = status.segments.find(s => s.period === 'PM')
          segments.value.am = am ? am.available : true
          segments.value.pm = pm ? pm.available : false
        } else {
          segments.value.am = true
          segments.value.pm = false
        }
      }
    }
  },
  { immediate: true }
)

const saving = ref(false)

const handleSave = () => {
  saving.value = true
  try {
    const payload = {
      date: props.date,
      status: form.value.status,
      reason: form.value.reason,
      segments:
        form.value.status === 'partial'
          ? [
              { period: 'AM', available: segments.value.am, reason: '' },
              { period: 'PM', available: segments.value.pm, reason: '' },
            ]
          : null,
    }
    store.saveDaySlot(payload)
    ElMessage.success('设置已保存')
    emit('saved')
    emit('update:visible', false)
  } catch (e) {
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

const handleClear = async () => {
  try {
    await ElMessageBox.confirm(
      '清除后该日期将回退到周期规则或默认可用状态，是否继续？',
      '清除单日设置',
      { type: 'warning', confirmButtonText: '清除', cancelButtonText: '取消' }
    )
    store.deleteDaySlot(props.date)
    ElMessage.success('已清除单日设置')
    emit('saved')
    emit('update:visible', false)
  } catch (e) {
    // 用户取消，不处理
  }
}
</script>

<style scoped lang="scss">
.date-setting-dialog {
  .form-section {
    margin-bottom: 16px;
    .form-label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-bottom: 8px;
    }
  }

  .status-group {
    :deep(.el-radio-button__inner) {
      font-size: 12px;
    }
  }

  .segment-section {
    padding: 12px;
    background: var(--el-fill-color-light);
    border-radius: 4px;

    .segment-grid {
      display: flex;
      gap: 10px;
    }
    .segment-card {
      flex: 1;
      background: #fff;
      padding: 10px;
      border-radius: 4px;
      border: 1px solid var(--el-border-color-lighter);

      .segment-title {
        font-size: 12px;
        color: var(--el-text-color-regular);
        margin-bottom: 8px;
      }
    }
  }

  .recurring-hint {
    margin-top: 12px;
    padding: 8px 10px;
    background: var(--el-color-warning-light-9);
    border-radius: 4px;
    font-size: 12px;
    color: var(--el-color-warning);
    line-height: 1.5;
  }
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .clear-link {
    font-size: 12px;
    color: var(--el-color-danger);
    cursor: pointer;
    &:hover {
      opacity: 0.8;
    }
  }
  .footer-actions {
    display: flex;
    gap: 8px;
  }
}
</style>
