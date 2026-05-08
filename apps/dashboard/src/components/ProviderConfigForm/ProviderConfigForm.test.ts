import { mount } from '@vue/test-utils'

import ProviderConfigForm from './ProviderConfigForm.vue'

describe('ProviderConfigForm', () => {
  it('normalizes provider payload on submit', async () => {
    const wrapper = mount(ProviderConfigForm)

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('re_test')
    await inputs[1].setValue('noreply@example.com')
    await inputs[2].setValue('example.com, app.example.com')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual(
      expect.objectContaining({
        providerType: 'resend',
        defaultFrom: 'noreply@example.com',
        allowedDomains: ['example.com', 'app.example.com'],
        config: { apiKey: 're_test' },
      }),
    )
  })
})
