import { useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Grid, IconButton, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckIcon from '@mui/icons-material/Check';
import { useNavigate } from 'react-router-dom';
import Logo from 'components/Logo';
import { T } from 'components/Theme';
import useHotel from 'hooks/useHotel';
import { useAuth } from 'context/Auth';
import { useToast } from 'context/Toast';
import { GST_REGEX } from 'utils/constants';
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

    const card = { bgcolor: T.panel, border: `1px solid ${T.line}`, borderRadius: '8px' };
    const sectionTitle = (title, text) => (
        <Box sx={{ mb: 2.5 }}>
            <Typography component="h2" sx={{ fontSize: 16, fontWeight: 650 }}>{title}</Typography>
            {text && <Typography sx={{ mt: 0.5, fontSize: 13, color: T.ink2 }}>{text}</Typography>}
        </Box>
    );

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: T.page, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ height: 56, px: { xs: 2, sm: 3 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: T.panel, borderBottom: `1px solid ${T.line}` }}>
                <Logo size={30} showText />
                <Button color="inherit" onClick={skip} sx={{ color: T.ink2 }}>Skip for now</Button>
            </Box>

            <Box sx={{ flex: 1, width: '100%', maxWidth: 1040, mx: 'auto', px: 2, py: { xs: 3, md: 5 } }}>
                <Typography variant="h4" component="h1">Set up {hotel.hotelName.trim() || 'your hotel'}</Typography>
                <Typography sx={{ mt: 0.5, mb: 3, fontSize: 13.5, color: T.ink2 }}>About ten minutes. Everything can be changed later in Settings.</Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '240px 1fr' }, gap: 2, alignItems: 'start' }}>
                    {/* step list */}
                    <Box component="ol" sx={{ ...card, listStyle: 'none', m: 0, p: 1, display: { xs: 'none', md: 'block' } }}>
                        {STEPS.map((label, i) => {
                            const done = i < step;
                            const current = i === step;
                            return (
                                <Box component="li" key={label} aria-current={current ? 'step' : undefined} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1.25, py: 1, borderRadius: '6px', bgcolor: current ? T.brandTint : 'transparent' }}>
                                    <Box sx={{ width: 22, height: 22, flexShrink: 0, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11.5, fontWeight: 700, bgcolor: done ? T.brand : T.panel, color: done ? '#fff' : current ? T.brand : T.ink3, border: `1.5px solid ${done || current ? T.brand : T.line2}` }}>
                                        {done ? <CheckIcon sx={{ fontSize: 14 }} /> : i + 1}
                                    </Box>
                                    <Typography sx={{ fontSize: 13, fontWeight: current ? 650 : 500, color: done || current ? T.ink : T.ink3 }}>{label}</Typography>
                                </Box>
                            );
                        })}
                    </Box>
                    <Typography sx={{ display: { md: 'none' }, fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.ink3 }}>Step {step + 1} of {STEPS.length} · {STEPS[step]}</Typography>

                    {/* step content */}
                    <Box sx={{ ...card, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: { xs: 2, sm: 3 } }}>
                            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

                            {step === 0 && (
                                <>
                                    {sectionTitle('Hotel details', 'Printed on bills and guest messages.')}
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}><TextField label="Hotel name" value={hotel.hotelName} onChange={setH('hotelName')} autoFocus /></Grid>
                                        <Grid item xs={12}><TextField label="Address" value={hotel.address} onChange={setH('address')} multiline minRows={2} helperText="Printed on bills" /></Grid>
                                        <Grid item xs={12} sm={6}><TextField label="Phone" value={hotel.phone} onChange={setH('phone')} /></Grid>
                                        <Grid item xs={12} sm={6}><TextField label="Email" value={hotel.email} onChange={setH('email')} /></Grid>
                                        <Grid item xs={12}><TextField label="GSTIN (optional)" value={hotel.gstin} onChange={setH('gstin')} helperText="Needed for GST invoices" /></Grid>
                                        <Grid item xs={6}><TextField label="Check-in time" type="time" value={hotel.checkInTime} onChange={setH('checkInTime')} InputLabelProps={{ shrink: true }} /></Grid>
                                        <Grid item xs={6}><TextField label="Check-out time" type="time" value={hotel.checkOutTime} onChange={setH('checkOutTime')} InputLabelProps={{ shrink: true }} /></Grid>
                                    </Grid>
                                </>
                            )}

                            {step === 1 && (
                                <>
                                    {sectionTitle('Rooms & prices', <>A room type is a group of similar rooms with the same price. For the rooms, type numbers or ranges: <b>101-110, 201, 202</b>.</>)}
                                    <Box sx={{ border: `1px solid ${T.line}`, borderRadius: '6px', overflow: 'hidden' }}>
                                        {types.map((t, i) => (
                                            <Box key={i} sx={{ p: 2, borderTop: i ? `1px solid ${T.line}` : 0, bgcolor: i % 2 ? T.subtle : T.panel }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
                                                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: T.ink3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Room type {i + 1}</Typography>
                                                    {types.length > 1 && <IconButton size="small" aria-label="Remove room type" onClick={() => setTypes((ts) => ts.filter((_, j) => j !== i))} sx={{ color: T.ink3, '&:hover': { color: T.error } }}><DeleteOutlineIcon sx={{ fontSize: 18 }} /></IconButton>}
                                                </Box>
                                                <Grid container spacing={1.5}>
                                                    <Grid item xs={12} sm={5}><TextField label="Room type" value={t.name} onChange={setT(i, 'name')} placeholder="e.g. Deluxe" /></Grid>
                                                    <Grid item xs={6} sm={3}><TextField label="Usual price / night" type="number" value={t.basePrice} onChange={setT(i, 'basePrice')} /></Grid>
                                                    <Grid item xs={3} sm={2}><TextField label="Adults" type="number" value={t.maxAdults} onChange={setT(i, 'maxAdults')} /></Grid>
                                                    <Grid item xs={3} sm={2}><TextField label="Kids" type="number" value={t.maxChildren} onChange={setT(i, 'maxChildren')} /></Grid>
                                                    <Grid item xs={12}>
                                                        <TextField label="Room numbers" value={t.rooms} onChange={setT(i, 'rooms')} placeholder="101-110, 201" helperText={parsed[i].error || (parsed[i].rooms?.length ? `${parsed[i].rooms.length} room(s)` : ' ')} error={Boolean(parsed[i].error)} />
                                                    </Grid>
                                                </Grid>
                                            </Box>
                                        ))}
                                    </Box>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1} sx={{ mt: 1.5 }} alignItems="center">
                                        <Button variant="outlined" color="inherit" startIcon={<AddIcon />} onClick={() => setTypes((ts) => [...ts, blankType()])}>Add room type</Button>
                                        {['Standard', 'Deluxe', 'Suite', 'Family room'].filter((n) => !types.some((t) => t.name === n)).map((n) => <Chip key={n} size="small" label={`+ ${n}`} variant="outlined" clickable onClick={() => setTypes((ts) => [...ts, blankType(n)])} />)}
                                        <Box sx={{ flex: 1 }} />
                                        <Typography sx={{ fontSize: 13, color: T.ink2 }}>Total <Box component="span" className="num" sx={{ fontWeight: 650, color: T.ink }}>{totalRooms}</Box> room(s)</Typography>
                                    </Stack>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    {sectionTitle('Tax', 'Room GST depends on the price of each night: at or below the limit uses the lower rate, above it the higher rate.')}
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
                                    {sectionTitle('Team', 'Optional. Add the people you pay a monthly salary to. You can skip this and add them later.')}
                                    <Box sx={{ display: { xs: 'none', sm: 'grid' }, gridTemplateColumns: '4fr 4fr 3fr 1fr', gap: 1.5, mb: 0.75, px: 0.25 }}>
                                        {['Name', 'Designation', 'Salary / month', ''].map((h) => <Typography key={h} sx={{ fontSize: 12, fontWeight: 600, color: T.ink2 }}>{h}</Typography>)}
                                    </Box>
                                    <Stack spacing={1.25}>
                                        {staff.map((s, i) => (
                                            <Grid container spacing={1.5} key={i} alignItems="center">
                                                <Grid item xs={12} sm={4}><TextField label="Name" value={s.name} onChange={setS(i, 'name')} /></Grid>
                                                <Grid item xs={6} sm={4}><TextField label="Designation" value={s.designation} onChange={setS(i, 'designation')} placeholder="e.g. Cook" /></Grid>
                                                <Grid item xs={5} sm={3}><TextField label="Salary / month" type="number" value={s.monthlySalary} onChange={setS(i, 'monthlySalary')} /></Grid>
                                                <Grid item xs={1}>{staff.length > 1 && <IconButton size="small" aria-label="Remove" onClick={() => setStaff((ss) => ss.filter((_, j) => j !== i))} sx={{ color: T.ink3, '&:hover': { color: T.error } }}><DeleteOutlineIcon sx={{ fontSize: 18 }} /></IconButton>}</Grid>
                                            </Grid>
                                        ))}
                                    </Stack>
                                    <Button variant="outlined" color="inherit" startIcon={<AddIcon />} sx={{ mt: 1.5 }} onClick={() => setStaff((ss) => [...ss, { name: '', designation: '', monthlySalary: '' }])}>Add another</Button>
                                </>
                            )}

                            {step === 4 && (
                                <>
                                    {sectionTitle(`Ready to create ${hotel.hotelName}`, 'Check the summary below, then create the hotel.')}
                                    <Box sx={{ border: `1px solid ${T.line}`, borderRadius: '6px' }}>
                                        {[
                                            ['Room types', `${types.length}: ${types.map((t) => `${t.name} (${inr(t.basePrice)})`).join(', ')}`],
                                            ['Rooms', `${totalRooms} in total`],
                                            ['Room GST', `${tax.roomGstLow}% up to ${inr(tax.gstThreshold)}, ${tax.roomGstHigh}% above`],
                                            ['Staff', `${stafCount} member${stafCount === 1 ? '' : 's'}`],
                                            ['Times', `Check-in ${hotel.checkInTime}, check-out ${hotel.checkOutTime}`]
                                        ].map(([l, v], i) => (
                                            <Box key={l} sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 2, px: 2, py: 1.1, borderTop: i ? `1px solid ${T.line}` : 0 }}>
                                                <Typography sx={{ fontSize: 13, color: T.ink2 }}>{l}</Typography>
                                                <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{v}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                    <Alert severity="success" sx={{ mt: 2 }}>After this you can add a logo, change prices by date, import your old guests and bookings, and create logins for your team.</Alert>
                                </>
                            )}
                        </Box>

                        <Box sx={{ px: { xs: 2, sm: 3 }, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: T.subtle, borderTop: `1px solid ${T.line}`, borderRadius: '0 0 8px 8px' }}>
                            <Button variant="outlined" color="inherit" disabled={step === 0 || busy} onClick={() => { setError(''); setStep((s) => s - 1); }}>Back</Button>
                            {step < STEPS.length - 1 ? (
                                <Button variant="contained" onClick={next}>Continue</Button>
                            ) : (
                                <Button variant="contained" onClick={finish} disabled={busy} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}>Create my hotel</Button>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default Setup;
