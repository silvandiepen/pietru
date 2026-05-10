export interface TestAlias {
  id: string
  userId: string
  projectId: string | null
  localPart: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  email: string
  projectName: string | null
  projectSlug: string | null
}

export interface CreateTestAliasPayload {
  localPart: string
  projectId?: string | null
  description?: string | null
}

export interface UpdateTestAliasPayload {
  projectId?: string | null
  description?: string | null
  isActive?: boolean
}

export interface TestAliasesListResponse {
  aliases: TestAlias[]
  count: number
  limit: number
}
