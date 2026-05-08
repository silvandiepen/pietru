import { createMemoryHistory, createRouter } from 'vue-router'
import { mount } from '@vue/test-utils'

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
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Open Dashboard')
    expect(wrapper.text()).toContain('Swap provider modes, configure sender policies, and manage routing rules')
  })
})
