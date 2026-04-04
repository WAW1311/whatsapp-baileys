'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null
    try {
      return JSON.parse(localStorage.getItem('wa_user'))
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('wa_token')
  })
  const [loading, setLoading] = useState(false)

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password })
    if (!res.data.status) throw new Error(res.data.response)
    const { token: t, user: u } = res.data.response
    localStorage.setItem('wa_token', t)
    localStorage.setItem('wa_user', JSON.stringify(u))
    setToken(t)
    setUser(u)
    return u
  }

  const register = async (name, email, password) => {
    const res = await api.post('/api/auth/register', { name, email, password })
    if (!res.data.status) throw new Error(res.data.response)
    return res.data.response
  }

  const logout = () => {
    localStorage.removeItem('wa_token')
    localStorage.removeItem('wa_user')
    setToken(null)
    setUser(null)
  }

  const refreshUser = async () => {
    if (!localStorage.getItem('wa_token')) return
    try {
      setLoading(true)
      const res = await api.get('/api/auth/me')
      if (res.data.status) {
        setUser(res.data.response)
        localStorage.setItem('wa_user', JSON.stringify(res.data.response))
      }
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) refreshUser()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
