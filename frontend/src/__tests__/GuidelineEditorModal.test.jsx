import { render, screen, waitFor } from '@testing-library/react'
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
  render(<GuidelineEditorModal open onClose={() => {}} method="8D" />)
  await waitFor(() =>
    expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/guide/8D`)
  )
  await waitFor(() =>
    expect(screen.getByRole('textbox')).toHaveValue(
      JSON.stringify(mockData, null, 2)
    )
  )
})
