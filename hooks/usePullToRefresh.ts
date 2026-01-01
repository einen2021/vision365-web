import { useEffect, useRef, useState } from 'react'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  threshold?: number
  enabled?: boolean
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  enabled = true,
}: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef<number>(0)
  const currentY = useRef<number>(0)
  const isPulling = useRef<boolean>(false)

  useEffect(() => {
    if (!enabled) return

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY
        isPulling.current = true
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current) return

      currentY.current = e.touches[0].clientY
      const pullDistance = currentY.current - startY.current

      if (pullDistance > 0 && window.scrollY === 0) {
        // Prevent default scrolling when pulling down
        if (pullDistance > 10) {
          e.preventDefault()
        }
      } else {
        isPulling.current = false
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling.current) return

      const pullDistance = currentY.current - startY.current

      if (pullDistance > threshold && window.scrollY === 0) {
        setIsRefreshing(true)
        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
        }
      }

      isPulling.current = false
      startY.current = 0
      currentY.current = 0
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, onRefresh, threshold])

  return { isRefreshing }
}

