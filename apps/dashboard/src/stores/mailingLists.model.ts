export interface MailingList {
  id: string
  projectId: string
  name: string
  slug: string
  description: string | null
  meta: Record<string, unknown> | null
  confirmationEmailFrom: string | null
  confirmationEmailSubject: string | null
  confirmationSuccessUrl: string | null
  subscriberCount?: number
  subscriberCounts?: Record<string, number>
  createdAt: string
  updatedAt: string | null
}

export interface MailingListSubscriber {
  id: string
  mailingListId: string
  email: string
  name: string | null
  meta: Record<string, unknown> | null
  status: 'pending' | 'confirmed' | 'unsubscribed'
  subscribedAt: string
  confirmedAt: string | null
  unsubscribedAt: string | null
  createdAt: string
}

export interface CreateMailingListPayload {
  projectId: string
  name: string
  slug?: string
  description?: string
  meta?: Record<string, unknown>
  confirmationEmailFrom?: string
  confirmationEmailSubject?: string
  confirmationSuccessUrl?: string
}

export interface UpdateMailingListPayload {
  name?: string
  description?: string
  meta?: Record<string, unknown>
  confirmationEmailFrom?: string
  confirmationEmailSubject?: string
  confirmationSuccessUrl?: string
}

export interface SubscribersResponse {
  subscribers: MailingListSubscriber[]
  total: number
}
