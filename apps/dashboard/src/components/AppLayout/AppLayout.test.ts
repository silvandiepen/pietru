import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { mount } from '@vue/test-utils'
import { createI18n, fromObject } from 'lezu-i18n'
import { createLezuI18nVue } from 'lezu-i18n/vue'

import AppLayout from './AppLayout.vue'
import en from '@/i18n/locales/en.json'

const pinia = createPinia()
const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  loaders: { messages: fromObject({ en }) },
})

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/settings', component: { template: '<div />' } },
  ],
})

describe('AppLayout', () => {
  it('renders project context', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(AppLayout, {
      global: {
        plugins: [pinia, router, createLezuI18nVue(i18n)],
      },
      props: {
        projectName: 'Alpha',
        environment: 'dev',
        projects: [{ id: '1', name: 'Alpha', slug: 'alpha' }],
        activeProjectId: '1',
      },
    })

    expect(wrapper.text()).toContain('Alpha')
    expect(wrapper.text()).toContain('Messages')
  })
})
