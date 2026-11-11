import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
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
import { addDays, formatDate, inr, num, todayISO } from 'utils/format';

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
            <DialogTitle sx={{ pr: 7 }}>
                {type.name} · prices by date
                <Typography variant="body2" color="text.secondary">Usual price {inr(type.basePrice)} per night. Dates with no custom price use it.</Typography>
                <IconButton aria-label="Close" onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2}>
                    <Grid item xs={6}><TextField label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={6}><TextField label="To (included)" type="date" value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>Only on these days (leave empty for every day)</Typography>
                        <ToggleButtonGroup size="small" value={days} onChange={(_, v) => setDays(v)} aria-label="Weekdays">
                            {DAYS.map(([v, l]) => <ToggleButton key={v} value={v} sx={{ px: 1.5 }}>{l}</ToggleButton>)}
                        </ToggleButtonGroup>
                    </Grid>
                    <Grid item xs={12} sm={6}><TextField label="Price per night (₹)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Grid>
                    <Grid item xs={12} sm={6} sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="contained" onClick={() => run(false)} disabled={busy} fullWidth>Set price</Button>
                        <Button color="inherit" variant="outlined" onClick={() => run(true)} disabled={busy} fullWidth>Clear</Button>
                    </Grid>
                </Grid>
                <Alert severity="info" sx={{ mt: 2 }}>Bookings that already exist keep the price the guest was quoted.</Alert>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Custom prices in the next 90 days</Typography>
                {rates.data.length === 0 ? <Typography color="text.secondary" variant="body2">None. Every date uses the usual price.</Typography> : (
                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                        {rates.data.map((r) => <Chip key={r.date} size="small" variant="outlined" label={`${formatDate(r.date).slice(0, 6)} · ${num(r.price)}`} color={r.price > type.basePrice ? 'warning' : 'success'} />)}
                    </Stack>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}><Button onClick={onClose}>Done</Button></DialogActions>
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
        { id: 'name', label: 'Room type', render: (t) => <Box><Typography variant="body2" sx={{ fontWeight: 600 }}>{t.name}</Typography><Typography variant="caption" color="text.secondary">{t.description}</Typography></Box>, value: (t) => t.name },
        { id: 'basePrice', label: 'Usual price / night', value: (t) => t.basePrice, render: (t) => inr(t.basePrice) },
        { id: 'sleeps', label: 'Sleeps', value: (t) => `${t.maxAdults} adults${t.maxChildren ? ` + ${t.maxChildren} children` : ''}` },
        { id: 'roomCount', label: 'Rooms' },
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
            <PageHeader title="Room types & rates" subtitle="Set the usual price, then change it for particular dates, weekends or seasons" />
            <DataTable columns={columns} rows={list.data} loading={list.loading} onAdd={dialog.openAdd} addLabel="Add room type" searchPlaceholder="Search room types…" exportName="room-types" emptyText="Add a room type, for example Deluxe or Suite, then add rooms to it."
                actions={[
                    { title: 'Prices by date', icon: <EventAvailableOutlinedIcon fontSize="small" />, onClick: setRatesFor },
                    { title: 'Edit', icon: <EditOutlinedIcon fontSize="small" />, onClick: dialog.openEdit }
                ]} />
            <FormDialog open={dialog.open} title={editing ? 'Edit room type' : 'Add room type'} fields={fields} initialValues={editing ? { ...dialog.editing, active: Boolean(dialog.editing.active) } : { maxAdults: 2, maxChildren: 1, active: true }} validationSchema={schema} onSubmit={save} onClose={dialog.close} />
            <RatesDialog type={ratesFor} onClose={() => setRatesFor(null)} />
        </>
    );
};

export default RoomTypes;
