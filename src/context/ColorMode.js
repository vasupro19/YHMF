import { CssBaseline, ThemeProvider } from '@mui/material';
import { createContext, useContext, useMemo, useState } from 'react';
import { buildTheme } from 'components/Theme';

const ColorModeContext = createContext({ mode: 'light', toggle: () => {} });

const initialMode = () => {
    try {
        const saved = localStorage.getItem('colorMode');
        if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {
        /* storage blocked */
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ColorModeProvider = ({ children }) => {
    const [mode, setMode] = useState(initialMode);
    const theme = useMemo(() => buildTheme(mode), [mode]);

    const toggle = () =>
        setMode((prev) => {
            const next = prev === 'light' ? 'dark' : 'light';
            try {
                localStorage.setItem('colorMode', next);
            } catch (e) {
                /* ignore */
            }
            return next;
        });

    return (
        <ColorModeContext.Provider value={{ mode, toggle }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
};

export const useColorMode = () => useContext(ColorModeContext);
