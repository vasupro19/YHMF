import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useState } from 'react';

const ConfirmDialog = ({ open, title, children, confirmLabel = 'Confirm', color = 'primary', onConfirm, onClose }) => {
    const [busy, setBusy] = useState(false);
    const run = async () => {
        setBusy(true);
        try {
            await onConfirm();
        } finally {
            setBusy(false);
        }
    };
    return (
        <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText component="div">{children}</DialogContentText>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button color="inherit" onClick={onClose} disabled={busy}>
                    Cancel
                </Button>
                <Button variant="contained" color={color} onClick={run} disabled={busy} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}>
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
