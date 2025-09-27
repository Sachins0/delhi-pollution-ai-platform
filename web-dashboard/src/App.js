import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import theme from './theme';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import PolicyCenter from './pages/PolicyCenter';
import CitizenApp from './pages/CitizenApp';
import Analytics from './pages/Analytics';
import { SocketProvider } from './services/SocketContext';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SocketProvider>
        <Router>
          <Box sx={{ 
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a0e27 0%, #162a47 100%)',
          }}>
            <Navbar />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/policy" element={<PolicyCenter />} />
              <Route path="/citizen" element={<CitizenApp />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </Box>
        </Router>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;
