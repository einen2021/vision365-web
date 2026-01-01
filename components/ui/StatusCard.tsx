'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Wrench, AlertTriangle } from 'lucide-react'

interface StatusCardProps {
  title: string
  count: number
  icon: 'fire' | 'trouble' | 'supervisory'
  backgroundColor: string
  blinking?: boolean
}

const iconMap = {
  fire: Flame,
  trouble: Wrench,
  supervisory: AlertTriangle,
}

export function StatusCard({
  title,
  count,
  icon,
  backgroundColor,
  blinking = false,
}: StatusCardProps) {
  const [isBlinking, setIsBlinking] = useState(false)
  const IconComponent = iconMap[icon]
  const isLightBackground = backgroundColor === '#ffffff' || backgroundColor === '#f8f9fa'
  const textColor = isLightBackground ? 'text-gray-900' : 'text-white'
  const borderColor = isLightBackground ? 'border-gray-200' : ''

  useEffect(() => {
    if (blinking) {
      setIsBlinking(true)
      const timer = setTimeout(() => setIsBlinking(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [blinking])

  return (
    <motion.div
      className={`
        w-[130px] min-h-[120px] rounded-2xl p-4 mr-3
        border-2 ${borderColor}
        flex flex-col justify-between relative
        shadow-card ${count > 0 ? 'shadow-card-active scale-[1.02]' : ''}
      `}
      style={{ backgroundColor }}
      animate={{
        opacity: isBlinking ? [1, 0.6, 1] : 1,
      }}
      transition={{
        duration: 0.5,
        repeat: blinking ? Infinity : 0,
      }}
    >
      <div className="flex justify-center mb-2">
        <IconComponent className={`w-8 h-8 ${textColor}`} />
      </div>
      
      <div className="flex flex-col items-center justify-center flex-1">
        <p className={`text-[11px] font-bold uppercase tracking-wide mb-2 ${textColor}`}>
          {title}
        </p>
        <p className={`text-4xl font-bold ${textColor}`}>
          {count}
        </p>
      </div>

      {count > 0 && (
        <div
          className={`
            absolute top-2 right-2 px-2 py-1 rounded-xl
            ${isLightBackground ? 'bg-gray-900' : 'bg-white'}
          `}
        >
          <span
            className={`
              text-[9px] font-bold uppercase tracking-wide
              ${isLightBackground ? 'text-white' : 'text-gray-900'}
            `}
          >
            ACTIVE
          </span>
        </div>
      )}
    </motion.div>
  )
}

