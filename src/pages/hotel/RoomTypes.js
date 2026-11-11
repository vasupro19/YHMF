import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, Grid, IconButton, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import CloseIcon from '@mui/icons-material/Close';
import * as Yup from 'yup';
import useHotel from 'hooks/useHotel';
import useAsync from 'hooks/useAsync';
import useDialogState from 'hooks/useDialogState';
import { useToast } from 'context/Toast';
import DataTable from 'components/DataTable';
import FormDialog from 'components/FormDialog';
import PageHeader from 'components/PageHeader';
import { ActiveChip } from 'components/StatusChip';
import { KpiStrip } from 'components/Panel';
import { T } from 'components/Theme';
import { addDays, formatDate, inr, num, todayISO, weekdayShort } from 'utils/format';

const schema = Yup.object({
    name: Yup.string().trim().required('Name is required'),
    basePrice: Yup.number().typeError('Enter a price').min(0, 'Cannot be negative').required('Price is required'),
    maxAdults: Yup.number().typeError('Enter a number').min(1, 'At least 1').required('Required'),
    maxChildren: Yup.number().typeError('Enter a number').min(0, 'Cannot be negative').required('Required')
});

const DAYS = [['1', 'Mon'], ['2', 'Tue'], ['3', 'Wed'], ['4', 'Thu'], ['5', 'Fri'], ['6', 'Sat'], ['0', 'Sun']];

// set or clear a price for a date range, optionally only on some weekdays
const RatesDialog = ({ type, onClose }) => {
    const { api } = useHotel();
    const toast = useToast();
    const [from, setFrom] = useState(todayISO());
    const [to, setTo] = useState(addDays(todayISO(), 6));
    const [price, setPrice] = useState('');
    const [days, setDays] = useState([]);
    const [busy, setBusy] = useState(false);
    const rates = useAsync(() => api.rates.list({ roomTypeId: type.id, from: todayISO(), to: addDays(todayISO(), 90) }), { enabled: Boolean(type), deps: [type?.id] });

    useEffect(() => {
        if (type) {
            setFrom(todayISO());
            setTo(addDays(todayISO(), 6));
            setPrice('');
            setDays([]);
        }
    }, [type]);

    if (!type) return null;

    const run = async (clear) => {
        if (to < from) return toast.error('The end date is before the start date');
        if (!clear && !(Number(price) >= 0 && price !== '')) return toast.error('Enter a price');
        setBusy(true);
        try {
            toast.success(await api.rates.set({ roomTypeId: type.id, from, to, price: clear ? null : Number(price), weekdays: days.map(Number) }));
            rates.reload();
        } catch (e) {
            toast.error(e.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="sm">
            <Box sx={{ px: 2.5, py: 1.75, pr: 7, borderBottom: `1px solid ${T.line}`, position: 'relative' }}>
                <Typography component="h2" sx={{ fontSize: 16, fontWeight: 650 }}>Rates by date · {type.name}</Typography>
                <Typography sx={{ fontSize: 12.5, color: T.ink2, mt: 0.25 }}>Rack rate {inr(type.basePrice)} per night. Dates without a special rate use it.</Typography>
                <IconButton aria-label="Close" onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12, color: T.ink3 }}><CloseIcon fontSize="small" /></IconButton>
            </Box>
            <DialogContent sx={{ px: 2.5, py: 2.5 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.ink3, mb: 1.25 }}>Set a special rate</Typography>
                <Grid container spacing={1.5}>
                    <Grid item xs={6}><TextField label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={6}><TextField label="To (included)" type="date" value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12}>
                        <Typography sx={{ fontSize: 12.5, color: T.ink2, mb: 0.75 }}>Only on these weekdays <Box component="span" sx={{ color: T.ink3 }}>(leave all off for every day)</Box></Typography>
                        <ToggleButtonGroup size="small" value={days} onChange={(_, v) => setDays(v)} aria-label="Weekdays">
                            {DAYS.map(([v, l]) => <ToggleButton key={v} value={v} sx={{ px: 1.5 }}>{l}</ToggleButton>)}
                        </ToggleButtonGroup>
                    </Grid>
                    <Grid item xs={12} sm={6}><TextField label="Rate per night (₹)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Grid>
                    <Grid item xs={12} sm={6} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <Button variant="contained" onClick={() => run(false)} disabled={busy} fullWidth sx={{ height: 37 }}>Apply rate</Button>
                        <Button color="inherit" variant="outlined" onClick={() => run(true)} disabled={busy} fullWidth sx={{ height: 37 }}>Clear range</Button>
                    </Grid>
                </Grid>
                <Alert severity="info" sx={{ mt: 2 }}>Existing bookings keep the rate the guest was quoted.</Alert>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 2.5, mb: 1 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.ink3 }}>Special rates, next 90 days</Typography>
                    {rates.data.length > 0 && (
                        <Typography sx={{ fontSize: 12, color: T.ink3 }}>
                            <Box component="span" sx={{ color: T.warning, fontWeight: 600 }}>Amber</Box> above rack · <Box component="span" sx={{ color: T.success, fontWeight: 600 }}>green</Box> below
                        </Typography>
                    )}
                </Box>
                {rates.data.length === 0 ? (
                    <Box sx={{ p: 2, border: `1px dashed ${T.line2}`, borderRadius: '6px', textAlign: 'center' }}>
                        <Typography sx={{ fontSize: 13, color: T.ink3 }}>None. Every date uses the rack rate.</Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', border: `1px solid ${T.line}`, borderRadius: '6px', overflow: 'hidden', maxHeight: 260, overflowY: 'auto' }}>
                        {rates.data.map((r) => {
                            const up = r.price > type.basePrice;
                            return (
                                <Tooltip key={r.date} title={`${formatDate(r.date)}: ${inr(r.price)} (rack ${inr(type.basePrice)})`}>
                                    <Box sx={{ px: 1, py: 0.75, borderRight: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`, bgcolor: up ? '#FDF7EC' : '#F2F9F5' }}>
                                        <Typography sx={{ fontSize: 11, color: T.ink3 }}>{weekdayShort(r.date)} {formatDate(r.date).slice(0, 6)}</Typography>
                                        <Typography className="num" sx={{ fontSize: 13, fontWeight: 600, color: up ? T.warning : T.success }}>{num(r.price)}</Typography>
                                    </Box>
                                </Tooltip>
                            );
                        })}
                    </Box>
                )}
            </DialogContent>
            <DialogActions><Button variant="outlined" color="inherit" onClick={onClose}>Done</Button></DialogActions>
        </Dialog>
    );
};

const RoomTypes = () => {
    const { api } = useHotel();
    const toast = useToast();
    const dialog = useDialogState();
    const [ratesFor, setRatesFor] = useState(null);
    const list = useAsync(() => api.roomTypes.list());
    const editing = Boolean(dialog.editing);

    const columns = useMemo(() => [
        {
            id: 'name',
            label: 'Room type',
            value: (t) => t.name,
            render: (t) => (
                <Box>
                    <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, minWidth: 140 }}>{t.name}</Typography>
                    {t.description && <Typography sx={{ fontSize: 12, color: T.ink3 }}>{t.description}</Typography>}
                </Box>
            )
        },
        { id: 'basePrice', label: 'Rack rate / night', align: 'right', value: (t) => Number(t.basePrice), render: (t) => <Box component="span" sx={{ fontWeight: 600 }}>{inr(t.basePrice)}</Box> },
        { id: 'sleeps', label: 'Max occupancy', value: (t) => `${t.maxAdults} adults${t.maxChildren ? ` + ${t.maxChildren} children` : ''}`, render: (t) => <Box component="span" sx={{ whiteSpace: 'nowrap' }}>{t.maxAdults} adults{t.maxChildren ? ` + ${t.maxChildren} children` : ''}</Box> },
        { id: 'amenities', label: 'Amenities', sortable: false, value: (t) => t.amenities || '', render: (t) => (t.amenities ? <Typography noWrap sx={{ fontSize: 12.5, color: T.ink2, maxWidth: 260 }}>{t.amenities}</Typography> : <Box component="span" sx={{ color: T.ink3 }}>—</Box>) },
        { id: 'roomCount', label: 'Rooms', align: 'right', value: (t) => Number(t.roomCount) || 0 },
        { id: 'active', label: 'Status', value: (t) => (t.active ? 'Active' : 'Inactive'), render: (t) => <ActiveChip active={Boolean(t.active)} /> }
    ], []);

    const fields = [
        { name: 'name', label: 'Name', type: 'text', placeholder: 'e.g. Deluxe King' },
        { name: 'basePrice', label: 'Usual price per night (₹)', type: 'number' },
        { name: 'maxAdults', label: 'Max adults', type: 'number', half: true },
        { name: 'maxChildren', label: 'Max children', type: 'number', half: true },
        { name: 'description', label: 'Description', type: 'text' },
        { name: 'amenities', label: 'Amenities', type: 'textarea', placeholder: 'AC, Wi-Fi, Balcony…' },
        { name: 'active', label: 'Available for booking', type: 'switch' }
    ];

    const save = async (v) => {
        const message = await api.roomTypes.save(dialog.editing?.id, { name: v.name.trim(), basePrice: Number(v.basePrice), maxAdults: Number(v.maxAdults), maxChildren: Number(v.maxChildren), description: v.description, amenities: v.amenities, active: v.active });
        toast.success(message);
        dialog.close();
        list.reload();
    };

    return (
        <>
            <PageHeader title="Room types & rates" subtitle="Rack rates per room type. Use Rates by date for weekends, seasons and events." />
            <Box sx={{ mb: 2 }}>
                <KpiStrip
                    loading={list.loading}
                    items={[
                        { label: 'Room types', value: list.data.length, sub: `${list.data.filter((t) => t.active).length} open for booking` },
                        { label: 'Rooms', value: list.data.reduce((n, t) => n + (Number(t.roomCount) || 0), 0), sub: 'across all types' },
                        { label: 'Lowest rack rate', value: list.data.length ? inr(Math.min(...list.data.map((t) => Number(t.basePrice)))) : '—', sub: 'per night' },
                        { label: 'Highest rack rate', value: list.data.length ? inr(Math.max(...list.data.map((t) => Number(t.basePrice)))) : '—', sub: 'per night' }
                    ]}
                />
            </Box>
            <DataTable columns={columns} rows={list.data} loading={list.loading} onAdd={dialog.openAdd} addLabel="Add room type" searchPlaceholder="Search room types" exportName="room-types" emptyText="Add a room type, for example Deluxe or Suite, then add rooms to it."
                actions={[
                    { title: 'Rates by date', icon: <EventAvailableOutlinedIcon fontSize="small" />, onClick: setRatesFor },
                    { title: 'Edit', icon: <EditOutlinedIcon fontSize="small" />, onClick: dialog.openEdit }
                ]} />
            <FormDialog open={dialog.open} title={editing ? 'Edit room type' : 'Add room type'} subtitle="Rack rate, occupancy and what the room includes" fields={fields} initialValues={editing ? { ...dialog.editing, active: Boolean(dialog.editing.active) } : { maxAdults: 2, maxChildren: 1, active: true }} validationSchema={schema} onSubmit={save} onClose={dialog.close} />
            <RatesDialog type={ratesFor} onClose={() => setRatesFor(null)} />
        </>
    );
};

export default RoomTypes;
