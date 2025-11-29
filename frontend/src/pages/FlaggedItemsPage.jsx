import { useEffect, useMemo, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import StatusBadge from '../components/StatusBadge'
import Toast from '../components/Toast'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorBanner from '../components/ErrorBanner'
import { api } from '../services/api'
import '../styles/FlaggedItemsPage.css'

export default function FlaggedItemsPage() {
  const [items, setItems] = useState([])
  const [datasetTypes, setDatasetTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false
  })

  const [filters, setFilters] = useState({
    dataset_type_id: '',
    language: '',
    reason: ''
  })

  const [selectedItem, setSelectedItem] = useState(null)
  const [resolutionMap, setResolutionMap] = useState({})
  const [toast, setToast] = useState(null)

  const [triageDialog, setTriageDialog] = useState(null)
  const [triageNote, setTriageNote] = useState('')
  const [triageError, setTriageError] = useState('')
  const [triageSubmitting, setTriageSubmitting] = useState(false)

  useEffect(() => {
    loadDatasetTypes()
    loadItems()
  }, [])

  const loadDatasetTypes = async () => {
    try {
      const data = await api.getDatasetTypes()
      setDatasetTypes(data)
    } catch (err) {
      console.error('Failed to load dataset types:', err)
    }
  }

  const mergeResolutionState = (list = []) => {
    return list.map((item) =>
      resolutionMap[item._id] ? { ...item, resolution: resolutionMap[item._id] } : item
    )
  }

  const loadItems = async (offset = 0) => {
    setLoading(true)
    setError(null)

    try {
      const data = await api.getFlaggedItems({ ...filters, limit: pagination.limit, offset })
      const merged = mergeResolutionState(data.items || [])
      setItems(merged)
      setPagination({
        total: data.total || 0,
        limit: data.limit || pagination.limit,
        offset: data.offset || 0,
        hasMore: data.has_more || false
      })
    } catch (err) {
      setError(err.message || 'Failed to load flagged items')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilters = () => {
    loadItems(0)
  }

  const handleResetFilters = () => {
    setFilters({ dataset_type_id: '', language: '', reason: '' })
    setTimeout(() => loadItems(0), 0)
  }

  const getFlagReasonLabel = (reason) => {
    const labels = {
      unclear: 'Unclear/Ambiguous',
      corrupt: 'Corrupt Data',
      offensive: 'Offensive Content',
      other: 'Other Issue'
    }
    return labels[reason] || reason
  }

  const getModalityIcon = (modality) => {
    const icons = {
      text: 'TXT',
      ocr: 'OCR',
      voice: 'AUD',
      conversation: 'CHAT',
      image: 'IMG',
      video: 'VID',
      custom: 'DATA'
    }
    return icons[modality] || 'DATA'
  }

  const getItemStatus = (item) => item?.resolution?.status || 'pending'

  const statusCounts = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const status = getItemStatus(item)
        acc[status] = (acc[status] || 0) + 1
        return acc
      },
      { pending: 0, resolved: 0, dismissed: 0, 're-review': 0 }
    )
  }, [items])

  const openTriageDialog = (item, action) => {
    setTriageDialog({ item, action })
    setTriageNote(item.resolution?.note || '')
    setTriageError('')
  }

  const handleConfirmTriage = () => {
    if (!triageDialog) return
    const { item, action } = triageDialog
    const requireNote = action !== 're-review'

    if (requireNote && !triageNote.trim()) {
      setTriageError('Please add a short note before saving.')
      return
    }

    setTriageSubmitting(true)
    try {
      const status = action === 'resolve' ? 'resolved' : action === 'dismiss' ? 'dismissed' : 're-review'
      const resolution = {
        status,
        note: triageNote.trim() || 'No additional note provided',
        updatedAt: new Date().toISOString()
      }

      setResolutionMap((prev) => ({ ...prev, [item._id]: resolution }))
      setItems((prev) =>
        prev.map((entry) => entry._id === item._id ? { ...entry, resolution } : entry)
      )
      setSelectedItem((prev) =>
        prev && prev._id === item._id ? { ...prev, resolution } : prev
      )

      setToast({
        type: 'success',
        message: status === 're-review'
          ? `Sent item ${item._id} for re-review`
          : `Updated flag as ${status}`
      })
      setTriageDialog(null)
      setTriageNote('')
      setTriageError('')
    } finally {
      setTriageSubmitting(false)
    }
  }

  const renderTriageDialog = () => {
    if (!triageDialog) return null
    const { item, action } = triageDialog
    const requireNote = action !== 're-review'
    const actionLabels = {
      resolve: 'Mark resolved',
      dismiss: 'Dismiss flag',
      're-review': 'Send for re-review'
    }

    return (
      <ConfirmDialog
        open={!!triageDialog}
        title={actionLabels[action]}
        description={`Confirm action for item ${item._id}`}
        confirmLabel={actionLabels[action]}
        confirmTone={action === 'dismiss' ? 'danger' : 'primary'}
        loading={triageSubmitting}
        onCancel={() => setTriageDialog(null)}
        onConfirm={handleConfirmTriage}
      >
        <div className="summary-grid">
          <div className="summary-tile">
            <span className="summary-label">Dataset</span>
            <span className="summary-value">{item.dataset_type_name}</span>
          </div>
          <div className="summary-tile">
            <span className="summary-label">Language</span>
            <span className="summary-value">{item.language || 'Unknown'}</span>
          </div>
          <div className="summary-tile">
            <span className="summary-label">Flags</span>
            <span className="summary-value">{item.flags?.length || 0}</span>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="triage-note">
            {requireNote ? 'Resolution note (required)' : 'Note (optional)'}
          </label>
          <textarea
            id="triage-note"
            className={`input ${triageError ? 'input-error' : ''}`}
            value={triageNote}
            onChange={(e) => {
              setTriageNote(e.target.value)
              setTriageError('')
            }}
            placeholder="Add context for the reviewer or data owner"
            required={requireNote}
          />
          {triageError && <div className="input-error-text">{triageError}</div>}
          <p className="helper-text">
            TODO: Persist this resolution once a backend endpoint is available. For now, it is stored in this session.
          </p>
        </div>
      </ConfirmDialog>
    )
  }

  if (loading && items.length === 0) {
    return <div className="page-container"><LoadingSkeleton lines={5} /></div>
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Flagged Items Review</h1>
          <p>Review flags, add notes, resolve, or send back for a second look.</p>
        </div>
      </div>

      <div className="filters-section">
        <h3>Filters</h3>
        <div className="filters-grid">
          <div className="form-group">
            <label>Dataset Type</label>
            <select
              value={filters.dataset_type_id}
              onChange={(e) => setFilters({ ...filters, dataset_type_id: e.target.value })}
            >
              <option value="">All Types</option>
              {datasetTypes.map(dt => (
                <option key={dt._id} value={dt._id}>{dt.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Language</label>
            <select
              value={filters.language}
              onChange={(e) => setFilters({ ...filters, language: e.target.value })}
            >
              <option value="">All Languages</option>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>

          <div className="form-group">
            <label>Flag Reason</label>
            <select
              value={filters.reason}
              onChange={(e) => setFilters({ ...filters, reason: e.target.value })}
            >
              <option value="">All Reasons</option>
              <option value="unclear">Unclear/Ambiguous</option>
              <option value="corrupt">Corrupt Data</option>
              <option value="offensive">Offensive Content</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="filters-actions">
          <button onClick={handleApplyFilters} className="btn-primary">
            Apply Filters
          </button>
          <button onClick={handleResetFilters} className="btn-secondary">
            Reset
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => loadItems(pagination.offset)} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="items-stats">
        <p>
          Showing <strong>{items.length}</strong> flagged items
          {pagination.total > 0 && ` (${pagination.offset + 1}-${Math.min(pagination.offset + items.length, pagination.total)} of ${pagination.total} total)`}
        </p>
        <div className="status-breakdown">
          <span><StatusBadge status="pending" /> {statusCounts.pending || 0}</span>
          <span><StatusBadge status="resolved" /> {statusCounts.resolved || 0}</span>
          <span><StatusBadge status="dismissed" /> {statusCounts.dismissed || 0}</span>
          <span><StatusBadge status="re-review" /> {statusCounts['re-review'] || 0}</span>
        </div>
      </div>

      {pagination.total > pagination.limit && (
        <div className="pagination-controls">
          <button
            onClick={() => loadItems(Math.max(0, pagination.offset - pagination.limit))}
            disabled={pagination.offset === 0 || loading}
            className="btn-secondary"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {Math.floor(pagination.offset / pagination.limit) + 1} of {Math.ceil(pagination.total / pagination.limit)}
          </span>
          <button
            onClick={() => loadItems(pagination.offset + pagination.limit)}
            disabled={!pagination.hasMore || loading}
            className="btn-secondary"
          >
            Next
          </button>
        </div>
      )}

      <div className="flagged-items-grid">
        {items.length === 0 ? (
          <div className="empty-state">
            <h3>No Flagged Items</h3>
            <p>All items look good. No flags to review at the moment.</p>
          </div>
        ) : (
          items.map((item) => {
            const status = getItemStatus(item)
            const actionsDisabled = triageSubmitting && triageDialog?.item?._id === item._id

            return (
              <div key={item._id} className="flagged-item-card">
                <div className="item-card-header">
                  <div className="header-left">
                    <span className="modality-icon">{getModalityIcon(item.modality)}</span>
                    <div>
                      <h4>{item.dataset_type_name}</h4>
                      <span className="item-language">{item.language?.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="header-right">
                    <StatusBadge status="flagged" />
                    <StatusBadge status={status} />
                  </div>
                </div>

                <div className="item-content-preview">
                  <h5>Content Preview:</h5>
                  <div className="content-fields">
                    {Object.entries(item.content || {}).slice(0, 3).map(([key, value]) => (
                      <div key={key} className="content-field">
                        <strong>{key}:</strong> {String(value).substring(0, 100)}
                        {String(value).length > 100 && '...'}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flags-list">
                  <h5>Flags ({item.flags?.length || 0}):</h5>
                  {(item.flags || []).map((flag, idx) => (
                    <div key={idx} className="flag-entry">
                      <div className="flag-header">
                        <span className={`flag-reason flag-reason-${flag.reason}`}>
                          {getFlagReasonLabel(flag.reason)}
                        </span>
                        <span className="flag-meta">
                          by {flag.reviewer_id} | {new Date(flag.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {flag.note && (
                        <div className="flag-note">"{flag.note}"</div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="resolution-banner">
                  <StatusBadge status={status} />
                  <span className="resolution-note">
                    {item.resolution?.note || 'Awaiting triage'}
                  </span>
                </div>

                <div className="review-state-info">
                  <span>Reviews: {item.review_state?.review_count || 0}</span>
                  <span>Skips: {item.review_state?.skip_count || 0}</span>
                  <span>Finalized: {item.review_state?.finalized ? 'Yes' : 'No'}</span>
                </div>

                <div className="item-actions">
                  <button
                    onClick={() => openTriageDialog(item, 'resolve')}
                    className="btn btn-primary btn-sm"
                    disabled={actionsDisabled}
                  >
                    Mark resolved
                  </button>
                  <button
                    onClick={() => openTriageDialog(item, 're-review')}
                    className="btn btn-secondary btn-sm"
                    disabled={actionsDisabled}
                  >
                    Send for re-review
                  </button>
                  <button
                    onClick={() => openTriageDialog(item, 'dismiss')}
                    className="btn btn-danger btn-sm"
                    disabled={actionsDisabled}
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="btn btn-secondary btn-sm"
                  >
                    View full details
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Flagged Item Details</h3>
              <div className="modal-header-actions">
                <StatusBadge status={getItemStatus(selectedItem)} />
              </div>
              <button className="modal-close" onClick={() => setSelectedItem(null)}>x</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h4>Dataset Info</h4>
                <p><strong>Type:</strong> {selectedItem.dataset_type_name}</p>
                <p><strong>Language:</strong> {selectedItem.language}</p>
                <p><strong>Item ID:</strong> {selectedItem._id}</p>
              </div>

              <div className="detail-section">
                <h4>Full Content</h4>
                <pre className="content-display">
                  {JSON.stringify(selectedItem.content, null, 2)}
                </pre>
              </div>

              <div className="detail-section">
                <h4>All Flags</h4>
                {(selectedItem.flags || []).map((flag, idx) => (
                  <div key={idx} className="flag-detail-entry">
                    <p><strong>Reason:</strong> {getFlagReasonLabel(flag.reason)}</p>
                    <p><strong>Reviewer:</strong> {flag.reviewer_id}</p>
                    <p><strong>Time:</strong> {new Date(flag.timestamp).toLocaleString()}</p>
                    {flag.note && <p><strong>Note:</strong> {flag.note}</p>}
                  </div>
                ))}
              </div>

              <div className="detail-section">
                <h4>Resolution</h4>
                <p><strong>Status:</strong> {getItemStatus(selectedItem)}</p>
                <p><strong>Note:</strong> {selectedItem.resolution?.note || 'Awaiting triage'}</p>
                {selectedItem.resolution?.updatedAt && (
                  <p><strong>Updated:</strong> {new Date(selectedItem.resolution.updatedAt).toLocaleString()}</p>
                )}
              </div>

              <div className="detail-actions">
                <button
                  onClick={() => openTriageDialog(selectedItem, 'resolve')}
                  className="btn btn-primary btn-sm"
                  disabled={triageSubmitting}
                >
                  Mark resolved
                </button>
                <button
                  onClick={() => openTriageDialog(selectedItem, 'dismiss')}
                  className="btn btn-danger btn-sm"
                  disabled={triageSubmitting}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {renderTriageDialog()}
    </div>
  )
}
