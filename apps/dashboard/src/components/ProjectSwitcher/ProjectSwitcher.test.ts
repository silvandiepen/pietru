import { mount } from '@vue/test-utils'

import ProjectSwitcher from './ProjectSwitcher.vue'

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
    })

    await wrapper.find('select').setValue('2')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['2'])
  })
})
