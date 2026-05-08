export interface ApiKeyCreateDialogProps {
  open: boolean
  pending?: boolean
  revealedKey?: string | null
}

export interface ApiKeyCreateDialogSubmitPayload {
  name: string
  environment: string
}
