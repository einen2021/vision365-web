export interface User {
  email: string
  role: string
  token?: string
}

export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null
  
  try {
    const userData = localStorage.getItem('user')
    if (userData) {
      return JSON.parse(userData)
    }
  } catch (e) {
    // Invalid JSON
  }
  return null
}

export const setStoredUser = (user: User): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user))
  }
}

export const clearStoredUser = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user')
  }
}

