import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PromptEditorModal from '../components/PromptEditorModal'
import { API_BASE } from '../api'

afterEach(() => {
  vi.restoreAllMocks()
})

test('loads prompt text and updates when method changes', async () => {
  const a3Text = 'Example A3'
  const d8Text = 'Example 8D'
  vi.spyOn(global, 'fetch')
    .mockResolvedValueOnce({ json: () => Promise.resolve({ text: a3Text }) })
    .mockResolvedValueOnce({ json: () => Promise.resolve({ text: d8Text }) })
  render(<PromptEditorModal open onClose={() => {}} initialMethod="A3" />)
  await waitFor(() =>
    expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/prompt/A3`)
  )
  await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(a3Text))
  await userEvent.click(screen.getByLabelText('Method'))
  await userEvent.click(await screen.findByRole('option', { name: '8D' }))
  await waitFor(() =>
    expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/prompt/8D`)
  )
  await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(d8Text))
})

test('shows error on fetch failure', async () => {
  vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('oops'))
  render(<PromptEditorModal open onClose={() => {}} />)
  await waitFor(() => expect(screen.getByText('oops')).toBeInTheDocument())
})
