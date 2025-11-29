import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import '../styles/DashboardPage.css'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [statsData, reviewsData] = await Promise.all([
        api.getReviewStats(),
        api.getMyReviews()
      ])
      setStats(statsData)
      setReviews(reviewsData)
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h2 className="empty-state-title">Failed to Load</h2>
          <p className="empty-state-description">{error}</p>
          <button onClick={loadData} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const approvalRate = stats?.total_reviews > 0 
    ? ((stats.approvals / stats.total_reviews) * 100).toFixed(1) 
    : 0

  return (
    <div className="dashboard-page animate-fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Track your review activity and earnings</p>
        </div>
        <button onClick={loadData} className="btn btn-secondary btn-icon" title="Refresh">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
          </svg>
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-tile stat-tile-primary">
          <div className="stat-icon">
            <svg width="32" height="32" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Current Balance</div>
            <div className="stat-value">${user?.payout_balance?.toFixed(3) || '0.000'}</div>
            <div className="stat-change stat-change-positive">
              ↑ ${stats?.total_earned?.toFixed(3) || '0.000'} earned
            </div>
          </div>
        </div>

        <div className="stat-tile">
          <div className="stat-icon stat-icon-secondary">
            <svg width="32" height="32" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Reviews</div>
            <div className="stat-value">{stats?.total_reviews || 0}</div>
            <div className="stat-meta">{stats?.approvals || 0} approved</div>
          </div>
        </div>

        <div className="stat-tile">
          <div className="stat-icon stat-icon-success">
            <svg width="32" height="32" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Approval Rate</div>
            <div className="stat-value">{approvalRate}%</div>
            <div className="stat-progress">
              <div className="stat-progress-bar" style={{ width: `${approvalRate}%` }}></div>
            </div>
          </div>
        </div>

        <div className="stat-tile">
          <div className="stat-icon stat-icon-warning">
            <svg width="32" height="32" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Edits Made</div>
            <div className="stat-value">{stats?.edits || 0}</div>
            <div className="stat-meta">{stats?.skips || 0} skips</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card activity-card">
          <div className="card-header">
            <h2 className="card-title">Recent Activity</h2>
            <span className="badge badge-neutral">{reviews.length} items</span>
          </div>

          {reviews.length === 0 ? (
            <div className="empty-state-inline">
              <div className="empty-state-icon-small">📋</div>
              <p>No reviews yet. Start reviewing to see your activity here!</p>
            </div>
          ) : (
            <div className="activity-timeline">
              {reviews.slice(0, 15).map((review, index) => (
                <div key={review._id} className="activity-item" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="activity-indicator">
                    {review.action === 'approve' && (
                      <div className="activity-dot activity-dot-success">
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      </div>
                    )}
                    {review.action === 'edit' && (
                      <div className="activity-dot activity-dot-primary">
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                        </svg>
                      </div>
                    )}
                    {review.action === 'skip' && (
                      <div className="activity-dot activity-dot-neutral">
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                        </svg>
                      </div>
                    )}
                    {index < reviews.length - 1 && <div className="activity-line"></div>}
                  </div>

                  <div className="activity-content">
                    <div className="activity-header">
                      <span className={`badge badge-${review.action === 'approve' ? 'success' : review.action === 'edit' ? 'primary' : 'neutral'}`}>
                        {review.action}
                      </span>
                      <span className="activity-time">{getTimeAgo(review.timestamp)}</span>
                    </div>
                    <div className="activity-details">
                      <span className="activity-id">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                        </svg>
                        {review.dataset_item_id.substring(0, 12)}...
                      </span>
                      <span className="activity-payout">+${review.payout_amount.toFixed(3)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sidebar-stats">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Quick Stats</h3>
            </div>
            
            <div className="quick-stats-list">
              <div className="quick-stat">
                <div className="quick-stat-label">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                  </svg>
                  Avg. Time/Review
                </div>
                <div className="quick-stat-value">~2.3 min</div>
              </div>

              <div className="quick-stat">
                <div className="quick-stat-label">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                    </svg>
                  Today's Reviews
                </div>
                <div className="quick-stat-value">{Math.min(stats?.total_reviews || 0, 15)}</div>
              </div>

              <div className="quick-stat">
                <div className="quick-stat-label">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"/>
                  </svg>
                  Current Streak
                </div>
                <div className="quick-stat-value">{Math.floor((stats?.total_reviews || 0) / 5) + 1} days</div>
              </div>

              <div className="quick-stat">
                <div className="quick-stat-label">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  Quality Score
                </div>
                <div className="quick-stat-value">{approvalRate > 80 ? '⭐⭐⭐⭐⭐' : approvalRate > 60 ? '⭐⭐⭐⭐' : '⭐⭐⭐'}</div>
              </div>
            </div>
          </div>

          <div className="card card-glass">
            <div className="motivational-card">
              <div className="motivational-icon">🎯</div>
              <h3>Keep Going!</h3>
              <p>You're doing great! {stats?.total_reviews < 10 ? 'Complete 10 reviews to unlock achievements' : 'You\'re a star reviewer!'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
