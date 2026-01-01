'use client'

import { Button } from './Button'
import { CheckCircle, RotateCcw, Shield, AlertCircle, Volume2 } from 'lucide-react'

interface ActionButtonsProps {
  buildingName: string
  actions: {
    ack?: boolean
    reset?: boolean
    sAck?: boolean
    tAck?: boolean
    silence?: boolean
  }
  onActionPress: (action: string) => void
  loading?: string | null
}

export function ActionButtons({
  buildingName,
  actions,
  onActionPress,
  loading,
}: ActionButtonsProps) {
  const buttonConfigs = [
    { key: 'ack', label: 'Ack', icon: CheckCircle, color: 'bg-success', disabled: !actions.ack },
    { key: 'reset', label: 'Reset', icon: RotateCcw, color: 'bg-danger', disabled: !actions.reset },
    { key: 'sAck', label: 'S-Ack', icon: Shield, color: 'bg-info', disabled: !actions.sAck },
    { key: 'tAck', label: 'T-Ack', icon: AlertCircle, color: 'bg-warning', disabled: !actions.tAck },
    { key: 'silence', label: 'Silence', icon: Volume2, color: 'bg-secondary', disabled: !actions.silence },
  ]

  return (
    <div className="flex flex-wrap gap-3">
      {buttonConfigs.map(({ key, label, icon: Icon, color, disabled }) => (
        <button
          key={key}
          onClick={() => onActionPress(key)}
          disabled={disabled || loading === key}
          className={`
            flex-1 min-w-[100px] px-4 py-3 rounded-lg font-semibold text-white
            flex items-center justify-center gap-2
            transition-all duration-200
            ${color}
            ${disabled || loading === key ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:scale-95'}
          `}
        >
          {loading === key ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </>
          )}
        </button>
      ))}
    </div>
  )
}

