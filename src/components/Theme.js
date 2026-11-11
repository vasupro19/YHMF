import { alpha, createTheme } from '@mui/material/styles';

// YHM: deep navy with a champagne-gold accent
export const buildTheme = (mode) => {
    const dark = mode === 'dark';
    const navy = dark ? '#8fb0ff' : '#1f3a73';
    const gold = dark ? '#e5b45a' : '#b9801f';
    const line = dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
    const shadow = dark ? '0 1px 2px rgba(0,0,0,.4)' : '0 1px 2px rgba(16,24,40,.04), 0 2px 6px rgba(16,24,40,.05)';

    return createTheme({
        palette: {
            mode,
            primary: { main: navy, contrastText: dark ? '#0b1630' : '#ffffff' },
            secondary: { main: gold, contrastText: '#1a1204' },
            success: { main: dark ? '#4ade80' : '#15803d' },
            warning: { main: dark ? '#fbbf24' : '#b45309' },
            error: { main: dark ? '#f87171' : '#dc2626' },
            info: { main: dark ? '#60a5fa' : '#2563eb' },
            background: dark ? { default: '#0a1220', paper: '#111b2e' } : { default: '#f4f6fb', paper: '#ffffff' },
            text: dark ? { primary: '#e8edf7', secondary: '#9aa8c2' } : { primary: '#111c33', secondary: '#5b6b87' },
            divider: line
        },
        shape: { borderRadius: 14 },
        typography: {
            fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            h3: { fontWeight: 700, letterSpacing: '-0.025em' },
            h4: { fontWeight: 700, letterSpacing: '-0.025em' },
            h5: { fontWeight: 700, letterSpacing: '-0.015em' },
            h6: { fontWeight: 650, letterSpacing: '-0.01em' },
            subtitle1: { fontWeight: 600 },
            subtitle2: { fontWeight: 600 },
            button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
            overline: { fontWeight: 700, letterSpacing: '0.08em' }
        },
        components: {
            MuiCssBaseline: { styleOverrides: { body: { fontFeatureSettings: '"cv02","cv03","cv04","cv11"' } } },
            MuiButton: {
                defaultProps: { disableElevation: true },
                styleOverrides: {
                    root: { borderRadius: 10, paddingInline: 16 },
                    containedPrimary: { background: dark ? navy : 'linear-gradient(180deg, #2a4a8f 0%, #1f3a73 100%)', '&:hover': { background: dark ? '#a5c0ff' : '#183063' } },
                    outlined: { borderColor: line, '&:hover': { borderColor: alpha(navy, 0.5), backgroundColor: alpha(navy, 0.06) } }
                }
            },
            MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
            MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 10, backgroundColor: dark ? alpha('#fff', 0.03) : '#fff' }, notchedOutline: { borderColor: dark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.16)' } } },
            MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
            MuiCard: { defaultProps: { variant: 'outlined' }, styleOverrides: { root: { borderColor: line, boxShadow: shadow, borderRadius: 16 } } },
            MuiDialog: { styleOverrides: { paper: { borderRadius: 20, boxShadow: '0 24px 64px rgba(8,15,35,.35)' } } },
            MuiDialogTitle: { styleOverrides: { root: { fontWeight: 700, fontSize: 20, letterSpacing: '-0.01em' } } },
            MuiTableCell: {
                styleOverrides: {
                    root: { borderColor: line, paddingBlock: 12 },
                    head: { fontWeight: 700, fontSize: 11.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: dark ? '#8a9bb8' : '#64748b', backgroundColor: dark ? alpha('#fff', 0.025) : '#f8fafc', whiteSpace: 'nowrap' }
                }
            },
            MuiTableRow: { styleOverrides: { root: { '&:last-child td': { borderBottom: 0 } } } },
            MuiChip: { styleOverrides: { root: { fontWeight: 600, borderRadius: 8 }, sizeSmall: { height: 24, fontSize: 12 } } },
            MuiToggleButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600, borderColor: line, paddingInline: 12, '&.Mui-selected': { backgroundColor: alpha(navy, dark ? 0.22 : 0.1), color: navy, '&:hover': { backgroundColor: alpha(navy, dark ? 0.3 : 0.16) } } } } },
            MuiTooltip: { styleOverrides: { tooltip: { borderRadius: 8, fontSize: 12.5, fontWeight: 500 } } },
            MuiAlert: { styleOverrides: { root: { borderRadius: 12 } } },
            MuiMenu: { styleOverrides: { paper: { borderRadius: 14, border: `1px solid ${line}`, boxShadow: '0 12px 32px rgba(8,15,35,.2)' } } }
        }
    });
};
