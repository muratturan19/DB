vi.mock('/logo.png', () => ({ default: '' }), { virtual: true })

import { render, screen, fireEvent } from '@testing-library/react'
import Header from '../components/Header'

it('calls toggleColorMode when icon clicked', () => {
  const toggle = vi.fn()
  render(<Header toggleColorMode={toggle} mode="light" />)
  fireEvent.click(screen.getByLabelText(/toggle color mode/i))
  expect(toggle).toHaveBeenCalled()
})

it('shows sun icon in dark mode', () => {
  render(<Header toggleColorMode={() => {}} mode="dark" />)
  expect(screen.getByTestId('Brightness7Icon')).toBeInTheDocument()
})
