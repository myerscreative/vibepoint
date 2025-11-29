'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNavigation() {
  const pathname = usePathname()

  // Don't show navigation on auth, onboarding, landing, or success pages
  const hiddenPaths = ['/auth', '/onboarding', '/', '/success', '/tutorial', '/deep-dive', '/recipe-player']
  const shouldHide = hiddenPaths.some(path => pathname?.startsWith(path))
  
  if (shouldHide) {
    return null
  }

  const navItems = [
    { href: '/home', label: 'Home', icon: '🏠' },
    { href: '/mood/new', label: 'Log Mood', icon: '📝' },
    { href: '/history', label: 'History', icon: '📊' },
    { href: '/patterns', label: 'Patterns', icon: '🔍' },
    { href: '/recipes', label: 'Recipes', icon: '📖' },
  ]

  const isActive = (href: string) => {
    if (href === '/home') {
      return pathname === '/home'
    }
    return pathname?.startsWith(href)
  }

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/20 bg-white/90 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
      style={{
        background: 'linear-gradient(to top, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
      }}
    >
      <div className="mx-auto flex max-w-[800px] items-center justify-around px-4 py-3">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all ${
                active
                  ? 'text-[#7c3aed]'
                  : 'text-[#4a4a6a] hover:text-[#1a1a2e]'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className={`text-xs font-medium ${active ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
              {active && (
                <div 
                  className="h-1 w-8 rounded-full"
                  style={{
                    background: 'linear-gradient(45deg, #7c3aed 0%, #c026d3 50%, #f97316 100%)',
                  }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

