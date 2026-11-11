import { CssBaseline, ThemeProvider } from '@mui/material';
import { createContext, useContext, useMemo } from 'react';
import { buildTheme } from 'components/Theme';

// YHM ships a single light theme; the context stays so older imports keep working
const ColorModeContext = createContext({ mode: 'light', toggle: () => {} });

export const ColorModeProvider = ({ children }) => {
    const theme = useMemo(() => buildTheme(), []);
    return (
        <ColorModeContext.Provider value={{ mode: 'light', toggle: () => {} }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
};

export const useColorMode = () => useContext(ColorModeContext);
