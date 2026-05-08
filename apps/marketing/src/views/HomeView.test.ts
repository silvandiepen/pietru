import { createMemoryHistory, createRouter } from 'vue-router'
import { mount } from '@vue/test-utils'

import HomeView from './HomeView.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/features', component: { template: '<div>Features</div>' } },
  ],
})

describe('HomeView', () => {
  it('renders the landing headline and CTA', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(HomeView, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('One API for every app that sends email')
    expect(wrapper.text()).toContain('Launch Dashboard')
  })
})
