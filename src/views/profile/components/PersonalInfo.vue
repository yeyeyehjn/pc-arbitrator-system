<template>
  <div class="personal-info">
    <!-- 基本信息 -->
    <InfoSection
      title="基本信息"
      class="main-info-section"
      v-model="basicEditing"
      :hide-edit-actions="true"
      @save="handleSaveBasic"
      @cancel="handleCancelBasic"
    >
      <!-- 只读态 -->
      <template #view>
        <div class="basic-view">
          <!-- 主体行：姓名锚点 + 核心标识 -->
          <header class="basic-hero">
            <div class="hero-avatar" aria-hidden="true">
              <el-icon><User /></el-icon>
            </div>
            <div class="hero-text">
              <h3 class="hero-name">{{ basicInfo.name || '未填写姓名' }}</h3>
              <div class="hero-sub">
                <span v-if="basicInfo.gender" class="hero-gender">{{ basicInfo.gender }}</span>
                <span v-if="basicInfo.gender && basicInfo.nationality" class="hero-sep">·</span>
                <span v-if="basicInfo.nationality" class="hero-nation">{{ basicInfo.nationality }}</span>
                <span v-if="basicInfo.idCard" class="hero-id">{{ basicInfo.idCard }}</span>
              </div>
            </div>
          </header>

          <!-- 证件信息网格 -->
          <div class="meta-grid">
            <div class="meta-cell">
              <div class="meta-label">
                <el-icon class="meta-icon"><CreditCard /></el-icon>
                <span>其他证件类型</span>
              </div>
              <div class="meta-value">{{ basicInfo.otherIdType || '-' }}</div>
            </div>
            <div class="meta-cell">
              <div class="meta-label">
                <el-icon class="meta-icon"><Postcard /></el-icon>
                <span>其他证件号码</span>
              </div>
              <div class="meta-value num-text">{{ basicInfo.otherIdNo || '-' }}</div>
            </div>
            <div class="meta-cell">
              <div class="meta-label">
                <el-icon class="meta-icon"><Calendar /></el-icon>
                <span>证件有效期</span>
              </div>
              <div class="meta-value num-text">{{ basicInfo.otherIdExpiry || '-' }}</div>
            </div>
          </div>

          <!-- 联系方式网格 -->
          <div class="meta-grid">
            <div class="meta-cell">
              <div class="meta-label">
                <el-icon class="meta-icon"><Iphone /></el-icon>
                <span>手机号码</span>
              </div>
              <div class="meta-value">
                <a v-if="basicInfo.phone" :href="'tel:' + basicInfo.phone" class="link-text num-text">{{ basicInfo.phone }}</a>
                <span v-else class="meta-empty">-</span>
              </div>
            </div>
            <div class="meta-cell meta-cell--wide">
              <div class="meta-label">
                <el-icon class="meta-icon"><Message /></el-icon>
                <span>电子邮箱</span>
              </div>
              <div class="meta-value">
                <a v-if="basicInfo.email" :href="'mailto:' + basicInfo.email" class="link-text">{{ basicInfo.email }}</a>
                <span v-else class="meta-empty">-</span>
              </div>
            </div>
          </div>

          <!-- 地址列表 -->
          <div class="address-section">
            <div class="meta-label address-section-label">
              <el-icon class="meta-icon"><LocationInformation /></el-icon>
              <span>地址信息</span>
            </div>
            <div class="address-list">
              <div
                v-for="addr in addressList"
                :key="addr.key"
                class="address-row"
                :class="{ 'is-preferred': addr.preferred }"
              >
                <div class="address-row-head">
                  <span class="address-type">{{ addr.label }}</span>
                </div>
                <div class="address-text">{{ addr.value || '未填写' }}</div>
                <el-tag v-if="addr.preferred" size="small" type="primary" effect="light" class="preferred-tag">首选</el-tag>
              </div>
            </div>
          </div>
        </div>
      </template>
      <!-- 编辑态 -->
      <template #edit>
        <el-form ref="basicFormRef" :model="basicForm" :rules="basicRules" label-width="120px" label-position="left" class="basic-edit-form">
          <el-form-item label="姓名">
            <span class="readonly-text">{{ basicInfo.name }}</span>
          </el-form-item>
          <el-form-item label="身份证号">
            <span class="readonly-text">{{ basicInfo.idCard }}</span>
          </el-form-item>
          <el-form-item label="国籍/地区">
            <span class="readonly-text">{{ basicInfo.nationality }}</span>
          </el-form-item>
          <el-form-item label="证件类型" prop="otherIdType">
            <el-select v-model="basicForm.otherIdType" placeholder="请选择证件类型" style="width: 100%">
              <el-option label="身份证" value="身份证" />
              <el-option label="护照" value="护照" />
              <el-option label="港澳台证件" value="港澳台证件" />
              <el-option label="军官证" value="军官证" />
            </el-select>
          </el-form-item>
          <el-form-item label="证件号码" prop="otherIdNo">
            <el-input v-model="basicForm.otherIdNo" placeholder="请输入证件号码" />
          </el-form-item>
          <el-form-item label="证件有效期" prop="otherIdExpiry">
            <el-date-picker
              v-model="basicForm.otherIdExpiry"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择有效期"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="手机号码" prop="phone">
            <el-input v-model="basicForm.phone" placeholder="请输入手机号码" />
          </el-form-item>
          <el-form-item label="性别" prop="gender">
            <el-select v-model="basicForm.gender" placeholder="请选择性别" style="width: 100%">
              <el-option label="男" value="男" />
              <el-option label="女" value="女" />
            </el-select>
          </el-form-item>
          <el-form-item label="电子邮箱" prop="email">
            <el-input v-model="basicForm.email" placeholder="请输入电子邮箱" />
          </el-form-item>
          <el-form-item label="居住地址">
            <div class="address-row">
              <el-input v-model="basicForm.addresses.home" placeholder="请输入居住地址" />
              <el-radio v-model="basicForm.addresses.preferred" value="home">设为首选</el-radio>
            </div>
          </el-form-item>
          <el-form-item label="单位地址">
            <div class="address-row">
              <el-input v-model="basicForm.addresses.work" placeholder="请输入单位地址" />
              <el-radio v-model="basicForm.addresses.preferred" value="work">设为首选</el-radio>
            </div>
          </el-form-item>
          <el-form-item label="其他地址">
            <div class="address-row">
              <el-input v-model="basicForm.addresses.other" placeholder="请输入其他地址" />
              <el-radio v-model="basicForm.addresses.preferred" value="other">设为首选</el-radio>
            </div>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSaveBasic">保存</el-button>
            <el-button @click="handleCancelBasic">取消</el-button>
          </el-form-item>
        </el-form>
      </template>
    </InfoSection>

    <!-- 修改密码 -->
    <div class="section-card pwd-section">
      <div class="section-title-row">
        <div class="section-title">修改密码</div>
      </div>
      <div class="section-subtitle"><el-icon class="subtitle-icon"><InfoFilled /></el-icon><span>定期修改密码以保护账户安全，密码需 8-20 位且包含字母和数字</span></div>
      <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="120px" label-position="left" class="pwd-form">
        <el-form-item label="修改方式">
          <el-radio-group v-model="pwdMode">
            <el-radio value="sms">短信验证方式</el-radio>
            <el-radio value="old">旧密码方式</el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="pwdMode === 'sms'">
          <el-form-item label="短信验证码" prop="smsCode">
            <div class="sms-row">
              <el-input v-model="pwdForm.smsCode" placeholder="请输入短信验证码" />
              <el-button
                type="primary"
                :disabled="smsCounting > 0"
                @click="handleSendSms"
              >
                {{ smsCounting > 0 ? `${smsCounting}s 后重新获取` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="旧密码" prop="oldPassword">
            <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="请输入旧密码" />
          </el-form-item>
        </template>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="8-20位，需含字母和数字" />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleChangePassword">修改密码</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Iphone,
  Message,
  InfoFilled,
  User,
  CreditCard,
  Postcard,
  Calendar,
  LocationInformation,
} from '@element-plus/icons-vue'
import { useProfileStore } from '@/stores/profile'
import InfoSection from './shared/InfoSection.vue'

const profileStore = useProfileStore()

// ============ 响应式列数 ============
const windowWidth = ref(window.innerWidth)
const descColumn = computed(() => (windowWidth.value <= 768 ? 1 : 2))
const handleResize = () => { windowWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', handleResize))
onBeforeUnmount(() => window.removeEventListener('resize', handleResize))

// ============ 基本信息 ============
const basicInfo = computed(() => profileStore.basicInfo)
const basicEditing = ref(false)

// 地址列表（用于只读态渲染）
const addressList = computed(() => {
  const a = basicInfo.value.addresses || {}
  const preferred = a.preferred
  return [
    { key: 'home', label: '居住地址', value: a.home, preferred: preferred === 'home' },
    { key: 'work', label: '单位地址', value: a.work, preferred: preferred === 'work' },
    { key: 'other', label: '其他地址', value: a.other, preferred: preferred === 'other' },
  ]
})
const basicFormRef = ref(null)
const basicForm = reactive({
  otherIdType: '',
  otherIdNo: '',
  otherIdExpiry: '',
  phone: '',
  gender: '',
  email: '',
  addresses: { home: '', work: '', other: '', preferred: 'home' },
})

const basicRules = {
  phone: [
    { pattern: /^1\d{10}$/, message: '请输入正确的手机号（11位、首位为1）', trigger: 'blur' },
  ],
  email: [
    { pattern: /^[\w.-]+@[\w-]+(\.[\w-]+)+$/, message: '请输入正确的邮箱地址', trigger: 'blur' },
  ],
}

const handleStartEdit = () => {
  Object.assign(basicForm, {
    otherIdType: basicInfo.value.otherIdType,
    otherIdNo: basicInfo.value.otherIdNo,
    otherIdExpiry: basicInfo.value.otherIdExpiry,
    phone: basicInfo.value.phone,
    gender: basicInfo.value.gender,
    email: basicInfo.value.email,
    addresses: { ...basicInfo.value.addresses },
  })
}

// 监听 editing 变化初始化表单
import { watch } from 'vue'
watch(basicEditing, (val) => {
  if (val) handleStartEdit()
})

const handleSaveBasic = async () => {
  if (!basicFormRef.value) return
  await basicFormRef.value.validate(async (valid) => {
    if (!valid) return
    // 证件有效期过期提示
    if (basicForm.otherIdExpiry) {
      const today = new Date().toISOString().substring(0, 10)
      if (basicForm.otherIdExpiry < today) {
        ElMessage.warning('证件已过期')
      }
    }
    await profileStore.updateBasicInfo({
      otherIdType: basicForm.otherIdType,
      otherIdNo: basicForm.otherIdNo,
      otherIdExpiry: basicForm.otherIdExpiry,
      phone: basicForm.phone,
      gender: basicForm.gender,
      email: basicForm.email,
      addresses: { ...basicForm.addresses },
    })
    ElMessage.success('保存成功')
    basicEditing.value = false
  })
}

const handleCancelBasic = () => {
  basicFormRef.value?.resetFields()
}

// ============ 修改密码 ============
const pwdFormRef = ref(null)
const pwdMode = ref('sms')
const smsCounting = ref(0)
let smsTimer = null
const pwdForm = reactive({
  smsCode: '',
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const validateNewPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入新密码'))
  } else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/.test(value)) {
    callback(new Error('密码需 8-20 位且包含字母和数字'))
  } else {
    if (pwdForm.confirmPassword) {
      pwdFormRef.value?.validateField('confirmPassword')
    }
    callback()
  }
}

const validateConfirmPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入新密码'))
  } else if (value !== pwdForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const pwdRules = {
  smsCode: [{ required: true, message: '请输入短信验证码', trigger: 'blur' }],
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [{ required: true, validator: validateNewPassword, trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: validateConfirmPassword, trigger: 'blur' }],
}

const handleSendSms = () => {
  if (!basicInfo.value.phone) {
    ElMessage.warning('请先填写手机号码')
    return
  }
  smsCounting.value = 60
  smsTimer = setInterval(() => {
    smsCounting.value--
    if (smsCounting.value <= 0) {
      clearInterval(smsTimer)
      smsTimer = null
    }
  }, 1000)
  ElMessage.success('验证码已发送（mock）')
}

const handleChangePassword = async () => {
  if (!pwdFormRef.value) return
  await pwdFormRef.value.validate(async (valid) => {
    if (!valid) return
    const payload = pwdMode.value === 'sms'
      ? { mode: 'sms', smsCode: pwdForm.smsCode, newPassword: pwdForm.newPassword }
      : { mode: 'old', oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword }
    await profileStore.changePassword(payload)
    ElMessage.success('密码修改成功')
    pwdFormRef.value.resetFields()
    pwdForm.smsCode = ''
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
  })
}

onBeforeUnmount(() => {
  if (smsTimer) clearInterval(smsTimer)
})
</script>

<style scoped lang="scss">
.personal-info {
  .link-text {
    color: var(--el-color-primary);
    text-decoration: none;
    transition: color 0.2s ease;
    &:hover {
      text-decoration: underline;
      color: var(--el-color-primary-dark-2);
    }
  }

  .readonly-text {
    color: var(--el-text-color-secondary);
  }

  .basic-edit-form,
  .pwd-form {
    max-width: 640px;
  }

  .address-row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 96%;

    .el-input {
      flex: 1;
    }
  }

  .sms-row {
    display: flex;
    gap: 12px;
    width: 100%;

    .el-input {
      flex: 1;
    }
  }
}

/* ============ 基本信息：只读态 ============ */
.basic-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

/* 主体行 */
.basic-hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.hero-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  color: #ffffff;
  font-size: 22px;
}

.hero-text {
  min-width: 0;
  flex: 1;
}

.hero-name {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
}

.hero-sub {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.hero-gender {
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.hero-sep {
  color: var(--el-text-color-placeholder);
}

.hero-id {
  margin-left: 6px;
  padding-left: 8px;
  border-left: 1px solid var(--el-border-color);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

/* 元数据网格 */
.meta-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px 24px;
}

.meta-grid:has(.meta-cell--wide) {
  grid-template-columns: 1fr 2fr;
}

.meta-cell {
  min-width: 0;
}

.meta-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
  margin-bottom: 4px;
}

.meta-icon {
  font-size: 14px;
  color: var(--el-color-primary-light-5);
}

.meta-value {
  font-size: 14px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  min-width: 0;
  word-break: break-all;
}

.num-text {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}

.meta-empty {
  color: var(--el-text-color-placeholder);
}

/* 地址区块 */
.address-section {
  padding-top: 18px;
  border-top: 1px solid var(--el-border-color-lighter);
  min-width: 0;
}

.address-section-label {
  margin-bottom: 12px;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.address-row {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 6px;
  background-color: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  transition: border-color 0.2s ease, background-color 0.2s ease;

  &.is-preferred {
    background-color: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-5);
    // box-shadow: 0 0 0 1px var(--el-color-primary-light-5);

    .address-type {
      color: var(--el-color-primary);
    }
  }
}

.address-row-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  width: 96px;
  padding-top: 1px;
}

.address-type {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.preferred-tag {
  flex-shrink: 0;
  align-self: center;
}

.address-text {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  word-break: break-all;
}

/* ============ 修改密码卡片 ============ */
.pwd-section {
  .section-subtitle {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 16px;
    padding: 8px 12px;
    background-color: #f8f8f9;
    border-radius: 4px;
    line-height: 1.5;

    .subtitle-icon {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      flex-shrink: 0;
    }
  }
}

/* ============ 响应式 ============ */
@media (max-width: 768px) {
  .personal-info {
    .basic-edit-form,
    .pwd-form {
      max-width: 100%;
    }

    .sms-row {
      flex-direction: column;
      align-items: stretch;
    }
  }

  .meta-grid,
  .meta-grid:has(.meta-cell--wide) {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .address-row-head {
    width: 80px;
  }

  .hero-id {
    margin-left: 0;
    padding-left: 0;
    border-left: none;
    width: 100%;
  }

  .personal-info .address-row {
    width: 90%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .personal-info .link-text,
  .address-row {
    transition: none;
  }
}
</style>
