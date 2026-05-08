import { mount } from '@vue/test-utils'

import MessageHtmlPreview from './MessageHtmlPreview.vue'

describe('MessageHtmlPreview', () => {
  it('passes html into srcdoc', () => {
    const wrapper = mount(MessageHtmlPreview, {
      props: {
        html: '<p>Hello</p>',
      },
    })

    expect(wrapper.find('iframe').attributes('srcdoc')).toContain('<p>Hello</p>')
  })
})
