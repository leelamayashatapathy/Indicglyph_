import React from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-dom/test-utils'
import ErrorBanner from '../components/ErrorBanner'

describe('ErrorBanner', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container)
    container.remove()
  })

  it('renders the provided message', () => {
    ReactDOM.render(<ErrorBanner message="Something went wrong" />, container)
    expect(container.textContent).toMatch(/something went wrong/i)
  })

  it('calls onRetry when retry button clicked', () => {
    const onRetry = jest.fn()
    ReactDOM.render(<ErrorBanner message="error" onRetry={onRetry} />, container)
    const button = container.querySelector('button')
    TestUtils.act(() => {
      TestUtils.Simulate.click(button)
    })
    expect(onRetry).toHaveBeenCalled()
  })
})
