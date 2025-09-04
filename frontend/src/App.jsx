import { useMemo, useState } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Home from './pages/Home'
import Header from './components/Header'
import GuidelineEditorModal from './components/GuidelineEditorModal'
import PromptEditorModal from './components/PromptEditorModal'
import SettingsModal from './components/SettingsModal'

function App() {
  const [mode, setMode] = useState('light')
  const [guideOpen, setGuideOpen] = useState(false)
  const [promptOpen, setPromptOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const toggleColorMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#002855'
          },
          secondary: {
            main: '#14397c'
          }
        },
        shape: { borderRadius: 12 },
        typography: {
          fontFamily: "'Poppins','Inter','Roboto','Helvetica','Arial',sans-serif",
          fontSize: 14
        },
        components: {
          MuiButton: { defaultProps: { size: 'small' } },
          MuiTextField: { defaultProps: { size: 'small' } },
          MuiSelect: { defaultProps: { size: 'small' } },
          MuiAutocomplete: { defaultProps: { size: 'small' } }
        }
      }),
    [mode]
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
        <Header
          toggleColorMode={toggleColorMode}
          mode={mode}
          onOpenGuide={() => setGuideOpen(true)}
          onOpenPrompt={() => setPromptOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <Home />
        <GuidelineEditorModal open={guideOpen} onClose={() => setGuideOpen(false)} />
        <PromptEditorModal open={promptOpen} onClose={() => setPromptOpen(false)} />
        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </ThemeProvider>
    )
  }

export default App
