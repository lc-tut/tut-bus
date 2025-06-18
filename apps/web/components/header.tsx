import Image from 'next/image'

const Header: React.FC = () => {
  return (
    <header className="w-full flex items-center justify-between h-20 shadow-sm bg-background fixed top-0 left-0 z-50 md:h-16">
      <div className="flex items-center gap-4 px-4">
        <Image
          src="/tut-logo.png"
          alt="Logo"
          width={60}
          height={60}
          priority={true}
          className="md:w-10 md:h-10 w-15 h-15"
        />
        <h1 className="text-2xl font-bold">スクールバス</h1>
      </div>
    </header>
  )
}

export default Header
