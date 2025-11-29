import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorBanner from '../components/ErrorBanner'
import '../styles/ReviewPage.css'
import { useFocusTrap } from '../hooks/useFocusTrap'

const MODALITY_ICONS = {
  text: 'TEXT',
  ocr: 'OCR',
  voice: 'VOICE',
  conversation: 'CHAT',
  image: 'IMG',
  video: 'VIDEO',
  custom: 'CUSTOM'
}

export default function ReviewPage() {
  const { user, refreshUser } = useAuth()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editedContent, setEditedContent] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const [stats, setStats] = useState({ totalReviews: 0, todayReviews: 0, streak: 1 })
  
  // Skip checkbox and feedback
  const [skipDataCorrect, setSkipDataCorrect] = useState(false)
  const [showSkipFeedbackModal, setShowSkipFeedbackModal] = useState(false)
  const [skipFeedback, setSkipFeedback] = useState('')
  
  // Flag modal
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [flagReason, setFlagReason] = useState('unclear')
  const [flagNote, setFlagNote] = useState('')
  const skipModalRef = useRef(null)
  const flagModalRef = useRef(null)
  const skipTriggerRef = useRef(null)
  const flagTriggerRef = useRef(null)
  const skipTextareaRef = useRef(null)
  const flagReasonRef = useRef(null)

  // System config
  const [systemConfig, setSystemConfig] = useState(null)

  // Dataset type schema for widget rendering
  const [datasetTypeSchema, setDatasetTypeSchema] = useState(null)

  useFocusTrap(showSkipFeedbackModal, skipModalRef, {
    initialFocusRef: skipTextareaRef,
    returnFocusRef: skipTriggerRef,
    onClose: () => setShowSkipFeedbackModal(false)
  })

  useFocusTrap(showFlagModal, flagModalRef, {
    initialFocusRef: flagReasonRef,
    returnFocusRef: flagTriggerRef,
    onClose: () => setShowFlagModal(false)
  })

  useEffect(() => {
    // Fetch system config on mount
    const fetchConfig = async () => {
      try {
        const config = await api.getSystemConfig()
        setSystemConfig(config)
      } catch (err) {
        console.error('Failed to fetch system config:', err)
        // Use defaults if config fetch fails
        setSystemConfig({
          gold_skip_correct_threshold: 5,
          max_unchecked_skips_before_prompt: 2
        })
      }
    }
    fetchConfig()
  }, [])

  const fetchNextItem = async () => {
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    setEditMode(false)
    
    try {
      const languages = user?.languages?.length > 0 ? user.languages : ['en']
      const data = await api.getNextItem(languages)
      
      if (data.message) {
        setItem(null)
        setError(data.message)
      } else {
        setItem(data)
        setEditedContent(data.content || {})
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch next item')
      setItem(null)
    } finally {
      setLoading(false)
    }
  }

  // Fetch dataset type schema when item changes
  useEffect(() => {
    const fetchSchema = async () => {
      if (item?.dataset_type_id) {
        try {
          const schema = await api.getDatasetTypeSchema(item.dataset_type_id)
          setDatasetTypeSchema(schema)
        } catch (err) {
          console.error('Failed to fetch dataset type schema:', err)
          setDatasetTypeSchema(null)
        }
      }
    }
    fetchSchema()
  }, [item?.dataset_type_id])

  // Only update stats when user changes, don't auto-fetch on mount
  useEffect(() => {
    if (user) {
      setStats({
        totalReviews: user.reviews_done || 0,
        todayReviews: Math.floor((user.reviews_done || 0) / 10),
        streak: Math.floor((user.reviews_done || 0) / 5) + 1
      })
    }
  }, [user])

  const handleApprove = async () => {
    if (!item) return
    
    setSubmitting(true)
    setError(null)
    
    try {
      const result = await api.submitReview(item._id, 'approve')
      setSuccessMessage(`Approved! Earned $${result.payout_amount.toFixed(3)}`)
      await refreshUser()
      setTimeout(fetchNextItem, 1500)
    } catch (err) {
      setError(err.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = () => {
    setEditMode(true)
  }

  const handleSaveEdit = async () => {
    if (!item) return
    
    setSubmitting(true)
    setError(null)
    
    try {
      const result = await api.submitReview(item._id, 'edit', editedContent)
      setSuccessMessage(`Edited! Earned $${result.payout_amount.toFixed(3)}`)
      await refreshUser()
      setTimeout(fetchNextItem, 1500)
    } catch (err) {
      setError(err.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkip = async (feedback = null) => {
    if (!item) return
    
    setSubmitting(true)
    setError(null)
    
    try {
      const result = await api.submitReview(item._id, 'skip', null, skipDataCorrect, feedback)
      
      if (skipDataCorrect) {
        setSuccessMessage('Marked as correct data')
      } else {
        setSuccessMessage('Skipped item')
      }
      
      // Reset skip state
      setSkipDataCorrect(false)
      setSkipFeedback('')
      setShowSkipFeedbackModal(false)
      
      await refreshUser()
      setTimeout(fetchNextItem, 1000)
    } catch (err) {
      setError(err.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }
  
  const handleSkipClick = () => {
    // Check if we need to show feedback popup
    const uncheckedSkips = item?.review_state?.unchecked_skips || 0
    const maxUncheckedSkips = systemConfig?.max_unchecked_skips_before_prompt || 2
    
    if (!skipDataCorrect && uncheckedSkips >= maxUncheckedSkips) {
      setShowSkipFeedbackModal(true)
    } else {
      handleSkip()
    }
  }
  
  const handleFlag = async () => {
    if (!item) return
    
    setSubmitting(true)
    setError(null)
    
    try {
      await api.flagItem(item._id, flagReason, flagNote)
      setSuccessMessage('Item flagged successfully')
      setShowFlagModal(false)
      setFlagReason('unclear')
      setFlagNote('')
      setTimeout(fetchNextItem, 1500)
    } catch (err) {
      setError(err.message || 'Failed to flag item')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!item) return

    const handleKeyDown = (event) => {
      const tagName = event.target.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName) || event.target.isContentEditable) {
        return
      }
      if (showSkipFeedbackModal || showFlagModal || submitting) return

      const key = event.key.toLowerCase()
      const actions = {
        a: () => !editMode && handleApprove(),
        e: () => { if (!editMode) handleEdit() },
        s: () => { if (!editMode) handleSkipClick() },
        f: () => { if (!editMode) setShowFlagModal(true) }
      }

      const action = actions[key]
      if (action) {
        event.preventDefault()
        action()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [item, editMode, showSkipFeedbackModal, showFlagModal, submitting, handleApprove, handleEdit, handleSkipClick])

  const handleContentChange = (field, value) => {
    setEditedContent(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const renderFieldWidget = (fieldKey, fieldValue, fieldSchema) => {
    const widget = fieldSchema?.review_widget || 'textarea'
    const value = editedContent[fieldKey] !== undefined ? editedContent[fieldKey] : fieldValue
    
    if (!editMode) {
      // Display mode
      if (widget === 'image_viewer') {
        return (
          <div className="content-display">
            <img 
              src={value} 
              alt={fieldSchema?.label || fieldKey}
              className="media-responsive"
            />
          </div>
        )
      } else if (widget === 'video_player') {
        return (
          <div className="content-display">
            <video 
              controls 
              src={value}
              className="media-responsive"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )
      } else if (widget === 'audio_player') {
        return (
          <div className="content-display">
            <audio 
              controls 
              src={value}
              className="media-responsive"
              style={{ width: '100%' }}
            >
              Your browser does not support the audio tag.
            </audio>
          </div>
        )
      } else {
        return <div className="content-display">{value}</div>
      }
    }
    
    // Edit mode
    if (widget === 'text_input') {
      return (
        <input
          type="text"
          className="input"
          value={value}
          onChange={(e) => handleContentChange(fieldKey, e.target.value)}
        />
      )
    } else if (widget === 'image_viewer') {
      return (
        <div>
          <img 
            src={value} 
            alt={fieldSchema?.label || fieldKey}
            className="media-responsive"
            style={{ marginBottom: '8px' }}
          />
          <input
            type="text"
            className="input"
            value={value}
            onChange={(e) => handleContentChange(fieldKey, e.target.value)}
            placeholder="Image URL"
          />
        </div>
      )
    } else if (widget === 'video_player') {
      return (
        <div>
          <video 
            controls 
            src={value}
            className="media-responsive"
            style={{ marginBottom: '8px' }}
          >
            Your browser does not support the video tag.
          </video>
          <input
            type="text"
            className="input"
            value={value}
            onChange={(e) => handleContentChange(fieldKey, e.target.value)}
            placeholder="Video URL"
          />
        </div>
      )
    } else if (widget === 'audio_player') {
      return (
        <div>
          <audio 
            controls 
            src={value}
            className="media-responsive"
            style={{ width: '100%', marginBottom: '8px' }}
          >
            Your browser does not support the audio tag.
          </audio>
          <input
            type="text"
            className="input"
            value={value}
            onChange={(e) => handleContentChange(fieldKey, e.target.value)}
            placeholder="Audio URL"
          />
        </div>
      )
    } else if (typeof fieldValue === 'number') {
      return (
        <input
          type="number"
          className="input"
          value={value}
          onChange={(e) => handleContentChange(fieldKey, parseFloat(e.target.value))}
          step="0.01"
        />
      )
    } else {
      // Default fallback: textarea
      return (
        <textarea
          className="input"
          value={value}
          onChange={(e) => handleContentChange(fieldKey, e.target.value)}
          rows={4}
        />
      )
    }
  }

  const reviewProgress = item?.review_state ? 
    ((item.review_state.review_count || 0) / 3) * 100 : 0

  if (loading && !item) {
    return (
      <div className="review-page">
        <LoadingSkeleton lines={6} />
      </div>
    )
  }

  return (
    <div className="review-page">
      <div className="review-header animate-fade-in">
        <div className="header-left">
          <h1 className="page-title">Review Queue</h1>
          <p className="page-subtitle">Review, approve, or edit data items to earn rewards</p>
        </div>
        <div className="header-stats">
          <div className="stat-mini">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
            </svg>
            <div>
              <div className="stat-value">${user?.payout_balance?.toFixed(3) || '0.000'}</div>
              <div className="stat-label">Balance</div>
            </div>
          </div>
          <div className="stat-mini">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <div>
              <div className="stat-value">{user?.reviews_done || 0}</div>
              <div className="stat-label">Reviews</div>
            </div>
          </div>
          <div className="stat-mini">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"/>
            </svg>
            <div>
              <div className="stat-value">{stats.streak} day</div>
              <div className="stat-label">Streak</div>
            </div>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="alert alert-success animate-slide-in">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          {successMessage}
        </div>
      )}

      {!item && !loading && error && error.includes('No items') && (
        <div className="empty-state animate-fade-in">
          <div className="empty-state-icon" aria-hidden="true">DONE</div>
          <h2 className="empty-state-title">All Done!</h2>
          <p className="empty-state-description">No more items to review right now. Check back later or contact your admin to add more items.</p>
          <button onClick={fetchNextItem} disabled={loading} className="btn btn-secondary">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
            </svg>
            Refresh Queue
          </button>
        </div>
      )}

      {!item && !loading && error && !error.includes('No items') && (
        <div className="empty-state animate-fade-in">
          <div className="empty-state-icon" aria-hidden="true">ERROR</div>
          <h2 className="empty-state-title">Error Loading Item</h2>
          <p className="empty-state-description">{error}</p>
          <button onClick={fetchNextItem} disabled={loading} className="btn btn-primary">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
            </svg>
            Try Again
          </button>
        </div>
      )}

      {!item && !loading && !error && (
        <div className="empty-state animate-fade-in">
          <div className="empty-state-icon" aria-hidden="true">START</div>
          <h2 className="empty-state-title">Ready to Review?</h2>
          <p className="empty-state-description">Click below to load your first item and start earning!</p>
          <button onClick={fetchNextItem} disabled={loading} className="btn btn-primary btn-large">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
            </svg>
            Start Reviewing
          </button>
        </div>
      )}

      {error && item && <ErrorBanner message={error} onRetry={fetchNextItem} />}

      {item && (
        <div className="review-container animate-fade-in">
          <div className="review-content-pane card">
            <div className="item-header">
              <div className="item-badges">
                <span className="badge badge-primary">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path fillRule="evenodd" d="M11.5 2a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM9.05 3a2.5 2.5 0 014.9 0H16v1h-2.05a2.5 2.5 0 01-4.9 0H0V3h9.05zM4.5 7a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM2.05 8a2.5 2.5 0 014.9 0H16v1H6.95a2.5 2.5 0 01-4.9 0H0V8h2.05zm9.45 4a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm-2.45 1a2.5 2.5 0 014.9 0H16v1h-2.05a2.5 2.5 0 01-4.9 0H0v-1h9.05z" clipRule="evenodd"/>
                  </svg>
                  {item.type_name || item.dataset_type}
                </span>
                {item.modality && (
                  <span
                    className={`badge badge-modality badge-modality-${item.modality}`}
                    aria-label={`${item.modality} modality`}
                  >
                    <span aria-hidden="true" style={{ marginRight: '4px' }}>
                      {MODALITY_ICONS[item.modality] || 'ICON'}
                    </span>
                    {item.modality.toUpperCase()}
                  </span>
                )}
                <span className="badge badge-neutral">
                  {item.language?.toUpperCase()}
                </span>
              </div>
              <div className="item-progress-info">
                <div className="progress-label">
                  <span>Review Progress</span>
                  <span className="progress-numbers">
                    {item.review_state?.review_count || 0}/3 reviews and {item.review_state?.skip_count || 0} skips
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${reviewProgress}%` }}></div>
                </div>
              </div>
            </div>

            <div className="item-content">
              {Object.entries(item.content || {}).map(([field, value]) => {
                const fieldSchema = datasetTypeSchema?.fields?.find(f => f.key === field)
                const label = fieldSchema?.label || field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')
                
                return (
                  <div key={field} className="content-field">
                    <label className="content-label">{label}</label>
                    {renderFieldWidget(field, value, fieldSchema)}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="review-actions-pane">
            <div className="card sticky-actions">
              <h3 className="actions-title">Review Actions</h3>
              <p className="actions-subtitle">Choose your action for this item</p>

              {!editMode ? (
                <div className="action-buttons">
                  <button 
                    className="btn btn-primary action-btn" 
                    onClick={handleApprove}
                    disabled={submitting}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Approve
                    <span className="btn-hint">Data is correct</span>
                  </button>

                  <button 
                    className="btn btn-secondary action-btn" 
                    onClick={handleEdit}
                    disabled={submitting}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                    </svg>
                    Edit
                    <span className="btn-hint">Make corrections</span>
                  </button>

                  <div className="skip-container">
                    <button 
                      className="btn btn-ghost action-btn" 
                      ref={skipTriggerRef}
                      onClick={handleSkipClick}
                      disabled={submitting}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                      Skip
                      <span className="btn-hint">Unsure/unclear</span>
                    </button>
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={skipDataCorrect}
                        onChange={(e) => setSkipDataCorrect(e.target.checked)}
                        className="checkbox-input"
                      />
                      <span>Data is already correct</span>
                    </label>
                  </div>
                  
                  <button 
                    className="btn btn-warning action-btn flag-btn" 
                    ref={flagTriggerRef}
                    onClick={() => setShowFlagModal(true)}
                    disabled={submitting}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd"/>
                    </svg>
                    Flag Item
                  </button>
                </div>
              ) : (
                <div className="action-buttons">
                  <button 
                    className="btn btn-primary action-btn" 
                    onClick={handleSaveEdit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z"/>
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>

                  <button 
                    className="btn btn-secondary action-btn" 
                    onClick={() => {
                      setEditMode(false)
                      setEditedContent(item.content)
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="keyboard-shortcuts">
                <div className="shortcut-title">Keyboard Shortcuts</div>
                <div className="shortcut-item">
                  <kbd>A</kbd> <span>Approve</span>
                </div>
                <div className="shortcut-item">
                  <kbd>E</kbd> <span>Edit</span>
                </div>
                <div className="shortcut-item">
                  <kbd>S</kbd> <span>Skip</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Skip Feedback Modal */}
      {showSkipFeedbackModal && (
        <div className="modal-overlay" onClick={() => setShowSkipFeedbackModal(false)}>
          <div
            className="modal-content"
            ref={skipModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="skip-feedback-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title" id="skip-feedback-title">Skip Feedback</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowSkipFeedbackModal(false)}
                aria-label="Close skip feedback dialog"
              >
                ×
              </button>
            </div>
            <p className="modal-description">
              You've skipped this item multiple times. Could you tell us what's wrong?
            </p>
            <textarea
              className="input"
              placeholder="Optional: What's unclear or problematic about this item?"
              value={skipFeedback}
              onChange={(e) => setSkipFeedback(e.target.value)}
              rows={4}
              ref={skipTextareaRef}
            />
            <div className="modal-actions">
              <button 
                className="btn btn-primary" 
                onClick={() => handleSkip(skipFeedback || null)}
                disabled={submitting}
              >
                Skip Item
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowSkipFeedbackModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Flag Modal */}
      {showFlagModal && (
        <div className="modal-overlay" onClick={() => setShowFlagModal(false)}>
          <div
            className="modal-content"
            ref={flagModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="flag-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title" id="flag-modal-title">Flag Item</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowFlagModal(false)}
                aria-label="Close flag dialog"
              >
                ×
              </button>
            </div>
            <p className="modal-description">
              Report this item as suspicious or inappropriate
            </p>
            <div className="form-group">
              <label className="form-label">Reason *</label>
              <select 
                className="input" 
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                ref={flagReasonRef}
              >
                <option value="unclear">Unclear / Ambiguous</option>
                <option value="corrupt">Corrupt / Broken Data</option>
                <option value="offensive">Offensive Content</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Additional Notes (Optional)</label>
              <textarea
                className="input"
                placeholder="Provide more details about why you're flagging this item..."
                value={flagNote}
                onChange={(e) => setFlagNote(e.target.value)}
                rows={3}
              />
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-warning" 
                onClick={handleFlag}
                disabled={submitting}
              >
                {submitting ? 'Flagging...' : 'Flag Item'}
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowFlagModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


