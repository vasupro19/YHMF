import { useEffect, useMemo, useState } from 'react';
import { Alert, Autocomplete, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton, MenuItem, TextField, ToggleButton, ToggleButtonGroup, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import useHotel from 'hooks/useHotel';
import { useToast } from 'context/Toast';
import { BOOKING_SOURCES, GST_REGEX, PAY_METHODS } from 'utils/constants';
import { addDays, daysBetween, inr, todayISO } from 'utils/format';

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
        <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="md" fullScreen={fullScreen}>
            <DialogTitle sx={{ pr: 7 }}>
                {editing ? `Edit ${booking.bookingNumber}` : 'New booking'}
                <IconButton aria-label="Close" onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
                <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}><TextField label="Check-in" type="date" value={checkIn} onChange={(e) => { setCheckIn(e.target.value); if (e.target.value >= checkOut) setCheckOut(addDays(e.target.value, 1)); }} InputLabelProps={{ shrink: true }} disabled={booking?.status === 'CHECKED_IN'} /></Grid>
                    <Grid item xs={6} sm={3}><TextField label="Check-out" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ min: checkIn ? addDays(checkIn, 1) : undefined }} /></Grid>
                    <Grid item xs={6} sm={3}><TextField label="Adults" type="number" value={adults} onChange={(e) => setAdults(e.target.value)} inputProps={{ min: 1 }} /></Grid>
                    <Grid item xs={6} sm={3}><TextField label="Children" type="number" value={children} onChange={(e) => setChildren(e.target.value)} inputProps={{ min: 0 }} /></Grid>

                    <Grid item xs={12} sm={4}>
                        <TextField select label="Room type" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
                            <MenuItem value=""><em>Any type</em></MenuItem>
                            {types.filter((t) => t.active).map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                        <TextField select label="Room" value={roomId} onChange={(e) => setRoomId(e.target.value)} disabled={!validDates || checking} helperText={!validDates ? 'Pick valid dates first' : checking ? 'Checking availability…' : quote && quote.rooms.length === 0 ? 'No rooms are free for these dates' : `${quote?.rooms.length ?? 0} room(s) free for ${nights} night(s)`} error={Boolean(quote) && quote.rooms.length === 0}
                            InputProps={{ endAdornment: checking ? <CircularProgress size={16} sx={{ mr: 3 }} /> : null }}>
                            {(quote?.rooms || []).map((r) => (
                                <MenuItem key={r.id} value={r.id}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                                        <span>Room {r.roomNumber} · {r.roomTypeName}</span>
                                        <Typography component="span" variant="body2" color="text.secondary">{inr(r.roomTotal)}</Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {!editing && (
                        <>
                            <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">GUEST</Typography></Divider></Grid>
                            <Grid item xs={12}>
                                <ToggleButtonGroup size="small" exclusive value={guestMode} onChange={(_, v) => v && setGuestMode(v)}>
                                    <ToggleButton value="existing">Existing guest</ToggleButton>
                                    <ToggleButton value="new">New guest</ToggleButton>
                                </ToggleButtonGroup>
                            </Grid>
                            {guestMode === 'existing' ? (
                                <Grid item xs={12}>
                                    <Autocomplete options={customers} value={customer} onChange={(_, v) => setCustomer(v)} getOptionLabel={(c) => `${c.name}${c.companyName ? ` · ${c.companyName}` : ''}${c.phone ? ` · ${c.phone}` : ''}`} isOptionEqualToValue={(a, b) => a.id === b.id} renderInput={(p) => <TextField {...p} label="Search guest by name, company or phone" />} noOptionsText="No match. Use New guest." />
                                </Grid>
                            ) : (
                                <>
                                    <Grid item xs={12} sm={4}><TextField select label="Type" value={guest.type} onChange={setG('type')}><MenuItem value="INDIVIDUAL">Individual</MenuItem><MenuItem value="COMPANY">Company</MenuItem></TextField></Grid>
                                    <Grid item xs={12} sm={8}><TextField label={guest.type === 'COMPANY' ? 'Contact person' : 'Guest name'} value={guest.name} onChange={setG('name')} /></Grid>
                                    {guest.type === 'COMPANY' && <><Grid item xs={12} sm={6}><TextField label="Company name" value={guest.companyName} onChange={setG('companyName')} /></Grid><Grid item xs={12} sm={6}><TextField label="GSTIN" value={guest.gstin} onChange={setG('gstin')} /></Grid></>}
                                    <Grid item xs={12} sm={6}><TextField label="Phone" value={guest.phone} onChange={setG('phone')} /></Grid>
                                    <Grid item xs={12} sm={6}><TextField label="Email" type="email" value={guest.email} onChange={setG('email')} /></Grid>
                                </>
                            )}
                        </>
                    )}

                    <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">DETAILS</Typography></Divider></Grid>
                    <Grid item xs={12} sm={4}><TextField select label="Source" value={source} onChange={(e) => setSource(e.target.value)}>{BOOKING_SOURCES.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}</TextField></Grid>
                    <Grid item xs={12} sm={4}><TextField label="Discount on room (₹)" type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} inputProps={{ min: 0 }} /></Grid>
                    {!editing && <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}><ToggleButton size="small" value="hold" selected={hold} onChange={() => setHold((h) => !h)} fullWidth>{hold ? 'Placed on hold' : 'Confirmed booking'}</ToggleButton></Grid>}
                    {!editing && <>
                        <Grid item xs={6}><TextField label="Advance received (₹)" type="number" value={advance} onChange={(e) => setAdvance(e.target.value)} inputProps={{ min: 0 }} /></Grid>
                        <Grid item xs={6}><TextField select label="Paid by" value={advanceMethod} onChange={(e) => setAdvanceMethod(e.target.value)} disabled={!Number(advance)}>{PAY_METHODS.map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}</TextField></Grid>
                    </>}
                    <Grid item xs={12}><TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} /></Grid>
                </Grid>

                {money && (
                    <Box sx={{ mt: 2.5, p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><span>{nights} night(s) · Room {room.roomNumber}</span><span>{inr(money.subtotal)}</span></Box>
                        {money.discount > 0 && <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><span>Discount</span><span>− {inr(money.discount)}</span></Box>}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><span>GST</span><span>{inr(money.tax)}</span></Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}><span>Room total</span><span>{inr(money.total)}</span></Box>
                        <Typography variant="caption" color="text.secondary">Food and other charges are added during the stay.</Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button color="inherit" onClick={onClose} disabled={busy}>Cancel</Button>
                <Button variant="contained" onClick={submit} disabled={busy || checking} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}>{editing ? 'Save changes' : hold ? 'Place on hold' : 'Confirm booking'}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default BookingDialog;
