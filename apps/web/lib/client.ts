import createClient from 'openapi-fetch'

import type { paths } from '@/generated/oas'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const client = createClient<paths>({
  baseUrl: API_URL,
})
