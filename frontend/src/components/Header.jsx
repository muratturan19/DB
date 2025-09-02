import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import useMediaQuery from '@mui/material/useMediaQuery'
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import SettingsIcon from '@mui/icons-material/Settings'

function Header({ toggleColorMode, mode }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

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
        <IconButton color="inherit" aria-label="help" sx={{ mx: 0.5, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.1)' } }}>
          <HelpOutlineIcon />
        </IconButton>
        <IconButton color="inherit" aria-label="settings" sx={{ mx: 0.5, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.1)' } }}>
          <SettingsIcon />
        </IconButton>
        <IconButton color="inherit" onClick={toggleColorMode} aria-label="toggle color mode" sx={{ mx: 0.5, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.1)' } }}>
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Toolbar>
    </AppBar>
  )
}

export default Header
