import { mount } from '@vue/test-utils'

import SessionRow from './SessionRow.vue'
import i18n from '@/i18n'

describe('SessionRow', () => {
  it('emits revoke with the session id', async () => {
    const wrapper = mount(SessionRow, {
      props: {
        session: {
          id: 'sess_1',
          created_at: '2024-01-15T10:30:00Z',
          expires_at: '2024-01-16T10:30:00Z',
          user_agent: 'Safari',
        },
      },
      global: {
        plugins: [i18n],
      },
    })

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('revoke')?.[0]).toEqual(['sess_1'])
  })
})
