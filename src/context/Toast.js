import { Alert, Snackbar } from '@mui/material';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    const show = useCallback((message, severity = 'success') => setToast({ open: true, message, severity }), []);
    const api = useMemo(() => ({ success: (m) => show(m, 'success'), error: (m) => show(m, 'error'), info: (m) => show(m, 'info') }), [show]);

    return (
        <ToastContext.Provider value={api}>
            {children}
            <Snackbar
                open={toast.open}
                autoHideDuration={3500}
                onClose={(_, reason) => reason !== 'clickaway' && setToast((t) => ({ ...t, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={toast.severity} variant="filled" onClose={() => setToast((t) => ({ ...t, open: false }))} sx={{ width: '100%' }}>
                    {toast.message}
                </Alert>
            </Snackbar>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside ToastProvider');
    return ctx;
};
