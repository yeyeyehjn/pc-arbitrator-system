<template>
  <div class="bank-account">
    <InfoSection
      title="银行账号信息"
      v-model="editing"
      :hide-edit-actions="true"
      @save="handleSave"
      @cancel="handleCancel"
    >
      <!-- 只读态 -->
      <template #view>
        <div class="bank-view">
          <!-- 银行卡视觉主体 -->
          <div class="bank-card-hero">
            <div class="bank-card-chip" aria-hidden="true">
              <span class="chip-line"></span>
              <span class="chip-line"></span>
              <span class="chip-line"></span>
            </div>
            <div class="bank-card-brand">
              <el-icon class="brand-icon"><CreditCard /></el-icon>
              <span class="bank-name-text">{{ bank.bankName || '未设置' }}</span>
            </div>
            <div class="bank-card-number">
              <span class="num-group num-group--mask">••••</span>
              <span class="num-group num-group--mask">••••</span>
              <span class="num-group num-group--mask">••••</span>
              <span class="num-group num-group--last">{{ accountLast4 }}</span>
            </div>
            <div class="bank-card-footer">
              <div class="card-footer-item">
                <span class="footer-label">账户名称</span>
                <span class="footer-value">{{ bank.accountName || '-' }}</span>
              </div>
              <div class="card-footer-item card-footer-item--right">
                <span class="footer-label">银行账号</span>
                <span class="footer-value num-text" :class="{ 'is-revealed': revealAccount }">{{ revealAccount ? bank.accountNo : maskedAccount }}</span>
              </div>
            </div>
            <button
              type="button"
              class="reveal-toggle"
              :aria-label="revealAccount ? '隐藏账号' : '显示完整账号'"
              @click="revealAccount = !revealAccount"
            >
              <el-icon><View v-if="!revealAccount" /><Hide v-else /></el-icon>
            </button>
          </div>

          <!-- 身份状态徽章 -->
          <div class="status-badges">
            <div
              class="status-badge"
              :class="bank.isCivilServant === 'yes' ? 'is-warning' : 'is-safe'"
            >
              <el-icon class="badge-icon"><CircleCheck v-if="bank.isCivilServant !== 'yes'" /><Warning v-else /></el-icon>
              <div class="badge-text">
                <span class="badge-label">公务员/参公人员</span>
                <span class="badge-value">{{ bank.isCivilServant === 'yes' ? '是' : '否' }}</span>
              </div>
            </div>
            <div
              class="status-badge"
              :class="bank.isNonRemuneration === 'yes' ? 'is-warning' : 'is-safe'"
            >
              <el-icon class="badge-icon"><CircleCheck v-if="bank.isNonRemuneration !== 'yes'" /><Warning v-else /></el-icon>
              <div class="badge-text">
                <span class="badge-label">其他依法不取酬人员</span>
                <span class="badge-value">{{ bank.isNonRemuneration === 'yes' ? '是' : '否' }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
      <!-- 编辑态 -->
      <template #edit>
        <el-form ref="formRef" :model="form" :rules="rules" label-width="180px" label-position="left" class="bank-edit-form">
          <el-form-item label="是否公务员/参公人员" prop="isCivilServant">
            <el-radio-group v-model="form.isCivilServant" @change="handleRemunerationChange">
              <el-radio value="yes">是</el-radio>
              <el-radio value="no">否</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="是否其他依法不取酬人员" prop="isNonRemuneration">
            <el-radio-group v-model="form.isNonRemuneration" @change="handleRemunerationChange">
              <el-radio value="yes">是</el-radio>
              <el-radio value="no">否</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="开户银行" prop="bankName">
            <el-select v-model="form.bankName" placeholder="请选择开户银行" style="width: 100%">
              <el-option label="中国工商银行" value="中国工商银行" />
              <el-option label="中国农业银行" value="中国农业银行" />
              <el-option label="中国银行" value="中国银行" />
              <el-option label="中国建设银行" value="中国建设银行" />
              <el-option label="交通银行" value="交通银行" />
              <el-option label="招商银行" value="招商银行" />
              <el-option label="中国邮政储蓄银行" value="中国邮政储蓄银行" />
              <el-option label="浦发银行" value="浦发银行" />
              <el-option label="中信银行" value="中信银行" />
              <el-option label="中国民生银行" value="中国民生银行" />
            </el-select>
          </el-form-item>
          <el-form-item label="账户名称">
            <span class="readonly-text">{{ bank.accountName }}</span>
          </el-form-item>
          <el-form-item label="银行账号" prop="accountNo">
            <el-input v-model="form.accountNo" placeholder="请输入银行账号" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSave">保存</el-button>
            <el-button @click="handleCancel">取消</el-button>
          </el-form-item>
        </el-form>
      </template>
    </InfoSection>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CreditCard, View, Hide, CircleCheck, Warning } from '@element-plus/icons-vue'
import { useProfileStore } from '@/stores/profile'
import InfoSection from './shared/InfoSection.vue'

const profileStore = useProfileStore()

// ============ 响应式列数 ============
const windowWidth = ref(window.innerWidth)
const descColumn = computed(() => (windowWidth.value <= 768 ? 1 : 2))
const handleResize = () => { windowWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', handleResize))
onBeforeUnmount(() => window.removeEventListener('resize', handleResize))

// ============ 数据 ============
const bank = computed(() => profileStore.bank)
const editing = ref(false)
const formRef = ref(null)

// 账号显隐
const revealAccount = ref(false)
const accountLast4 = computed(() => {
  const no = bank.value.accountNo
  return no ? no.slice(-4) : '----'
})
const maskedAccount = computed(() => {
  const no = bank.value.accountNo
  if (!no) return '-'
  return no.replace(/\d(?=\d{4})/g, '•')
})
const form = reactive({
  isCivilServant: 'no',
  isNonRemuneration: 'no',
  bankName: '',
  accountNo: '',
})

// 保存原始值用于回退
const original = ref({ isCivilServant: 'no', isNonRemuneration: 'no' })

const validateAccountNo = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入银行账号'))
  } else if (!/^\d{16,19}$/.test(value)) {
    callback(new Error('请输入正确的银行账号（16-19位数字）'))
  } else {
    callback()
  }
}

const rules = {
  isCivilServant: [{ required: true, message: '请选择', trigger: 'change' }],
  isNonRemuneration: [{ required: true, message: '请选择', trigger: 'change' }],
  bankName: [{ required: true, message: '请选择开户银行', trigger: 'change' }],
  accountNo: [{ required: true, validator: validateAccountNo, trigger: 'blur' }],
}

watch(editing, (val) => {
  if (val) {
    form.isCivilServant = bank.value.isCivilServant
    form.isNonRemuneration = bank.value.isNonRemuneration
    form.bankName = bank.value.bankName
    form.accountNo = bank.value.accountNo
    original.value = {
      isCivilServant: bank.value.isCivilServant,
      isNonRemuneration: bank.value.isNonRemuneration,
    }
  }
})

const handleRemunerationChange = async () => {
  const wasNo = original.value.isCivilServant === 'no' && original.value.isNonRemuneration === 'no'
  const nowYes = form.isCivilServant === 'yes' || form.isNonRemuneration === 'yes'
  if (wasNo && nowYes) {
    try {
      await ElMessageBox.confirm(
        '取酬人员身份变更将影响酬金发放，请确认',
        '提示',
        { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' },
      )
    } catch {
      // 用户取消，回退
      form.isCivilServant = original.value.isCivilServant
      form.isNonRemuneration = original.value.isNonRemuneration
    }
  }
}

const handleSave = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    await profileStore.updateBank({ ...form })
    ElMessage.success('保存成功')
    editing.value = false
  })
}

const handleCancel = () => {
  formRef.value?.resetFields()
}
</script>

<style scoped lang="scss">
.bank-account {
  .readonly-text {
    color: var(--el-text-color-secondary);
  }

  .bank-edit-form {
    max-width: 640px;
  }
}

/* ============ 银行卡视觉主体 ============ */
.bank-view {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.bank-card-hero {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;
  height: 180px;
  padding: 22px 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, #053d99 0%, #0a5bc4 55%, #1e6fd6 100%);
  color: #fff;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(5, 61, 153, 0.25);

  // 卡片背景纹理：斜向光泽
  &::before {
    content: '';
    position: absolute;
    top: -40%;
    right: -20%;
    width: 60%;
    height: 180%;
    background: linear-gradient(115deg, transparent 40%, rgba(255, 255, 255, 0.08) 50%, transparent 60%);
    transform: rotate(-12deg);
    pointer-events: none;
  }

  // 装饰圆弧
  &::after {
    content: '';
    position: absolute;
    bottom: -60px;
    right: -30px;
    width: 140px;
    height: 140px;
    border-radius: 50%;
    border: 20px solid rgba(255, 255, 255, 0.06);
    pointer-events: none;
  }
}

// 芯片装饰
.bank-card-chip {
  position: absolute;
  top: 24px;
  left: 24px;
  width: 36px;
  height: 26px;
  border-radius: 4px;
  background: linear-gradient(135deg, #e8c878 0%, #c9a85c 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  padding: 0 5px;

  .chip-line {
    height: 1px;
    background: rgba(0, 0, 0, 0.18);
  }
}

.bank-card-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 48px;

  .brand-icon {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.85);
  }

  .bank-name-text {
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.02em;
    color: rgba(255, 255, 255, 0.95);
  }
}

// 卡号
.bank-card-number {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 500;
  letter-spacing: 0.08em;
  font-variant-numeric: tabular-nums;

  .num-group {
    &--mask {
      color: rgba(255, 255, 255, 0.7);
      font-size: 16px;
    }

    &--last {
      color: #fff;
      font-weight: 600;
    }
  }
}

// 卡片底部信息
.bank-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
}

.card-footer-item {
  display: flex;
  flex-direction: column;
  gap: 2px;

  &--right {
    text-align: right;
  }

  .footer-label {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.6);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .footer-value {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.95);

    &.is-revealed {
      letter-spacing: 0.04em;
    }
  }
}

// 显隐切换按钮
.reveal-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: background-color 0.2s ease;
  backdrop-filter: blur(4px);

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.6);
    outline-offset: 2px;
  }
}

/* ============ 身份状态徽章 ============ */
.status-badges {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color);
  transition: border-color 0.2s ease, background-color 0.2s ease;

  .badge-icon {
    font-size: 18px;
    flex-shrink: 0;
  }

  .badge-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .badge-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.4;
  }

  .badge-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    line-height: 1.4;
  }

  // 安全态（否）：绿色
  &.is-safe {
    background-color: var(--el-color-success-light-9);
    border-color: var(--el-color-success-light-7);

    .badge-icon {
      color: var(--el-color-success);
    }

    .badge-value {
      color: var(--el-color-success);
    }
  }

  // 警示态（是）：橙色
  &.is-warning {
    background-color: var(--el-color-warning-light-9);
    border-color: var(--el-color-warning-light-7);

    .badge-icon {
      color: var(--el-color-warning);
    }

    .badge-value {
      color: var(--el-color-warning);
    }
  }
}

/* ============ 响应式 ============ */
@media (max-width: 768px) {
  .bank-account .bank-edit-form {
    max-width: 100%;
  }

  .bank-card-hero {
    height: auto;
    padding: 18px 18px;
    gap: 16px;
  }

  .bank-card-chip {
    top: 18px;
    left: 18px;
  }

  .bank-card-brand {
    padding-left: 48px;
  }

  .bank-card-number {
    font-size: 16px;
    gap: 10px;

    .num-group--mask {
      font-size: 14px;
    }
  }

  .bank-card-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .card-footer-item--right {
    text-align: left;
  }

  .status-badges {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .reveal-toggle,
  .status-badge {
    transition: none;
  }
}
</style>
