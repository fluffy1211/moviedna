import React from 'react'
import Link from 'next/link'

export function Header() {
  return (
    <header className="w-full h-20 px-8 flex items-center justify-between">
      <a href="/"><h1 className="text-lg font-bold">MovieDNA</h1></a>
      <nav className="flex gap-8 text-sm font-medium text-muted-foreground">
        <Link href="/profile">Profil</Link>
        <Link href="/about">À propos</Link>
      </nav>
    </header>
  )
}

export default Header
