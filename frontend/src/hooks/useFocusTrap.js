import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

/**
 * Traps focus within a container when active and restores focus when closed.
 * - Moves initial focus to the first focusable element (or provided ref)
 * - Cycles Tab/Shift+Tab within the container
 * - Handles Escape to close when onClose is provided
 */
export function useFocusTrap(isActive, containerRef, { initialFocusRef, returnFocusRef, onClose } = {}) {
  const previousFocusRef = useRef(null)

  useEffect(() => {
    if (!isActive) return
    const container = containerRef.current
    if (!container) return

    previousFocusRef.current = document.activeElement
    const focusableElements = Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS))
    const initialElement = (initialFocusRef?.current) || focusableElements[0]
    initialElement?.focus({ preventScroll: true })

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && onClose) {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return
      if (focusableElements.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusableElements[0]
      const last = focusableElements[focusableElements.length - 1]
      const active = document.activeElement

      if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
          event.preventDefault()
          last.focus()
        }
      } else {
        if (active === last || !container.contains(active)) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      const returnTarget = returnFocusRef?.current || previousFocusRef.current
      returnTarget?.focus?.({ preventScroll: true })
    }
  }, [isActive, containerRef, initialFocusRef, returnFocusRef, onClose])
}
