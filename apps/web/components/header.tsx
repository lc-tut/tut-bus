import Image from 'next/image'

const Header: React.FC = () => {
  return (
    <header className="w-full flex items-center justify-between h-20 shadow-sm  bg-background">
      <div className="flex items-center gap-4 px-4">
        <Image src="/tut-logo.png" alt="Logo" width={60} height={60} />
        <h1 className="text-2xl font-bold">スクールバス</h1>
      </div>
    </header>
  )
}

export default Header
