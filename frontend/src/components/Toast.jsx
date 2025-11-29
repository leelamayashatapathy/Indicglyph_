import { useEffect } from 'react'

export default function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message || !onClose) return
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [message, duration, onClose])

  if (!message) return null

  return (
    <div className="toast-stack">
      <div className={`toast toast-${type}`} role="status" aria-live="polite">
        <span className="toast-message">{message}</span>
        {onClose && (
          <button className="toast-close" onClick={onClose} aria-label="Close notification" type="button">
            x
          </button>
        )}
      </div>
    </div>
  )
}
