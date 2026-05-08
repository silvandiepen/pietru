import { createRouter, createWebHistory } from 'vue-router'
import { mount } from '@vue/test-utils'

import AppLayout from './AppLayout.vue'

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
        plugins: [router],
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
