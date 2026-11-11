import { alpha, createTheme } from '@mui/material/styles';

// YHM design tokens: a calm, light ERP look with a maroon brand colour used sparingly
export const T = {
    brand: '#7A1F2B',
    brandDark: '#5E1520',
    brandTint: '#F7EDEF',
    brandLine: '#E9D3D7',
    brass: '#9C7A3C',
    ink: '#1C1A19',
    ink2: '#57534E',
    ink3: '#8A857F',
    page: '#F5F4F1',
    panel: '#FFFFFF',
    subtle: '#FAF9F7',
    line: '#E5E2DD',
    line2: '#D5D0C9',
    success: '#1F7A4D',
    warning: '#A35F00',
    error: '#B42318',
    info: '#2457A6',
    neutral: '#6B6660'
};

const FONT = '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export const buildTheme = () =>
    createTheme({
        palette: {
            mode: 'light',
            primary: { main: T.brand, dark: T.brandDark, light: '#9A3A47', contrastText: '#fff' },
            secondary: { main: T.brass, contrastText: '#fff' },
            success: { main: T.success },
            warning: { main: T.warning },
            error: { main: T.error },
            info: { main: T.info },
            background: { default: T.page, paper: T.panel },
            text: { primary: T.ink, secondary: T.ink2, disabled: '#B3AEA8' },
            divider: T.line,
            action: { hover: 'rgba(28,26,25,0.04)', selected: alpha(T.brand, 0.08) }
        },
        shape: { borderRadius: 6 },
        typography: {
            fontFamily: FONT,
            fontSize: 13,
            h1: { fontSize: 28, fontWeight: 650, letterSpacing: '-0.02em' },
            h2: { fontSize: 24, fontWeight: 650, letterSpacing: '-0.02em' },
            h3: { fontSize: 22, fontWeight: 650, letterSpacing: '-0.015em' },
            h4: { fontSize: 20, fontWeight: 650, letterSpacing: '-0.01em' },
            h5: { fontSize: 17, fontWeight: 650, letterSpacing: '-0.005em' },
            h6: { fontSize: 14.5, fontWeight: 650 },
            subtitle1: { fontSize: 14, fontWeight: 600 },
            subtitle2: { fontSize: 13, fontWeight: 600 },
            body1: { fontSize: 14 },
            body2: { fontSize: 13 },
            caption: { fontSize: 12 },
            button: { textTransform: 'none', fontWeight: 600, fontSize: 13, letterSpacing: 0 },
            overline: { fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', lineHeight: 1.6 }
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: { backgroundColor: T.page, fontFeatureSettings: '"cv11","ss01"' },
                    '.num, td, th': { fontVariantNumeric: 'tabular-nums' },
                    '::selection': { background: alpha(T.brand, 0.18) }
                }
            },
            MuiButtonBase: { defaultProps: { disableRipple: true } },
            MuiButton: {
                defaultProps: { disableElevation: true },
                styleOverrides: {
                    root: { borderRadius: 6, minHeight: 32, paddingInline: 14, paddingBlock: 5, whiteSpace: 'nowrap', '&:focus-visible': { boxShadow: `0 0 0 3px ${alpha(T.brand, 0.2)}` } },
                    sizeSmall: { minHeight: 28, paddingInline: 10, fontSize: 12.5 },
                    sizeLarge: { minHeight: 40, fontSize: 14 },
                    containedPrimary: { backgroundColor: T.brand, '&:hover': { backgroundColor: T.brandDark } },
                    outlined: { borderColor: T.line2, backgroundColor: T.panel, '&:hover': { borderColor: '#BDB7AF', backgroundColor: T.subtle } },
                    outlinedInherit: { color: T.ink },
                    text: { '&:hover': { backgroundColor: 'rgba(28,26,25,0.05)' } },
                    startIcon: { marginRight: 6, '& > *:nth-of-type(1)': { fontSize: 18 } }
                }
            },
            MuiIconButton: { styleOverrides: { root: { borderRadius: 6 }, sizeSmall: { padding: 4 } } },
            MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
            MuiInputLabel: { styleOverrides: { root: { fontSize: 13 } } },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        borderRadius: 6,
                        backgroundColor: T.panel,
                        fontSize: 13.5,
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#B9B3AB' },
                        '&.Mui-focused': { boxShadow: `0 0 0 3px ${alpha(T.brand, 0.12)}` },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 1, borderColor: T.brand },
                        '&.Mui-disabled': { backgroundColor: T.subtle }
                    },
                    notchedOutline: { borderColor: T.line2 }
                }
            },
            MuiFormHelperText: { styleOverrides: { root: { marginLeft: 2, fontSize: 12 } } },
            MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' }, rounded: { borderRadius: 8 } } },
            MuiCard: { defaultProps: { variant: 'outlined' }, styleOverrides: { root: { borderColor: T.line, borderRadius: 8, boxShadow: 'none' } } },
            MuiCardContent: { styleOverrides: { root: { padding: 16, '&:last-child': { paddingBottom: 16 } } } },
            MuiDialog: { styleOverrides: { paper: { borderRadius: 10, boxShadow: '0 20px 50px rgba(28,26,25,.22)' } } },
            MuiDialogTitle: { styleOverrides: { root: { fontWeight: 650, fontSize: 16, padding: '14px 20px' } } },
            MuiDialogContent: { styleOverrides: { root: { padding: '16px 20px' }, dividers: { borderColor: T.line, padding: '18px 20px' } } },
            MuiDialogActions: { styleOverrides: { root: { padding: '12px 20px', backgroundColor: T.subtle, borderTop: `1px solid ${T.line}` } } },
            MuiDrawer: { styleOverrides: { paper: { borderColor: T.line } } },
            MuiTableCell: {
                styleOverrides: {
                    root: { borderColor: T.line, padding: '8px 12px', fontSize: 13 },
                    sizeSmall: { padding: '6px 12px' },
                    head: { fontWeight: 600, fontSize: 12, color: T.ink2, backgroundColor: T.subtle, whiteSpace: 'nowrap', paddingTop: 8, paddingBottom: 8 }
                }
            },
            MuiTableRow: { styleOverrides: { root: { '&:last-child td': { borderBottom: 0 } }, hover: { '&:hover': { backgroundColor: '#FAF6F4 !important' } } } },
            MuiTableSortLabel: { styleOverrides: { root: { '&.Mui-active': { color: T.ink } }, icon: { fontSize: 15 } } },
            MuiTablePagination: { styleOverrides: { root: { borderTop: `1px solid ${T.line}` }, toolbar: { minHeight: '44px !important' }, selectLabel: { fontSize: 12.5 }, displayedRows: { fontSize: 12.5 } } },
            MuiChip: { styleOverrides: { root: { fontWeight: 500, borderRadius: 4 }, sizeSmall: { height: 22, fontSize: 12 }, outlined: { borderColor: T.line2 } } },
            MuiTabs: { styleOverrides: { root: { minHeight: 40 }, indicator: { height: 2, backgroundColor: T.brand } } },
            MuiTab: { styleOverrides: { root: { minHeight: 40, textTransform: 'none', fontWeight: 600, fontSize: 13, paddingInline: 12, minWidth: 0, color: T.ink2, '&.Mui-selected': { color: T.ink } } } },
            MuiToggleButton: {
                styleOverrides: {
                    root: { textTransform: 'none', fontWeight: 600, fontSize: 12.5, borderColor: T.line2, color: T.ink2, paddingBlock: 4, paddingInline: 10, '&.Mui-selected': { backgroundColor: T.brandTint, color: T.brand, '&:hover': { backgroundColor: '#F1E1E4' } } }
                }
            },
            MuiTooltip: { styleOverrides: { tooltip: { borderRadius: 4, fontSize: 12, fontWeight: 500, backgroundColor: T.ink, padding: '5px 8px' }, arrow: { color: T.ink } } },
            MuiAlert: {
                styleOverrides: {
                    root: { borderRadius: 6, fontSize: 13, alignItems: 'center', border: '1px solid' },
                    standardInfo: { borderColor: '#C9D7EE', backgroundColor: '#F2F6FC' },
                    standardSuccess: { borderColor: '#C3E0CF', backgroundColor: '#F1F8F4' },
                    standardWarning: { borderColor: '#EBD5A8', backgroundColor: '#FCF7EC' },
                    standardError: { borderColor: '#EFC5C1', backgroundColor: '#FDF3F2' }
                }
            },
            MuiMenu: { styleOverrides: { paper: { borderRadius: 8, border: `1px solid ${T.line}`, boxShadow: '0 10px 30px rgba(28,26,25,.12)' } } },
            MuiMenuItem: { styleOverrides: { root: { fontSize: 13, minHeight: 34 } } },
            MuiListItemIcon: { styleOverrides: { root: { minWidth: 32 } } },
            MuiSkeleton: { styleOverrides: { root: { backgroundColor: 'rgba(28,26,25,0.06)' } } },
            MuiLinearProgress: { styleOverrides: { root: { borderRadius: 2, backgroundColor: T.line } } }
        }
    });
