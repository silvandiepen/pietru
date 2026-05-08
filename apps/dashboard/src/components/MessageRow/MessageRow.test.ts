import { mount } from '@vue/test-utils'

import MessageRow from './MessageRow.vue'

describe('MessageRow', () => {
  it('emits the selected message id', async () => {
    const wrapper = mount(MessageRow, {
      props: {
        message: {
          id: 'msg_1',
          projectId: 'p1',
          environment: 'dev',
          toAddress: 'to@example.com',
          fromAddress: 'from@example.com',
          subject: 'Hello',
          status: 'sent',
          createdAt: '2026-05-08T10:00:00.000Z',
        },
      },
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual(['msg_1'])
  })
})
