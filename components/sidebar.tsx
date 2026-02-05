'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Image, Wand2, PenTool, Clock, CreditCard, User, Settings, MoreHorizontal, Users, Pin, PinOff, ChevronRight } from 'lucide-react'

const GEN_AI_TOOLS = [
  {
    href: '/generate',
    label: 'ImageGen',
    description: 'Create unique visuals in diverse styles with simple text prompts.',
    icon: Image
  },
  {
    href: '/enhance',
    label: 'ImageEdit',
    description: 'Remove backgrounds, erase objects & upscale effortlessly.',
    icon: Wand2
  },
  {
    href: '/create',
    label: 'Create',
    description: 'Transform images using professional style templates.',
    icon: PenTool
  },
]

const MANAGE_ITEMS = [
  { href: '/history', label: 'History', icon: Clock },
  { href: '/billing', label: 'Billing', icon: CreditCard },
  { href: '/account', label: 'Account', icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPinned, setIsPinned] = useState(false)

  // Load pin state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar_pinned')
    if (saved === 'true') {
      setIsPinned(true)
      setIsExpanded(true)
    }
  }, [])

  // Save pin state
  const togglePin = () => {
    const newPinned = !isPinned
    setIsPinned(newPinned)
    localStorage.setItem('sidebar_pinned', newPinned ? 'true' : 'false')
    if (newPinned) {
      setIsExpanded(true)
    }
  }

  const handleMouseEnter = () => {
    if (!isPinned) {
      setIsExpanded(true)
    }
  }

  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsExpanded(false)
    }
  }

  return (
    <>
      {/* Hover trigger area - invisible strip on the left edge */}
      {!isExpanded && (
        <div 
          className="fixed left-0 top-0 w-4 h-full z-40"
          onMouseEnter={handleMouseEnter}
        />
      )}

      {/* Sidebar */}
      <motion.aside 
        className="fixed left-0 top-0 h-screen bg-background border-r border-border z-50 overflow-hidden shadow-lg"
        initial={{ width: 0, x: -10 }}
        animate={{ 
          width: isExpanded ? 280 : 0,
          x: isExpanded ? 0 : -10
        }}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        onMouseLeave={handleMouseLeave}
      >
        <div className="w-[280px] h-full flex flex-col">
          {/* Header with pin button */}
          <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0">
            <Link href="/" className="font-bold text-lg select-none">Gen AI</Link>
            <button
              onClick={togglePin}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isPinned 
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-muted text-muted-foreground"
              )}
              title={isPinned ? "Unpin sidebar" : "Pin sidebar open"}
            >
              {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </button>
          </div>

          {/* Tools List */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
            <div className="space-y-1">
              {GEN_AI_TOOLS.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-start gap-3 p-2.5 rounded-xl transition-all duration-200 group",
                      isActive
                        ? "bg-primary/5 text-foreground"
                        : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors",
                      isActive ? "bg-transparent text-primary" : "bg-transparent text-foreground"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm mb-0.5">{item.label}</div>
                      <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Management Section */}
            <div>
              <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Account
              </div>
              <div className="space-y-1">
                {MANAGE_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Admin Panel */}
            {user?.isAdmin && (
              <div>
                <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin
                </div>
                <div className="space-y-1">
                  <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                    <Settings className="w-4 h-4" />
                    Admin Panel
                  </Link>
                  <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                    <Users className="w-4 h-4" />
                    Manage Users
                  </Link>
                  <Link href="/admin/styles" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                    <PenTool className="w-4 h-4" />
                    Manage Styles
                  </Link>
                </div>
              </div>
            )}
          </nav>

          {/* Footer / User */}
          <div className="p-3 border-t border-border bg-muted/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user?.name || 'User'}</div>
                <div className="text-xs text-muted-foreground">{user?.credits || 0} Credits</div>
              </div>
              <button onClick={logout} className="p-2 hover:bg-muted rounded-full transition" title="Logout">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Toggle button when sidebar is collapsed */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 top-1/2 -translate-y-1/2 z-40 p-2 bg-background border border-l-0 border-border rounded-r-lg shadow-md hover:bg-muted transition-colors"
            onClick={() => setIsExpanded(true)}
            onMouseEnter={handleMouseEnter}
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}
