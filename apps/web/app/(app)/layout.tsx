import Header from '@/components/header'
import NavBar from '@/components/nav-bar'

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div>
      <Header />
      <div className="p-1 my-20 min-h-screen mx-auto max-w-6xl">{children}</div>
      <NavBar />
    </div>
  )
}
