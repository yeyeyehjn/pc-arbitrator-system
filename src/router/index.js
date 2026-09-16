import { createRouter, createWebHistory } from 'vue-router'

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
          meta: { title: '首页' },
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
              meta: { title: '签名列表' },
            },
            {
              path: 'center',
              name: 'TodoCenter',
              component: () => import('../views/todos/components/TodoCenter.vue'),
              meta: { title: '待办中心' },
            },
            {
              path: 'review',
              name: 'TodoReview',
              component: () => import('../views/todos/components/ReviewList.vue'),
              meta: { title: '裁决书核阅列表' },
            },
            {
              path: 'scheduling',
              name: 'TodoScheduling',
              component: () => import('../views/todos/components/SchedulingView.vue'),
              meta: { title: '智能约庭' },
            },
            {
              path: 'consult',
              name: 'TodoConsultList',
              component: () => import('../views/todos/components/consult/ConsultListView.vue'),
              meta: { title: '专家咨询案件' },
            },
            {
              path: 'consult/:id',
              name: 'TodoConsultDetail',
              component: () => import('../views/todos/components/consult/ConsultDetailView.vue'),
              meta: { title: '专家咨询详情' },
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
              meta: { title: '我的案件' },
            },
            {
              path: 'statistics',
              name: 'CaseStatistics',
              component: () => import('../views/cases/statistics/StatisticsView.vue'),
              meta: { title: '数据统计' },
            },
            {
              path: 'consult',
              name: 'CaseConsultList',
              component: () => import('../views/cases/components/consult/ConsultListView.vue'),
              meta: { title: '申请专家咨询案件' },
            },
            {
              path: 'consult/:id',
              name: 'CaseConsultDetail',
              component: () => import('../views/cases/components/consult/ConsultDetailView.vue'),
              meta: { title: '专家咨询详情' },
            },
            {
              path: ':id',
              name: 'CaseDetail',
              component: () => import('../views/cases/CaseDetailView.vue'),
              meta: { title: '案件详情' },
            },
          ],
        },
        {
          // 材料阅读页：全屏沉浸页，脱离 CasesView 出血布局
          // （margin:-20px + .cases-content overflow），直挂 MainLayout，
          // 消除嵌套滚动条与横向溢出。路径不变，跳转方无需调整。
          path: 'cases/:id/material-reader',
          name: 'MaterialReader',
          component: () => import('../views/cases/MaterialReaderView.vue'),
          meta: { title: '材料阅读' },
        },
        {
          path: 'notifications',
          name: 'Notifications',
          component: () => import('../views/notifications/NotificationsView.vue'),
          meta: { title: '消息通知' },
        },
        {
          path: 'auxiliary',
          name: 'Auxiliary',
          component: () => import('../views/auxiliary/AuxiliaryView.vue'),
          meta: { title: '文书指引' },
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
              meta: { title: '个人信息' },
            },
            {
              path: 'work',
              name: 'ProfileWork',
              component: () => import('../views/profile/components/WorkUnit.vue'),
              meta: { title: '工作单位' },
            },
            {
              path: 'resume',
              name: 'ProfileResume',
              component: () => import('../views/profile/components/PersonalResume.vue'),
              meta: { title: '个人履历' },
            },
            {
              path: 'fee',
              name: 'ProfileFee',
              component: () => import('../views/profile/components/FeeList.vue'),
              meta: { title: '酬金单' },
            },
            {
              path: 'bank',
              name: 'ProfileBank',
              component: () => import('../views/profile/components/BankAccount.vue'),
              meta: { title: '银行账号信息' },
            },
            {
              path: 'certificate',
              name: 'ProfileCertificate',
              component: () => import('../views/profile/components/CertificateList.vue'),
              meta: { title: '仲裁员聘书' },
            },
          ],
        },
      ],
    },
  ],
})

// 全局前置守卫：默认直接进入首页，不再强制跳转登录页
router.beforeEach(() => {})

export default router
