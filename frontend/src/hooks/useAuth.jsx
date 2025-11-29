import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authMessage, setAuthMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.getProfile()
        .then(profile => {
          setUser(profile)
        })
        .catch(error => {
          if (error?.status === 401) {
            setAuthMessage('Session expired. Please log in again.')
            logout('Session expired. Please log in again.')
          } else {
            console.error('useAuth - Error fetching profile:', error)
            localStorage.removeItem('token')
            setUser(null)
          }
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username, password) => {
    await api.login(username, password)
    const profile = await api.getProfile()
    setAuthMessage('')
    setUser(profile)
    navigate('/')
  }

  const register = async (userData) => {
    await api.register(userData)
    await login(userData.username, userData.password)
  }

  const logout = (message = '') => {
    setAuthMessage(message)
    api.logout()
    setUser(null)
    navigate('/login')
  }

  const refreshUser = async () => {
    try {
      const profile = await api.getProfile()
      setUser(profile)
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, authMessage, setAuthMessage, login, register, logout, refreshUser }}>
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
