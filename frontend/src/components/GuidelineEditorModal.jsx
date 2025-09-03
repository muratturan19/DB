import React, { useEffect, useState } from 'react'
import {
  Modal,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  MenuItem,
  Alert
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { API_BASE } from '../api'

function GuidelineEditorModal({ open, onClose, initialMethod = '8D' }) {
  const [method, setMethod] = useState(initialMethod)
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setError('')
      fetch(`${API_BASE}/guide/${method}`)
        .then((res) => res.json())
        .then((data) => setContent(JSON.stringify(data, null, 2)))
        .catch((err) => setError(err.message))
    }
  }, [open, method])

  const handleSave = () => {
    fetch(`${API_BASE}/guide/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: JSON.parse(content) })
    }).then(onClose)
  }

  const handleReset = () => {
    fetch(`${API_BASE}/guide/${method}/reset`, { method: 'POST' })
      .then(() => fetch(`${API_BASE}/guide/${method}`))
      .then((res) => res.json())
      .then((data) => setContent(JSON.stringify(data, null, 2)))
      .catch((err) => setError(err.message))
  }

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="guideline-editor-title">
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 3,
          borderRadius: 2,
          width: '80%',
          maxWidth: 700,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <IconButton aria-label="close" onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8 }}>
          <CloseIcon />
        </IconButton>
        <Typography id="guideline-editor-title" variant="h6" sx={{ mb: 2 }}>
          Guideline Editor
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          select
          label="Method"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          sx={{ mb: 2 }}
        >
          {['5N1K', '8D', 'A3', 'DMAIC', 'Ishikawa'].map((m) => (
            <MenuItem key={m} value={m}>
              {m}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          multiline
          fullWidth
          minRows={12}
          maxRows={25}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          inputProps={{ 'aria-label': 'guideline-content' }}
          sx={{ mb: 2, flexGrow: 1, overflowY: 'auto' }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Button onClick={handleReset} color="secondary" sx={{ mr: 1 }}>
            Reset
          </Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </Box>
      </Box>
    </Modal>
  )
}

export default GuidelineEditorModal
