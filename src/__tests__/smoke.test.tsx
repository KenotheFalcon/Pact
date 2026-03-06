import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

describe('Smoke Test', () => {
    it('adds 1 + 1 correctly', () => {
        expect(1 + 1).toBe(2)
    })

    it('renders a simple div', () => {
        render(<div data-testid="test-div">Hello World</div>)
        const element = screen.getByTestId('test-div')
        expect(element).toBeInTheDocument()
        expect(element).toHaveTextContent('Hello World')
    })
})
