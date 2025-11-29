import React from 'react'
import ReactDOM from 'react-dom'
import StatusBadge from '../components/StatusBadge'

const renderBadge = (status) => {
  const container = document.createElement('div')
  ReactDOM.render(<StatusBadge status={status} />, container)
  return container.textContent
}

describe('StatusBadge', () => {
  it('renders readable labels for common statuses', () => {
    expect(renderBadge('pending')).toMatch(/Pending/i)
    expect(renderBadge('completed')).toMatch(/Completed/i)
    expect(renderBadge('rejected')).toMatch(/Rejected/i)
    expect(renderBadge('resolved')).toMatch(/Resolved/i)
    expect(renderBadge('transcribing')).toMatch(/Transcribing/i)
  })

  it('falls back to provided status text when unknown', () => {
    expect(renderBadge('custom-status')).toMatch(/custom-status/i)
  })
})
