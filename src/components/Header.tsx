import React from 'react'

export function Header() {
  return (
    <header className="w-full h-20 px-8 flex items-center justify-between border-b">
      <h1 className="text-lg font-bold">MovieDNA</h1>
      <nav className="flex gap-8 text-sm font-medium text-muted-foreground">
        <a href="/quiz">Quiz</a>
        <a href="/about">À propos</a>
        <a href="/profile">Profil</a>
      </nav>
    </header>
  )
}

export default Header
