import { useState, useEffect } from 'react'
import { api } from '../services/api'
import '../styles/AnalyticsDashboardPage.css'

export default function AnalyticsDashboardPage() {
  const [activeTab, setActiveTab] = useState('reviewers')
  const [reviewerStats, setReviewerStats] = useState([])
  const [datasetAnalytics, setDatasetAnalytics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [reviewers, datasets] = await Promise.all([
        api.getReviewerStats(),
        api.getDatasetAnalytics()
      ])
      setReviewerStats(reviewers)
      setDatasetAnalytics(datasets)
    } catch (err) {
      setError(err.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const exportReviewerStats = () => {
    const csv = [
      ['Username', 'Email', 'Total Reviews', 'Approvals', 'Edits', 'Skips', 'Flags', 'Earnings', 'Status'].join(','),
      ...reviewerStats.map(r => [
        r.username,
        r.email,
        r.total_reviews,
        r.approvals,
        r.edits,
        r.skips,
        r.flags_submitted,
        r.total_earnings,
        r.is_active ? 'Active' : 'Inactive'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reviewer_stats_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="page-container"><div className="loading">Loading analytics...</div></div>
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-message">{error}</div>
        <button onClick={loadData} className="btn btn-primary">Retry</button>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>📊 Analytics Dashboard</h1>
          <p>Platform performance and reviewer statistics</p>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'reviewers' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviewers')}
        >
          👥 Reviewer Stats ({reviewerStats.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'datasets' ? 'active' : ''}`}
          onClick={() => setActiveTab('datasets')}
        >
          📁 Dataset Analytics ({datasetAnalytics.length})
        </button>
      </div>

      {activeTab === 'reviewers' && (
        <div className="tab-content">
          <div className="stats-actions">
            <button onClick={exportReviewerStats} className="btn btn-secondary">
              📥 Export to CSV
            </button>
          </div>

          <div className="stats-table-container">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Reviewer</th>
                  <th>Languages</th>
                  <th>Total Reviews</th>
                  <th>Actions</th>
                  <th>Flags</th>
                  <th>Gold Items</th>
                  <th>Earnings</th>
                  <th>Avg Time</th>
                  <th>Last Activity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reviewerStats.map((reviewer) => (
                  <tr key={reviewer.username}>
                    <td>
                      <div className="reviewer-info">
                        <strong>{reviewer.username}</strong>
                        <small>{reviewer.email}</small>
                      </div>
                    </td>
                    <td>
                      <div className="language-tags">
                        {reviewer.languages.map(lang => (
                          <span key={lang} className="language-tag-small">{lang}</span>
                        ))}
                      </div>
                    </td>
                    <td><strong>{reviewer.total_reviews}</strong></td>
                    <td>
                      <div className="action-breakdown">
                        <span className="action-stat approve">✓ {reviewer.approvals}</span>
                        <span className="action-stat edit">✏️ {reviewer.edits}</span>
                        <span className="action-stat skip">⏭ {reviewer.skips}</span>
                      </div>
                    </td>
                    <td>{reviewer.flags_submitted}</td>
                    <td>{reviewer.gold_items_reviewed}</td>
                    <td className="earnings">${reviewer.total_earnings}</td>
                    <td>{reviewer.avg_review_time_seconds > 0 ? `${reviewer.avg_review_time_seconds}s` : 'N/A'}</td>
                    <td>
                      {reviewer.last_review 
                        ? new Date(reviewer.last_review).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td>
                      <span className={`status-badge ${reviewer.is_active ? 'active' : 'inactive'}`}>
                        {reviewer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'datasets' && (
        <div className="tab-content">
          <div className="analytics-grid">
            {datasetAnalytics.map((dataset) => (
              <div key={dataset.dataset_type_id} className="analytics-card">
                <div className="analytics-card-header">
                  <div>
                    <h3>{dataset.name}</h3>
                    <span className={`modality-badge modality-${dataset.modality}`}>
                      {dataset.modality?.toUpperCase() || 'TEXT'}
                    </span>
                  </div>
                </div>

                <div className="analytics-stats-grid">
                  <div className="analytics-stat">
                    <span className="stat-label">Total Items</span>
                    <span className="stat-value-large">{dataset.total_items}</span>
                  </div>

                  <div className="analytics-stat">
                    <span className="stat-label">Finalized</span>
                    <span className="stat-value-large">
                      {dataset.finalized_count}
                      <small>({dataset.finalized_pct}%)</small>
                    </span>
                  </div>

                  <div className="analytics-stat">
                    <span className="stat-label">Gold Standard</span>
                    <span className="stat-value-large gold">
                      {dataset.gold_count}
                      <small>({dataset.gold_pct}%)</small>
                    </span>
                  </div>

                  <div className="analytics-stat">
                    <span className="stat-label">Flagged</span>
                    <span className="stat-value-large flagged">
                      {dataset.flagged_count}
                      <small>({dataset.flagged_pct}%)</small>
                    </span>
                  </div>
                </div>

                <div className="analytics-metrics">
                  <div className="metric-row">
                    <span>Avg Reviews/Item:</span>
                    <strong>{dataset.avg_reviews_per_item}</strong>
                  </div>
                  <div className="metric-row">
                    <span>Avg Skips/Item:</span>
                    <strong>{dataset.avg_skips_per_item}</strong>
                  </div>
                  <div className="metric-row">
                    <span>Unique Reviewers:</span>
                    <strong>{dataset.unique_reviewers}</strong>
                  </div>
                  <div className="metric-row">
                    <span>Total Payout:</span>
                    <strong className="earnings">${dataset.total_payout}</strong>
                  </div>
                </div>

                {dataset.skip_reasons && Object.keys(dataset.skip_reasons).length > 0 && (
                  <div className="skip-reasons">
                    <h4>Skip Reasons:</h4>
                    {Object.entries(dataset.skip_reasons).map(([reason, count]) => (
                      <div key={reason} className="skip-reason-item">
                        <span>{reason}</span>
                        <span className="skip-count">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {datasetAnalytics.length === 0 && (
              <div className="empty-state">
                <p>No datasets found. Create a dataset type to get started!</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
