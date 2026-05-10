<template>
  <iframe
    class="message-html-preview"
    sandbox="allow-same-origin"
    :srcdoc="html || emptyState"
    :title="$t('messageDetail.htmlPreviewTitle')"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { MessageHtmlPreviewProps } from './MessageHtmlPreview.model'

const props = defineProps<MessageHtmlPreviewProps>()

const { t } = useI18n()

const emptyState = computed(() => `
  <html>
    <body style="font-family: Inter, system-ui, sans-serif; color: #8888a0; background: #020b22; padding: 24px;">
      ${t('messageDetail.noHtmlContent')}
    </body>
  </html>
`)
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
