import { useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Grid, IconButton, Step, StepLabel, Stepper, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useNavigate } from 'react-router-dom';
import Logo from 'components/Logo';
import useHotel from 'hooks/useHotel';
import { useAuth } from 'context/Auth';
import { useToast } from 'context/Toast';
import { APP_NAME, GST_REGEX } from 'utils/constants';
import { inr } from 'utils/format';

const STEPS = ['Your hotel', 'Rooms & prices', 'Tax', 'Team', 'Finish'];

// "101-110, 201" -> list of room numbers (same rules as the server)
export const parseRooms = (text) => {
    const out = [];
    for (const token of String(text || '').split(/[\s,;]+/).filter(Boolean)) {
        const m = token.match(/^(\d+)-(\d+)$/);
        if (m) {
            const [a, b] = [Number(m[1]), Number(m[2])];
            if (b < a || b - a > 200) return { error: `"${token}" is not a valid range` };
            for (let n = a; n <= b; n++) out.push(String(n).padStart(m[1].length, '0'));
        } else out.push(token);
    }
    return { rooms: out };
};

const blankType = (name = '') => ({ name, basePrice: '', maxAdults: 2, maxChildren: 1, rooms: '' });

const Setup = () => {
    const { api } = useHotel();
    const { user } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const [hotel, setHotel] = useState({ hotelName: user.name || '', address: '', phone: '', email: '', gstin: '', checkInTime: '12:00', checkOutTime: '11:00' });
    const [types, setTypes] = useState([blankType('Standard')]);
    const [tax, setTax] = useState({ gstThreshold: 7500, roomGstLow: 5, roomGstHigh: 18 });
    const [staff, setStaff] = useState([{ name: '', designation: '', monthlySalary: '' }]);

    const parsed = useMemo(() => types.map((t) => parseRooms(t.rooms)), [types]);
    const totalRooms = parsed.reduce((s, p) => s + (p.rooms?.length || 0), 0);

    const setH = (k) => (e) => setHotel((h) => ({ ...h, [k]: e.target.value }));
    const setT = (i, k) => (e) => setTypes((ts) => ts.map((t, j) => (j === i ? { ...t, [k]: e.target.value } : t)));
    const setS = (i, k) => (e) => setStaff((ss) => ss.map((s, j) => (j === i ? { ...s, [k]: e.target.value } : s)));

    const problem = () => {
        if (step === 0) {
            if (!hotel.hotelName.trim()) return 'Enter the hotel name.';
            if (hotel.gstin && !GST_REGEX.test(hotel.gstin.toUpperCase())) return 'The GSTIN is not valid. Leave it empty if you do not have one.';
        }
        if (step === 1) {
            const seen = new Set();
            for (let i = 0; i < types.length; i++) {
                const t = types[i];
                if (!t.name.trim()) return `Room type ${i + 1} needs a name.`;
                if (!(Number(t.basePrice) >= 0) || t.basePrice === '') return `Enter the usual price for ${t.name}.`;
                if (parsed[i].error) return `${t.name}: ${parsed[i].error}`;
                if (!parsed[i].rooms.length) return `List the room numbers for ${t.name}, for example 101-105.`;
                for (const r of parsed[i].rooms) {
                    if (seen.has(r.toLowerCase())) return `Room ${r} is listed twice.`;
                    seen.add(r.toLowerCase());
                }
            }
        }
        if (step === 2) {
            if (![tax.roomGstLow, tax.roomGstHigh].every((v) => Number(v) >= 0 && Number(v) <= 100)) return 'GST rates must be between 0 and 100.';
            if (!(Number(tax.gstThreshold) >= 0)) return 'Enter the price limit.';
        }
        if (step === 3) {
            for (const [i, s] of staff.entries()) if ((s.name || s.designation || s.monthlySalary) && (!s.name.trim() || !s.designation.trim())) return `Staff ${i + 1}: enter both a name and a designation, or clear the row.`;
        }
        return '';
    };

    const next = () => {
        const p = problem();
        setError(p);
        if (!p) setStep((s) => s + 1);
    };

    const finish = async () => {
        setBusy(true);
        setError('');
        try {
            await api.onboarding({
                settings: { ...hotel, gstin: hotel.gstin.toUpperCase(), ...tax },
                roomTypes: types.map((t) => ({ ...t, basePrice: Number(t.basePrice), maxAdults: Number(t.maxAdults), maxChildren: Number(t.maxChildren) })),
                staff: staff.filter((s) => s.name || s.designation || s.monthlySalary)
            });
            toast.success('Your hotel is ready');
            navigate('/dashboard', { replace: true });
        } catch (e) {
            setError(e.message);
            setBusy(false);
        }
    };

    const skip = async () => {
        try {
            await api.onboarding({ skip: true });
            navigate('/dashboard', { replace: true });
        } catch (e) {
            setError(e.message);
        }
    };

    const stafCount = staff.filter((s) => s.name.trim()).length;

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', backgroundImage: 'radial-gradient(900px 400px at 50% -10%, rgba(31,58,115,.16), transparent 70%)', py: { xs: 3, md: 6 }, px: 2 }}>
            <Box sx={{ maxWidth: 780, mx: 'auto' }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={1.25} alignItems="center"><Logo size={38} /><Typography sx={{ fontWeight: 800, fontSize: 20 }}>{APP_NAME}</Typography></Stack>
                    <Button color="inherit" onClick={skip}>Skip for now</Button>
                </Stack>
                <Typography variant="h4" component="h1">Let's set up your hotel</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.75, mb: 3 }}>About ten minutes. You can change everything later.</Typography>

                <Stepper activeStep={step} alternativeLabel sx={{ mb: 3, display: { xs: 'none', sm: 'flex' } }}>
                    {STEPS.map((s) => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
                </Stepper>
                <Typography variant="overline" color="text.secondary" sx={{ display: { sm: 'none' } }}>Step {step + 1} of {STEPS.length}: {STEPS[step]}</Typography>

                <Box sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: '20px', boxShadow: 2, p: { xs: 2.5, sm: 4 } }}>
                    {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

                    {step === 0 && (
                        <Grid container spacing={2}>
                            <Grid item xs={12}><TextField label="Hotel name" value={hotel.hotelName} onChange={setH('hotelName')} autoFocus /></Grid>
                            <Grid item xs={12}><TextField label="Address" value={hotel.address} onChange={setH('address')} multiline minRows={2} helperText="Printed on bills" /></Grid>
                            <Grid item xs={12} sm={6}><TextField label="Phone" value={hotel.phone} onChange={setH('phone')} /></Grid>
                            <Grid item xs={12} sm={6}><TextField label="Email" value={hotel.email} onChange={setH('email')} /></Grid>
                            <Grid item xs={12}><TextField label="GSTIN (optional)" value={hotel.gstin} onChange={setH('gstin')} helperText="Needed for GST invoices" /></Grid>
                            <Grid item xs={6}><TextField label="Check-in time" type="time" value={hotel.checkInTime} onChange={setH('checkInTime')} InputLabelProps={{ shrink: true }} /></Grid>
                            <Grid item xs={6}><TextField label="Check-out time" type="time" value={hotel.checkOutTime} onChange={setH('checkOutTime')} InputLabelProps={{ shrink: true }} /></Grid>
                        </Grid>
                    )}

                    {step === 1 && (
                        <>
                            <Typography color="text.secondary" sx={{ mb: 2 }}>A room type is a group of similar rooms with the same price. For the rooms, type numbers or ranges: <b>101-110, 201, 202</b>.</Typography>
                            <Stack spacing={2}>
                                {types.map((t, i) => (
                                    <Box key={i} sx={{ p: 2, borderRadius: 3, border: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
                                        <Grid container spacing={1.5}>
                                            <Grid item xs={12} sm={5}><TextField label="Room type" value={t.name} onChange={setT(i, 'name')} placeholder="e.g. Deluxe" /></Grid>
                                            <Grid item xs={6} sm={3}><TextField label="Usual price / night" type="number" value={t.basePrice} onChange={setT(i, 'basePrice')} /></Grid>
                                            <Grid item xs={3} sm={2}><TextField label="Adults" type="number" value={t.maxAdults} onChange={setT(i, 'maxAdults')} /></Grid>
                                            <Grid item xs={3} sm={2}><TextField label="Kids" type="number" value={t.maxChildren} onChange={setT(i, 'maxChildren')} /></Grid>
                                            <Grid item xs={12}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <TextField label="Room numbers" value={t.rooms} onChange={setT(i, 'rooms')} placeholder="101-110, 201" helperText={parsed[i].error || (parsed[i].rooms?.length ? `${parsed[i].rooms.length} room(s)` : ' ')} error={Boolean(parsed[i].error)} />
                                                    {types.length > 1 && <IconButton aria-label="Remove room type" onClick={() => setTypes((ts) => ts.filter((_, j) => j !== i))}><DeleteOutlineIcon /></IconButton>}
                                                </Stack>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                ))}
                            </Stack>
                            <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1} sx={{ mt: 2 }} alignItems="center">
                                <Button startIcon={<AddIcon />} onClick={() => setTypes((ts) => [...ts, blankType()])}>Add room type</Button>
                                {['Standard', 'Deluxe', 'Suite', 'Family room'].filter((n) => !types.some((t) => t.name === n)).map((n) => <Chip key={n} label={`+ ${n}`} variant="outlined" clickable onClick={() => setTypes((ts) => [...ts, blankType(n)])} />)}
                            </Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Total: <b>{totalRooms}</b> room(s)</Typography>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <Typography color="text.secondary" sx={{ mb: 2 }}>Room GST depends on the price of each night: at or below the limit uses the lower rate, above it the higher rate.</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}><TextField label="Price limit (₹ per night)" type="number" value={tax.gstThreshold} onChange={(e) => setTax((x) => ({ ...x, gstThreshold: e.target.value }))} /></Grid>
                                <Grid item xs={6} sm={4}><TextField label="Rate at or below (%)" type="number" value={tax.roomGstLow} onChange={(e) => setTax((x) => ({ ...x, roomGstLow: e.target.value }))} /></Grid>
                                <Grid item xs={6} sm={4}><TextField label="Rate above (%)" type="number" value={tax.roomGstHigh} onChange={(e) => setTax((x) => ({ ...x, roomGstHigh: e.target.value }))} /></Grid>
                            </Grid>
                            <Alert severity="info" sx={{ mt: 2 }}>These are the usual defaults: 5% up to ₹7,500 and 18% above. Confirm the current rules with your accountant.</Alert>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <Typography color="text.secondary" sx={{ mb: 2 }}>Optional. Add the people you pay a monthly salary to. You can skip this and add them later.</Typography>
                            <Stack spacing={1.5}>
                                {staff.map((s, i) => (
                                    <Grid container spacing={1.5} key={i} alignItems="center">
                                        <Grid item xs={12} sm={4}><TextField label="Name" value={s.name} onChange={setS(i, 'name')} /></Grid>
                                        <Grid item xs={6} sm={4}><TextField label="Designation" value={s.designation} onChange={setS(i, 'designation')} placeholder="e.g. Cook" /></Grid>
                                        <Grid item xs={5} sm={3}><TextField label="Salary / month" type="number" value={s.monthlySalary} onChange={setS(i, 'monthlySalary')} /></Grid>
                                        <Grid item xs={1}>{staff.length > 1 && <IconButton aria-label="Remove" onClick={() => setStaff((ss) => ss.filter((_, j) => j !== i))}><DeleteOutlineIcon /></IconButton>}</Grid>
                                    </Grid>
                                ))}
                            </Stack>
                            <Button startIcon={<AddIcon />} sx={{ mt: 1.5 }} onClick={() => setStaff((ss) => [...ss, { name: '', designation: '', monthlySalary: '' }])}>Add another</Button>
                        </>
                    )}

                    {step === 4 && (
                        <>
                            <Typography variant="h6" sx={{ mb: 1.5 }}>Ready to create {hotel.hotelName}</Typography>
                            <Stack spacing={1}>
                                <Typography>• <b>{types.length}</b> room type{types.length > 1 ? 's' : ''}: {types.map((t) => `${t.name} (${inr(t.basePrice)})`).join(', ')}</Typography>
                                <Typography>• <b>{totalRooms}</b> rooms in total</Typography>
                                <Typography>• Room GST: {tax.roomGstLow}% up to {inr(tax.gstThreshold)}, {tax.roomGstHigh}% above</Typography>
                                <Typography>• <b>{stafCount}</b> staff member{stafCount === 1 ? '' : 's'}</Typography>
                                <Typography>• Check-in {hotel.checkInTime}, check-out {hotel.checkOutTime}</Typography>
                            </Stack>
                            <Alert severity="success" sx={{ mt: 2 }}>After this you can add a logo, change prices by date, import your old guests and bookings, and create logins for your team.</Alert>
                        </>
                    )}

                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
                        <Button color="inherit" disabled={step === 0 || busy} onClick={() => { setError(''); setStep((s) => s - 1); }}>Back</Button>
                        {step < STEPS.length - 1 ? (
                            <Button variant="contained" size="large" onClick={next}>Continue</Button>
                        ) : (
                            <Button variant="contained" size="large" onClick={finish} disabled={busy} startIcon={busy ? <CircularProgress size={18} color="inherit" /> : null}>Create my hotel</Button>
                        )}
                    </Stack>
                </Box>
            </Box>
        </Box>
    );
};

export default Setup;
