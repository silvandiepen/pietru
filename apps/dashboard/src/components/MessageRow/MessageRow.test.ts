import { mount } from '@vue/test-utils'

import MessageRow from './MessageRow.vue'

describe('MessageRow', () => {
  it('emits the selected message id', async () => {
    const wrapper = mount(MessageRow, {
      props: {
        message: {
          id: 'msg_1',
          project_id: 'p1',
          environment: 'dev',
          to_address: 'to@example.com',
          from_address: 'from@example.com',
          subject: 'Hello',
          status: 'sent',
          created_at: '2024-01-15T10:30:00Z',
        },
      },
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual(['msg_1'])
  })
})
