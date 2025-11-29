import { useEffect, useMemo, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import StatusBadge from '../components/StatusBadge'
import Toast from '../components/Toast'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorBanner from '../components/ErrorBanner'
import { api } from '../services/api'
import '../styles/PayoutManagementPage.css'

export default function PayoutManagementPage() {
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [dialog, setDialog] = useState(null)
  const [notesInput, setNotesInput] = useState('')
  const [validationError, setValidationError] = useState('')
  const [actionState, setActionState] = useState({ id: null, action: null })
  const [toast, setToast] = useState(null)

  useEffect(() => {
    loadPayouts()
  }, [filterStatus])

  const loadPayouts = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await api.getPayouts(filterStatus || null)
      setPayouts(data || [])
    } catch (err) {
      setError(err.message || 'Failed to load payouts')
    } finally {
      setLoading(false)
    }
  }

  const statusTotals = useMemo(() => {
    return payouts.reduce(
      (acc, payout) => {
        const status = payout.status || 'pending'
        acc[status] = (acc[status] || 0) + 1
        return acc
      },
      { pending: 0, processing: 0, completed: 0, rejected: 0 }
    )
  }, [payouts])

  const openDialog = (payout, action) => {
    setDialog({ payout, action })
    setNotesInput('')
    setValidationError('')
  }

  const applyUpdatedPayout = (updated) => {
    if (!updated) return
    setPayouts((prev) => {
      if (!updated) return prev
      const idMatch = (p) =>
        p._id === updated._id ||
        p.payout_id === updated.payout_id ||
        p._id === updated.payout_id ||
        p.id === updated.payout_id ||
        p.id === updated._id

      const next = prev.map((payout) =>
        idMatch(payout) ? { ...payout, ...updated } : payout
      )

      if (filterStatus && updated.status && updated.status !== filterStatus) {
        return next.filter((payout) => !idMatch(payout))
      }

      return next
    })
  }

  const handleConfirmAction = async () => {
    if (!dialog) return

    const { payout, action } = dialog
    const payoutId = payout._id || payout.payout_id || payout.id

    if (!payoutId) {
      setToast({ type: 'error', message: 'Missing payout identifier' })
      return
    }

    if (action === 'rejected' && !notesInput.trim()) {
      setValidationError('Rejection reason is required.')
      return
    }

    const notesToSend = action === 'rejected' ? notesInput.trim() : payout.notes || ''
    const statusToSend = action === 'processing'
      ? 'processing'
      : action === 'completed'
        ? 'completed'
        : 'rejected'

    setActionState({ id: payoutId, action })

    try {
      const updated = await api.processPayout(payoutId, statusToSend, notesToSend || null)
      applyUpdatedPayout(updated)
      setToast({
        type: 'success',
        message: `Payout ${statusToSend} for ${payout.user_id || payout.username || 'user'}`,
      })
      setDialog(null)
      setNotesInput('')
      setValidationError('')
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to process payout' })
    } finally {
      setActionState({ id: null, action: null })
    }
  }

  const renderDialogContent = () => {
    if (!dialog) return null
    const { payout, action } = dialog
    const userLabel = payout.user_id || payout.username || 'User'
    const currency = payout.currency || 'USD'

    const warningCopy = action === 'rejected'
      ? 'Please provide a reason so the reviewer knows what to fix.'
      : action === 'processing'
        ? 'This will mark the payout as in-progress for payment.'
        : 'This will mark the payout as completed in the ledger.'

    return (
      <ConfirmDialog
        open={!!dialog}
        title={
          action === 'rejected'
            ? 'Reject payout'
            : action === 'completed'
              ? 'Mark payout as paid'
              : 'Start payout processing'
        }
        description={`Review and confirm the change for ${userLabel}.`}
        confirmLabel={
          action === 'processing' ? 'Mark as processing' :
          action === 'completed' ? 'Mark as completed' :
          'Reject payout'
        }
        cancelLabel="Cancel"
        confirmTone={action === 'rejected' ? 'danger' : 'primary'}
        onConfirm={handleConfirmAction}
        onCancel={() => setDialog(null)}
        loading={actionState.id === (payout._id || payout.payout_id || payout.id)}
      >
        <div className="summary-grid">
          <div className="summary-tile">
            <span className="summary-label">User</span>
            <span className="summary-value">{userLabel}</span>
          </div>
          <div className="summary-tile">
            <span className="summary-label">Amount</span>
            <span className="summary-value">
              {currency} {Number(payout.amount || 0).toFixed(2)}
            </span>
          </div>
          <div className="summary-tile">
            <span className="summary-label">Payment</span>
            <span className="summary-value">{payout.payment_method || 'N/A'}</span>
          </div>
          <div className="summary-tile">
            <span className="summary-label">Requested</span>
            <span className="summary-value">
              {payout.requested_at ? new Date(payout.requested_at).toLocaleString() : 'Unknown'}
            </span>
          </div>
        </div>

        {action === 'rejected' ? (
          <div className="input-group">
            <label className="input-label" htmlFor="rejection-notes">Rejection reason</label>
            <textarea
              id="rejection-notes"
              className={`input ${validationError ? 'input-error' : ''}`}
              placeholder="Add details the reviewer will see"
              value={notesInput}
              onChange={(e) => {
                setNotesInput(e.target.value)
                setValidationError('')
              }}
              required
            />
            {validationError && <div className="input-error-text">{validationError}</div>}
          </div>
        ) : (
          <p className="helper-text warning-text">{warningCopy}</p>
        )}
      </ConfirmDialog>
    )
  }

  if (loading) {
    return (
      <div className="payout-management-page">
        <LoadingSkeleton lines={4} />
      </div>
    )
  }

  return (
    <div className="payout-management-page">
      <div className="page-header">
        <h2>Payout Management</h2>

        <div className="filter-controls">
          <label htmlFor="payout-status-filter">Filter by Status:</label>
          <select
            id="payout-status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadPayouts} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="payout-stats">
        {['pending', 'processing', 'completed', 'rejected'].map((statusKey) => (
          <div key={statusKey} className="payout-stat-chip">
            <StatusBadge status={statusKey} />
            <span className="payout-stat-value">{statusTotals[statusKey] || 0}</span>
          </div>
        ))}
      </div>

      {payouts.length === 0 ? (
        <div className="empty-state">
          <p>No payout requests found.</p>
        </div>
      ) : (
        <div className="payouts-table-container">
          <table className="payouts-table data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Payment Info</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => {
                const payoutId = payout._id || payout.payout_id || payout.id
                const disabled = actionState.id === payoutId
                const currency = payout.currency || 'USD'
                const amountDisplay = `${currency} ${Number(payout.amount || 0).toFixed(2)}`
                const isPending = payout.status === 'pending'
                const isProcessing = payout.status === 'processing'

                return (
                  <tr key={payoutId}>
                    <td><strong>{payout.user_id || payout.username}</strong></td>
                    <td className="amount">{amountDisplay}</td>
                    <td>
                      <StatusBadge status={payout.status} />
                    </td>
                    <td>{payout.requested_at ? new Date(payout.requested_at).toLocaleString() : '-'}</td>
                    <td>
                      {payout.payment_method && (
                        <div className="payment-info">
                          <div><strong>{payout.payment_method}</strong></div>
                          <div className="small">
                            {typeof payout.payment_details === 'object'
                              ? JSON.stringify(payout.payment_details)
                              : payout.payment_details}
                          </div>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="notes">{payout.notes || '-'}</div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {isPending && (
                          <>
                            <button
                              onClick={() => openDialog(payout, 'processing')}
                              className="btn btn-primary btn-sm"
                              disabled={disabled}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openDialog(payout, 'rejected')}
                              className="btn btn-danger btn-sm"
                              disabled={disabled}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {isProcessing && (
                          <>
                            <button
                              onClick={() => openDialog(payout, 'completed')}
                              className="btn btn-primary btn-sm"
                              disabled={disabled}
                            >
                              Mark Paid
                            </button>
                            <button
                              onClick={() => openDialog(payout, 'rejected')}
                              className="btn btn-danger btn-sm"
                              disabled={disabled}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {renderDialogContent()}
    </div>
  )
}
