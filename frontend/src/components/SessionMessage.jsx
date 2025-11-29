export default function SessionMessage({ message, onDismiss }) {
  if (!message) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="session-message"
      style={{
        background: '#fff7ed',
        color: '#8a4b0f',
        border: '1px solid #fdba74',
        borderRadius: '8px',
        padding: '0.75rem 1rem',
        margin: '0.5rem 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem'
      }}
    >
      <span aria-label="Session notice">⚠️</span>
      <div style={{ flex: 1 }}>{message}</div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss session message"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 600,
          color: '#8a4b0f'
        }}
      >
        ×
      </button>
    </div>
  )
}
