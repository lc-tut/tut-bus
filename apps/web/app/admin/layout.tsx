import { AdminHeader } from '@/components/admin/admin-header'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect('/auth/signin?callbackUrl=/admin')
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader user={session.user} />
      <main className="p-4 md:p-6 mx-auto max-w-6xl">{children}</main>
    </div>
  )
}
