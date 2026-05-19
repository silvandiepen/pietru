import { createMemoryHistory, createRouter } from 'vue-router'
import { mount } from '@vue/test-utils'
import i18n from '@/i18n'

import HomeView from './HomeView.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/features', component: { template: '<div>Features</div>' } },
  ],
})

describe('HomeView', () => {
  it('renders the landing headline and CTAs', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(HomeView, {
      global: {
        plugins: [router, i18n],
      },
    })

    expect(wrapper.text()).toContain('One dashboard for all your product emails')
    expect(wrapper.text()).toContain('Get Started')
    expect(wrapper.text()).toContain('See How It Works')
    expect(wrapper.text()).toContain('Set up once, see everything')
    expect(wrapper.text()).toContain('Two problems, one dashboard')
    expect(wrapper.text()).toContain('Stop juggling email dashboards')
    expect(wrapper.text()).toContain('Open Dashboard')
  })

  it('renders dashboard buttons with target blank', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(HomeView, {
      global: {
        plugins: [router, i18n],
      },
    })

    const dashboardLinks = wrapper.findAll('a[target="_blank"]')
    expect(dashboardLinks.length).toBeGreaterThanOrEqual(2)
  })
})
