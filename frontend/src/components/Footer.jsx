import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

function Footer() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const year = new Date().getFullYear()

  return (
    <Box
      component="footer"
      sx={{
        mt: 4,
        py: 3,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.secondary,
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: 'md',
          mx: 'auto',
          px: 2,
          textAlign: isMobile ? 'center' : 'inherit',
        }}
      >
        <Typography variant="body2" sx={{ mb: isMobile ? 1 : 0 }}>
          © {year} DB Kalite Asistanı. All rights reserved.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Link href="#" color="inherit" underline="hover">
            About
          </Link>
          <Link href="#" color="inherit" underline="hover">
            Privacy
          </Link>
        </Box>
      </Box>
    </Box>
  )
}

export default Footer
