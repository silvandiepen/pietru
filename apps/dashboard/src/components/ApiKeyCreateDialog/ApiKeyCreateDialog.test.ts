import { mount } from '@vue/test-utils'

import ApiKeyCreateDialog from './ApiKeyCreateDialog.vue'
import i18n from '@/i18n'

describe('ApiKeyCreateDialog', () => {
  it('emits the form payload', async () => {
    const wrapper = mount(ApiKeyCreateDialog, {
      props: {
        open: true,
      },
      global: {
        plugins: [i18n],
      },
    })

    await wrapper.find('input').setValue('Worker key')
    await wrapper.find('select').setValue('production')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]).toEqual([
      { name: 'Worker key', environment: 'production' },
    ])
  })
})
