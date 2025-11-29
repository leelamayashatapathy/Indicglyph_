import React from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-dom/test-utils'
import ThemeToggle from '../components/ThemeToggle'
import { ThemeProvider, useTheme } from '../hooks/useTheme'

function Wrapper() {
  const { theme } = useTheme()
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <ThemeToggle />
    </div>
  )
}

function renderInProvider(container) {
  ReactDOM.render(
    <ThemeProvider>
      <Wrapper />
    </ThemeProvider>,
    container
  )
}

describe('ThemeToggle', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container)
    container.remove()
  })

  it('renders with aria-pressed reflecting theme', () => {
    renderInProvider(container)
    const button = container.querySelector('button')
    expect(button.getAttribute('aria-pressed')).toBe('false')
  })

  it('toggles theme on click', () => {
    renderInProvider(container)
    const button = container.querySelector('button')
    const themeValue = () => container.querySelector('[data-testid="theme-value"]').textContent

    const initial = themeValue()
    TestUtils.act(() => {
      TestUtils.Simulate.click(button)
    })
    expect(button.getAttribute('aria-pressed')).toBe(initial === 'dark' ? 'false' : 'true')
    expect(themeValue()).not.toBe(initial)
  })

  it('toggles on Enter and Space keypress', () => {
    renderInProvider(container)
    const button = container.querySelector('button')
    const initialPressed = button.getAttribute('aria-pressed')

    TestUtils.act(() => {
      TestUtils.Simulate.keyDown(button, { key: 'Enter' })
    })
    expect(button.getAttribute('aria-pressed')).not.toBe(initialPressed)

    const pressedAfterEnter = button.getAttribute('aria-pressed')
    TestUtils.act(() => {
      TestUtils.Simulate.keyDown(button, { key: ' ' })
    })
    expect(button.getAttribute('aria-pressed')).not.toBe(pressedAfterEnter)
  })
})
