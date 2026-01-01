'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-primary hover:bg-blue-600 text-white',
    secondary: 'bg-secondary hover:bg-gray-600 text-white',
    danger: 'bg-danger hover:bg-red-600 text-white',
  }

  return (
    <button
      className={cn(
        'px-6 py-3 rounded-lg font-semibold text-base',
        'min-h-[48px] flex items-center justify-center',
        'transition-colors duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        children
      )}
    </button>
  )
}

