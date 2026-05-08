import { mount } from '@vue/test-utils'

import EnvironmentBadge from './EnvironmentBadge.vue'

describe('EnvironmentBadge', () => {
  it('renders the provided environment', () => {
    const wrapper = mount(EnvironmentBadge, {
      props: {
        environment: 'prod',
      },
    })

    expect(wrapper.text()).toContain('prod')
    expect(wrapper.attributes('data-environment')).toBe('prod')
  })
})
