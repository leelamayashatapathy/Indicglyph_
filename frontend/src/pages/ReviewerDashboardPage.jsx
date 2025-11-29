import { useState, useEffect } from 'react'
import { api } from '../services/api'
import '../styles/ReviewerDashboardPage.css'
import { useNavigate } from 'react-router-dom'

export default function ReviewerDashboardPage() {
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadAssignedDatasets()
  }, [])

  const loadAssignedDatasets = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await api.getAssignedDatasets()
      setDatasets(response)
    } catch (err) {
      setError(err.message || 'Failed to load assigned datasets')
    } finally {
      setLoading(false)
    }
  }

  const handleContinueReviewing = (datasetTypeId) => {
    navigate(`/review?dataset_type=${datasetTypeId}`)
  }

  const getModalityIcon = (modality) => {
    const icons = {
      text: '📝',
      ocr: '🔍',
      voice: '🎤',
      conversation: '💬',
      image: '🖼️',
      video: '🎬',
      custom: '⚙️'
    }
    return icons[modality] || '📄'
  }

  const getModalityColor = (modality) => {
    const colors = {
      text: '#2196F3',
      ocr: '#9C27B0',
      voice: '#FF9800',
      conversation: '#4CAF50',
      image: '#E91E63',
      video: '#00BCD4',
      custom: '#607D8B'
    }
    return colors[modality] || '#757575'
  }

  if (loading) {
    return <div className="loading">Loading your assignments...</div>
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={loadAssignedDatasets} className="btn btn-primary">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="reviewer-dashboard">
      <div className="dashboard-header">
        <h1>📊 Your Dashboard</h1>
        <p className="subtitle">Review tasks assigned to you</p>
      </div>

      {datasets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No Datasets Currently Assigned</h3>
          <p>You don't have any active review assignments right now.</p>
          <p className="help-text">Check back later or contact your administrator for assignments.</p>
        </div>
      ) : (
        <div className="datasets-grid">
          {datasets.map((dataset) => (
            <div key={dataset._id} className="dataset-card">
              <div className="card-header">
                <div className="modality-badge" style={{ backgroundColor: getModalityColor(dataset.modality) }}>
                  <span className="modality-icon">{getModalityIcon(dataset.modality)}</span>
                  <span className="modality-label">{dataset.modality.toUpperCase()}</span>
                </div>
              </div>

              <div className="card-body">
                <h3 className="dataset-name">{dataset.name}</h3>
                {dataset.description && (
                  <p className="dataset-description">{dataset.description}</p>
                )}

                <div className="stats-row">
                  <div className="stat-item">
                    <span className="stat-label">Total Items</span>
                    <span className="stat-value">{dataset.total_items}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Reviewed by You</span>
                    <span className="stat-value">{dataset.items_reviewed}</span>
                  </div>
                </div>

                <div className="progress-section">
                  <div className="progress-header">
                    <span className="progress-label">Progress</span>
                    <span className="progress-percent">{dataset.progress_pct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${dataset.progress_pct}%`,
                        backgroundColor: getModalityColor(dataset.modality)
                      }}
                    />
                  </div>
                </div>

                <div className="earnings-section">
                  <div className="earnings-label">💰 Your Earnings</div>
                  <div className="earnings-value">${dataset.user_earnings.toFixed(3)}</div>
                  <div className="earnings-rate">
                    ${dataset.payout_rate.toFixed(3)} per review
                  </div>
                </div>

                {dataset.review_guidelines && (
                  <div className="guidelines-preview">
                    <strong>Guidelines:</strong> {dataset.review_guidelines.substring(0, 100)}
                    {dataset.review_guidelines.length > 100 && '...'}
                  </div>
                )}

                <div className="languages-tags">
                  {dataset.languages.map(lang => (
                    <span key={lang} className="language-tag">{lang}</span>
                  ))}
                </div>
              </div>

              <div className="card-footer">
                <button
                  className="btn btn-primary"
                  onClick={() => handleContinueReviewing(dataset._id)}
                  disabled={dataset.total_items === 0}
                >
                  {dataset.items_reviewed === 0 ? '▶️ Start Reviewing' : '⏭️ Continue Reviewing'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
