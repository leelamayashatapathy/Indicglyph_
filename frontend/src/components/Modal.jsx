import { useEffect, useRef } from 'react'

export default function Modal({ open, title, children, onClose, ariaLabelledById = 'modal-title' }) {
  const dialogRef = useRef(null)
  const lastFocused = useRef(null)

  useEffect(() => {
    if (open) {
      lastFocused.current = document.activeElement
      dialogRef.current?.focus()
    } else if (lastFocused.current) {
      lastFocused.current.focus?.()
    }
  }, [open])

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape' && open) {
        onClose?.()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledById}
        tabIndex={-1}
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id={ariaLabelledById}>{title}</h3>
          <button
            type="button"
            className="modal-close"
            aria-label="Close dialog"
            onClick={onClose}
          >
            x
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}
