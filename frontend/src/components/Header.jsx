import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import useMediaQuery from '@mui/material/useMediaQuery'
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import SettingsIcon from '@mui/icons-material/Settings'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import EditNoteIcon from '@mui/icons-material/EditNote'

function Header({ toggleColorMode, mode, onOpenGuide, onOpenPrompt }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)
  const handleOpen = (e) => setAnchorEl(e.currentTarget)
  const handleClose = () => setAnchorEl(null)

  const api = window.api

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: '#002855',
        color: '#ffffff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        borderBottom: '4px solid #14397c'
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 64, sm: 80 } }}>
        <Box component="img" src="/fkt.png" alt="Company Logo" sx={{ height: isMobile ? 40 : 50, mr: 2 }} />
        <Typography
          variant={isMobile ? 'h6' : 'h5'}
          sx={{
            flexGrow: 1,
            fontFamily: 'Poppins, Inter, sans-serif',
            animation: 'fadeIn 1s ease-in-out'
          }}
        >
          DB Kalite Asistanı
        </Typography>
        <IconButton color="inherit" aria-label="guide" onClick={onOpenGuide} sx={{ mx: 0.5, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.1)' } }}>
          <MenuBookIcon />
        </IconButton>
        <IconButton color="inherit" aria-label="prompt" onClick={onOpenPrompt} sx={{ mx: 0.5, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.1)' } }}>
          <EditNoteIcon />
        </IconButton>
        <IconButton color="inherit" aria-label="help" sx={{ mx: 0.5, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.1)' } }}>
          <HelpOutlineIcon />
        </IconButton>
        <IconButton color="inherit" aria-label="settings" onClick={handleOpen} sx={{ mx: 0.5, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.1)' } }}>
          <SettingsIcon />
        </IconButton>
        <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
          <MenuItem onClick={() => { api.openGuidelines(); handleClose() }}>Guidelines klasörünü aç</MenuItem>
          <MenuItem onClick={() => { api.resetGuidelines(); handleClose() }}>Guidelines'ı sıfırla</MenuItem>
          <MenuItem onClick={() => { api.openPrompts(); handleClose() }}>Prompts klasörünü aç</MenuItem>
          <MenuItem onClick={() => { api.resetPrompts(); handleClose() }}>Prompts'u sıfırla</MenuItem>
          <MenuItem onClick={() => { api.openConfig(); handleClose() }}>Konfigürasyon klasörünü aç (.env)</MenuItem>
        </Menu>
        <IconButton color="inherit" onClick={toggleColorMode} aria-label="toggle color mode" sx={{ mx: 0.5, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.1)' } }}>
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Toolbar>
    </AppBar>
  )
}

export default Header
