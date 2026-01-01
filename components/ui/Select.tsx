'use client'

import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDown, Check } from 'lucide-react'
import { ReactNode } from 'react'

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  children: ReactNode
  className?: string
  disabled?: boolean
}

export function Select({
  value,
  onValueChange,
  placeholder = 'Select...',
  children,
  className = '',
  disabled = false,
}: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        className={`
          flex items-center justify-between w-full px-4 py-2
          bg-white border border-gray-300 rounded-lg
          text-gray-900 text-sm
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50 min-w-[200px]">
          <SelectPrimitive.Viewport className="p-1">
            {children}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

interface SelectItemProps {
  value: string
  children: ReactNode
  className?: string
}

export function SelectItem({ value, children, className = '' }: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      value={value}
      className={`
        relative flex items-center px-3 py-2 rounded
        text-sm text-gray-900 cursor-pointer
        hover:bg-gray-100 focus:bg-gray-100 focus:outline-none
        ${className}
      `}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2">
        <Check className="w-4 h-4 text-primary" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

