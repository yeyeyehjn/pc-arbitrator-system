import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const TOKEN_KEY = 'gzac_token'
const USER_KEY = 'gzac_user'

export const useAuthStore = defineStore('auth', () => {
  // ============ 状态 ============
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const user = ref(JSON.parse(localStorage.getItem(USER_KEY) || 'null'))

  // ============ 计算属性 ============
  const isAuthenticated = computed(() => !!token.value)

  // ============ 方法 ============
  // 设置登录态（真实环境由 LoginView 调用后端 API 后写入）
  const setAuth = ({ token: t, user: u }) => {
    token.value = t
    user.value = u
    localStorage.setItem(TOKEN_KEY, t)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
  }

  // 退出登录
  const logout = () => {
    token.value = ''
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return {
    token,
    user,
    isAuthenticated,
    setAuth,
    logout,
  }
})
