import { useEffect, useRef } from 'react'

export function usePolling(
  callback: () => Promise<void> | void,
  interval: number,
  enabled: boolean = true
) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return

    const tick = () => {
      savedCallback.current()
    }

    // Initial call
    tick()

    // Set up interval
    const id = setInterval(tick, interval)

    return () => clearInterval(id)
  }, [interval, enabled])
}

