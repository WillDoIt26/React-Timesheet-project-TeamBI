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
        palette: { 
            mode, 
            ...(mode === 'light' 
                ? { 
                    primary: { main: '#26a9be', contrastText: '#FFFFFF' },         // Light Blue
                    secondary: { main: '#19415e', contrastText: '#FFFFFF' },       // Dark Blue
                    background: { default: '#EFEFEE', paper: '#FFFFFF' },          // Grey, White
                    text: { primary: '#19415e', secondary: '#26a9be' },            // Dark Blue, Light Blue
                    warning: { main: '#FFDF00', contrastText: '#19415e' },         // Golden
                    info: { main: '#26a9be' },
                    divider: '#6868689f',
                    grey: { 100: '#EFEFEE', 900: '#333333' },
                    action: { 
                        hover: 'rgba(38, 169, 190, 0.08)',                        // Light Blue hover
                        selected: 'rgba(25, 65, 94, 0.12)'                         // Dark Blue selected
                    },
                    error: { lighter: '#ffe5e5', main: '#d32f2f' }
                } 
                : { 
                    primary: { main: '#90caf9' }, 
                    secondary: { main: '#f48fb1' }, 
                    background: { default: '#161C24', paper: '#212B36' }, 
                    text: { primary: '#FFFFFF', secondary: '#919EAB' }, 
                    action: { hover: 'rgba(255, 255, 255, 0.08)', selected: 'rgba(144, 202, 249, 0.16)' }, 
                    error: { lighter: 'rgba(211, 47, 47, 0.2)', main: '#ffcdd2' }
                }), 
        },
        typography: { fontFamily: 'Inter, sans-serif' },
        components: { 
            MuiButton: { 
                styleOverrides: { 
                    root: { textTransform: 'none', borderRadius: 8 },
                    containedPrimary: {
                        backgroundColor: '#19415e',
                        color: '#FFFFFF',
                        '&:hover': { backgroundColor: '#12334a' }
                    },
                    outlinedPrimary: {
                        color: '#19415e',
                        borderColor: '#19415e',
                        '&:hover': {
                          backgroundColor: '#F0F4F8',
                          borderColor: '#12334a',
                          color: '#12334a'
                        }
                    }
                }
            }, 
            MuiPaper: { styleOverrides: { root: { borderRadius: 12, backgroundImage: 'none' }}}, 
            MuiDataGrid: { styleOverrides: { root: { border: 'none' }}}
        },
    }),[mode]);

    return ( 
        <ThemeModeContext.Provider value={colorMode}>
            {children(theme)}
        </ThemeModeContext.Provider> 
    );
};

export const useThemeMode = () => useContext(ThemeModeContext);