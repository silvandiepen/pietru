import { createMemoryHistory, createRouter } from 'vue-router'
import { mount } from '@vue/test-utils'
import i18n from '@/i18n'

import FeaturesView from './FeaturesView.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/features', component: FeaturesView },
  ],
})

describe('FeaturesView', () => {
  it('renders the feature list and dashboard link', async () => {
    router.push('/features')
    await router.isReady()

    const wrapper = mount(FeaturesView, {
      global: {
        plugins: [router, i18n],
      },
    })

    expect(wrapper.text()).toContain('Open Dashboard')
    expect(wrapper.text()).toContain('One API to send all your transactional email')
    expect(wrapper.text()).toContain('Built for teams that ship')
    expect(wrapper.text()).toContain('Start using Pietru today')
  })

  it('renders dashboard CTA with target blank', async () => {
    router.push('/features')
    await router.isReady()

    const wrapper = mount(FeaturesView, {
      global: {
        plugins: [router, i18n],
      },
    })

    const dashboardLinks = wrapper.findAll('a[target="_blank"]')
    expect(dashboardLinks.length).toBeGreaterThanOrEqual(1)
  })
})
