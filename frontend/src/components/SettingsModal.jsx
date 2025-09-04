import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import { API_BASE } from '../api'

function SettingsModal({ open, onClose }) {
  const [apiKey, setApiKey] = useState('')
  const [excelPath, setExcelPath] = useState('')
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' })

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setExcelPath(file.path || '')
    }
  }

  const handleSave = async () => {
    if (!apiKey.startsWith('sk-') || !excelPath) {
      setSnack({ open: true, message: 'Geçersiz bilgi', severity: 'error' })
      return
    }
    try {
      const res = await fetch(`${API_BASE}/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, excelPath })
      })
      if (!res.ok) throw new Error('failed')
      setSnack({ open: true, message: 'Ayarlar kaydedildi', severity: 'success' })
      onClose()
    } catch {
      setSnack({ open: true, message: 'Ayarlar kaydedilemedi', severity: 'error' })
    }
  }

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Ayarlar</DialogTitle>
        <DialogContent>
          <TextField
            label="OpenAI API Key"
            type="password"
            fullWidth
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            margin="normal"
          />
          <TextField
            label="Excel Dosyası"
            type="file"
            fullWidth
            onChange={handleFileChange}
            margin="normal"
            inputProps={{ 'data-testid': 'excel-input' }}
          />
          {excelPath && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {excelPath}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>İptal</Button>
          <Button onClick={handleSave} variant="contained">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default SettingsModal
