'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        'bg-cardBg border border-cardBorder rounded-card p-5 md:p-6',
        'shadow-card text-gray-900',
        className
      )}
    >
      {children}
    </div>
  )
}

