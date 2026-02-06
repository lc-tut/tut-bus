import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'

const ALLOWED_ORG = 'lc-tut'
const ALLOWED_TEAM = process.env.AUTH_ALLOWED_TEAM || ''

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7日間
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      // 組織メンバーシップを確認するためにスコープを追加
      scope: ['read:user', 'user:email', 'read:org'],
      // GitHub組織/チームのメンバーかチェック
      mapProfileToUser: async (profile) => {
        return {
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
        }
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return { data: user }
        },
      },
    },
    account: {
      create: {
        before: async (account) => {
          if (account.providerId === 'github' && account.accessToken) {
            const isMember = await checkOrgMembership(account.accessToken, ALLOWED_ORG)
            if (!isMember) {
              throw new APIError('FORBIDDEN', {
                message: `${ALLOWED_ORG}組織のメンバーではありません。アクセスが拒否されました。`,
              })
            }

            if (ALLOWED_TEAM) {
              const isTeamMember = await checkTeamMembership(
                account.accessToken,
                ALLOWED_ORG,
                ALLOWED_TEAM
              )
              if (!isTeamMember) {
                throw new APIError('FORBIDDEN', {
                  message: `${ALLOWED_TEAM}チームのメンバーではありません。アクセスが拒否されました。`,
                })
              }
            }
          }
          return { data: account }
        },
      },
    },
  },
})

/**
 * GitHub組織のメンバーかチェック
 */
async function checkOrgMembership(accessToken: string, org: string): Promise<boolean> {
  try {
    // 方法1: /user/memberships/orgs/{org} API を使用
    // これは read:org スコープがあれば非公開組織でも確認可能
    const membershipResponse = await fetch(`https://api.github.com/user/memberships/orgs/${org}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    console.log('[Auth] メンバーシップAPIレスポンス:', membershipResponse.status)

    if (membershipResponse.status === 200) {
      const data = (await membershipResponse.json()) as { state: string }
      console.log('[Auth] メンバーシップ状態:', data.state)
      // state が 'active' または 'pending' ならメンバー
      return data.state === 'active'
    }

    // 方法2: /user/orgs API でフォールバック（公開組織用）
    const orgsResponse = await fetch('https://api.github.com/user/orgs', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    console.log('[Auth] 組織一覧APIレスポンス:', orgsResponse.status)

    if (orgsResponse.status === 200) {
      const orgs = (await orgsResponse.json()) as Array<{ login: string }>
      console.log(
        '[Auth] 所属組織:',
        orgs.map((o) => o.login)
      )
      const isMember = orgs.some((o) => o.login.toLowerCase() === org.toLowerCase())
      console.log(`[Auth] ${org}のメンバー:`, isMember)
      return isMember
    }

    const errorText = await membershipResponse.text()
    console.error('[Auth] 組織確認に失敗:', membershipResponse.status, errorText)
    return false
  } catch (error) {
    console.error('[Auth] 組織メンバーシップの確認に失敗しました:', error)
    return false
  }
}

/**
 * GitHub組織の特定チームのメンバーかチェック
 */
async function checkTeamMembership(
  accessToken: string,
  org: string,
  teamSlug: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.github.com/orgs/${org}/teams/${teamSlug}/memberships`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    if (response.status === 200) {
      return true
    }

    // 別の方法: ユーザーのチーム一覧から確認
    const teamsResponse = await fetch(`https://api.github.com/user/teams`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (teamsResponse.status === 200) {
      const teams = await teamsResponse.json()
      return teams.some(
        (team: { slug: string; organization: { login: string } }) =>
          team.slug === teamSlug && team.organization.login === org
      )
    }

    return false
  } catch (error) {
    console.error('チームメンバーシップの確認に失敗しました:', error)
    return false
  }
}

export type Session = typeof auth.$Infer.Session
