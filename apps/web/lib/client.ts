import createClient from 'openapi-fetch'

import type { paths } from '@/generated/oas'

export const client = createClient<paths>({
  baseUrl: `https://petstore3.swagger.io/api/v3`,
})
