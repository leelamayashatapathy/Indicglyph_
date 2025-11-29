export default function ErrorBanner({ message, onRetry }) {
  if (!message) return null

  return (
    <div className="error-banner" role="alert" aria-live="assertive">
      <div className="error-banner__icon" aria-hidden="true">!</div>
      <div className="error-banner__content">{message}</div>
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  )
}
