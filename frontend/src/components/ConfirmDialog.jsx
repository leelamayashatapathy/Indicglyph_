import { useEffect } from 'react'

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  confirmTone = 'primary',
  loading = false,
  children
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && open) {
        onCancel?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) return null

  const confirmClass =
    confirmTone === 'danger'
      ? 'btn btn-danger'
      : confirmTone === 'secondary'
        ? 'btn btn-secondary'
        : 'btn btn-primary'

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={onCancel}
    >
      <div
        className="modal-content confirm-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title" id="confirm-dialog-title">{title}</h3>
          <button
            className="modal-close"
            aria-label="Close dialog"
            onClick={onCancel}
            type="button"
          >
            x
          </button>
        </div>

        <div className="modal-body">
          {description && (
            <p className="modal-description">{description}</p>
          )}
          {children}
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            type="button"
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            className={confirmClass}
            onClick={onConfirm}
            type="button"
            disabled={loading}
          >
            {loading ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
