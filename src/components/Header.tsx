'use client'
import React from 'react'
import Link from 'next/link'
import { useSession, signOut, signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Menu, X, User, LogOut, Film, Home, Dna } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const { data: session, status } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const handleSignIn = () => {
    signIn(undefined, { callbackUrl: '/' })
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/quiz', label: 'Quiz', icon: Film },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="page-container">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 text-xl font-bold text-foreground hover:text-foreground/80 transition-colors"
          >
            <Dna className="w-6 h-6 text-primary" />
            <span className="hidden sm:inline">MovieDNA</span>
            <span className="sm:hidden">DNA</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {status === 'loading' ? (
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
                <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
              </div>
            ) : session ? (
              <div className="flex items-center space-x-4">
                {/* Navigation Links */}
                <div className="flex items-center space-x-1">
                  {navLinks.slice(1).map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-all duration-200"
                    >
                      <link.icon className="w-4 h-4" />
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </div>

                {/* User Info & Actions */}
                <div className="flex items-center space-x-3 pl-3">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {(session.user?.username || session.user?.name || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground hidden lg:inline">
                      {session.user?.username || session.user?.name || 'User'}
                    </span>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSignOut}
                    className="text-sm hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                onClick={handleSignIn}
                className="btn-primary"
              >
                Sign In
              </Button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-background shadow-lg animate-slide-down">
            <div className="page-padding py-4 space-y-2">
              {session ? (
                <>
                  {/* User Info */}
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {(session.user?.username || session.user?.name || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {session.user?.username || session.user?.name || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.user?.email}
                      </p>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center space-x-3 p-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <link.icon className="w-5 h-5" />
                      <span>{link.label}</span>
                    </Link>
                  ))}

                  {/* Sign Out */}
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      handleSignOut()
                      setIsMobileMenuOpen(false)
                    }}
                    className="w-full justify-start text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => {
                    handleSignIn()
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full btn-primary"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
