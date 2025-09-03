import { render, screen, waitFor } from '@testing-library/react'
import PromptEditorModal from '../components/PromptEditorModal'
import { API_BASE } from '../api'

afterEach(() => {
  vi.restoreAllMocks()
})

test('loads prompt text on open', async () => {
  const text = 'Example prompt'
  vi.spyOn(global, 'fetch').mockResolvedValueOnce({
    json: () => Promise.resolve({ text })
  })
  render(<PromptEditorModal open onClose={() => {}} method="A3" />)
  await waitFor(() =>
    expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/prompt/A3`)
  )
  await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(text))
})

test('shows error on fetch failure', async () => {
  vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('oops'))
  render(<PromptEditorModal open onClose={() => {}} />)
  await waitFor(() => expect(screen.getByText('oops')).toBeInTheDocument())
})
