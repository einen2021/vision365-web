# Vision 365 - Next.js Web App Implementation Guide

## Table of Contents

1. [App Overview](#app-overview)
2. [Design System & Theme](#design-system--theme)
3. [Core Features](#core-features)
4. [UI Components](#ui-components)
5. [Screen-by-Screen Implementation](#screen-by-screen-implementation)
6. [Next.js Setup & Architecture](#nextjs-setup--architecture)
7. [Component Implementation Examples](#component-implementation-examples)
8. [State Management](#state-management)
9. [API Integration](#api-integration)
10. [Real-time Features](#real-time-features)
11. [Mobile-First Responsive Design](#mobile-first-responsive-design)
12. [Deployment](#deployment)

---

## App Overview

**Vision 365** is a Fire & Safety Intelligence application designed for monitoring and managing building safety systems. The app provides real-time monitoring, incident reporting, construction progress tracking, and control systems management.

### Key Characteristics
- **Mobile-first design** - Optimized for mobile devices with responsive desktop support
- **Real-time monitoring** - Live updates via polling mechanisms
- **Dark theme with accent colors** - Professional, safety-focused aesthetic
- **Intuitive navigation** - Slide-out drawer navigation pattern
- **Status-driven UI** - Color-coded status indicators throughout

---

## Design System & Theme

### Color Palette

```typescript
// colors.ts
export const colors = {
  // Primary Colors
  primary: '#007bff',        // Blue - Main brand color
  secondary: '#6c757d',      // Gray - Secondary actions
  success: '#28a745',        // Green - Success states
  danger: '#dc3545',         // Red - Danger/errors
  warning: '#ffc107',        // Yellow - Warnings
  info: '#17a2b8',           // Cyan - Information
  
  // Status Colors (Critical for safety monitoring)
  fire: '#ff5722',           // Deep Orange - Fire alarms
  trouble: '#FFC107',        // Amber - Troubles
  supervisory: '#FF9800',    // Orange - Supervisory alerts
  
  // Background Colors
  light: '#f8f9fa',          // Light gray background
  dark: '#343a40',           // Dark gray
  cardBg: 'rgba(17, 24, 39, 0.95)',  // Dark card background (semi-transparent)
  cardBorder: '#1f2937',     // Card border color
  
  // Text Colors
  textPrimary: '#212529',    // Primary text (dark)
  textSecondary: '#6c757d',   // Secondary text
  textLight: '#9ca3af',      // Light text on dark backgrounds
  textWhite: '#ffffff',      // White text
}
```

### Typography

- **Headings**: Bold, 20-32px
- **Body**: Regular, 14-16px
- **Labels**: Medium weight, 12-14px
- **Status Text**: Uppercase, letter-spacing: 0.5-1px

### Spacing System

- **Base unit**: 4px
- **Common spacing**: 8px, 12px, 16px, 20px, 24px, 32px
- **Card padding**: 16-24px
- **Section margins**: 16-24px

### Border Radius

- **Small**: 4-8px (buttons, inputs)
- **Medium**: 12px (cards, modals)
- **Large**: 16px (status cards)

### Shadows & Elevation

```css
/* Card shadow */
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

/* Active card shadow */
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);

/* Modal shadow */
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
```

---

## Core Features

### 1. Authentication System
- Email/password login
- User registration
- Session persistence
- Protected routes

### 2. Dashboard (Main Monitoring)
- Real-time alarm monitoring (Fire, Trouble, Supervisory)
- Community and Building selectors
- Message list with pagination
- Action buttons (Ack, Reset, S-Ack, T-Ack, Silence)
- Auto-refresh every 5 seconds

### 3. Stats/Mimics Screen
- Device status monitoring
- Building selector
- Add Building/Device functionality
- Real-time polling (2 seconds)
- Color-coded device cards (Green: Active, Red: Inactive)

### 4. Construction Dashboard
- Construction progress tracking
- Stats cards (Total Assets, Completed, Ongoing, Progress %)
- Step-by-step status management
- Expandable subcategory cards
- Edit mode for status updates
- Real-time polling (10 seconds)

### 5. Controls Screen
- Smoke control system management
- Building selector with logo display
- Toggle controls (SEF, SPF, LIFT, FAN)
- Optimistic UI updates
- Real-time status sync

### 6. Incident Reports
- Create, view, and edit incidents
- Community/Building filters
- Search functionality
- Stats cards (Total, Resolved, Open, High Priority)
- Priority and status badges
- Real-time polling (5 seconds)

### 7. Floor Map Viewer
- Three-level navigation (Community → Building → Floor Plan)
- Interactive floor plan display
- Asset markers with activity indicators
- Category-based asset grouping
- Asset detail modals
- Real-time activity polling (2 seconds)

---

## UI Components

### 1. StatusCard Component

**Purpose**: Display alarm/status counts with visual indicators

**Features**:
- Icon display (emoji or icon component)
- Large count number
- Uppercase title
- Active badge when count > 0
- Blinking animation on count change
- Color-coded backgrounds
- Horizontal scrollable container

**Design Specs**:
- Width: 130px (fixed)
- Border radius: 16px
- Padding: 14-16px
- Icon size: 32px
- Count font: 36px, bold
- Title font: 11px, uppercase, letter-spacing: 1px

### 2. Button Component

**Variants**:
- Primary (Blue): Main actions
- Secondary (Gray): Secondary actions
- Danger (Red): Destructive actions

**States**:
- Default
- Hover
- Active
- Disabled
- Loading

### 3. Input Component

**Features**:
- Label above input
- Placeholder text
- Error states
- Dark theme support
- Border styling

### 4. Card Component

**Usage**: Container for grouped content

**Styling**:
- Dark semi-transparent background
- Border: 1px solid
- Border radius: 8-12px
- Padding: 20-24px

### 5. ActionButtons Component

**Purpose**: Building control actions

**Buttons**:
- Ack (Green)
- Reset (Red)
- S-Ack (Cyan)
- T-Ack (Yellow)
- Silence (Gray)

**Features**:
- Active/inactive states
- Loading states
- Horizontal layout with wrapping

### 6. Navigation Drawer

**Features**:
- Slide-in animation from left
- 85% screen width
- Backdrop overlay
- Active route highlighting
- Logout button at bottom
- Icon + text navigation items

### 7. Navigation Header

**Features**:
- App title and subtitle
- Hamburger menu button
- Right component slot
- Blue header background

---

## Screen-by-Screen Implementation

### 1. Login Screen

**Layout**:
- Full-screen background image
- Centered dark card (semi-transparent)
- Email input
- Password input
- Login button
- Sign up link

**Key Features**:
- Form validation
- Loading state
- Error handling
- Keyboard handling

### 2. Dashboard Screen

**Layout Structure**:
```
Header (Navigation)
├── Selectors Row (Community, Building)
├── Status Cards (Horizontal ScrollView)
│   ├── Fire Card
│   ├── Trouble Card
│   └── Supervisory Card
├── Messages Section
│   ├── Message List
│   └── Pagination Controls
└── Action Buttons (Fixed Bottom)
```

**Key Features**:
- Modal-based dropdowns
- Horizontal scrolling status cards
- Paginated message list
- Real-time polling
- Pull-to-refresh

### 3. Stats Screen

**Layout**:
- Building selector (top)
- Device cards grid
- Add Building button
- Add Device button

**Device Card**:
- Device name
- Pseudo/identifier
- Status badge (Active/Inactive)
- Color-coded background

### 4. Construction Dashboard

**Layout**:
- Selectors (Community, Building)
- Stats cards row (horizontal scroll)
- Overall progress bar
- Construction steps list
- Expandable subcategory cards

**Construction Step**:
- Step name
- Status badge (Yet to Start / Ongoing / Completed)
- Edit button (in edit mode)

### 5. Controls Screen

**Layout**:
- Selectors (Community, Building)
- Building info card (with logo)
- Smoke control buttons grid
- Navigation to Floor Maps

**Control Button**:
- Label (SEF, SPF, LIFT, FAN)
- ON/OFF state
- Color: Green (ON), Red (OFF)
- Toggle functionality

### 6. Incident Reports Screen

**Layout**:
- Filters (Community, Building)
- Stats cards row
- Search bar
- Incident cards list
- Create button (FAB)

**Incident Card**:
- Category icon
- Title
- Priority badge
- Status badge
- Building name
- Location
- Timestamp

### 7. Floor Map Viewer

**Layout**:
- Three-level selector
- Floor plan image container
- Asset markers (overlay)
- Activity legend
- Mapped assets list (sidebar/bottom sheet)

**Asset Marker**:
- Category icon
- Activity level indicator (color-coded)
- Click to view details

---

## Next.js Setup & Architecture

### Project Initialization

```bash
# Create Next.js app with TypeScript
npx create-next-app@latest vision365-web --typescript --tailwind --app

# Install dependencies
cd vision365-web
npm install lucide-react
npm install axios
npm install zustand  # or use React Context
npm install @radix-ui/react-dialog  # for modals
npm install @radix-ui/react-select  # for dropdowns
npm install @radix-ui/react-dropdown-menu
npm install framer-motion  # for animations
npm install react-hook-form  # for forms
npm install zod  # for validation
```

### Project Structure

```
vision365-web/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── stats/
│   │   │   └── page.tsx
│   │   ├── construction/
│   │   │   └── page.tsx
│   │   ├── controls/
│   │   │   └── page.tsx
│   │   ├── incidents/
│   │   │   └── page.tsx
│   │   └── floor-maps/
│   │       └── page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── StatusCard.tsx
│   │   └── ActionButtons.tsx
│   ├── navigation/
│   │   ├── NavigationDrawer.tsx
│   │   └── NavigationHeader.tsx
│   └── common/
│       └── BaseScreen.tsx
├── lib/
│   ├── api.ts
│   ├── endpoints.ts
│   ├── constants.ts
│   └── auth.ts
├── hooks/
│   ├── useAuth.ts
│   ├── usePolling.ts
│   └── useRealTime.ts
├── store/
│   └── authStore.ts  # if using Zustand
└── styles/
    └── globals.css
```

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
        success: '#28a745',
        danger: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8',
        fire: '#ff5722',
        trouble: '#FFC107',
        supervisory: '#FF9800',
        cardBg: 'rgba(17, 24, 39, 0.95)',
        cardBorder: '#1f2937',
        textPrimary: '#212529',
        textSecondary: '#6c757d',
        textLight: '#9ca3af',
      },
      borderRadius: {
        'card': '12px',
        'status-card': '16px',
      },
      boxShadow: {
        'card': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'card-active': '0 4px 6px rgba(0, 0, 0, 0.2)',
        'modal': '0 2px 8px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
}
```

---

## Component Implementation Examples

### StatusCard Component (Next.js + Tailwind)

```tsx
// components/ui/StatusCard.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Wrench, User } from 'lucide-react'

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
  supervisory: User,
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
```

### Button Component

```tsx
// components/ui/Button.tsx
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
```

### Input Component

```tsx
// components/ui/Input.tsx
'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-3 rounded-lg border',
            'bg-gray-800 border-gray-700 text-white',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'placeholder:text-gray-500',
            error && 'border-danger focus:ring-danger',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-danger">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
```

### Navigation Drawer

```tsx
// components/navigation/NavigationDrawer.tsx
'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  BarChart3,
  Building2,
  Sliders,
  AlertTriangle,
  Map,
  LogOut,
  X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface NavigationDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const navigationItems = [
  { title: 'Dashboard', route: '/dashboard', icon: LayoutDashboard },
  { title: 'Stats', route: '/stats', icon: BarChart3 },
  { title: 'Construction', route: '/construction', icon: Building2 },
  { title: 'Controls', route: '/controls', icon: Sliders },
  { title: 'Incidents', route: '/incidents', icon: AlertTriangle },
  { title: 'Floor Maps', route: '/floor-maps', icon: Map },
]

export function NavigationDrawer({ isOpen, onClose }: NavigationDrawerProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  const handleNavigate = (route: string) => {
    onClose()
    router.push(route)
  }

  const handleLogout = async () => {
    onClose()
    await logout()
    router.push('/login')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-[85vw] max-w-sm bg-white shadow-2xl z-50"
          >
            {/* Header */}
            <div className="bg-primary p-5 border-b border-blue-600 relative">
              <h1 className="text-2xl font-bold text-white">Vision365</h1>
              <p className="text-sm text-white/80 mt-1">Fire & Safety Intelligence</p>
              <button
                onClick={onClose}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto py-4">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.route

                return (
                  <button
                    key={item.route}
                    onClick={() => handleNavigate(item.route)}
                    className={`
                      w-full flex items-center px-5 py-4 transition-colors
                      ${isActive ? 'bg-blue-50 text-primary' : 'text-gray-700 hover:bg-gray-50'}
                    `}
                  >
                    <Icon className="w-5 h-5 mr-4" />
                    <span className="font-medium">{item.title}</span>
                  </button>
                )
              })}
            </nav>

            {/* Logout Button */}
            <div className="p-5 border-t">
              <button
                onClick={handleLogout}
                className="w-full py-3 bg-danger text-white rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center justify-center"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

### BaseScreen Component

```tsx
// components/common/BaseScreen.tsx
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
```

### Dashboard Page Example

```tsx
// app/(dashboard)/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { BaseScreen } from '@/components/common/BaseScreen'
import { StatusCard } from '@/components/ui/StatusCard'
import { ActionButtons } from '@/components/ui/ActionButtons'
import { usePolling } from '@/hooks/usePolling'
import { api } from '@/lib/api'
import { endpoints } from '@/lib/endpoints'

export default function DashboardPage() {
  const [selectedCommunity, setSelectedCommunity] = useState('All')
  const [selectedBuilding, setSelectedBuilding] = useState('All')
  const [fireCount, setFireCount] = useState(0)
  const [troubleCount, setTroubleCount] = useState(0)
  const [supervisoryCount, setSupervisoryCount] = useState(0)
  const [fireBlinking, setFireBlinking] = useState(false)
  const [messages, setMessages] = useState([])
  const [currentPage, setCurrentPage] = useState(1)

  // Real-time polling
  usePolling(async () => {
    await fetchAlarmData()
    await fetchMessages()
  }, 5000)

  const fetchAlarmData = async () => {
    try {
      const response = await api.post(endpoints.alarmdetails, {
        community: selectedCommunity,
        building: selectedBuilding,
      })
      // Update counts and trigger blinking
      setFireCount(response.data.fire || 0)
      setTroubleCount(response.data.trouble || 0)
      setSupervisoryCount(response.data.supervisory || 0)
    } catch (error) {
      console.error('Error fetching alarm data:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await api.post(endpoints.listmessages, {
        page: currentPage,
        limit: 10,
      })
      setMessages(response.data.messages || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  return (
    <BaseScreen
      title="Vision 365 Dashboard"
      subtitle="Fire & Safety Intelligence"
    >
      <div className="p-4 space-y-6">
        {/* Selectors */}
        <div className="flex gap-4">
          {/* Community Selector */}
          <select
            value={selectedCommunity}
            onChange={(e) => setSelectedCommunity(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg"
          >
            <option>All Communities</option>
            {/* Options */}
          </select>

          {/* Building Selector */}
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg"
          >
            <option>All Buildings</option>
            {/* Options */}
          </select>
        </div>

        {/* Status Cards - Horizontal Scroll */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            <StatusCard
              title="Fire"
              count={fireCount}
              icon="fire"
              backgroundColor={fireCount > 0 ? '#ff5722' : '#ffffff'}
              blinking={fireBlinking}
            />
            <StatusCard
              title="Trouble"
              count={troubleCount}
              icon="trouble"
              backgroundColor={troubleCount > 0 ? '#FFC107' : '#ffffff'}
            />
            <StatusCard
              title="Supervisory"
              count={supervisoryCount}
              icon="supervisory"
              backgroundColor={supervisoryCount > 0 ? '#FF9800' : '#ffffff'}
            />
          </div>
        </div>

        {/* Messages Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Messages</h2>
          <div className="space-y-2">
            {messages.map((message) => (
              <div key={message.id} className="p-4 bg-gray-50 rounded-lg">
                {/* Message content */}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons - Fixed Bottom */}
      {selectedBuilding !== 'All' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <ActionButtons
            buildingName={selectedBuilding}
            actions={{}}
            onActionPress={() => {}}
          />
        </div>
      )}
    </BaseScreen>
  )
}
```

---

## State Management

### Using React Context (Recommended for Auth)

```tsx
// context/AuthContext.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  email: string
  role: string
  token?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (user: User) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for existing session
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = async () => {
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

### Using Zustand (Optional)

```tsx
// store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  email: string
  role: string
  token?: string
}

interface AuthStore {
  user: User | null
  login: (user: User) => void
  logout: () => void
  isAuthenticated: boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
      isAuthenticated: false,
    }),
    {
      name: 'auth-storage',
    }
  )
)
```

---

## API Integration

### API Client Setup

```tsx
// lib/api.ts
import axios from 'axios'

export const BASE_URL = 'https://einen-backend-430199503919.asia-south1.run.app'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

### Endpoints Configuration

```tsx
// lib/endpoints.ts
export const BASE_URL = 'https://einen-backend-430199503919.asia-south1.run.app'

export const endpoints = {
  // Auth
  login: `${BASE_URL}/login`,
  signup: `${BASE_URL}/signup`,

  // Messages & Alarms
  listmessages: `${BASE_URL}/list-messages`,
  alarmdetails: `${BASE_URL}/buildings/alarm-details`,

  // Buildings
  allbuildings: `${BASE_URL}/building/all`,
  addbuilding: `${BASE_URL}/building/add-building/v2`,

  // Mimic / Device status
  allmimic: `${BASE_URL}/buildings/mimic`,
  addmimic: (buildingName: string) => `${BASE_URL}/building/${buildingName}/mimic/add-device`,

  // Communities
  getAllCommunities: `${BASE_URL}/community/all`,

  // Floor Maps
  getBuildingFloorMaps: (buildingName: string) => `${BASE_URL}/buildings/${buildingName}/floor-maps`,
  getFloorMap: (buildingName: string, floorName: string) =>
    `${BASE_URL}/buildings/${buildingName}/floor-maps/${floorName}`,
  getActiveStatus: (buildingName: string, floorPlanName: string) =>
    `${BASE_URL}/buildings/${buildingName}/floor-maps/${floorPlanName}/active-status`,

  // Construction
  getConstructionAllForBuilding: (buildingName: string) => `${BASE_URL}/construction/status/${buildingName}`,
  getSubcategoriesList: `${BASE_URL}/construction/subcategory/list`,

  // Incidents
  getAllIncidents: `${BASE_URL}/buildings/incidents`,
  createIncident: (buildingName: string) => `${BASE_URL}/building/${buildingName}/incidents`,

  // Smoke Controls
  getSmokeActions: (buildingName: string) => `${BASE_URL}/smoke/${buildingName}BuildingDB`,
  updateSmokeAction: (buildingName: string) => `${BASE_URL}/smoke/${buildingName}BuildingDB`,

  // Building Actions
  getBuildingActions: (buildingName: string) => `${BASE_URL}/building/${buildingName}BuildingDB/actions`,
  updateBuildingActions: (buildingName: string) => `${BASE_URL}/building/${buildingName}BuildingDB/actions`,
}
```

---

## Real-time Features

### Custom Polling Hook

```tsx
// hooks/usePolling.ts
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
```

### Usage Example

```tsx
'use client'

import { usePolling } from '@/hooks/usePolling'
import { fetchAlarmData } from '@/lib/api'

export function DashboardComponent() {
  const [isVisible, setIsVisible] = useState(true)

  // Poll every 5 seconds when page is visible
  usePolling(
    async () => {
      await fetchAlarmData()
    },
    5000,
    isVisible
  )

  // Pause polling when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return <div>...</div>
}
```

---

## Mobile-First Responsive Design

### Breakpoints Strategy

```css
/* Tailwind default breakpoints */
sm: 640px   /* Small devices (landscape phones) */
md: 768px   /* Medium devices (tablets) */
lg: 1024px  /* Large devices (desktops) */
xl: 1280px  /* Extra large devices */
```

### Responsive Patterns

```tsx
// Mobile-first: Stack vertically, then horizontal on larger screens
<div className="flex flex-col md:flex-row gap-4">
  {/* Content */}
</div>

// Status cards: Horizontal scroll on mobile, grid on desktop
<div className="overflow-x-auto md:overflow-x-visible">
  <div className="flex md:grid md:grid-cols-3 gap-4 min-w-max md:min-w-0">
    {/* Cards */}
  </div>
</div>

// Navigation: Drawer on mobile, sidebar on desktop
<div className="md:hidden">
  <NavigationDrawer />
</div>
<div className="hidden md:block">
  <Sidebar />
</div>
```

### Touch-Friendly Sizing

- Minimum touch target: 44x44px (iOS) / 48x48px (Android)
- Button padding: 12-16px vertical, 20-24px horizontal
- Card spacing: 16px minimum between interactive elements

---

## Deployment

### Vercel Deployment (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Environment Variables

```env
NEXT_PUBLIC_API_URL=https://einen-backend-430199503919.asia-south1.run.app
```

### Build Configuration

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

---

## Key Implementation Tips

### 1. Optimistic UI Updates

```tsx
const handleToggle = async (id: string, newState: boolean) => {
  // Update UI immediately
  setButtonState(prev => ({ ...prev, [id]: newState }))
  
  try {
    await api.patch(`/endpoint/${id}`, { state: newState })
  } catch (error) {
    // Revert on error
    setButtonState(prev => ({ ...prev, [id]: !newState }))
    toast.error('Failed to update')
  }
}
```

### 2. Modal/Dropdown Implementation

Use Radix UI Dialog for modals:

```tsx
import * as Dialog from '@radix-ui/react-dialog'

<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 bg-black/50" />
    <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6">
      {/* Content */}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### 3. Form Handling

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    // Handle login
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```

### 4. Loading States

```tsx
const [loading, setLoading] = useState(false)

{loading ? (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="w-6 h-6 animate-spin text-primary" />
  </div>
) : (
  <div>Content</div>
)}
```

### 5. Error Handling

```tsx
const [error, setError] = useState<string | null>(null)

try {
  await api.post(endpoint, data)
} catch (err) {
  if (axios.isAxiosError(err)) {
    setError(err.response?.data?.message || 'An error occurred')
  } else {
    setError('An unexpected error occurred')
  }
}

{error && (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
    {error}
  </div>
)}
```

---

## Summary

This guide provides a comprehensive blueprint for implementing the Vision 365 app as a Next.js web application. Key takeaways:

1. **Mobile-first approach** - Design for mobile, enhance for desktop
2. **Component reusability** - Build modular, reusable UI components
3. **Real-time updates** - Implement polling with visibility-aware pausing
4. **Consistent theming** - Use Tailwind config for design system
5. **Type safety** - Leverage TypeScript throughout
6. **Performance** - Optimize with Next.js features (SSR, ISR, etc.)
7. **Accessibility** - Ensure keyboard navigation and screen reader support

For questions or clarifications, refer to the original React Native implementation for additional context.

