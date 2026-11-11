import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, IconButton, Stack, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import useHotel from 'hooks/useHotel';
import { useToast } from 'context/Toast';
import { inr, upiLink } from 'utils/format';
import UpiQr from './UpiQr';
import { T } from './Theme';

const KINDS = [
    ['confirmation', 'Booking confirmation'],
    ['reminder', 'Arrival reminder'],
    ['payment', 'Payment request'],
    ['bill', 'Bill'],
    ['thanks', 'Thank you']
];

// pick a message for the guest, edit it, then send it on WhatsApp or by email, or copy it
const ShareDialog = ({ open, booking, defaultKind = 'confirmation', onClose }) => {
    const { api } = useHotel();
    const toast = useToast();
    const [info, setInfo] = useState(null);
    const [kind, setKind] = useState(defaultKind);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    const load = async (regenerate = false) => {
        setLoading(true);
        setError('');
        try {
            const data = await api.bookings.share(booking.id, regenerate);
            setInfo(data);
            if (regenerate) toast.success('New link created. The old one no longer works.');
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && booking) {
            setKind(defaultKind);
            setInfo(null);
            load();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, booking?.id]);

    const link = info ? `${window.location.origin}/b/${info.token}` : '';
    const filled = useMemo(() => (info ? info.messages[kind].replace(/\{\{BILL_LINK\}\}/g, link) : ''), [info, kind, link]);
    useEffect(() => setText(filled), [filled]);

    const copy = async (value, what) => {
        try {
            await navigator.clipboard.writeText(value);
            toast.success(`${what} copied`);
        } catch (e) {
            toast.error('Could not copy. Select the text and copy it by hand.');
        }
    };

    const whatsapp = () => window.open(`https://wa.me/${info.phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');

    const email = async () => {
        setSending(true);
        try {
            toast.info(await api.bookings.email(booking.id, kind, text.replace(link, '{{BILL_LINK}}')));
        } catch (e) {
            toast.error(e.message);
        } finally {
            setSending(false);
        }
    };

    const showUpi = info && info.upiId && info.balance > 0;
    const pay = showUpi ? upiLink({ upiId: info.upiId, name: info.hotelName, amount: info.balance, note: `Booking ${booking.bookingNumber}` }) : '';

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <Box sx={{ px: 2.5, py: 1.75, pr: 7, borderBottom: `1px solid ${T.line}`, position: 'relative' }}>
                <Typography component="h2" sx={{ fontSize: 16, fontWeight: 650 }}>Send to guest</Typography>
                <Typography sx={{ fontSize: 12.5, color: T.ink2, mt: 0.25 }}>{booking?.customerName} · {booking?.bookingNumber}</Typography>
                <IconButton aria-label="Close" onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12, color: T.ink3 }}><CloseIcon fontSize="small" /></IconButton>
            </Box>
            <DialogContent sx={{ px: 2.5, py: 2.5 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {loading && !info ? (
                    <Box sx={{ textAlign: 'center', py: 5 }}><CircularProgress size={28} /></Box>
                ) : info && (
                    <>
                        <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.ink3, mb: 1 }}>Message</Typography>
                        <ToggleButtonGroup size="small" exclusive value={kind} onChange={(_, v) => v && setKind(v)} aria-label="Message type" sx={{ mb: 1.5, flexWrap: 'wrap', '& .MuiToggleButton-root': { borderRadius: '6px !important', border: `1px solid ${T.line2} !important`, mr: 0.75, mb: 0.75 } }}>
                            {KINDS.map(([id, label]) => <ToggleButton key={id} value={id}>{label}</ToggleButton>)}
                        </ToggleButtonGroup>
                        <TextField inputProps={{ 'aria-label': 'Message', style: { fontSize: 13, lineHeight: 1.55 } }} value={text} onChange={(e) => setText(e.target.value)} multiline minRows={8} maxRows={14} helperText="You can edit the message before sending." />

                        <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1} sx={{ mt: 2 }}>
                            <Tooltip title={info.phone ? '' : 'This guest has no phone number saved'}>
                                <span><Button variant="contained" color="success" startIcon={<WhatsAppIcon />} onClick={whatsapp} disabled={!info.phone}>WhatsApp</Button></span>
                            </Tooltip>
                            <Tooltip title={info.email ? '' : 'This guest has no email address saved'}>
                                <span><Button variant="outlined" startIcon={sending ? <CircularProgress size={16} /> : <EmailOutlinedIcon />} onClick={email} disabled={!info.email || sending}>Email</Button></span>
                            </Tooltip>
                            <Button variant="outlined" color="inherit" startIcon={<ContentCopyIcon />} onClick={() => copy(text, 'Message')}>Copy text</Button>
                            <Button variant="outlined" color="inherit" startIcon={<LinkIcon />} onClick={() => copy(link, 'Bill link')}>Copy bill link</Button>
                        </Stack>
                        {!info.phone && <Typography sx={{ display: 'block', mt: 1, fontSize: 12, color: T.ink3 }}>WhatsApp opens with the message ready. You press send, so nothing goes out by itself.</Typography>}

                        {showUpi && (
                            <Box sx={{ mt: 2.5, p: 2, borderRadius: '6px', border: `1px solid ${T.line}`, bgcolor: T.subtle, display: 'flex', gap: 2.5, alignItems: 'center', flexWrap: 'wrap' }}>
                                <UpiQr link={pay} size={140} />
                                <Box sx={{ flex: 1, minWidth: 200 }}>
                                    <Typography sx={{ fontSize: 14, fontWeight: 650 }}>Collect {inr(info.balance)} by UPI</Typography>
                                    <Typography sx={{ fontSize: 12.5, color: T.ink2, mt: 0.5 }}>The guest scans this with any UPI app, or pays from their bill link. Record the payment here once it arrives.</Typography>
                                </Box>
                            </Box>
                        )}
                        {info && info.balance > 0 && !info.upiId && <Alert severity="info" sx={{ mt: 2 }}>Add your UPI id in Hotel settings to show a payment QR code here and on the guest's bill page.</Alert>}
                    </>
                )}
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'space-between' }}>
                <Tooltip title="Makes the current link stop working and creates a new one"><span><Button color="inherit" size="small" onClick={() => load(true)} disabled={loading || !info}>Replace link</Button></span></Tooltip>
                <Button variant="outlined" color="inherit" onClick={onClose}>Done</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ShareDialog;
