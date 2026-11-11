import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useState } from 'react';
import { T } from './Theme';

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
            <DialogTitle sx={{ pb: 0.5 }}>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText component="div" sx={{ fontSize: 13.5, color: T.ink2, lineHeight: 1.55 }}>{children}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button color="inherit" onClick={onClose} disabled={busy}>
                    Cancel
                </Button>
                <Button variant="contained" color={color} onClick={run} disabled={busy} startIcon={busy ? <CircularProgress size={14} color="inherit" /> : null}>
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
