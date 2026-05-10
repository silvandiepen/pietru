import { createMemoryHistory, createRouter } from 'vue-router'
import { mount } from '@vue/test-utils'
import i18n from '@/i18n'

import PricingView from './PricingView.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/pricing', component: PricingView },
  ],
})

describe('PricingView', () => {
  it('renders the pricing headline and plans', async () => {
    router.push('/pricing')
    await router.isReady()

    const wrapper = mount(PricingView, {
      global: {
        plugins: [router, i18n],
      },
    })

    expect(wrapper.text()).toContain('Simple, transparent pricing')
    expect(wrapper.text()).toContain('Free')
    expect(wrapper.text()).toContain('Pro')
    expect(wrapper.text()).toContain('Frequently asked questions')
    expect(wrapper.text()).toContain('Start free, no credit card required')
  })

  it('renders FAQ items', async () => {
    router.push('/pricing')
    await router.isReady()

    const wrapper = mount(PricingView, {
      global: {
        plugins: [router, i18n],
      },
    })

    expect(wrapper.text()).toContain('Can I switch plans later?')
    expect(wrapper.text()).toContain('Do I need a credit card to start?')
  })

  it('renders dashboard buttons with target blank', async () => {
    router.push('/pricing')
    await router.isReady()

    const wrapper = mount(PricingView, {
      global: {
        plugins: [router, i18n],
      },
    })

    const dashboardLinks = wrapper.findAll('a[target="_blank"]')
    expect(dashboardLinks.length).toBeGreaterThanOrEqual(2)
  })
})
