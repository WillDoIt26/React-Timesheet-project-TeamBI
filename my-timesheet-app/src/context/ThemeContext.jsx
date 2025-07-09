// src/context/ThemeContext.jsx
import { createContext, useState, useMemo, useContext } from 'react';
import { createTheme } from '@mui/material/styles';

const ThemeModeContext = createContext({ toggleColorMode: () => {} });
export const ThemeModeProvider = ({ children }) => {
    const [mode, setMode] = useState('light');
    const colorMode = useMemo(() => ({
        toggleColorMode: () => {
            setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
        },
    }), []);
    const theme = useMemo(() => createTheme({
        palette: { mode, ...(mode === 'light' ? { primary: { main: '#1976d2' }, secondary: { main: '#dc004e' }, background: { default: '#f4f6f8', paper: '#ffffff' }, text: { primary: '#212B36', secondary: '#637381' }, action: { hover: 'rgba(0, 0, 0, 0.04)', selected: 'rgba(25, 118, 210, 0.08)' }, error: { lighter: '#ffe5e5', main: '#d32f2f' } } : { primary: { main: '#90caf9' }, secondary: { main: '#f48fb1' }, background: { default: '#161C24', paper: '#212B36' }, text: { primary: '#FFFFFF', secondary: '#919EAB' }, action: { hover: 'rgba(255, 255, 255, 0.08)', selected: 'rgba(144, 202, 249, 0.16)' }, error: { lighter: 'rgba(211, 47, 47, 0.2)', main: '#ffcdd2' } }), },
        typography: { fontFamily: 'Roboto, sans-serif' },
        components: { MuiButton: { styleOverrides: { root: { textTransform: 'none', borderRadius: 8 }}}, MuiPaper: { styleOverrides: { root: { borderRadius: 12, backgroundImage: 'none' }}}, MuiDataGrid: { styleOverrides: { root: { border: 'none' }}}},
    }),[mode]);
    return ( <ThemeModeContext.Provider value={colorMode}>{children(theme)}</ThemeModeContext.Provider> );
};
export const useThemeMode = () => useContext(ThemeModeContext);