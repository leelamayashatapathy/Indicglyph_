import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import ErrorBoundary from '../components/ErrorBoundary'
import '../styles/AdminPanel.css'

export default function AdminPanel() {
  const { user } = useAuth()
  const location = useLocation()
  const [expandedSections, setExpandedSections] = useState({
    data: true,
    ingestion: false,
    monitoring: false,
    administration: false,
    content: false,
  })

  const isAdmin = user?.roles?.some(role => ['platform_operator', 'super_operator'].includes(role))

  if (!isAdmin) {
    return (
      <div className="admin-panel">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <h1 className="empty-state-title">Access Denied</h1>
          <p className="empty-state-description">You need platform operator privileges to access this area.</p>
        </div>
      </div>
    )
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  const menuGroups = [
    {
      id: 'overview',
      type: 'single',
      items: [
        {
          path: '/admin',
          label: 'Overview',
          exact: true,
          icon: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
          )
        }
      ]
    },
    {
      id: 'data',
      label: 'Data Management',
      type: 'group',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/>
        </svg>
      ),
      items: [
        {
          path: '/admin/dataset-types',
          label: 'Dataset Types',
          icon: (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
            </svg>
          )
        },
        {
          path: '/admin/dataset-items',
          label: 'Dataset Items',
          icon: (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/>
            </svg>
          )
        },
        {
          path: '/admin/add-items',
          label: 'Add Items',
          icon: (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"/>
            </svg>
          )
        }
      ]
    },
    {
      id: 'ingestion',
      label: 'Ingestion',
      type: 'group',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
        </svg>
      ),
      items: [
        {
          path: '/admin/ocr',
          label: 'OCR Ingestion',
          icon: (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
            </svg>
          )
        },
        {
          path: '/admin/audio',
          label: 'Audio Transcription',
          icon: (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
            </svg>
          )
        }
      ]
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      type: 'group',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
        </svg>
      ),
      items: [
        {
          path: '/admin/analytics',
          label: 'Analytics',
          icon: (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
            </svg>
          )
        },
        {
          path: '/admin/flagged-items',
          label: 'Flagged Items',
          icon: (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd"/>
            </svg>
          )
        }
      ]
    },
    {
      id: 'administration',
      label: 'Administration',
      type: 'group',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
        </svg>
      ),
      items: [
        {
          path: '/admin/users',
          label: 'Users',
          icon: (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
            </svg>
          )
        },
        {
          path: '/admin/system-config',
          label: 'System Config',
          icon: (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
            </svg>
          )
        },
        {
          path: '/admin/payouts',
          label: 'Payouts',
          icon: (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
            </svg>
          )
        }
      ]
    },
    {
      id: 'content',
      label: 'Content',
      type: 'group',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
        </svg>
      ),
      items: [
        {
          path: '/admin/homepage-setup',
          label: 'Homepage',
          icon: (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
            </svg>
          )
        }
      ]
    }
  ]

  // Auto-expand section if current route is in it
  useEffect(() => {
    const newExpanded = { ...expandedSections }
    let changed = false
    
    menuGroups.forEach(group => {
      if (group.type === 'group') {
        const hasActiveItem = group.items.some(item => {
          if (item.exact) {
            return location.pathname === item.path
          }
          return location.pathname.startsWith(item.path)
        })
        if (hasActiveItem && !newExpanded[group.id]) {
          newExpanded[group.id] = true
          changed = true
        }
      }
    })
    
    if (changed) {
      setExpandedSections(newExpanded)
    }
  }, [location.pathname])

  return (
    <div className="admin-panel animate-fade-in">
      <div className="admin-header card-glass">
        <div className="admin-header-content">
          <div className="admin-branding">
            <div className="admin-icon">
              <svg width="32" height="32" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <h1 className="admin-title">Platform Console</h1>
              <p className="admin-subtitle">Manage your data review platform</p>
            </div>
          </div>
          <div className="admin-user-badge">
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="user-info-mini">
              <div className="user-name">{user?.username}</div>
              <div className="user-role">
                {user?.roles?.includes('super_operator') ? 'Super Operator' : 'Operator'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <nav className="admin-nav">
            {menuGroups.map(group => {
              if (group.type === 'single') {
                const item = group.items[0]
                const active = isActive(item.path, item.exact)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-item nav-item-single ${active ? 'nav-item-active' : ''}`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                )
              }

              const isExpanded = expandedSections[group.id]
              const hasActiveItem = group.items.some(item => isActive(item.path))

              return (
                <div key={group.id} className="nav-group">
                  <button
                    className={`nav-group-header ${hasActiveItem ? 'nav-group-active' : ''}`}
                    onClick={() => toggleSection(group.id)}
                  >
                    <span className="nav-group-icon">{group.icon}</span>
                    <span className="nav-group-label">{group.label}</span>
                    <svg
                      className={`nav-group-chevron ${isExpanded ? 'expanded' : ''}`}
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {isExpanded && (
                    <div className="nav-group-items">
                      {group.items.map(item => {
                        const active = isActive(item.path)
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item nav-item-nested ${active ? 'nav-item-active' : ''}`}
                          >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </aside>

        <div className="admin-content">
          <ErrorBoundary fallbackMessage="An error occurred while loading the admin page. Please try refreshing or contact support.">
            <Outlet />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}
