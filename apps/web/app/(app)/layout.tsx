import NavBar from '@/components/nav-bar'

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div>
      {children}
      <NavBar />
    </div>
  )
}
