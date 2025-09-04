import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SettingsModal from '../components/SettingsModal'

afterEach(() => {
  vi.restoreAllMocks()
})

test('posts settings and closes', async () => {
  const onClose = vi.fn()
  vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true })
  render(<SettingsModal open onClose={onClose} />)
  fireEvent.change(screen.getByLabelText(/openai api key/i), {
    target: { value: 'sk-test' }
  })
  const file = new File(['data'], 'test.xlsx')
  Object.defineProperty(file, 'path', { value: '/path/test.xlsx' })
  fireEvent.change(screen.getByTestId('excel-input'), { target: { files: [file] } })
  fireEvent.click(screen.getByText('Kaydet'))
  await waitFor(() =>
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/setup',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: 'sk-test', excelPath: '/path/test.xlsx' })
      })
    )
  )
  await waitFor(() => expect(onClose).toHaveBeenCalled())
})
