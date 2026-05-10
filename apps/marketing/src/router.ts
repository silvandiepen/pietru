import { createRouter, createWebHistory } from 'vue-router'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('@/views/HomeView.vue') },
    { path: '/features', component: () => import('@/views/FeaturesView.vue') },
    { path: '/pricing', component: () => import('@/views/PricingView.vue') },
    { path: '/about', component: () => import('@/views/AboutView.vue') },
  ],
})
