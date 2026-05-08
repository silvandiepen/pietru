<template>
  <iframe
    class="message-html-preview"
    sandbox="allow-same-origin"
    :srcdoc="html || emptyState"
    title="Email HTML preview"
  />
</template>

<script lang="ts" setup>
import type { MessageHtmlPreviewProps } from './MessageHtmlPreview.model'

defineProps<MessageHtmlPreviewProps>()

const emptyState = `
  <html>
    <body style="font-family: Inter, system-ui, sans-serif; color: #8888a0; background: #020b22; padding: 24px;">
      No HTML content available for this message.
    </body>
  </html>
`
</script>

<style lang="scss" scoped>
.message-html-preview {
  width: 100%;
  min-height: 36rem;
  border: 1px solid var(--pietru-color-border);
  border-radius: var(--pietru-radius-md);
  background: var(--pietru-color-surface);
}
</style>
