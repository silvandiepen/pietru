import { mount } from '@vue/test-utils'

import EnvironmentBadge from './EnvironmentBadge.vue'
import i18n from '@/i18n'

describe('EnvironmentBadge', () => {
  it('renders the provided environment', () => {
    const wrapper = mount(EnvironmentBadge, {
      props: {
        environment: 'prod',
      },
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.text()).toContain('prod')
    expect(wrapper.attributes('data-environment')).toBe('prod')
  })
})
