import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GuidelineEditorModal from '../components/GuidelineEditorModal'
import { API_BASE } from '../api'

afterEach(() => {
  vi.restoreAllMocks()
})

test('loads guideline content on open', async () => {
  const mockData = { step: 'Test' }
  vi.spyOn(global, 'fetch').mockResolvedValueOnce({
    json: () => Promise.resolve(mockData)
  })
  render(<GuidelineEditorModal open onClose={() => {}} initialMethod="8D" />)
  await waitFor(() =>
    expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/guide/8D`)
  )
  await waitFor(() =>
    expect(
      screen.getByRole('textbox', { name: 'guideline-content' })
    ).toHaveValue(JSON.stringify(mockData, null, 2))
  )
})

test('allows switching between guideline methods', async () => {
  const responses = [
    { json: () => Promise.resolve({ step: '8D data' }) },
    { json: () => Promise.resolve({ step: 'A3 data' }) }
  ]
  vi.spyOn(global, 'fetch').mockImplementation(() =>
    Promise.resolve(responses.shift())
  )
  const user = userEvent.setup()
  render(<GuidelineEditorModal open onClose={() => {}} />)
  await waitFor(() =>
    expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/guide/8D`)
  )
  await user.click(screen.getByLabelText(/method/i))
  await user.click(screen.getByRole('option', { name: 'A3' }))
  await waitFor(() =>
    expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/guide/A3`)
  )
})
