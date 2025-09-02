import React, { useEffect, useState } from 'react'
import { Modal, Box, Typography, IconButton, TextField, Button } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

function PromptEditorModal({ open, onClose, method = 'A3' }) {
  const [content, setContent] = useState('')

  useEffect(() => {
    if (open) {
      fetch(`/prompt/${method}`)
        .then((res) => res.json())
        .then((data) => setContent(data.text))
    }
  }, [open, method])

  const handleSave = () => {
    fetch(`/prompt/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: content })
    }).then(onClose)
  }

  const handleReset = () => {
    fetch(`/prompt/${method}/reset`, { method: 'POST' })
      .then(() => fetch(`/prompt/${method}`))
      .then((res) => res.json())
      .then((data) => setContent(data.text))
  }

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="prompt-editor-title">
      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bgcolor: 'background.paper', boxShadow: 24, p: 3, borderRadius: 2, width: '80%', maxWidth: 700 }}>
        <IconButton aria-label="close" onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8 }}>
          <CloseIcon />
        </IconButton>
        <Typography id="prompt-editor-title" variant="h6" sx={{ mb: 2 }}>
          {method} Prompt
        </Typography>
        <TextField multiline fullWidth minRows={12} value={content} onChange={(e) => setContent(e.target.value)} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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

export default PromptEditorModal
