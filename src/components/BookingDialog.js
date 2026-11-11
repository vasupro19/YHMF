import { useEffect, useMemo, useState } from 'react';
import { Alert, Autocomplete, Box, Button, CircularProgress, Dialog, DialogActions, Grid, IconButton, MenuItem, TextField, ToggleButton, ToggleButtonGroup, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import useHotel from 'hooks/useHotel';
import { useToast } from 'context/Toast';
import { BOOKING_SOURCES, GST_REGEX, PAY_METHODS } from 'utils/constants';
import { addDays, daysBetween, formatDate, inr, todayISO } from 'utils/format';
import { T } from './Theme';

const Section = ({ title, children, first }) => (
    <Box sx={{ pt: first ? 0 : 2.25, mt: first ? 0 : 2.25, borderTop: first ? 0 : `1px solid ${T.line}` }}>
        <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.ink3, mb: 1.5 }}>{title}</Typography>
        {children}
    </Box>
);

const Line = ({ label, value, strong }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, py: 0.5 }}>
        <Typography sx={{ fontSize: 13, color: strong ? T.ink : T.ink2, fontWeight: strong ? 650 : 400 }}>{label}</Typography>
        <Typography className="num" sx={{ fontSize: strong ? 15 : 13, fontWeight: strong ? 700 : 500 }}>{value}</Typography>
    </Box>
);

const blankGuest = { type: 'INDIVIDUAL', name: '', phone: '', email: '', companyName: '', gstin: '' };

/**
 * Create a booking (or edit one when `booking` is given).
 * Availability and the price for the chosen dates are fetched live, so a room that is
 * already taken can't be picked.
 */
const BookingDialog = ({ open, onClose, onSaved, initial = {}, booking = null }) => {
    const { api } = useHotel();
    const toast = useToast();
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const editing = Boolean(booking);

    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [typeId, setTypeId] = useState('');
    const [roomId, setRoomId] = useState('');
    const [guestMode, setGuestMode] = useState('existing');
    const [customer, setCustomer] = useState(null);
    const [guest, setGuest] = useState(blankGuest);
    const [source, setSource] = useState('DIRECT');
    const [hold, setHold] = useState(false);
    const [discount, setDiscount] = useState('');
    const [advance, setAdvance] = useState('');
    const [advanceMethod, setAdvanceMethod] = useState('CASH');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const [types, setTypes] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [quote, setQuote] = useState(null); // availability result
    const [checking, setChecking] = useState(false);

    // reset every time the dialog opens
    useEffect(() => {
        if (!open) return;
        const start = booking?.checkIn || initial.checkIn || todayISO();
        setCheckIn(start);
        setCheckOut(booking?.checkOut || initial.checkOut || addDays(start, 1));
        setAdults(booking?.adults ?? 2);
        setChildren(booking?.children ?? 0);
        setTypeId('');
        setRoomId(booking?.roomId || initial.roomId || '');
        setGuestMode('existing');
        setCustomer(null);
        setGuest(blankGuest);
        setSource(booking?.source || 'DIRECT');
        setHold(false);
        setDiscount(booking?.discount ? String(booking.discount) : '');
        setAdvance('');
        setAdvanceMethod('CASH');
        setNotes(booking?.notes || '');
        setError('');
        setQuote(null);
        api.roomTypes.list().then(setTypes).catch((e) => toast.error(e.message));
        if (!booking) api.customers.list('').then(setCustomers).catch((e) => toast.error(e.message));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const validDates = checkIn && checkOut && checkOut > checkIn;
    const nights = validDates ? daysBetween(checkIn, checkOut) : 0;

    // availability for the chosen dates
    useEffect(() => {
        if (!open || !validDates) return setQuote(null);
        let cancelled = false;
        setChecking(true);
        api.availability({ checkIn, checkOut, roomTypeId: typeId || undefined, excludeBookingId: booking?.id })
            .then((q) => {
                if (cancelled) return;
                setQuote(q);
                setRoomId((cur) => (cur && q.rooms.some((r) => r.id === cur) ? cur : ''));
            })
            .catch((e) => !cancelled && setError(e.message))
            .finally(() => !cancelled && setChecking(false));
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, checkIn, checkOut, typeId]);

    const room = quote?.rooms.find((r) => r.id === roomId);
    const money = useMemo(() => {
        if (!room) return null;
        const d = Math.min(Number(discount) || 0, room.roomTotal);
        const factor = room.roomTotal ? (room.roomTotal - d) / room.roomTotal : 1;
        const tax = room.nights.reduce((s, n) => s + (n.price * factor * n.gstPercent) / 100, 0);
        return { subtotal: room.roomTotal, discount: d, tax: Math.round(tax * 100) / 100, total: Math.round((room.roomTotal - d + tax) * 100) / 100 };
    }, [room, discount]);

    const setG = (k) => (e) => setGuest((g) => ({ ...g, [k]: e.target.value }));

    const submit = async () => {
        setError('');
        if (!validDates) return setError('Check-out must be after check-in.');
        if (!roomId) return setError('Choose an available room.');
        if (!(Number(adults) >= 1)) return setError('At least one adult is required.');
        if (!editing) {
            if (guestMode === 'existing' && !customer) return setError('Choose a guest, or add a new one.');
            if (guestMode === 'new') {
                if (!guest.name.trim()) return setError('Enter the guest name.');
                if (guest.gstin && !GST_REGEX.test(guest.gstin.toUpperCase())) return setError('The GSTIN is not valid.');
            }
        }
        if (Number(discount) < 0 || Number(advance) < 0) return setError('Amounts cannot be negative.');
        if (money && Number(discount) > money.subtotal) return setError('The discount is more than the room total.');

        setBusy(true);
        try {
            const body = { roomId, checkIn, checkOut, adults: Number(adults), children: Number(children || 0), source, discount: Number(discount) || 0, notes };
            let saved;
            if (editing) {
                saved = await api.bookings.update(booking.id, body);
            } else {
                saved = await api.bookings.create({
                    ...body,
                    status: hold ? 'PENDING' : 'CONFIRMED',
                    advance: Number(advance) || 0,
                    advanceMethod,
                    ...(guestMode === 'existing' ? { customerId: customer.id } : { customer: { ...guest, name: guest.name.trim(), gstin: guest.gstin.toUpperCase() } })
                });
            }
            toast.success(editing ? 'Booking updated' : `Booking ${saved.bookingNumber} created`);
            onSaved(saved);
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="md" fullScreen={fullScreen} PaperProps={{ sx: { maxWidth: 980 } }}>
            <Box sx={{ px: 2.5, py: 1.75, pr: 7, borderBottom: `1px solid ${T.line}`, position: 'relative' }}>
                <Typography component="h2" sx={{ fontSize: 16, fontWeight: 650 }}>{editing ? `Edit booking ${booking.bookingNumber}` : 'New booking'}</Typography>
                <Typography sx={{ fontSize: 12.5, color: T.ink2, mt: 0.25 }}>{editing ? 'Change dates, room or details. The folio is repriced for new nights.' : 'Pick dates and a free room, then the guest. Rates and GST are worked out live.'}</Typography>
                <IconButton aria-label="Close" onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12, color: T.ink3 }}><CloseIcon fontSize="small" /></IconButton>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 300px' }, flex: 1, minHeight: 0, overflow: 'auto' }}>
                <Box sx={{ px: 2.5, py: 2.5, minWidth: 0 }}>
                    {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

                    <Section title="Stay" first>
                        <Grid container spacing={1.5}>
                            <Grid item xs={6} sm={3}><TextField label="Check-in" type="date" value={checkIn} onChange={(e) => { setCheckIn(e.target.value); if (e.target.value >= checkOut) setCheckOut(addDays(e.target.value, 1)); }} InputLabelProps={{ shrink: true }} disabled={booking?.status === 'CHECKED_IN'} /></Grid>
                            <Grid item xs={6} sm={3}><TextField label="Check-out" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ min: checkIn ? addDays(checkIn, 1) : undefined }} /></Grid>
                            <Grid item xs={6} sm={3}><TextField label="Adults" type="number" value={adults} onChange={(e) => setAdults(e.target.value)} inputProps={{ min: 1 }} /></Grid>
                            <Grid item xs={6} sm={3}><TextField label="Children" type="number" value={children} onChange={(e) => setChildren(e.target.value)} inputProps={{ min: 0 }} /></Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField select label="Room type" value={typeId} onChange={(e) => setTypeId(e.target.value)} SelectProps={{ displayEmpty: true }} InputLabelProps={{ shrink: true }}>
                                    <MenuItem value="">Any type</MenuItem>
                                    {types.filter((t) => t.active).map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={8}>
                                <TextField select label="Room" value={roomId} onChange={(e) => setRoomId(e.target.value)} disabled={!validDates || checking} helperText={!validDates ? 'Pick valid dates first' : checking ? 'Checking availability…' : quote && quote.rooms.length === 0 ? 'No rooms are free for these dates' : `${quote?.rooms.length ?? 0} room(s) free for ${nights} night(s)`} error={Boolean(quote) && quote.rooms.length === 0}
                                    InputProps={{ endAdornment: checking ? <CircularProgress size={16} sx={{ mr: 3 }} /> : null }}>
                                    {(quote?.rooms || []).map((r) => (
                                        <MenuItem key={r.id} value={r.id}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                                                <span><strong>{r.roomNumber}</strong> · {r.roomTypeName}</span>
                                                <Typography component="span" className="num" sx={{ fontSize: 12.5, color: T.ink2 }}>{inr(r.roomTotal)}</Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        </Grid>
                    </Section>

                    {!editing && (
                        <Section title="Guest">
                            <ToggleButtonGroup size="small" exclusive value={guestMode} onChange={(_, v) => v && setGuestMode(v)} sx={{ mb: 1.5 }}>
                                <ToggleButton value="existing">Existing guest</ToggleButton>
                                <ToggleButton value="new">New guest</ToggleButton>
                            </ToggleButtonGroup>
                            {guestMode === 'existing' ? (
                                <Autocomplete size="small" options={customers} value={customer} onChange={(_, v) => setCustomer(v)} getOptionLabel={(c) => `${c.name}${c.companyName ? ` · ${c.companyName}` : ''}${c.phone ? ` · ${c.phone}` : ''}`} isOptionEqualToValue={(a, b) => a.id === b.id} renderInput={(p) => <TextField {...p} label="Search guest by name, company or phone" />} noOptionsText="No match. Use New guest." />
                            ) : (
                                <Grid container spacing={1.5}>
                                    <Grid item xs={12} sm={4}><TextField select label="Type" value={guest.type} onChange={setG('type')}><MenuItem value="INDIVIDUAL">Individual</MenuItem><MenuItem value="COMPANY">Company</MenuItem></TextField></Grid>
                                    <Grid item xs={12} sm={8}><TextField label={guest.type === 'COMPANY' ? 'Contact person' : 'Guest name'} value={guest.name} onChange={setG('name')} /></Grid>
                                    {guest.type === 'COMPANY' && <><Grid item xs={12} sm={6}><TextField label="Company name" value={guest.companyName} onChange={setG('companyName')} /></Grid><Grid item xs={12} sm={6}><TextField label="GSTIN" value={guest.gstin} onChange={setG('gstin')} /></Grid></>}
                                    <Grid item xs={12} sm={6}><TextField label="Phone" value={guest.phone} onChange={setG('phone')} /></Grid>
                                    <Grid item xs={12} sm={6}><TextField label="Email" type="email" value={guest.email} onChange={setG('email')} /></Grid>
                                </Grid>
                            )}
                        </Section>
                    )}

                    <Section title="Details">
                        <Grid container spacing={1.5}>
                            <Grid item xs={12} sm={4}><TextField select label="Source" value={source} onChange={(e) => setSource(e.target.value)}>{BOOKING_SOURCES.map((x) => <MenuItem key={x.id} value={x.id}>{x.name}</MenuItem>)}</TextField></Grid>
                            <Grid item xs={12} sm={4}><TextField label="Discount on room (₹)" type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} inputProps={{ min: 0 }} /></Grid>
                            {!editing && (
                                <Grid item xs={12} sm={4}>
                                    <ToggleButtonGroup size="small" exclusive fullWidth value={hold ? 'hold' : 'confirmed'} onChange={(_, v) => v && setHold(v === 'hold')} sx={{ height: 37 }} aria-label="Booking status">
                                        <ToggleButton value="confirmed">Confirmed</ToggleButton>
                                        <ToggleButton value="hold">On hold</ToggleButton>
                                    </ToggleButtonGroup>
                                </Grid>
                            )}
                            {!editing && (
                                <>
                                    <Grid item xs={6}><TextField label="Advance received (₹)" type="number" value={advance} onChange={(e) => setAdvance(e.target.value)} inputProps={{ min: 0 }} /></Grid>
                                    <Grid item xs={6}><TextField select label="Paid by" value={advanceMethod} onChange={(e) => setAdvanceMethod(e.target.value)} disabled={!Number(advance)}>{PAY_METHODS.map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}</TextField></Grid>
                                </>
                            )}
                            <Grid item xs={12}><TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} /></Grid>
                        </Grid>
                    </Section>
                </Box>

                <Box sx={{ bgcolor: T.subtle, borderLeft: { md: `1px solid ${T.line}` }, borderTop: { xs: `1px solid ${T.line}`, md: 0 }, px: 2.5, py: 2.5 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.ink3, mb: 1.5 }}>Summary</Typography>
                    <Box sx={{ display: 'grid', gap: 1, mb: 2 }}>
                        <Box>
                            <Typography sx={{ fontSize: 11.5, color: T.ink3 }}>Stay</Typography>
                            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{validDates ? `${formatDate(checkIn)} → ${formatDate(checkOut)}` : 'Choose dates'}</Typography>
                            {validDates && <Typography sx={{ fontSize: 12, color: T.ink3 }}>{nights} night{nights > 1 ? 's' : ''} · {adults || 0} adult{Number(adults) === 1 ? '' : 's'}{Number(children) ? `, ${children} child${Number(children) > 1 ? 'ren' : ''}` : ''}</Typography>}
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: 11.5, color: T.ink3 }}>Room</Typography>
                            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{room ? `${room.roomNumber} · ${room.roomTypeName}` : 'Not chosen yet'}</Typography>
                        </Box>
                        {!editing && (
                            <Box>
                                <Typography sx={{ fontSize: 11.5, color: T.ink3 }}>Guest</Typography>
                                <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{guestMode === 'existing' ? customer?.name || 'Not chosen yet' : guest.name || 'New guest'}</Typography>
                            </Box>
                        )}
                    </Box>
                    {money ? (
                        <Box sx={{ bgcolor: T.panel, border: `1px solid ${T.line}`, borderRadius: '6px', px: 1.5, py: 1 }}>
                            <Line label={`Room × ${nights}`} value={inr(money.subtotal)} />
                            {money.discount > 0 && <Line label="Discount" value={`− ${inr(money.discount)}`} />}
                            <Line label="GST" value={inr(money.tax)} />
                            <Box sx={{ borderTop: `1px solid ${T.line}`, mt: 0.5, pt: 0.5 }}>
                                <Line label="Room total" value={inr(money.total)} strong />
                            </Box>
                            {!editing && Number(advance) > 0 && <Line label="Advance" value={`− ${inr(Number(advance))}`} />}
                        </Box>
                    ) : (
                        <Box sx={{ border: `1px dashed ${T.line2}`, borderRadius: '6px', p: 1.5 }}>
                            <Typography sx={{ fontSize: 12.5, color: T.ink3 }}>Choose a room to see the price.</Typography>
                        </Box>
                    )}
                    <Typography sx={{ fontSize: 11.5, color: T.ink3, mt: 1.25 }}>Food and other charges are posted to the folio during the stay.</Typography>
                </Box>
            </Box>
            <DialogActions>
                <Button color="inherit" onClick={onClose} disabled={busy}>Cancel</Button>
                <Button variant="contained" onClick={submit} disabled={busy || checking} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}>{editing ? 'Save changes' : hold ? 'Place on hold' : 'Confirm booking'}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default BookingDialog;
