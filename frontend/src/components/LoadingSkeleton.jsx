export default function LoadingSkeleton({ lines = 3, width = '100%' }) {
  const count = Math.max(1, lines)
  return (
    <div className="skeleton-stack" role="status" aria-live="polite" aria-busy="true">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="skeleton-line"
          style={{ width: idx === count - 1 ? width : '100%' }}
        />
      ))}
    </div>
  )
}
