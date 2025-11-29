import React from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-dom/test-utils'
import Modal from '../components/Modal'

describe('Modal', () => {
  let container
  let trigger

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    trigger = document.createElement('button')
    document.body.appendChild(trigger)
  })

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container)
    container.remove()
    trigger.remove()
  })

  const renderModal = (props) => {
    TestUtils.act(() => {
      ReactDOM.render(<Modal {...props} />, container)
    })
  }

  it('renders children when open', () => {
    renderModal({ open: true, title: 'Test Modal', onClose: () => {}, children: <div data-testid="child">Child</div> })
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull()
  })

  it('calls onClose on ESC key', () => {
    const onClose = jest.fn()
    renderModal({ open: true, title: 'Title', onClose, children: <div>Body</div> })
    TestUtils.act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      window.dispatchEvent(event)
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose on backdrop click', () => {
    const onClose = jest.fn()
    renderModal({ open: true, title: 'Title', onClose, children: <div>Body</div> })
    const backdrop = container.querySelector('.modal-overlay')
    TestUtils.act(() => {
      TestUtils.Simulate.click(backdrop)
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('manages focus on open and close', () => {
    trigger.focus()
    const onClose = jest.fn(() => {
      // rerender closed state to trigger focus restore
      renderModal({ open: false, title: 'Title', onClose, children: null })
    })

    renderModal({ open: true, title: 'Title', onClose, children: <div>Body</div> })
    const dialog = container.querySelector('.modal-content')
    expect(document.activeElement).toBe(dialog)

    TestUtils.act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      window.dispatchEvent(event)
    })

    expect(onClose).toHaveBeenCalled()
    expect(document.activeElement).toBe(trigger)
  })
})
