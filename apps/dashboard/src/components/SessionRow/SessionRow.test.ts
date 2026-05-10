import { mount } from '@vue/test-utils'

import SessionRow from './SessionRow.vue'
import i18n from '@/i18n'

describe('SessionRow', () => {
  it('emits revoke with the session id', async () => {
    const wrapper = mount(SessionRow, {
      props: {
        session: {
          id: 'sess_1',
          createdAt: '2026-05-08T10:00:00.000Z',
          expiresAt: '2026-05-09T10:00:00.000Z',
          userAgent: 'Safari',
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
