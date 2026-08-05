<template>
  <div class="page">
    <!-- Brand Panel -->
    <div class="brand-panel">
      <div class="brand-bg"></div>
      <div class="brand-content">
        <div class="brand-mark">
          <img src="/tu/login/bt-st2.png" alt="广州仲裁委员会" />
        </div>
        <div class="brand-headline">
          <img src="/tu/login/font.png" alt="立信铸就广仲 创新赢得未来" />
        </div>
        <p class="brand-footer">&copy; 1995–2026 广州仲裁委员会 版权所有</p>
      </div>
    </div>

    <!-- Login Panel -->
    <div class="login-panel">
      <!-- Main login form -->
      <div class="login-form" v-show="!forgotMode">
        <h2 class="login-title">案件管理系统</h2>

        <!-- Tabs -->
        <div class="tabs">
          <button
            type="button"
            class="tab"
            :class="{ active: activeTab === 'account' }"
            @click="switchTab('account')"
          >
            账号登录
          </button>
          <button
            type="button"
            class="tab"
            :class="{ active: activeTab === 'phone' }"
            @click="switchTab('phone')"
          >
            手机登录
          </button>
        </div>

        <!-- Account Login -->
        <div v-show="activeTab === 'account'">
          <!-- Step indicator -->
          <div class="steps-bar">
            <div class="step-item" :class="accountStepClass(1)">
              <div class="step-num"><span v-if="accountStep < 2">1</span></div>
              <div class="step-label">账号验证</div>
            </div>
            <div class="step-item" :class="accountStepClass(2)">
              <div class="step-num"><span v-if="accountStep < 3">2</span></div>
              <div class="step-label">双因素校验</div>
            </div>
          </div>

          <!-- Step 1: Account + Password -->
          <div v-show="accountStep === 1" class="step-panel active">
            <div class="field">
              <label>登录账号</label>
              <div class="field-input">
                <input
                  v-model="acctInput"
                  type="text"
                  placeholder="请输入账号/邮箱"
                  autocomplete="username"
                />
                <span class="icon">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 10-16 0" /></svg>
                </span>
              </div>
            </div>
            <div class="field">
              <label>登录密码</label>
              <div class="field-input">
                <input
                  v-model="pwdInput"
                  :type="pwdVisible ? 'text' : 'password'"
                  placeholder="请输入密码"
                  autocomplete="current-password"
                  @keydown="checkCapsLock"
                  @keyup="checkCapsLock"
                  @focus="checkCapsLock"
                />
                <span class="icon">
                  <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                </span>
                <button
                  type="button"
                  class="pwd-toggle"
                  :aria-label="pwdVisible ? '隐藏密码' : '显示密码'"
                  @click="pwdVisible = !pwdVisible"
                >
                  <svg v-if="!pwdVisible" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  <svg v-else viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><path d="M14.12 14.12a3 3 0 01-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                </button>
              </div>
              <div class="caps-hint" :class="{ visible: capsLockOn }">
                <svg viewBox="0 0 24 24"><path d="M12 17a1 1 0 100-2 1 1 0 000 2z" /><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z" /></svg>
                <span>大写锁定已开启</span>
              </div>
            </div>

            <div class="options">
              <label class="remember">
                <input v-model="rememberMe" type="checkbox" />
                <span class="check">
                  <svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg>
                </span>
                <span>下次自动登录</span>
              </label>
              <a href="#" class="forgot" @click.prevent="showForgot">忘记密码</a>
            </div>

            <button type="button" class="btn-login" @click="goToStep2">下一步</button>

            <div class="bottom-links">
              没有账号？<a href="#">立即注册</a>
            </div>
          </div>

          <!-- Step 2: Two-factor verification -->
          <div v-show="accountStep === 2" class="step-panel active">
            <div class="verify-hint">
              <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              <span>为保障账户安全，请完成双因素校验。验证码已发送至您的手机/邮箱，请输入收到的验证码。</span>
            </div>

            <div class="verify-methods">
              <button
                type="button"
                class="verify-method"
                :class="{ active: verifyMethod === 'sms' }"
                @click="setVerifyMethod('sms')"
              >
                短信验证码
              </button>
              <button
                type="button"
                class="verify-method"
                :class="{ active: verifyMethod === 'email' }"
                @click="setVerifyMethod('email')"
              >
                邮件验证码
              </button>
            </div>

            <div class="bound-info">
              <svg v-if="verifyMethod === 'sms'" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></svg>
              <svg v-else viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 6l-10 7L2 6" /></svg>
              <span class="bound-label">接收验证码：</span>
              <span class="bound-value">{{ boundContact }}</span>
            </div>

            <div class="field">
              <label>{{ verifyMethod === 'sms' ? '短信验证码' : '邮件验证码' }}</label>
              <div class="field-input--sms">
                <div class="field-input">
                  <input
                    v-model="verifyInput"
                    type="text"
                    :placeholder="verifyMethod === 'sms' ? '请输入短信验证码' : '请输入邮件验证码'"
                    autocomplete="one-time-code"
                  />
                  <span class="icon">
                    <svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 15l3-3-3-3M13 15h4" /></svg>
                  </span>
                </div>
                <button
                  type="button"
                  class="btn-sms"
                  :disabled="verifyCounting"
                  @click="triggerVerifyCountdown"
                >
                  {{ verifyBtnText }}
                </button>
              </div>
            </div>

            <button type="button" class="btn-login" @click="handleLogin">登 录</button>
            <button type="button" class="btn-back" @click="resetToStep1">返回上一步</button>
          </div>
        </div>

        <!-- Phone Login -->
        <div v-show="activeTab === 'phone'">
          <div class="field">
            <label>手机号码</label>
            <div class="field-input">
              <input v-model="phoneInput" type="tel" placeholder="请输入手机号码" autocomplete="tel" />
              <span class="icon">
                <svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></svg>
              </span>
            </div>
          </div>
          <div class="field">
            <label>验证码</label>
            <div class="field-input--sms">
              <div class="field-input">
                <input v-model="smsInput" type="text" placeholder="请输入短信验证码" autocomplete="one-time-code" />
                <span class="icon">
                  <svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 15l3-3-3-3M13 15h4" /></svg>
                </span>
              </div>
              <button
                type="button"
                class="btn-sms"
                :disabled="smsCounting"
                @click="triggerSmsCountdown"
              >
                {{ smsBtnText }}
              </button>
            </div>
          </div>

          <div class="options">
            <label class="remember">
              <input v-model="rememberMe" type="checkbox" />
              <span class="check">
                <svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg>
              </span>
              <span>下次自动登录</span>
            </label>
            <a href="#" class="forgot" @click.prevent="showForgot">忘记密码</a>
          </div>

          <button type="button" class="btn-login" @click="handleLogin">登 录</button>

          <div class="bottom-links">
            没有账号？<a href="#">立即注册</a>
          </div>
        </div>
      </div>

      <!-- Forgot Password Form -->
      <div class="forgot-form" :class="{ active: forgotMode }" v-show="forgotMode">
        <h2 class="forgot-title">找回密码</h2>
        <p class="forgot-subtitle">通过手机号验证身份，重置您的登录密码</p>

        <!-- Step indicator -->
        <div class="steps-bar">
          <div class="step-item" :class="fpStepClass(1)">
            <div class="step-num"><span v-if="fpStep < 2">1</span></div>
            <div class="step-label">身份验证</div>
          </div>
          <div class="step-item" :class="fpStepClass(2)">
            <div class="step-num"><span v-if="fpStep < 3">2</span></div>
            <div class="step-label">重置密码</div>
          </div>
          <div class="step-item" :class="fpStepClass(3)">
            <div class="step-num"><span v-if="fpStep < 4">3</span></div>
            <div class="step-label">完成</div>
          </div>
        </div>

        <!-- Step 1: Identity verification -->
        <div v-show="fpStep === 1" class="step-panel active">
          <div class="field">
            <label>登录账号</label>
            <div class="field-input">
              <input v-model="fpAccount" type="text" placeholder="请输入登录账号" autocomplete="username" />
              <span class="icon">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 10-16 0" /></svg>
              </span>
            </div>
          </div>
          <div class="field">
            <label>手机号码</label>
            <div class="field-input">
              <input v-model="fpPhone" type="tel" placeholder="请输入绑定的手机号码" autocomplete="tel" />
              <span class="icon">
                <svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></svg>
              </span>
            </div>
          </div>
          <div class="field">
            <label>短信验证码</label>
            <div class="field-input--sms">
              <div class="field-input">
                <input v-model="fpCode" type="text" placeholder="请输入验证码" autocomplete="one-time-code" />
                <span class="icon">
                  <svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 15l3-3-3-3M13 15h4" /></svg>
                </span>
              </div>
              <button
                type="button"
                class="btn-sms"
                :disabled="fpCounting"
                @click="triggerFpCountdown"
              >
                {{ fpBtnText }}
              </button>
            </div>
          </div>

          <button type="button" class="btn-login" @click="fpGoStep2">下一步</button>
          <button type="button" class="btn-back" @click="hideForgot">返回登录</button>
        </div>

        <!-- Step 2: Reset password -->
        <div v-show="fpStep === 2" class="step-panel active">
          <div class="field">
            <label>新密码</label>
            <div class="field-input">
              <input
                v-model="fpNewPwd"
                :type="fpNewPwdVisible ? 'text' : 'password'"
                placeholder="请输入新密码"
                autocomplete="new-password"
                @input="checkPwdMatch"
              />
              <span class="icon">
                <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
              </span>
              <button
                type="button"
                class="pwd-toggle"
                :aria-label="fpNewPwdVisible ? '隐藏密码' : '显示密码'"
                @click="fpNewPwdVisible = !fpNewPwdVisible"
              >
                <svg v-if="!fpNewPwdVisible" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                <svg v-else viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><path d="M14.12 14.12a3 3 0 01-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
              </button>
            </div>
          </div>
          <div class="field">
            <label>确认新密码</label>
            <div class="field-input">
              <input
                ref="fpConfirmPwdRef"
                v-model="fpConfirmPwd"
                :type="fpConfirmPwdVisible ? 'text' : 'password'"
                placeholder="请再次输入新密码"
                autocomplete="new-password"
                @input="checkPwdMatch"
              />
              <span class="icon">
                <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
              </span>
              <button
                type="button"
                class="pwd-toggle"
                :aria-label="fpConfirmPwdVisible ? '隐藏密码' : '显示密码'"
                @click="fpConfirmPwdVisible = !fpConfirmPwdVisible"
              >
                <svg v-if="!fpConfirmPwdVisible" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                <svg v-else viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><path d="M14.12 14.12a3 3 0 01-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
              </button>
            </div>
            <div
              class="pwd-match-hint"
              :class="{ visible: fpMatchVisible, match: fpMatchOk, mismatch: !fpMatchOk }"
            >
              <svg v-if="fpMatchOk" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
              <svg v-else viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              <span>{{ fpMatchText }}</span>
            </div>
          </div>

          <button type="button" class="btn-login" @click="fpGoStep3">确认重置</button>
          <button type="button" class="btn-back" @click="fpStep = 1">上一步</button>
        </div>

        <!-- Step 3: Success -->
        <div v-show="fpStep === 3" class="step-panel active">
          <div class="success-panel">
            <div class="success-icon">
              <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h3 class="success-title">密码重置成功</h3>
            <p class="success-desc">您的密码已成功重置，请使用新密码重新登录。</p>
            <button type="button" class="btn-login" @click="fpDone">返回登录</button>
          </div>
        </div>
      </div>

      <p class="legal-notice">
        本系统由广州仲裁委员会运营，仅限授权人员使用。登录即表示您同意《用户协议》与《隐私政策》。
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 锁定 body 滚动，避免登录页出现多个滚动条
let prevBodyOverflow = ''
onMounted(() => {
  prevBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
})
onUnmounted(() => {
  document.body.style.overflow = prevBodyOverflow
})

// ============ 基础状态 ============
const activeTab = ref('account')
const rememberMe = ref(false)

// 账号登录
const acctInput = ref('')
const pwdInput = ref('')
const pwdVisible = ref(false)
const capsLockOn = ref(false)
const accountStep = ref(1)

// 双因素校验
const verifyMethod = ref('sms')
const verifyInput = ref('')
const verifyCounting = ref(false)
const verifyCountdown = ref(60)
let verifyTimer = null

const boundContacts = {
  sms: '138****8888',
  email: 'z***@gzac.org.cn',
}
const boundContact = computed(() => boundContacts[verifyMethod.value])
const verifyBtnText = computed(() =>
  verifyCounting.value ? `${verifyCountdown.value}s 后重发` : '获取验证码'
)

// 手机登录
const phoneInput = ref('')
const smsInput = ref('')
const smsCounting = ref(false)
const smsCountdown = ref(60)
let smsTimer = null
const smsBtnText = computed(() =>
  smsCounting.value ? `${smsCountdown.value}s 后重发` : '获取验证码'
)

// 找回密码
const forgotMode = ref(false)
const fpStep = ref(1)
const fpAccount = ref('')
const fpPhone = ref('')
const fpCode = ref('')
const fpNewPwd = ref('')
const fpConfirmPwd = ref('')
const fpNewPwdVisible = ref(false)
const fpConfirmPwdVisible = ref(false)
const fpMatchVisible = ref(false)
const fpMatchOk = ref(false)
const fpMatchText = ref('')
const fpCounting = ref(false)
const fpCountdown = ref(60)
let fpTimer = null
const fpBtnText = computed(() =>
  fpCounting.value ? `${fpCountdown.value}s 后重发` : '获取验证码'
)

const fpConfirmPwdRef = ref(null)

// ============ Tab 切换 ============
const switchTab = (tab) => {
  activeTab.value = tab
  if (tab === 'account') resetToStep1()
}

// ============ 大写锁定检测 ============
const checkCapsLock = (e) => {
  capsLockOn.value = !!(e.getModifierState && e.getModifierState('CapsLock'))
}

// ============ 账号登录：步骤控制 ============
const accountStepClass = (step) => {
  if (accountStep.value > step) return 'done'
  if (accountStep.value === step) return 'active'
  return ''
}

const goToStep2 = () => {
  if (!acctInput.value.trim()) {
    ElMessage.warning('请输入登录账号')
    return
  }
  if (!pwdInput.value.trim()) {
    ElMessage.warning('请输入登录密码')
    return
  }
  accountStep.value = 2
  // 进入第二步自动触发验证码发送
  triggerVerifyCountdown()
}

const resetToStep1 = () => {
  accountStep.value = 1
  if (verifyTimer) {
    clearInterval(verifyTimer)
    verifyTimer = null
  }
  verifyCounting.value = false
  verifyCountdown.value = 60
}

const setVerifyMethod = (method) => {
  verifyMethod.value = method
}

const triggerVerifyCountdown = () => {
  if (verifyCounting.value) return
  verifyCounting.value = true
  verifyCountdown.value = 60
  verifyTimer = setInterval(() => {
    verifyCountdown.value--
    if (verifyCountdown.value <= 0) {
      clearInterval(verifyTimer)
      verifyTimer = null
      verifyCounting.value = false
    }
  }, 1000)
}

// 手机登录验证码倒计时
const triggerSmsCountdown = () => {
  if (smsCounting.value) return
  if (!phoneInput.value.trim()) {
    ElMessage.warning('请输入手机号码')
    return
  }
  smsCounting.value = true
  smsCountdown.value = 60
  smsTimer = setInterval(() => {
    smsCountdown.value--
    if (smsCountdown.value <= 0) {
      clearInterval(smsTimer)
      smsTimer = null
      smsCounting.value = false
    }
  }, 1000)
}

// ============ 登录提交 ============
const handleLogin = () => {
  if (activeTab.value === 'account') {
    if (!verifyInput.value.trim()) {
      ElMessage.warning('请输入验证码')
      return
    }
  } else {
    if (!phoneInput.value.trim()) {
      ElMessage.warning('请输入手机号码')
      return
    }
    if (!smsInput.value.trim()) {
      ElMessage.warning('请输入短信验证码')
      return
    }
  }

  // Mock：写入登录态并跳转首页（真实环境调用后端登录接口）
  authStore.setAuth({
    token: 'mock_token_' + Date.now(),
    user: {
      name: '张三',
      role: '仲裁员',
      account: acctInput.value || phoneInput.value,
    },
  })
  ElMessage.success('登录成功')
  router.push('/')
}

// ============ 找回密码 ============
const showForgot = () => {
  forgotMode.value = true
  fpStep.value = 1
}

const hideForgot = () => {
  forgotMode.value = false
}

const fpStepClass = (step) => {
  if (fpStep.value > step) return 'done'
  if (fpStep.value === step) return 'active'
  return ''
}

const fpGoStep2 = () => {
  if (!fpAccount.value.trim()) {
    ElMessage.warning('请输入登录账号')
    return
  }
  if (!fpPhone.value.trim()) {
    ElMessage.warning('请输入手机号码')
    return
  }
  if (!fpCode.value.trim()) {
    ElMessage.warning('请输入验证码')
    return
  }
  fpStep.value = 2
}

const fpGoStep3 = () => {
  if (!fpNewPwd.value.trim()) {
    ElMessage.warning('请输入新密码')
    return
  }
  if (!fpConfirmPwd.value.trim()) {
    ElMessage.warning('请再次输入新密码')
    return
  }
  if (fpNewPwd.value !== fpConfirmPwd.value) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }
  fpStep.value = 3
}

const fpDone = () => {
  fpAccount.value = ''
  fpPhone.value = ''
  fpCode.value = ''
  fpNewPwd.value = ''
  fpConfirmPwd.value = ''
  fpMatchVisible.value = false
  hideForgot()
}

const checkPwdMatch = () => {
  const v1 = fpNewPwd.value
  const v2 = fpConfirmPwd.value
  if (!v2) {
    fpMatchVisible.value = false
    return
  }
  fpMatchVisible.value = true
  if (v1 === v2) {
    fpMatchOk.value = true
    fpMatchText.value = '两次密码一致'
  } else {
    fpMatchOk.value = false
    fpMatchText.value = '两次输入的密码不一致'
  }
}

const triggerFpCountdown = () => {
  if (fpCounting.value) return
  if (!fpPhone.value.trim()) {
    ElMessage.warning('请输入手机号码')
    return
  }
  fpCounting.value = true
  fpCountdown.value = 60
  fpTimer = setInterval(() => {
    fpCountdown.value--
    if (fpCountdown.value <= 0) {
      clearInterval(fpTimer)
      fpTimer = null
      fpCounting.value = false
    }
  }, 1000)
}

// ============ 清理定时器 ============
onUnmounted(() => {
  ;[verifyTimer, smsTimer, fpTimer].forEach((t) => t && clearInterval(t))
})
</script>

<style scoped lang="scss">
$blue: #2563eb;
$blue-hover: #1d4ed8;
$blue-light: #dbeafe;
$blue-50: #eff6ff;
$blue-100: #dbeafe;
$blue-200: #3989c2;
$blue-600: #086cb3;
$blue-700: #15377f;

$slate-50: #f8fafc;
$slate-100: #f1f5f9;
$slate-200: #e2e8f0;
$slate-300: #cbd5e1;
$slate-400: #94a3b8;
$slate-500: #64748b;
$slate-600: #475569;
$slate-700: #334155;
$slate-800: #1e293b;
$slate-900: #0f172a;

$radius: 10px;

.page {
  display: grid;
  grid-template-columns: 1fr 520px;
  height: 100%;
  width: 100%;
  overflow-x: hidden;
  font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ── Brand panel ── */
.brand-panel {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: clamp(40px, 6vw, 80px);

  .brand-bg {
    position: absolute;
    inset: 0;
    background: url('/tu/login/banner10.png') center/cover no-repeat;
    filter: brightness(1.02) saturate(1.1);
    transform: scale(1.05);
    transition: transform 8s ease;
  }
  &:hover .brand-bg {
    transform: scale(1);
  }

  .brand-content {
    position: absolute;
    inset: 0;
    z-index: 1;
  }
  .brand-mark {
    position: absolute;
    top: clamp(24px, 4vw, 40px);
    left: clamp(24px, 4vw, 40px);
    opacity: 0;
    transform: translateY(24px);
    animation: riseIn 1s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards;

    img {
      height: 60px;
      width: auto;
      object-fit: contain;
    }
  }
  .brand-headline {
    position: absolute;
    top: clamp(140px, 2vw, 140px);
    right: clamp(40px, 2vw, 80px);
    line-height: 1.3;
    opacity: 0;
    animation: headlineRiseIn 1s cubic-bezier(0.22, 1, 0.36, 1) 0.5s forwards;

    img {
      height: clamp(80px, 8vw, 160px);
      width: auto;
      object-fit: contain;
      filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1)) drop-shadow(0 8px 24px rgba(0, 0, 0, 0.05));
    }
  }
  .brand-footer {
    position: absolute;
    bottom: clamp(24px, 4vw, 48px);
    left: clamp(24px, 4vw, 48px);
    font-size: 12px;
    color: rgba(255, 255, 255, 0.35);
    letter-spacing: 0.04em;
    opacity: 0;
    animation: riseIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.9s forwards;
    margin: 0;
  }
}

/* ── Login panel ── */
.login-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  background: #fff;
  border-left: 1px solid #{$slate-100};
  position: relative;
  overflow-y: auto;
}

.login-form {
  width: 100%;
  max-width: 360px;
  opacity: 0;
  transform: translateY(20px);
  animation: riseIn 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.6s forwards;
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: #{$slate-800};
  margin: 0 0 32px;
}

/* ── Tabs ── */
.tabs {
  display: flex;
  gap: 0;
  margin-bottom: 32px;
  border-bottom: 2px solid #{$slate-100};

  .tab {
    flex: 1;
    padding: 12px 0;
    font-size: 14px;
    font-weight: 500;
    color: #{$slate-400};
    text-align: center;
    cursor: pointer;
    position: relative;
    transition: color 0.25s;
    border: none;
    background: none;
    font-family: inherit;

    &:hover {
      color: #{$slate-600};
    }
    &.active {
      color: #{$blue-600};
      font-weight: 600;

      &::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        right: 0;
        height: 2px;
        background: #{$blue-600};
        border-radius: 1px;
        animation: tabSlide 0.3s ease;
      }
    }
  }
}

.step-panel.active {
  animation: fadeUp 0.35s ease;
}

/* ── Form fields ── */
.field {
  margin-bottom: 20px;

  label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #{$slate-700};
    margin-bottom: 8px;
  }
}
.field-input {
  position: relative;

  input {
    width: 100%;
    padding: 12px 42px 12px 42px;
    background: #{$slate-50};
    border: 1px solid #{$slate-200};
    border-radius: $radius;
    color: #{$slate-800};
    font-family: inherit;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;

    &::placeholder {
      color: #{$slate-400};
    }
    &:focus {
      border-color: #{$blue-600};
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      background: #fff;

      ~ .icon {
        color: #{$blue-600};
      }
    }
  }
  .icon {
    position: absolute;
    left: 13px;
    top: 50%;
    transform: translateY(-50%);
    color: #{$slate-400};
    transition: color 0.2s;
    pointer-events: none;

    svg {
      width: 18px;
      height: 18px;
      stroke: currentColor;
      fill: none;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  }
}

/* ── Password toggle ── */
.pwd-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #{$slate-400};
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;

  &:hover {
    color: #{$slate-600};
  }
  svg {
    width: 18px;
    height: 18px;
    stroke: currentColor;
    fill: none;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
}

/* ── Caps Lock hint ── */
.caps-hint {
  display: none;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-size: 12px;
  color: #d97706;
  animation: fadeUp 0.25s ease;

  &.visible {
    display: flex;
  }
  svg {
    width: 14px;
    height: 14px;
    stroke: currentColor;
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    flex-shrink: 0;
  }
}

/* ── SMS code field ── */
.field-input--sms {
  display: flex;
  gap: 10px;

  .field-input {
    flex: 1;
    min-width: 0;
  }
}
.btn-sms {
  flex-shrink: 0;
  min-width: 104px;
  padding: 12px 16px;
  background: #{$blue-600};
  color: #fff;
  border: none;
  border-radius: $radius;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s, opacity 0.2s;

  &:not(:disabled):hover {
    background: #{$blue-200};
  }
  &:disabled {
    background: #{$slate-300};
    color: #{$slate-500};
    cursor: not-allowed;
  }
}

/* ── Step indicator ── */
.steps-bar {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 28px;

  .step-item {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    position: relative;

    &:not(:last-child)::after {
      content: '';
      flex: 1;
      height: 2px;
      background: #{$slate-200};
      margin: 0 12px;
      border-radius: 1px;
      transition: background 0.3s;
    }
    &.done:not(:last-child)::after {
      background: #{$blue-600};
    }

    .step-num {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #{$slate-100};
      color: #{$slate-400};
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.3s;
    }
    &.active .step-num {
      background: #{$blue-600};
      color: #fff;
    }
    &.done .step-num {
      background: #{$blue-600};
      color: #fff;

      &::after {
        content: '✓';
      }
      span {
        display: none;
      }
    }
    .step-label {
      font-size: 14px;
      font-weight: 500;
      color: #{$slate-400};
      white-space: nowrap;
      transition: color 0.3s;
    }
    &.active .step-label,
    &.done .step-label {
      color: #{$slate-700};
    }
  }
}

/* ── Verification methods ── */
.verify-methods {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  border: 1px solid #{$slate-200};
  border-radius: $radius;
  overflow: hidden;

  .verify-method {
    flex: 1;
    padding: 10px;
    font-size: 14px;
    font-weight: 500;
    color: #{$slate-500};
    text-align: center;
    cursor: pointer;
    border: none;
    background: #{$slate-50};
    font-family: inherit;
    transition: all 0.2s;

    &.active {
      background: #{$blue-600};
      color: #fff;
    }
  }
}

/* ── Bound info ── */
.bound-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 20px;
  font-size: 12px;
  color: #{$slate-500};
  line-height: 1.5;

  svg {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
    stroke: #{$slate-400};
    fill: none;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .bound-label {
    color: #{$slate-400};
  }
  .bound-value {
    color: #{$slate-700};
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
  }
}

/* ── Verify hint ── */
.verify-hint {
  font-size: 12px;
  color: #{$slate-500};
  line-height: 1.6;
  margin-bottom: 20px;
  padding: 12px 14px;
  background: #{$blue-50};
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
  gap: 8px;

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    margin-top: 1px;
    stroke: #{$blue-600};
    fill: none;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
}

/* ── Options row ── */
.options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;

  .remember {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;

    input {
      display: none;
    }
    .check {
      width: 16px;
      height: 16px;
      border: 1.5px solid #{$slate-300};
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;

      svg {
        width: 10px;
        height: 10px;
        stroke: #fff;
        fill: none;
        stroke-width: 2.5;
        opacity: 0;
        transition: opacity 0.2s;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    }
    input:checked + .check {
      background: #{$blue-600};
      border-color: #{$blue-600};

      svg {
        opacity: 1;
      }
    }
    span:last-child {
      font-size: 14px;
      color: #{$slate-500};
    }
  }
  .forgot {
    font-size: 14px;
    color: #{$blue-600};
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: #{$blue-200};
    }
  }
}

/* ── Submit button ── */
.btn-login {
  width: 100%;
  padding: 13px;
  background: #{$blue-600};
  border: none;
  border-radius: $radius;
  color: #fff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: background 0.2s, transform 0.15s, box-shadow 0.2s;

  &:hover {
    background: #{$blue-200};
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.25);
  }
  &:active {
    transform: translateY(0);
    box-shadow: none;
  }
}

.btn-back {
  width: 100%;
  padding: 11px;
  margin-top: 12px;
  background: transparent;
  border: 1px solid #{$slate-200};
  border-radius: $radius;
  color: #{$slate-600};
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #{$slate-50};
    border-color: #{$slate-300};
  }
}

/* ── Bottom links ── */
.bottom-links {
  margin-top: 28px;
  text-align: center;
  font-size: 12px;
  color: #{$slate-400};

  a {
    color: #{$blue-600};
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;

    &:hover {
      color: #{$blue-200};
    }
  }
}

/* ── Legal notice ── */
.legal-notice {
  position: absolute;
  bottom: 20px;
  left: 40px;
  right: 40px;
  text-align: center;
  font-size: 12px;
  color: #{$slate-300};
  line-height: 1.6;
  opacity: 0;
  animation: riseIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) 1.2s forwards;
  margin: 0;
}

/* ── Forgot password form ── */
.forgot-form {
  width: 100%;
  max-width: 360px;
  animation: fadeUp 0.35s ease;

  .forgot-title {
    font-size: 24px;
    font-weight: 700;
    color: #{$slate-800};
    margin: 0 0 8px;
  }
  .forgot-subtitle {
    font-size: 12px;
    color: #{$slate-400};
    margin: 0 0 28px;
  }
  .steps-bar .step-item {
    flex: 0 1 auto;

    &:not(:last-child)::after {
      min-width: 24px;
    }
  }
}

/* ── Success panel ── */
.success-panel {
  text-align: center;
  padding: 20px 0;

  .success-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 20px;
    border-radius: 50%;
    background: #{$blue-50};
    display: flex;
    align-items: center;
    justify-content: center;
    animation: successPop 0.5s cubic-bezier(0.22, 1, 0.36, 1);

    svg {
      width: 32px;
      height: 32px;
      stroke: #{$blue-600};
      fill: none;
      stroke-width: 2.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  }
  .success-title {
    font-size: 20px;
    font-weight: 600;
    color: #{$slate-800};
    margin: 0 0 8px;
  }
  .success-desc {
    font-size: 14px;
    color: #{$slate-500};
    line-height: 1.6;
    margin: 0 0 28px;
  }
}

/* ── Password match hint ── */
.pwd-match-hint {
  display: none;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-size: 12px;

  &.visible {
    display: flex;
  }
  &.match {
    color: #16a34a;
  }
  &.mismatch {
    color: #dc2626;
  }
  svg {
    width: 14px;
    height: 14px;
    stroke: currentColor;
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    flex-shrink: 0;
  }
}

/* ── Keyframes ── */
@keyframes riseIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes headlineRiseIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes tabSlide {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes successPop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  60% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* ── Responsive ── */
@media (max-width: 960px) {
  .page {
    grid-template-columns: 1fr;
    grid-template-rows: 32vh 1fr;
  }
  .brand-panel {
    padding: clamp(20px, 4vw, 32px);

    .brand-mark img {
      height: 44px;
    }
    .brand-headline {
      bottom: clamp(40px, 5vw, 60px);
      right: clamp(20px, 5vw, 32px);
      top: auto;

      img {
        height: clamp(56px, 12vw, 90px);
      }
    }
  }
  .login-panel {
    border-left: none;
    border-top: 1px solid #{$slate-100};
    padding: 32px 24px;
    min-height: 68vh;
    justify-content: flex-start;
  }
  .login-form,
  .forgot-form {
    margin-block: auto;
  }
  .legal-notice {
    position: static;
    left: auto;
    right: auto;
    bottom: auto;
    margin-top: 24px;
  }
}
@media (max-width: 480px) {
  .page {
    grid-template-rows: 26vh 1fr;
  }
  .login-form {
    max-width: 100%;
  }
  .brand-panel {
    .brand-mark img {
      height: 44px;
    }
    .brand-headline {
      bottom: 32px;
      right: 20px;

      img {
        height: clamp(44px, 11vw, 70px);
      }
    }
  }
  .login-panel {
    padding: 28px 20px;
  }
  .login-title {
    font-size: 22px;
    margin-bottom: 24px;
  }
  .field {
    margin-bottom: 16px;
  }
  .field-input input {
    padding: 11px 42px 11px 42px;
    font-size: 16px;
  }
  .btn-sms {
    padding: 11px 12px;
    font-size: 12px;
  }
  .btn-login {
    padding: 12px;
    font-size: 14px;
  }
  .tabs {
    margin-bottom: 24px;
  }
  .tab {
    font-size: 14px;
    padding: 10px 0;
  }
  .options {
    margin-bottom: 24px;
  }
  .legal-notice {
    margin-top: 20px;
    font-size: 10px;
  }
}
@media (max-width: 360px) {
  .page {
    grid-template-rows: 22vh 1fr;
  }
  .brand-panel {
    .brand-mark img {
      height: 40px;
    }
    .brand-headline img {
      height: clamp(40px, 13vw, 60px);
    }
  }
  .field-input--sms {
    gap: 8px;
  }
  .btn-sms {
    padding: 11px 10px;
    font-size: 12px;
  }
}

/* ── 触屏设备：避免 hover 状态粘连 ── */
@media (hover: none) {
  .btn-login:hover {
    transform: none;
    box-shadow: none;
  }
  .brand-panel:hover .brand-bg {
    transform: scale(1.05);
  }
}
</style>

<!-- 全局：保证登录页高度链贯通，#app 撑满视口 -->
<style>
html,
body,
#app {
  height: 100%;
  margin: 0;
}

/* 登录页 box-sizing reset，避免 input width:100% + padding 溢出产生横向滚动条 */
.page,
.page *,
.page *::before,
.page *::after {
  box-sizing: border-box;
}
</style>
