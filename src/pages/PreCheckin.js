import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useParams } from 'react-router-dom';
import { publicCheckin } from 'api';
import Loader from 'components/Loader';
import GuestFields, { guestValues } from 'components/GuestFields';
import { PhotoSlot } from 'components/IdPhotos';
import { fileUrl, formatDate } from 'utils/format';

const BRAND = '#7A1F2B';
const LINE = '#D9D5CF';
const MUTED = '#6B6660';

// The guest's own page from the WhatsApp link: fill in the register details and add an ID photo before arriving.
const PreCheckin = () => {
    const { token } = useParams();
    const [data, setData] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [values, setValues] = useState(guestValues());
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    useEffect(() => {
        publicCheckin
            .get(token)
            .then((d) => {
                setData(d);
                setValues(guestValues({ ...d.guest, ...d.booking, name: d.guest.name, email: d.guest.email || '' }));
            })
            .catch((e) => setLoadError(e.message));
    }, [token]);

    const set = useCallback((k, v) => setValues((prev) => ({ ...prev, [k]: v })), []);

    const submit = async () => {
        if (!values.name.trim()) return setError('Please enter your full name.');
        setBusy(true);
        setError('');
        try {
            await publicCheckin.save(token, values);
            setDone(true);
            window.scrollTo(0, 0);
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    if (loadError)
        return (
            <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3, textAlign: 'center' }}>
                <Box>
                    <Typography sx={{ fontSize: 18, fontWeight: 650 }}>We couldn't open this page</Typography>
                    <Typography sx={{ mt: 1, fontSize: 13.5, color: MUTED, maxWidth: 420 }}>{loadError} Please ask the hotel for a new link.</Typography>
                </Box>
            </Box>
        );
    if (!data) return <Loader />;
    const { hotel: h, booking: b } = data;

    return (
        <Box sx={{ bgcolor: '#EDEBE7', minHeight: '100vh', py: { xs: 0, sm: 4 }, px: { xs: 0, sm: 2 } }}>
            <Box sx={{ maxWidth: 660, mx: 'auto', bgcolor: '#fff', borderTop: `4px solid ${BRAND}`, boxShadow: { sm: '0 1px 3px rgba(0,0,0,.08), 0 8px 24px rgba(0,0,0,.06)' } }}>
                <Box sx={{ px: { xs: 2.5, sm: 4 }, pt: 3, pb: 2.5, display: 'flex', gap: 2, alignItems: 'flex-start', borderBottom: `1px solid ${LINE}` }}>
                    {h.logoPath && <img src={fileUrl(h.logoPath)} alt="" style={{ maxHeight: 52, maxWidth: 100, objectFit: 'contain' }} />}
                    <Box>
                        <Typography sx={{ fontSize: 19, fontWeight: 700 }}>{h.name || 'Your hotel'}</Typography>
                        {h.address && <Typography sx={{ fontSize: 12, color: MUTED, whiteSpace: 'pre-line' }}>{h.address}</Typography>}
                        {h.phone && <Typography sx={{ fontSize: 12, color: MUTED }}>{h.phone}</Typography>}
                    </Box>
                </Box>

                <Box sx={{ px: { xs: 2.5, sm: 4 }, py: 3 }}>
                    <Typography sx={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}>Online check-in</Typography>
                    <Typography sx={{ fontSize: 17, fontWeight: 700, color: BRAND }}>{b.bookingNumber}</Typography>
                    <Typography sx={{ fontSize: 13.5, mt: 0.5 }}>
                        {b.roomTypeName} · {formatDate(b.checkIn)} to {formatDate(b.checkOut)} · check-in from {h.checkInTime}
                    </Typography>

                    {done ? (
                        <Box sx={{ mt: 3, p: 2.5, borderRadius: '8px', bgcolor: '#F1F8F4', border: '1px solid #C3E0CF', textAlign: 'center' }}>
                            <CheckCircleIcon sx={{ color: '#2E7D4F', fontSize: 36 }} />
                            <Typography sx={{ fontSize: 16, fontWeight: 650, mt: 1 }}>Thank you, your details are saved</Typography>
                            <Typography sx={{ fontSize: 13, color: MUTED, mt: 0.5 }}>Please carry the same ID when you arrive. The front desk will only check it.</Typography>
                            <Button sx={{ mt: 2 }} onClick={() => setDone(false)}>Change something</Button>
                        </Box>
                    ) : !data.open ? (
                        <Alert severity="info" sx={{ mt: 3 }}>This booking is closed, so details can no longer be added here.</Alert>
                    ) : (
                        <>
                            <Typography sx={{ fontSize: 13.5, color: MUTED, mt: 2, mb: 2.5 }}>
                                Hotels in India must record every guest's details and photo ID. Fill them in now and your check-in at the desk takes a minute.
                            </Typography>
                            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                            <GuestFields
                                values={values}
                                set={set}
                                showEmail
                                guestFacing
                                photos={
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                                        <PhotoSlot label="Front of ID" has={Boolean(data.guest.hasIdFront)} upload={(file) => publicCheckin.uploadId(token, 'front', file)} />
                                        <PhotoSlot label="Back of ID" has={Boolean(data.guest.hasIdBack)} upload={(file) => publicCheckin.uploadId(token, 'back', file)} />
                                    </Box>
                                }
                            />
                            <Button fullWidth size="large" variant="contained" sx={{ mt: 3, bgcolor: BRAND }} disabled={busy} onClick={submit} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}>
                                Save my details
                            </Button>
                            <Typography sx={{ fontSize: 11.5, color: MUTED, mt: 1.5 }}>
                                Your details go only to {h.name || 'the hotel'} for its guest register. For Aadhaar, only the last four digits of the number are stored.
                            </Typography>
                        </>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default PreCheckin;
