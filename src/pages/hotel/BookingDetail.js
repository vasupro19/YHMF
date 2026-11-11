import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, Divider, Grid, IconButton, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import ShareDialog from 'components/ShareDialog';
import * as Yup from 'yup';
import useHotel from 'hooks/useHotel';
import useAsync from 'hooks/useAsync';
import { useToast } from 'context/Toast';
import BookingDialog from 'components/BookingDialog';
import ConfirmDialog from 'components/ConfirmDialog';
import FormDialog from 'components/FormDialog';
import { BookingChip } from 'components/StatusChip';
import { BOOKING_SOURCES, CHARGE_CATEGORIES, PAY_METHODS } from 'utils/constants';
import { daysBetween, formatDate, inr, todayISO } from 'utils/format';

const chargeSchema = Yup.object({
    category: Yup.string().required('Choose a category'),
    description: Yup.string().trim().required('Describe the charge'),
    quantity: Yup.number().typeError('Enter a number').moreThan(0, 'Must be more than 0').required('Required'),
    unitPrice: Yup.number().typeError('Enter an amount').min(0, 'Cannot be negative').required('Required'),
    gstPercent: Yup.number().typeError('Enter a number').min(0).max(100).required('Required')
});
const paySchema = Yup.object({ amount: Yup.number().typeError('Enter an amount').moreThan(0, 'Must be more than 0').required('Required'), method: Yup.string().required() });

const Row = ({ label, value, bold, color }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
        <Typography variant="body2" color={bold ? 'text.primary' : 'text.secondary'} sx={{ fontWeight: bold ? 700 : 400 }}>{label}</Typography>
        <Typography variant="body2" color={color} sx={{ fontWeight: bold ? 700 : 500 }}>{value}</Typography>
    </Box>
);

const BookingDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { api } = useHotel();
    const toast = useToast();
    const q = useAsync(() => api.bookings.get(id), { initial: null, deps: [id] });
    const [editing, setEditing] = useState(false);
    const [chargeOpen, setChargeOpen] = useState(false);
    const [payOpen, setPayOpen] = useState(false);
    const [shareKind, setShareKind] = useState(null);
    const location = useLocation();
    const [justCreated, setJustCreated] = useState(Boolean(location.state?.created));
    const [confirm, setConfirm] = useState(null); // { action, title, text, label, color }
    const b = q.data;

    if (!b) return <Box sx={{ py: 6, textAlign: 'center' }}><Typography color="text.secondary">{q.loading ? 'Loading booking…' : 'Booking not found'}</Typography>{!q.loading && <Button component={Link} to="/hotel/bookings" sx={{ mt: 2 }}>Back to bookings</Button>}</Box>;

    const today = todayISO();
    const nights = daysBetween(b.checkIn, b.checkOut);
    const active = !['CANCELLED', 'NO_SHOW'].includes(b.status);
    const canCharge = ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(b.status);
    const locked = b.status === 'CHECKED_OUT';
    const bill = b.bill;

    const run = async (fn, msg) => {
        try {
            const updated = await fn();
            q.setData(updated);
            if (msg) toast.success(msg);
        } catch (e) {
            toast.error(e.message);
        }
    };
    const act = (action, msg) => run(() => api.bookings.status(id, action), msg);

    const arrivalOk = b.checkIn <= today;
    const customerLine = [b.customerPhone, b.customerEmail].filter(Boolean).join(' · ');

    return (
        <>
            <Button component={Link} to="/hotel/bookings" startIcon={<ArrowBackIcon />} color="inherit" sx={{ mb: 1 }}>Bookings</Button>
            <Box sx={{ display: 'flex', alignItems: { md: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3 }}>
                <Box>
                    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                        <Typography variant="h4" component="h1">{b.bookingNumber}</Typography>
                        <BookingChip status={b.status} />
                        {b.invoice && <Chip size="small" variant="outlined" label={b.invoice.invoiceNumber} />}
                    </Stack>
                    <Typography color="text.secondary">{b.customerName}{b.companyName ? ` · ${b.companyName}` : ''} · Room {b.roomNumber} ({b.roomTypeName})</Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                    {b.status === 'PENDING' && <Button variant="outlined" onClick={() => act('confirm', 'Booking confirmed')}>Confirm</Button>}
                    {['PENDING', 'CONFIRMED'].includes(b.status) && (
                        <Tooltip title={arrivalOk ? '' : `Arrival is on ${formatDate(b.checkIn)}`}><span><Button variant="contained" color="success" disabled={!arrivalOk} onClick={() => act('checkin', 'Guest checked in')}>Check in</Button></span></Tooltip>
                    )}
                    {b.status === 'CHECKED_IN' && <Button variant="contained" onClick={() => setConfirm({ action: 'checkout', title: 'Check out this guest?', label: 'Check out', color: 'primary', text: bill.balance > 0 ? `${inr(bill.balance)} is still unpaid. You can record the payment now or after checkout.` : 'The bill is settled. The room will be marked for cleaning.' })}>Check out</Button>}
                    {['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(b.status) && <Button variant="outlined" color="inherit" onClick={() => setEditing(true)}>Edit</Button>}
                    {['CONFIRMED', 'PENDING'].includes(b.status) && b.checkIn <= today && <Button variant="outlined" color="inherit" onClick={() => setConfirm({ action: 'noshow', title: 'Mark as no-show?', label: 'Mark no-show', color: 'error', text: 'The guest did not arrive. The room becomes free again.' })}>No-show</Button>}
                    {['PENDING', 'CONFIRMED'].includes(b.status) && <Button variant="outlined" color="error" onClick={() => setConfirm({ action: 'cancel', title: 'Cancel this booking?', label: 'Cancel booking', color: 'error', text: 'The room becomes free again.' + (bill.paid > 0 ? ` ${inr(bill.paid)} was received as advance; refund it separately.` : '') })}>Cancel booking</Button>}
                    {active && <Button variant="outlined" startIcon={<SendOutlinedIcon />} onClick={() => setShareKind(b.status === 'CHECKED_OUT' ? 'bill' : 'confirmation')}>Send to guest</Button>}
                    {active && <Button variant="outlined" startIcon={<ReceiptLongOutlinedIcon />} onClick={() => window.open(`/print/booking/${id}`, '_blank')}>{b.invoice ? 'Invoice' : 'Proforma bill'}</Button>}
                </Stack>
            </Box>

            {justCreated && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setJustCreated(false)} action={<Button color="inherit" size="small" onClick={() => { setJustCreated(false); setShareKind('confirmation'); }}>Send confirmation</Button>}>Booking created. Send the guest their confirmation on WhatsApp or email?</Alert>}
            {b.status === 'CHECKED_OUT' && bill.balance > 0 && <Alert severity="warning" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => setPayOpen(true)}>Record payment</Button>}>{inr(bill.balance)} is still due on this booking.</Alert>}

            <Grid container spacing={2.5}>
                <Grid item xs={12} md={8}>
                    <Card sx={{ mb: 2.5 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 1.5 }}>Stay</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Check-in</Typography><Typography sx={{ fontWeight: 600 }}>{formatDate(b.checkIn)}</Typography></Grid>
                                <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Check-out</Typography><Typography sx={{ fontWeight: 600 }}>{formatDate(b.checkOut)}</Typography></Grid>
                                <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Nights</Typography><Typography sx={{ fontWeight: 600 }}>{nights}</Typography></Grid>
                                <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Guests</Typography><Typography sx={{ fontWeight: 600 }}>{b.adults} adult{b.adults > 1 ? 's' : ''}{b.children ? ` + ${b.children} child${b.children > 1 ? 'ren' : ''}` : ''}</Typography></Grid>
                                <Grid item xs={12} sm={6}><Typography variant="caption" color="text.secondary">Guest</Typography><Typography sx={{ fontWeight: 600 }}>{b.customerName}</Typography><Typography variant="body2" color="text.secondary">{customerLine || 'No contact saved'}</Typography>{b.customerGstin && <Typography variant="body2" color="text.secondary">GSTIN {b.customerGstin}</Typography>}</Grid>
                                <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Source</Typography><Typography sx={{ fontWeight: 600 }}>{BOOKING_SOURCES.find((s) => s.id === b.source)?.name || b.source}</Typography></Grid>
                                <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Check-in at</Typography><Typography sx={{ fontWeight: 600 }}>{b.checkedInAt ? new Date(b.checkedInAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}</Typography></Grid>
                                {b.notes && <Grid item xs={12}><Typography variant="caption" color="text.secondary">Notes</Typography><Typography variant="body2">{b.notes}</Typography></Grid>}
                            </Grid>
                        </CardContent>
                    </Card>

                    <Card sx={{ mb: 2.5 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h6">Charges to the room</Typography>
                                <Button variant="outlined" size="small" onClick={() => setChargeOpen(true)} disabled={!canCharge}>Add charge</Button>
                            </Box>
                            {b.charges.length === 0 ? <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>No extra charges yet. Add restaurant, room service, laundry and other bills here and they appear on the final bill.</Typography> : (
                                <Table size="small">
                                    <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Item</TableCell><TableCell align="right">Qty</TableCell><TableCell align="right">Rate</TableCell><TableCell align="right">GST</TableCell><TableCell align="right">Amount</TableCell><TableCell /></TableRow></TableHead>
                                    <TableBody>
                                        {bill.chargeLines.map((c) => (
                                            <TableRow key={c.id}>
                                                <TableCell>{formatDate(c.date)}</TableCell>
                                                <TableCell><Typography variant="body2">{c.description}</Typography><Typography variant="caption" color="text.secondary">{CHARGE_CATEGORIES.find((x) => x.id === c.category)?.name || c.category}</Typography></TableCell>
                                                <TableCell align="right">{c.quantity}</TableCell>
                                                <TableCell align="right">{inr(c.unitPrice)}</TableCell>
                                                <TableCell align="right">{c.gstPercent}%</TableCell>
                                                <TableCell align="right">{inr(c.amount)}</TableCell>
                                                <TableCell align="right">{!locked && <IconButton size="small" aria-label={`Remove ${c.description}`} onClick={() => run(() => api.bookings.removeCharge(id, c.id), 'Charge removed')}><DeleteOutlineIcon fontSize="small" /></IconButton>}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h6">Payments received</Typography>
                                <Button variant="outlined" size="small" onClick={() => setPayOpen(true)} disabled={!active}>Record payment</Button>
                            </Box>
                            {b.payments.length === 0 ? <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>Nothing received yet.</Typography> : (
                                <Table size="small">
                                    <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Method</TableCell><TableCell>Reference</TableCell><TableCell align="right">Amount</TableCell><TableCell /></TableRow></TableHead>
                                    <TableBody>
                                        {b.payments.map((p) => (
                                            <TableRow key={p.id}>
                                                <TableCell>{new Date(p.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
                                                <TableCell>{PAY_METHODS.find((m) => m.id === p.method)?.name || p.method}{p.note ? ` · ${p.note}` : ''}</TableCell>
                                                <TableCell>{p.reference || '-'}</TableCell>
                                                <TableCell align="right">{inr(p.amount)}</TableCell>
                                                <TableCell align="right">{!locked && <IconButton size="small" aria-label="Remove payment" onClick={() => run(() => api.bookings.removePayment(id, p.id), 'Payment removed')}><DeleteOutlineIcon fontSize="small" /></IconButton>}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card sx={{ position: { md: 'sticky' }, top: { md: 88 } }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 1 }}>Bill</Typography>
                            <Row label={`Room (${nights} night${nights > 1 ? 's' : ''})`} value={inr(bill.roomSubtotal)} />
                            {bill.discount > 0 && <Row label="Discount" value={`− ${inr(bill.discount)}`} />}
                            <Row label="Food & other charges" value={inr(bill.chargesSubtotal)} />
                            <Row label="GST" value={inr(bill.taxTotal)} />
                            <Divider sx={{ my: 1 }} />
                            <Row label="Total" value={inr(bill.total)} bold />
                            <Row label="Received" value={inr(bill.paid)} />
                            <Divider sx={{ my: 1 }} />
                            <Row label={bill.balance > 0 ? 'Balance due' : 'Balance'} value={bill.balance > 0 ? inr(bill.balance) : bill.balance < 0 ? `${inr(-bill.balance)} to refund` : 'Settled'} bold color={bill.balance > 0 ? 'error.main' : 'success.main'} />
                            {active && bill.balance > 0 && <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={() => setPayOpen(true)}>Collect {inr(bill.balance)}</Button>}
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>Room nights are priced as quoted at booking time. Later rate changes don't affect this bill.</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <ShareDialog open={Boolean(shareKind)} booking={b} defaultKind={shareKind || 'confirmation'} onClose={() => setShareKind(null)} />
            <BookingDialog open={editing} booking={b} onClose={() => setEditing(false)} onSaved={(u) => { setEditing(false); q.setData(u); }} />

            <FormDialog open={chargeOpen} title="Add charge" subtitle="Goes on the guest's final bill"
                fields={[
                    { name: 'category', label: 'Category', type: 'select', required: true, options: CHARGE_CATEGORIES, onChange: (v, set) => set('gstPercent', CHARGE_CATEGORIES.find((c) => c.id === v)?.gst ?? 18) },
                    { name: 'description', label: 'Description', type: 'text', placeholder: 'e.g. Dinner, 2 persons' },
                    { name: 'quantity', label: 'Quantity', type: 'number', half: true },
                    { name: 'unitPrice', label: 'Price each (₹)', type: 'number', half: true },
                    { name: 'gstPercent', label: 'GST %', type: 'number', half: true, helperText: 'Set from the category; change if needed' },
                    { name: 'chargeDate', label: 'Date', type: 'date', half: true }
                ]}
                initialValues={{ category: 'RESTAURANT', quantity: 1, gstPercent: 5, chargeDate: today }} validationSchema={chargeSchema}
                onSubmit={async (v) => { const u = await api.bookings.addCharge(id, { ...v, quantity: Number(v.quantity), unitPrice: Number(v.unitPrice), gstPercent: Number(v.gstPercent), description: v.description.trim() }); q.setData(u); setChargeOpen(false); toast.success('Charge added'); }}
                onClose={() => setChargeOpen(false)} />

            <FormDialog open={payOpen} title="Record payment" subtitle={`Balance due ${inr(Math.max(bill.balance, 0))}`}
                fields={[
                    { name: 'amount', label: 'Amount (₹)', type: 'number' },
                    { name: 'method', label: 'Paid by', type: 'select', required: true, options: PAY_METHODS, half: true },
                    { name: 'reference', label: 'Reference / UPI id', type: 'text', half: true },
                    { name: 'note', label: 'Note', type: 'text' }
                ]}
                initialValues={{ amount: Math.max(bill.balance, 0) || '', method: 'CASH' }} validationSchema={paySchema}
                onSubmit={async (v) => { const u = await api.bookings.addPayment(id, { ...v, amount: Number(v.amount) }); q.setData(u); setPayOpen(false); toast.success('Payment recorded'); }}
                onClose={() => setPayOpen(false)} submitLabel="Record payment" />

            <ConfirmDialog open={Boolean(confirm)} title={confirm?.title} confirmLabel={confirm?.label} color={confirm?.color} onClose={() => setConfirm(null)}
                onConfirm={async () => { const c = confirm; setConfirm(null); await act(c.action, c.action === 'checkout' ? 'Guest checked out. The invoice is ready; use the Invoice button.' : undefined); if (c.action === 'cancel') navigate('/hotel/bookings'); }}>
                {confirm?.text}
            </ConfirmDialog>
        </>
    );
};

export default BookingDetail;
