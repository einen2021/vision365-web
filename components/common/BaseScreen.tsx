'use client'

import { ReactNode, useState } from 'react'
import { NavigationHeader } from '../navigation/NavigationHeader'
import { NavigationDrawer } from '../navigation/NavigationDrawer'

interface BaseScreenProps {
  title: string
  subtitle?: string
  rightHeaderComponent?: ReactNode
  children: ReactNode
}

export function BaseScreen({
  title,
  subtitle,
  rightHeaderComponent,
  children,
}: BaseScreenProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <NavigationHeader
        title={title}
        subtitle={subtitle}
        onMenuPress={() => setDrawerOpen(true)}
        rightComponent={rightHeaderComponent}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <NavigationDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}

