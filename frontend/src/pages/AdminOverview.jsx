import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import { Link } from 'react-router-dom'
import '../styles/AdminOverview.css'

// SVG Icon Components with Gradient Fills
function UsersIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="usersGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00B8D9" />
          <stop offset="100%" stopColor="#B794F6" />
        </linearGradient>
      </defs>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="url(#usersGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="7" r="4" stroke="url(#usersGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="url(#usersGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ItemsIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="itemsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F9CF9" />
          <stop offset="100%" stopColor="#00B8D9" />
        </linearGradient>
      </defs>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="url(#itemsGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="14 2 14 8 20 8" stroke="url(#itemsGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="16" y1="13" x2="8" y2="13" stroke="url(#itemsGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="16" y1="17" x2="8" y2="17" stroke="url(#itemsGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ReviewsIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="reviewsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="url(#reviewsGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="22 4 12 14.01 9 11.01" stroke="url(#reviewsGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function MoneyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="moneyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <line x1="12" y1="1" x2="12" y2="23" stroke="url(#moneyGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="url(#moneyGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Number counter animation hook
function useCountUp(end, duration = 1000) {
  const [count, setCount] = useState(0)
  const countRef = useRef(0)
  
  useEffect(() => {
    if (end === 0) return
    
    const startTime = Date.now()
    const timer = setInterval(() => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)
      
      const easeOutQuad = progress * (2 - progress)
      const currentCount = Math.floor(easeOutQuad * end)
      
      countRef.current = currentCount
      setCount(currentCount)
      
      if (progress === 1) {
        clearInterval(timer)
        setCount(end)
      }
    }, 16)
    
    return () => clearInterval(timer)
  }, [end, duration])
  
  return count
}

export default function AdminOverview() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState('csv')
  const [exportFilters, setExportFilters] = useState({
    is_gold: null,
    flagged: null,
    language: [],
    dataset_type_id: '',
    finalized: null,
    reviewer_id: '',
  })
  const [datasetTypes, setDatasetTypes] = useState([])

  // Animated counters
  const totalUsers = useCountUp(stats?.users?.total || 0, 1200)
  const totalItems = useCountUp(stats?.queue?.total_items || 0, 1200)
  const totalReviews = useCountUp(stats?.totals?.total_reviews_completed || 0, 1200)

  useEffect(() => {
    loadStats()
    loadDatasetTypes()
  }, [])

  const loadDatasetTypes = async () => {
    try {
      const types = await api.getDatasetTypes()
      setDatasetTypes(types)
    } catch (err) {
      console.error('Failed to load dataset types:', err)
    }
  }

  const loadStats = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await api.getAdminStats()
      setStats(data)
    } catch (err) {
      setError(err.message || 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const cleanFilters = {}
      if (exportFilters.is_gold !== null) cleanFilters.is_gold = exportFilters.is_gold
      if (exportFilters.flagged !== null) cleanFilters.flagged = exportFilters.flagged
      if (exportFilters.language && exportFilters.language.length > 0) cleanFilters.language = exportFilters.language
      if (exportFilters.dataset_type_id) cleanFilters.dataset_type_id = exportFilters.dataset_type_id
      if (exportFilters.finalized !== null) cleanFilters.finalized = exportFilters.finalized
      if (exportFilters.reviewer_id) cleanFilters.reviewer_id = exportFilters.reviewer_id

      await api.exportDatasetItems(exportFormat, cleanFilters)
      alert(`Export successful! File downloaded.`)
      setShowExportModal(false)
    } catch (err) {
      alert(`Export failed: ${err.message}`)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-overview">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading platform stats...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-overview">
        <div className="error-container">
          <div className="error-message">{error}</div>
          <button onClick={loadStats} className="btn btn-primary">Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-overview">
      <div className="page-header-modern">
        <h2 className="gradient-text">Platform Overview</h2>
        <p className="header-subtitle">Real-time analytics and quick actions</p>
      </div>

      {/* Glassmorphic Stats Grid */}
      <div className="stats-grid-modern">
        <div className="stat-card-glass fade-in-up" style={{ animationDelay: '0s' }}>
          <div className="stat-icon-wrapper">
            <UsersIcon />
          </div>
          <div className="stat-info">
            <div className="stat-value">{totalUsers}</div>
            <div className="stat-label">Total Users</div>
            <div className="stat-meta">{stats?.users?.active || 0} active</div>
          </div>
          <div className="stat-glow stat-glow-purple"></div>
        </div>

        <div className="stat-card-glass fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="stat-icon-wrapper">
            <ItemsIcon />
          </div>
          <div className="stat-info">
            <div className="stat-value">{totalItems}</div>
            <div className="stat-label">Total Items</div>
            <div className="stat-meta">
              {stats?.queue?.pending_items || stats?.queue?.pending || 0} pending
            </div>
          </div>
          <div className="stat-glow stat-glow-blue"></div>
        </div>

        <div className="stat-card-glass fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="stat-icon-wrapper">
            <ReviewsIcon />
          </div>
          <div className="stat-info">
            <div className="stat-value">{totalReviews}</div>
            <div className="stat-label">Reviews Done</div>
          </div>
          <div className="stat-glow stat-glow-green"></div>
        </div>

        <div className="stat-card-glass fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="stat-icon-wrapper">
            <MoneyIcon />
          </div>
          <div className="stat-info">
            <div className="stat-value">${stats?.totals?.total_balance_outstanding?.toFixed(2) || '0.00'}</div>
            <div className="stat-label">Balance Outstanding</div>
          </div>
          <div className="stat-glow stat-glow-teal"></div>
        </div>
      </div>

      {/* Quick Actions with Gradient Cards */}
      <div className="quick-actions-modern">
        <h3 className="section-title">Quick Actions</h3>
        <div className="action-cards-grid">
          <Link to="/admin/dataset-types" className="action-card-gradient action-card-blue fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="action-icon-modern">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth="2"/>
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth="2"/>
                <rect x="14" y="14" width="7" height="7" rx="1" stroke="white" strokeWidth="2"/>
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
            <div className="action-content">
              <div className="action-title">Dataset Types</div>
              <div className="action-desc">Create and manage schemas</div>
            </div>
            <div className="action-arrow">→</div>
          </Link>

          <Link to="/admin/users" className="action-card-gradient action-card-purple fade-in-up" style={{ animationDelay: '0.5s' }}>
            <div className="action-icon-modern">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="7" r="4" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
            <div className="action-content">
              <div className="action-title">User Management</div>
              <div className="action-desc">Manage roles and access</div>
            </div>
            <div className="action-arrow">→</div>
          </Link>

          <Link to="/admin/system-config" className="action-card-gradient action-card-cyan fade-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="action-icon-modern">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2"/>
                <path d="M12 1v6m0 6v6M23 12h-6m-6 0H1" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="action-content">
              <div className="action-title">System Config</div>
              <div className="action-desc">Configure platform settings</div>
            </div>
            <div className="action-arrow">→</div>
          </Link>

          <Link to="/admin/payouts" className="action-card-gradient action-card-green fade-in-up" style={{ animationDelay: '0.7s' }}>
            <div className="action-icon-modern">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="2" stroke="white" strokeWidth="2"/>
                <line x1="2" y1="10" x2="22" y2="10" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
            <div className="action-content">
              <div className="action-title">Payouts</div>
              <div className="action-desc">Process payments</div>
            </div>
            <div className="action-arrow">→</div>
          </Link>
        </div>
      </div>

      {/* Export Tools - Gradient Card */}
      <div className="export-section-modern fade-in-up" style={{ animationDelay: '0.8s' }}>
        <div className="export-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="export-content">
          <h3 className="export-title">Export Dataset Items</h3>
          <p className="export-desc">Download your data in CSV or JSONL format with custom filters</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowExportModal(true)}>
          <span>Export Data</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Export Modal (keep existing) */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content export-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">📥 Export Dataset Items</h3>
            <p className="modal-description">
              Configure filters and export format to download your dataset
            </p>

            <div className="export-form">
              <div className="form-group">
                <label className="form-label">Export Format *</label>
                <div className="format-toggle">
                  <button 
                    className={`format-btn ${exportFormat === 'csv' ? 'active' : ''}`}
                    onClick={() => setExportFormat('csv')}
                  >
                    CSV
                  </button>
                  <button 
                    className={`format-btn ${exportFormat === 'jsonl' ? 'active' : ''}`}
                    onClick={() => setExportFormat('jsonl')}
                  >
                    JSONL
                  </button>
                </div>
              </div>

              <div className="filters-section">
                <h4 className="filters-header">🔍 Filters (Optional)</h4>
                
                <div className="form-group">
                  <label className="form-label">Dataset Type</label>
                  <select 
                    value={exportFilters.dataset_type_id}
                    onChange={(e) => setExportFilters({...exportFilters, dataset_type_id: e.target.value})}
                    className="form-input"
                  >
                    <option value="">All Dataset Types</option>
                    {datasetTypes.map(dt => (
                      <option key={dt.id} value={dt.id}>{dt.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Gold Standard Only</label>
                  <select 
                    value={exportFilters.is_gold === null ? '' : exportFilters.is_gold.toString()}
                    onChange={(e) => setExportFilters({
                      ...exportFilters, 
                      is_gold: e.target.value === '' ? null : e.target.value === 'true'
                    })}
                    className="form-input"
                  >
                    <option value="">All Items</option>
                    <option value="true">Gold Standard Only</option>
                    <option value="false">Non-Gold Only</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Flagged Items</label>
                  <select 
                    value={exportFilters.flagged === null ? '' : exportFilters.flagged.toString()}
                    onChange={(e) => setExportFilters({
                      ...exportFilters, 
                      flagged: e.target.value === '' ? null : e.target.value === 'true'
                    })}
                    className="form-input"
                  >
                    <option value="">All Items</option>
                    <option value="true">Flagged Only</option>
                    <option value="false">Not Flagged</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Finalized</label>
                  <select 
                    value={exportFilters.finalized === null ? '' : exportFilters.finalized.toString()}
                    onChange={(e) => setExportFilters({
                      ...exportFilters, 
                      finalized: e.target.value === '' ? null : e.target.value === 'true'
                    })}
                    className="form-input"
                  >
                    <option value="">All Items</option>
                    <option value="true">Finalized Only</option>
                    <option value="false">Not Finalized</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button onClick={() => setShowExportModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button onClick={handleExport} disabled={exporting} className="btn btn-primary">
                  {exporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
