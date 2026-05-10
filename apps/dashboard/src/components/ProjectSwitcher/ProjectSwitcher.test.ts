import { mount } from '@vue/test-utils'

import ProjectSwitcher from './ProjectSwitcher.vue'
import i18n from '@/i18n'

describe('ProjectSwitcher', () => {
  it('emits updates on selection', async () => {
    const wrapper = mount(ProjectSwitcher, {
      props: {
        modelValue: '1',
        projects: [
          { id: '1', name: 'Alpha', slug: 'alpha' },
          { id: '2', name: 'Beta', slug: 'beta' },
        ],
      },
      global: {
        plugins: [i18n],
      },
    })

    await wrapper.find('select').setValue('2')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['2'])
  })
})
