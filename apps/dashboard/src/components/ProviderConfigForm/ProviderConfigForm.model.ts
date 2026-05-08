import type { ProviderConfigPayload } from '@/stores/providers.model'

export interface ProviderConfigFormProps {
  pending?: boolean
  initialValue?: Partial<ProviderConfigPayload>
}
