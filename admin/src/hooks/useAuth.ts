import { useState, useEffect, useCallback } from 'react'
import client from '@/api/client'
import type { AdminInfo, AuthResponse, LoginCredentials } from '@/types'

const TOKEN_KEY = 'admin_token'
const INFO_KEY = 'admin_info'

export function useAuth() {
  const [admin, setAdmin] = useState<AdminInfo | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [isAuthed, setIsAuthed] = useState<boolean>(() => !!localStorage.getItem(TOKEN_KEY))

  useEffect(() => {
    if (token) {
      const infoStr = localStorage.getItem(INFO_KEY)
      if (infoStr) {
        try {
          const info = JSON.parse(infoStr) as AdminInfo
          setAdmin(info)
          setIsAuthed(true)
        } catch {
          setAdmin(null)
          setIsAuthed(false)
        }
      }
    } else {
      setAdmin(null)
      setIsAuthed(false)
    }
  }, [token])

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await client.post<AuthResponse>('/admin/auth/login', credentials)
    const data = response.data
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(INFO_KEY, JSON.stringify(data.admin))
    setToken(data.token)
    setAdmin(data.admin)
    setIsAuthed(true)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(INFO_KEY)
    setToken(null)
    setAdmin(null)
    setIsAuthed(false)
  }, [])

  return { admin, login, logout, isAuthed, token }
}
