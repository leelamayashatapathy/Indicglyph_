import { Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute({ children }) {
  const { user, loading, setAuthMessage } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (!loading && !user) {
      setAuthMessage?.('Please log in to continue.')
    }
  }, [loading, user, setAuthMessage])

  if (loading) {
    return <div style={{ padding: '1rem' }}>Loading...</div>
  }

  return user ? children : (
    <Navigate to="/login" state={{ from: location.pathname }} replace />
  )
}

export function AdminRoute({ children }) {
  const { user, loading, setAuthMessage } = useAuth()
  const location = useLocation()
  const isAdmin = user?.roles?.some(role => ['platform_operator', 'super_operator'].includes(role))

  useEffect(() => {
    if (!loading && !user) {
      setAuthMessage?.('Please log in to continue.')
    } else if (!loading && user && !isAdmin) {
      setAuthMessage?.('You need platform operator access to view that page.')
    }
  }, [loading, user, isAdmin, setAuthMessage])

  if (loading) {
    return <div style={{ padding: '1rem' }}>Loading...</div>
  }

  if (!user || !isAdmin) {
    return <Navigate to={user ? '/dashboard' : '/login'} state={{ from: location.pathname }} replace />
  }

  return children
}
