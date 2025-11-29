import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'
import '../styles/AuthPages.css'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await register(formData)
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>
      
      <div className="auth-container animate-fade-in">
        <div className="auth-header">
          <div className="auth-logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="url(#gradient2)"/>
              <path d="M24 14v20M14 24h20" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              <defs>
                <linearGradient id="gradient2" x1="0" y1="0" x2="48" y2="48">
                  <stop stopColor="#FFB74D"/>
                  <stop offset="1" stopColor="#FFA726"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join our platform and start reviewing data</p>
        </div>

        {error && (
          <div className="alert alert-error animate-slide-in">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label className="input-label">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 8a3 3 0 100-6 3 3 0 000 6zM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 00-11.215 0c-.22.578.254 1.139.872 1.139h9.47z"/>
              </svg>
              Username
            </label>
            <input
              type="text"
              name="username"
              className="input"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a unique username"
              required
              autoFocus
            />
          </div>

          <div className="input-group">
            <label className="input-label">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v.5a.5.5 0 01-.777.416L8 1.101 2.777 3.916A.5.5 0 012 3.5V3z"/>
                <path d="M2 4.217V13a1 1 0 001 1h10a1 1 0 001-1V4.217l-5.223 2.815a.5.5 0 01-.554 0L2 4.217z"/>
              </svg>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              className="input"
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M5 6a3 3 0 016 0v1h.5a1.5 1.5 0 011.5 1.5v4a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 013 12.5v-4A1.5 1.5 0 014.5 7H5V6zm1.5 1V6a1.5 1.5 0 013 0v1h-3z" clipRule="evenodd"/>
              </svg>
              Password
            </label>
            <input
              type="password"
              name="password"
              className="input"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              required
              minLength="6"
            />
            <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-small)', color: 'var(--color-ink-lighter)' }}>
              Must be at least 6 characters long
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Creating account...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
                </svg>
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? 
            <Link to="/login" className="auth-link">
              Sign in instead
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 9H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </Link>
          </p>
        </div>

        <div className="auth-trust-badges">
          <div className="trust-badge">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M8 0a1 1 0 011 1v.5a7.5 7.5 0 010 15V1a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            <span>256-bit SSL</span>
          </div>
          <div className="trust-badge">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8.186 1.113a.5.5 0 00-.372 0L1.846 3.5 8 5.961 14.154 3.5 8.186 1.113zM15 4.239l-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923l6.5 2.6z"/>
            </svg>
            <span>SOC 2 Certified</span>
          </div>
          <div className="trust-badge">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.5 1A1.5 1.5 0 001 2.5v11A1.5 1.5 0 002.5 15h6.086a1.5 1.5 0 001.06-.44l4.915-4.914A1.5 1.5 0 0015 8.586V2.5A1.5 1.5 0 0013.5 1h-11zM6 4.5a.5.5 0 01.5-.5h3a.5.5 0 010 1h-3a.5.5 0 01-.5-.5zM6.5 7a.5.5 0 000 1h3a.5.5 0 000-1h-3zm0 2.5a.5.5 0 000 1h3a.5.5 0 000-1h-3z"/>
            </svg>
            <span>GDPR Compliant</span>
          </div>
        </div>
      </div>
    </div>
  )
}
