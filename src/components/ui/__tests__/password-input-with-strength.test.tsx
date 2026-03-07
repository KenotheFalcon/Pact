import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PasswordInputWithStrength } from '../password-input-with-strength'

describe('PasswordInputWithStrength Accessibility', () => {
  it('should have an accessible toggle button', () => {
    render(<PasswordInputWithStrength />)

    // Check initial state
    const button = screen.getByLabelText('Show password')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-pressed', 'false')

    // Click to show password
    fireEvent.click(button)

    // Check toggled state
    const hideButton = screen.getByLabelText('Hide password')
    expect(hideButton).toBeInTheDocument()
    expect(hideButton).toHaveAttribute('aria-pressed', 'true')
  })
})
