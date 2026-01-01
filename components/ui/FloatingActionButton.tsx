'use client'

import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'

interface FloatingActionButtonProps {
  onClick: () => void
  icon?: React.ReactNode
  label?: string
  className?: string
}

export function FloatingActionButton({
  onClick,
  icon = <Plus className="w-6 h-6" />,
  label,
  className = '',
}: FloatingActionButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        fixed bottom-6 right-6 z-40
        w-14 h-14 rounded-full
        bg-primary text-white
        shadow-lg hover:shadow-xl
        flex items-center justify-center
        transition-all duration-200
        ${className}
      `}
      aria-label={label || 'Add'}
    >
      {icon}
      {label && (
        <span className="ml-2 font-semibold hidden sm:inline">{label}</span>
      )}
    </motion.button>
  )
}

