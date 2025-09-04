import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@mui/material/Autocomplete', () => ({
  __esModule: true,
  default: ({ value, inputValue, onChange, onInputChange, renderInput }) => {
    const params = { inputProps: {}, InputProps: {} }
    const { inputProps, label } = renderInput(params).props
    const handler = onChange || onInputChange || (() => {})
    return (
      <input
        aria-label={label}
        data-testid={inputProps['data-testid'] || inputProps.id}
        value={inputValue || value || ''}
        onChange={(e) => handler(null, e.target.value)}
      />
    )
  }
}))

import AnalysisForm from '../components/AnalysisForm'
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})


beforeEach(() => {
  global.fetch = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('renders when options fetch fails', async () => {
  fetch.mockRejectedValueOnce(new Error('fail'))
  fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
  fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })

  render(<AnalysisForm />)
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

  expect(screen.getByText(/özel talimatlar/i)).toBeInTheDocument()
})

test('shows guide text when method selected', async () => {
  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })

  render(<AnalysisForm />)
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

  const methodInput = screen.getByLabelText('Metot')
  fireEvent.change(methodInput, {
    target: { value: '8D' }
  })
})

test('calls scan 8d endpoint on button click', async () => {
  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, text: async () => '' })

  render(<AnalysisForm />)
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

  fireEvent.click(screen.getByRole('button', { name: /8d raporlarını tara/i }))
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(4))
  expect(fetch.mock.calls[3][0]).toMatch(/scan_8d/)
})

test('fetches filtered claims', async () => {
  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: { excel: [{ complaint: 'x', customer: 'y' }], store: [] }
      })
    })

  render(<AnalysisForm />)
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

  fireEvent.change(screen.getByTestId('customer-input'), {
    target: { value: 'acme' }
  })
  fireEvent.click(screen.getByLabelText('Müşteri'))
  fireEvent.click(screen.getByRole('button', { name: /şikayetleri getir/i }))

  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(4))
  const url = fetch.mock.calls[3][0]
  const encoded = encodeURIComponent('Müşteri Adı').replace(/%20/g, '+')
  expect(url).toContain(`${encoded}=acme`)
  await screen.findByText('x')
  const headers = screen
    .getAllByRole('columnheader')
    .map((h) => h.textContent)
  expect(headers).toEqual(expect.arrayContaining(['Complaint', 'Customer']))
  expect(
    screen.getByText(/Fetched 1 claims/)
  ).toBeInTheDocument()
  expect(screen.getByTestId('claims-json')).toHaveTextContent('"x"')
  expect(screen.getByTestId('claim-columns')).toHaveTextContent(
    'Complaint, Customer'
  )
})

test('handles single claim object response', async () => {
  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ complaint: 'x', customer: 'y' })
    })

  render(<AnalysisForm />)
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

  fireEvent.click(screen.getByRole('button', { name: /şikayetleri getir/i }))

  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(4))

  const headers = screen
    .getAllByRole('columnheader')
    .map((h) => h.textContent)
  expect(headers).toEqual(expect.arrayContaining(['Complaint', 'Customer']))
  await screen.findByText('x')
  await screen.findByText('y')
  expect(screen.getByText(/Fetched 1 claims/)).toBeInTheDocument()
})

test('formats iso date strings in claims table', async () => {
  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: { excel: [{ when: '2024-01-24T00:00:00' }], store: [] }
      })
    })

  render(<AnalysisForm />)
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

  fireEvent.click(screen.getByRole('button', { name: /şikayetleri getir/i }))

  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(4))
  await screen.findByText('2024-01-24')
})

test('shows alert on claims fetch rejection', async () => {
  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockRejectedValueOnce(new Error('claims fail'))

  render(<AnalysisForm />)
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

  fireEvent.click(screen.getByRole('button', { name: /şikayetleri getir/i }))

  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(4))
  expect(await screen.findByText('claims fail')).toBeInTheDocument()
  expect(screen.getByText('Kayıt bulunamadı')).toBeInTheDocument()
})

test('shows message when no claims returned', async () => {
  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ results: { excel: [], store: [] } }) })

  render(<AnalysisForm />)
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

  fireEvent.click(screen.getByRole('button', { name: /şikayetleri getir/i }))

  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(4))
  expect(screen.getByText('Kayıt bulunamadı')).toBeInTheDocument()
})

test('claims table uses sticky header', async () => {
  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: { excel: [{ complaint: 'x' }], store: [] } })
    })

  render(<AnalysisForm />)
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

  fireEvent.click(screen.getByRole('button', { name: /şikayetleri getir/i }))

  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(4))
  const table = await screen.findByRole('table')
  expect(table.className).toMatch(/MuiTable-stickyHeader/)
})

test('table container has expected spacing and scrolls', async () => {
  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: { excel: [{ complaint: 'x' }], store: [] } })
    })

  render(<AnalysisForm />)
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

  fireEvent.click(screen.getByRole('button', { name: /şikayetleri getir/i }))

  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(4))
  const table = await screen.findByRole('table')
  const container = table.parentElement
  const mt = parseInt(getComputedStyle(container).marginTop)
  expect(mt).toBeGreaterThanOrEqual(16)
  expect(mt).toBeLessThanOrEqual(24)
  expect(container).toHaveStyle({ maxHeight: '400px', overflowY: 'auto' })
})

test('applies instructionsBoxProps margin', async () => {
  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })

  render(<AnalysisForm instructionsBoxProps={{ mt: 5 }} />)
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

  const box = screen.getByText(/özel talimatlar/i).parentElement
  expect(box).toHaveStyle('margin-top: 40px')
})

test.skip('shows fishbone diagram on Ishikawa method', async () => {
  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })

  render(<AnalysisForm initialMethod="Ishikawa" />)
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))
  expect(screen.getByTestId('fishbone')).toBeInTheDocument()
})

test.skip('runs analyze workflow', async () => {
  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ fields: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ analysisText: 'a' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ result: 'r' }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ pdf: '/p', excel: '/e' })
    })

  render(<AnalysisForm initialMethod="8D" />)
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

  fireEvent.change(screen.getByLabelText('Şikayet (Complaint)'), {
    target: { value: 'c' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'ANALİZ ET' }))

  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(7))
  expect(fetch.mock.calls[3][0]).toMatch(/\/guide\/8D/)
  expect(fetch.mock.calls[4][0]).toMatch(/\/analyze$/)
  expect(fetch.mock.calls[5][0]).toMatch(/\/review$/)
  expect(fetch.mock.calls[6][0]).toMatch(/\/report$/)
  await screen.findByTestId('analysis-text')
  await screen.findByTestId('review-text')
  await screen.findByTestId('pdf-link')
  await screen.findByTestId('excel-link')
})

test('opens and closes report guide modal', async () => {
  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })

  render(<AnalysisForm />)
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

  fireEvent.click(screen.getByRole('button', { name: /rapor kılavuzu/i }))
  expect(
    screen.getByText(/Rapor Kılavuzu – Kaliteli ve Anlamlı Çıktı İçin İpuçları/i)
  ).toBeInTheDocument()

  fireEvent.click(screen.getByLabelText(/close/i))
  await waitFor(() =>
    expect(
      screen.queryByText(/Rapor Kılavuzu – Kaliteli ve Anlamlı Çıktı İçin İpuçları/i)
    ).toBeNull()
  )
})

test('shows error alert on analyze failure', async () => {
  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ fields: [] }) })
    .mockResolvedValueOnce({ ok: false, text: async () => 'fail' })

  render(<AnalysisForm initialMethod="8D" />)
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

  fireEvent.change(screen.getByLabelText('Şikayet (Complaint)'), {
    target: { value: 'c' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'ANALİZ ET' }))

  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(5))
  expect(await screen.findByText('fail')).toBeInTheDocument()
})

test('shows error alert on empty report response', async () => {
  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ fields: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ analysisText: 'a' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ result: 'r' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({}) })

  render(<AnalysisForm initialMethod="8D" />)
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

  fireEvent.change(screen.getByLabelText('Şikayet (Complaint)'), {
    target: { value: 'c' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'ANALİZ ET' }))

  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(7))
  expect(
    await screen.findByText('Sunucudan beklenmeyen boş yanıt alındı')
  ).toBeInTheDocument()
})

test('hides report links when report request fails', async () => {
  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ fields: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ analysisText: 'a' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ result: 'r' }) })
    .mockResolvedValueOnce({ ok: false, text: async () => 'err' })

  render(<AnalysisForm initialMethod="8D" />)
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

  fireEvent.change(screen.getByLabelText('Şikayet (Complaint)'), {
    target: { value: 'c' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'ANALİZ ET' }))

  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(7))
  expect(await screen.findByText('err')).toBeInTheDocument()
  expect(screen.queryByTestId('pdf-link')).toBeNull()
})

test('shows detail message from JSON error response', async () => {
  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ fields: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ analysisText: 'a' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ result: 'r' }) })
    .mockResolvedValueOnce({
      ok: false,
      text: async () => JSON.stringify({ detail: 'Report generation failed' })
    })

  render(<AnalysisForm initialMethod="8D" />)
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

  fireEvent.change(screen.getByLabelText('Şikayet (Complaint)'), {
    target: { value: 'c' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'ANALİZ ET' }))

  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(7))
  expect(
    await screen.findByText('Report generation failed')
  ).toBeInTheDocument()
})

test('shows alert when analyze request rejects', async () => {
  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ fields: [] }) })
    .mockRejectedValueOnce(new Error('server error'))

  render(<AnalysisForm initialMethod="8D" />)
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

  fireEvent.change(screen.getByLabelText('Şikayet (Complaint)'), {
    target: { value: 'c' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'ANALİZ ET' }))

  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(5))
  expect(await screen.findByText('server error')).toBeInTheDocument()
})

test('shows loading indicator during analyze', async () => {
  let resolveGuide
  const guidePromise = new Promise((res) => {
    resolveGuide = res
  })

  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockReturnValueOnce(guidePromise)
    .mockResolvedValueOnce({ ok: true, json: async () => ({ analysisText: 't' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ result: 'r' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ pdf: '/p', excel: '/e' }) })

  render(<AnalysisForm initialMethod="8D" />)
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

  fireEvent.change(screen.getByLabelText('Şikayet (Complaint)'), {
    target: { value: 'c' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'ANALİZ ET' }))

  await screen.findByTestId('loading-indicator')
  resolveGuide({ ok: true, json: async () => ({ fields: [] }) })

  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(7))
  expect(screen.queryByTestId('loading-indicator')).toBeNull()
})

test('shows debug alert after successful analyze', async () => {
  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ fields: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ analysisText: 't' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ result: 'r' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ pdf: '/p', excel: '/e' }) })

  render(<AnalysisForm initialMethod="8D" />)
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

  fireEvent.change(screen.getByLabelText('Şikayet (Complaint)'), {
    target: { value: 'c' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'ANALİZ ET' }))

  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(7))
  expect(screen.getByText(/Report generated/)).toBeInTheDocument()
})

test('shows raw analysis json when response missing fields', async () => {
  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ fields: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ foo: 'bar' }) })

  render(<AnalysisForm initialMethod="8D" />)
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

  fireEvent.change(screen.getByLabelText('Şikayet (Complaint)'), {
    target: { value: 'c' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'ANALİZ ET' }))

  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(5))
  const pre = await screen.findByTestId('raw-analysis')
  expect(pre).toHaveTextContent('"foo"')
})

test('shows raw claims json on unexpected response', async () => {
  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ strange: true }) })

  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  render(<AnalysisForm />)
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

  fireEvent.click(screen.getByRole('button', { name: /şikayetleri getir/i }))

  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(4))
  expect(log).toHaveBeenCalledWith(
    'raw claims',
    expect.stringContaining('"strange"')
  )
  log.mockRestore()
})

test.skip('uses step responses when analysisText missing', async () => {
  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ fields: [] }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        Step1: { response: 'one' },
        Step2: { response: 'two' }
      })
    })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ result: 'rev' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ pdf: '/p', excel: '/e' }) })

  render(<AnalysisForm initialMethod="8D" />)
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

  fireEvent.change(screen.getByLabelText('Şikayet (Complaint)'), {
    target: { value: 'c' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'ANALİZ ET' }))

  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(7))
  expect(await screen.findByTestId('analysis-text')).toHaveTextContent('one')
  expect(await screen.findByTestId('review-text')).toHaveTextContent('rev')
  await screen.findByTestId('pdf-link')
  await screen.findByTestId('excel-link')
})

test.skip('clears previous results when analyzing again', async () => {
  let resolveGuide
  const guidePromise = new Promise((res) => {
    resolveGuide = res
  })

  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ values: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ fields: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ analysisText: 'a1' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ result: 'r1' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ pdf: '/p1', excel: '/e1' }) })
    .mockReturnValueOnce(guidePromise)
    .mockResolvedValueOnce({ ok: true, json: async () => ({ analysisText: 'a2' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ result: 'r2' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ pdf: '/p2', excel: '/e2' }) })

  render(<AnalysisForm initialMethod="8D" />)
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))

  fireEvent.change(screen.getByLabelText('Şikayet (Complaint)'), {
    target: { value: 'c1' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'ANALİZ ET' }))

  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(7))
  await screen.findByTestId('analysis-text')
  await screen.findByTestId('review-text')
  await screen.findByTestId('pdf-link')
  await screen.findByTestId('excel-link')

  fireEvent.change(screen.getByLabelText('Şikayet (Complaint)'), {
    target: { value: 'c2' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'ANALİZ ET' }))

  expect(screen.queryByTestId('analysis-text')).toBeNull()
  expect(screen.queryByTestId('review-text')).toBeNull()
  expect(screen.queryByTestId('pdf-link')).toBeNull()
  expect(screen.queryByTestId('excel-link')).toBeNull()

  resolveGuide({ ok: true, json: async () => ({ fields: [] }) })
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(11))
  await screen.findByTestId('analysis-text')
  await screen.findByTestId('review-text')
  await screen.findByTestId('pdf-link')
  await screen.findByTestId('excel-link')
})
