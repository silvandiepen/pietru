import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
    { path: '/register', component: () => import('@/views/RegisterView.vue'), meta: { public: true } },
    { path: '/forgot-password', component: () => import('@/views/ForgotPasswordView.vue'), meta: { public: true } },
    { path: '/reset-password', component: () => import('@/views/ResetPasswordView.vue'), meta: { public: true } },
    { path: '/verify-email', component: () => import('@/views/VerifyEmailView.vue'), meta: { public: true } },
    { path: '/', component: () => import('@/views/DashboardView.vue') },
    { path: '/projects/:id', component: () => import('@/views/ProjectDetailView.vue') },
    { path: '/projects/:id/messages', component: () => import('@/views/MessagesView.vue') },
    { path: '/projects/:id/messages/:messageId', component: () => import('@/views/MessageDetailView.vue') },
    { path: '/projects/:id/test-inboxes', component: () => import('@/views/TestInboxesView.vue') },
    { path: '/projects/:id/test-inboxes/:inbox', component: () => import('@/views/TestInboxDetailView.vue') },
    { path: '/inbox', component: () => import('@/views/InboxView.vue') },
    { path: '/inbox/:id', component: () => import('@/views/InboxDetailView.vue') },
    { path: '/settings', component: () => import('@/views/SettingsView.vue') },
    { path: '/mailing-lists', component: () => import('@/views/MailingListsView.vue') },
    { path: '/mailing-lists/:id', component: () => import('@/views/MailingListDetailView.vue') },
    { path: '/mailing-lists/confirm', component: () => import('@/views/MailingListConfirmView.vue'), meta: { public: true } },
    {
      path: '/admin',
      component: () => import('@/views/AdminView.vue'),
      beforeEnter: () => {
        const authStore = useAuthStore()
        if (!authStore.isAdmin) return '/'
      },
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    await authStore.me()
  }

  if (to.meta.public && authStore.isAuthenticated && to.path !== '/verify-email') {
    return '/'
  }

  if (!to.meta.public && !authStore.isAuthenticated) {
    return '/login'
  }

  return true
})

export default router
