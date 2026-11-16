import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, DialogActions, Drawer, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import useHotel from 'hooks/useHotel';
import GuestFields, { guestValues } from './GuestFields';
import IdPhotos from './IdPhotos';
import { T } from './Theme';

// Front desk: complete the register details for a booking. In check-in mode it saves and then checks the guest in.
const GuestDetailsDrawer = ({ open, booking, onClose, onSaved, checkIn = false, onCheckIn }) => {
    const { api } = useHotel();
    const [values, setValues] = useState(guestValues());
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [photoTick, setPhotoTick] = useState(0);

    useEffect(() => {
        if (open && booking) {
            setValues(guestValues(booking));
            setError('');
        }
    }, [open, booking]);

    const set = useCallback((k, v) => setValues((prev) => ({ ...prev, [k]: v })), []);
    const cid = booking?.customerId;
    const photo = useMemo(
        () => (side) => ({
            has: Boolean(side === 'front' ? booking?.hasIdFront : booking?.hasIdBack),
            load: () => api.idPhoto.blob(cid, side),
            upload: (file) => api.idPhoto.upload(cid, side, file),
            remove: () => api.idPhoto.remove(cid, side),
            onChanged: () => setPhotoTick((t) => t + 1)
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [api, cid, booking?.hasIdFront, booking?.hasIdBack]
    );

    const save = async (thenCheckIn) => {
        if (!values.name.trim()) return setError('Enter the guest name.');
        setBusy(true);
        setError('');
        try {
            const updated = await api.guestDetails(booking.id, values);
            onSaved?.(updated);
            if (thenCheckIn) await onCheckIn?.();
            onClose();
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    const close = () => {
        // photos are saved the moment they are taken, so refresh the booking even without pressing Save
        if (photoTick) api.bookings.get(booking.id).then((u) => onSaved?.(u)).catch(() => {});
        setPhotoTick(0);
        onClose();
    };

    return (
        <Drawer anchor="right" open={open} onClose={close} PaperProps={{ sx: { width: { xs: '100%', sm: 620 }, display: 'flex' } }}>
            {open && booking && (
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ px: 2.5, py: 1.75, pr: 7, borderBottom: `1px solid ${T.line}`, position: 'relative' }}>
                        <Typography component="h2" sx={{ fontSize: 16, fontWeight: 650 }}>{checkIn ? 'Check in: guest details' : 'Guest details for the register'}</Typography>
                        <Typography sx={{ fontSize: 12.5, color: T.ink2, mt: 0.25 }}>{booking.bookingNumber} · Room {booking.roomNumber}</Typography>
                        <IconButton aria-label="Close" onClick={close} sx={{ position: 'absolute', right: 12, top: 12, color: T.ink3 }}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2.5 }}>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        {booking.precheckinAt && <Alert severity="info" sx={{ mb: 2 }}>The guest filled these in online on {new Date(booking.precheckinAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}. Check them against the ID.</Alert>}
                        <GuestFields values={values} set={set} photos={<IdPhotos front={photo('front')} back={photo('back')} />} />
                    </Box>
                    <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: `1px solid ${T.line}`, flexWrap: 'wrap', gap: 1 }}>
                        {checkIn && (
                            <Button color="inherit" sx={{ mr: 'auto', color: T.ink2 }} disabled={busy} onClick={async () => { setBusy(true); try { await onCheckIn?.(); onClose(); } finally { setBusy(false); } }}>
                                Check in without details
                            </Button>
                        )}
                        <Button onClick={close} color="inherit" disabled={busy}>Cancel</Button>
                        <Button variant="contained" disabled={busy} onClick={() => save(checkIn)} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}>
                            {checkIn ? 'Save and check in' : 'Save details'}
                        </Button>
                    </DialogActions>
                </Box>
            )}
        </Drawer>
    );
};

export default GuestDetailsDrawer;
