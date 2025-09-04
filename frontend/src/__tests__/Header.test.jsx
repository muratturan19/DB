import { render, screen, fireEvent } from '@testing-library/react'
import Header from '../components/Header'

it('calls toggleColorMode when icon clicked', () => {
  const toggle = vi.fn()
  render(
    <Header
      toggleColorMode={toggle}
      mode="light"
      onOpenSettings={() => {}}
      onOpenGuide={() => {}}
      onOpenPrompt={() => {}}
    />
  )
  fireEvent.click(screen.getByLabelText(/toggle color mode/i))
  expect(toggle).toHaveBeenCalled()
})

it('shows sun icon in dark mode', () => {
  render(
    <Header
      toggleColorMode={() => {}}
      mode="dark"
      onOpenSettings={() => {}}
      onOpenGuide={() => {}}
      onOpenPrompt={() => {}}
    />
  )
  expect(screen.getByTestId('Brightness7Icon')).toBeInTheDocument()
})

it('renders help and settings buttons', () => {
  render(
    <Header
      toggleColorMode={() => {}}
      mode="light"
      onOpenSettings={() => {}}
      onOpenGuide={() => {}}
      onOpenPrompt={() => {}}
    />
  )
  expect(screen.getByLabelText(/help/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/settings/i)).toBeInTheDocument()
})

it('calls onOpenSettings when settings icon clicked', () => {
  const open = vi.fn()
  render(
    <Header
      toggleColorMode={() => {}}
      mode="light"
      onOpenSettings={open}
      onOpenGuide={() => {}}
      onOpenPrompt={() => {}}
    />
  )
  fireEvent.click(screen.getByLabelText(/settings/i))
  expect(open).toHaveBeenCalled()
})
