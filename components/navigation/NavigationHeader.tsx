'use client'

import { ReactNode } from 'react'
import { Menu } from 'lucide-react'

interface NavigationHeaderProps {
  title: string
  subtitle?: string
  onMenuPress: () => void
  rightComponent?: ReactNode
}

export function NavigationHeader({
  title,
  subtitle,
  onMenuPress,
  rightComponent,
}: NavigationHeaderProps) {
  return (
    <header className="bg-primary text-white shadow-md">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuPress}
            className="p-2 rounded-lg hover:bg-blue-600 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            {subtitle && (
              <p className="text-sm text-white/80">{subtitle}</p>
            )}
          </div>
        </div>
        {rightComponent && (
          <div>{rightComponent}</div>
        )}
      </div>
    </header>
  )
}

