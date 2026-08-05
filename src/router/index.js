import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/login/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('../layout/MainLayout.vue'),
      children: [
        {
          path: '',
          name: 'Home',
          component: () => import('../views/home/HomeView.vue'),
        },
        {
          path: 'todos',
          component: () => import('../views/todos/TodosView.vue'),
          redirect: '/todos/signature',
          children: [
            {
              path: 'signature',
              name: 'TodoSignature',
              component: () => import('../views/todos/components/SignatureList.vue'),
            },
            {
              path: 'center',
              name: 'TodoCenter',
              component: () => import('../views/todos/components/TodoCenter.vue'),
            },
            {
              path: 'review',
              name: 'TodoReview',
              component: () => import('../views/todos/components/ReviewList.vue'),
            },
            {
              path: 'scheduling',
              name: 'TodoScheduling',
              component: () => import('../views/todos/components/SchedulingView.vue'),
            },
            {
              path: 'consult',
              name: 'TodoConsultList',
              component: () => import('../views/todos/components/consult/ConsultListView.vue'),
            },
            {
              path: 'consult/:id',
              name: 'TodoConsultDetail',
              component: () => import('../views/todos/components/consult/ConsultDetailView.vue'),
            },
          ],
        },
        {
          path: 'cases',
          component: () => import('../views/cases/CasesView.vue'),
          redirect: '/cases/list',
          children: [
            {
              path: 'list',
              name: 'CaseList',
              component: () => import('../views/cases/components/CaseListPanel.vue'),
            },
            {
              path: 'statistics',
              name: 'CaseStatistics',
              component: () => import('../views/cases/statistics/StatisticsView.vue'),
            },
            {
              path: 'consult',
              name: 'CaseConsultList',
              component: () => import('../views/cases/components/consult/ConsultListView.vue'),
            },
            {
              path: 'consult/:id',
              name: 'CaseConsultDetail',
              component: () => import('../views/cases/components/consult/ConsultDetailView.vue'),
            },
            {
              path: ':id',
              name: 'CaseDetail',
              component: () => import('../views/cases/CaseDetailView.vue'),
            },
            {
              path: ':id/material-reader',
              name: 'MaterialReader',
              component: () => import('../views/cases/MaterialReaderView.vue'),
            },
          ],
        },
        {
          path: 'notifications',
          name: 'Notifications',
          component: () => import('../views/notifications/NotificationsView.vue'),
        },
        {
          path: 'auxiliary',
          name: 'Auxiliary',
          component: () => import('../views/auxiliary/AuxiliaryView.vue'),
        },
        {
          path: 'profile',
          component: () => import('../views/profile/ProfileView.vue'),
          redirect: '/profile/info',
          children: [
            {
              path: 'info',
              name: 'ProfileInfo',
              component: () => import('../views/profile/components/PersonalInfo.vue'),
            },
            {
              path: 'work',
              name: 'ProfileWork',
              component: () => import('../views/profile/components/WorkUnit.vue'),
            },
            {
              path: 'resume',
              name: 'ProfileResume',
              component: () => import('../views/profile/components/PersonalResume.vue'),
            },
            {
              path: 'fee',
              name: 'ProfileFee',
              component: () => import('../views/profile/components/FeeList.vue'),
            },
            {
              path: 'bank',
              name: 'ProfileBank',
              component: () => import('../views/profile/components/BankAccount.vue'),
            },
            {
              path: 'certificate',
              name: 'ProfileCertificate',
              component: () => import('../views/profile/components/CertificateList.vue'),
            },
          ],
        },
      ],
    },
  ],
})

// 全局前置守卫：未登录时重定向到登录页
router.beforeEach((to) => {
  const authStore = useAuthStore()
  if (!to.meta.public && !authStore.isAuthenticated) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'Login' && authStore.isAuthenticated) {
    return { name: 'Home' }
  }
})

export default router
