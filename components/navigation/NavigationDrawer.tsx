'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  BarChart3,
  Building2,
  Sliders,
  AlertTriangle,
  Map,
  LogOut,
  X,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface NavigationDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const navigationItems = [
  { title: 'Dashboard', route: '/dashboard', icon: LayoutDashboard },
  { title: 'Stats', route: '/stats', icon: BarChart3 },
  { title: 'Construction', route: '/construction', icon: Building2 },
  { title: 'Controls', route: '/controls', icon: Sliders },
  { title: 'Incidents', route: '/incidents', icon: AlertTriangle },
  { title: 'Floor Maps', route: '/floor-maps', icon: Map },
]

export function NavigationDrawer({ isOpen, onClose }: NavigationDrawerProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  const handleNavigate = (route: string) => {
    onClose()
    router.push(route)
  }

  const handleLogout = async () => {
    onClose()
    await logout()
    router.push('/login')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-[85vw] max-w-sm bg-white shadow-2xl z-50"
          >
            {/* Header */}
            <div className="bg-primary p-5 border-b border-blue-600 relative">
              <h1 className="text-2xl font-bold text-white">Vision365</h1>
              <p className="text-sm text-white/80 mt-1">Fire & Safety Intelligence</p>
              <button
                onClick={onClose}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto py-4">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.route

                return (
                  <button
                    key={item.route}
                    onClick={() => handleNavigate(item.route)}
                    className={`
                      w-full flex items-center px-5 py-4 transition-colors
                      ${isActive ? 'bg-blue-50 text-primary' : 'text-gray-700 hover:bg-gray-50'}
                    `}
                  >
                    <Icon className="w-5 h-5 mr-4" />
                    <span className="font-medium">{item.title}</span>
                  </button>
                )
              })}
            </nav>

            {/* Logout Button */}
            <div className="p-5 border-t">
              <button
                onClick={handleLogout}
                className="w-full py-3 bg-danger text-white rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center justify-center"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

