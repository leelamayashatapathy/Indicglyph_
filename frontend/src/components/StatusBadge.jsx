const STATUS_MAP = {
  pending: { label: 'Pending', tone: 'warning' },
  processing: { label: 'Processing', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'error' },
  failed: { label: 'Failed', tone: 'error' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  resolved: { label: 'Resolved', tone: 'success' },
  dismissed: { label: 'Dismissed', tone: 'neutral' },
  're-review': { label: 'Needs Re-review', tone: 'primary' },
  flagged: { label: 'Flagged', tone: 'warning' },
  transcribing: { label: 'Transcribing', tone: 'info' },
  'waiting_for_manual_transcript': { label: 'Manual Transcript', tone: 'warning' },
}

export default function StatusBadge({ status, fallback = 'pending' }) {
  const normalized = (status || fallback || '').toLowerCase()
  const config = STATUS_MAP[normalized] || { label: status || 'Unknown', tone: 'neutral' }
  return (
    <span className={`status-badge status-${config.tone}`}>
      {config.label}
    </span>
  )
}
