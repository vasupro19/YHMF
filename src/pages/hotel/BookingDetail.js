import { useState } from 'react';
import { Alert, Box, Button, Divider, Grid, IconButton, ListItemIcon, Menu, MenuItem, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import * as Yup from 'yup';
import ShareDialog from 'components/ShareDialog';
import useHotel from 'hooks/useHotel';
import useAsync from 'hooks/useAsync';
import { useToast } from 'context/Toast';
import BookingDialog from 'components/BookingDialog';
import ConfirmDialog from 'components/ConfirmDialog';
import FormDialog from 'components/FormDialog';
import Panel from 'components/Panel';
import { BookingChip, Pill } from 'components/StatusChip';
import { T } from 'components/Theme';
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

const r2 = (n) => Math.round(n * 100) / 100;
const STEPS = [
    ['PENDING', 'On hold'],
    ['CONFIRMED', 'Confirmed'],
    ['CHECKED_IN', 'In house'],
    ['CHECKED_OUT', 'Checked out']
];

// On hold → Confirmed → In house → Checked out
const StatusTrack = ({ status }) => {
    if (['CANCELLED', 'NO_SHOW'].includes(status)) return null;
    const at = STEPS.findIndex((s) => s[0] === status);
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: { xs: 'wrap', sm: 'nowrap' }, columnGap: { xs: 2, sm: 0 }, rowGap: 1, mb: 2 }}>
            {STEPS.map(([id, label], i) => {
                const done = i < at;
                const current = i === at;
                return (
                    <Box key={id} sx={{ display: 'flex', alignItems: 'center', flex: { xs: '0 0 auto', sm: i < STEPS.length - 1 ? 1 : '0 0 auto' }, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
                            <Box sx={{ width: 20, height: 20, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, bgcolor: done ? T.brand : current ? T.panel : T.panel, color: done ? '#fff' : current ? T.brand : T.ink3, border: `1.5px solid ${done || current ? T.brand : T.line2}` }}>
                                {done ? <CheckIcon sx={{ fontSize: 13 }} /> : i + 1}
                            </Box>
                            <Typography sx={{ fontSize: 12.5, fontWeight: current ? 650 : 500, color: done || current ? T.ink : T.ink3, whiteSpace: 'nowrap' }}>{label}</Typography>
                        </Box>
                        {i < STEPS.length - 1 && <Box sx={{ display: { xs: 'none', sm: 'block' }, flex: 1, height: '1.5px', minWidth: 24, mx: 1.25, bgcolor: done ? T.brand : T.line2 }} />}
                    </Box>
                );
            })}
        </Box>
    );
};

const Field = ({ label, children }) => (
    <Box>
        <Typography sx={{ fontSize: 11.5, color: T.ink3, mb: 0.25 }}>{label}</Typography>
        <Box sx={{ fontSize: 13, fontWeight: 500 }}>{children}</Box>
    </Box>
);

const SumRow = ({ label, value, strong, color, sub }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.6 }}>
        <Typography sx={{ fontSize: 13, color: strong ? T.ink : T.ink2, fontWeight: strong ? 650 : 400 }}>
            {label}
            {sub && <Box component="span" sx={{ color: T.ink3, fontWeight: 400 }}> {sub}</Box>}
        </Typography>
        <Typography className="num" sx={{ fontSize: strong ? 14 : 13, fontWeight: strong ? 650 : 500, color }}>{value}</Typography>
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
    const [moreAnchor, setMoreAnchor] = useState(null);
    const location = useLocation();
    const [justCreated, setJustCreated] = useState(Boolean(location.state?.created));
    const [confirm, setConfirm] = useState(null); // { action, title, text, label, color }
    const b = q.data;

    if (!b)
        return (
            <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography sx={{ color: T.ink2 }}>{q.loading ? 'Loading booking…' : 'Booking not found'}</Typography>
                {!q.loading && <Button component={Link} to="/hotel/bookings" sx={{ mt: 2 }} variant="outlined" color="inherit">Back to reservations</Button>}
            </Box>
        );

    const today = todayISO();
    const nights = daysBetween(b.checkIn, b.checkOut);
    const active = !['CANCELLED', 'NO_SHOW'].includes(b.status);
    const canCharge = ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(b.status);
    const locked = b.status === 'CHECKED_OUT';
    const bill = b.bill;
    const arrivalOk = b.checkIn <= today;

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

    // one ledger: room nights and extras on the debit side, payments on the credit side
    const ledger = [
        ...bill.roomLines.map((l, i) => ({ key: `n${i}`, date: l.date, order: 0, text: `Room ${b.roomNumber} · ${b.roomTypeName}`, detail: bill.discount > 0 ? `Rate ${inr(l.unitPrice)}, less discount` : 'Room night', rate: l.taxable, gst: l.tax, gstPercent: l.gstPercent, debit: r2(l.taxable + l.tax) })),
        ...bill.chargeLines.map((c) => ({ key: `c${c.id}`, date: c.date, order: 1, text: c.description, detail: `${CHARGE_CATEGORIES.find((x) => x.id === c.category)?.name || c.category} · ${c.quantity} × ${inr(c.unitPrice)}`, rate: c.amount, gst: c.tax, gstPercent: c.gstPercent, debit: r2(c.amount + c.tax), remove: () => run(() => api.bookings.removeCharge(id, c.id), 'Charge removed') })),
        ...b.payments.map((p) => ({ key: `p${p.id}`, date: String(p.paidAt).slice(0, 10), order: 2, text: `Payment · ${PAY_METHODS.find((m) => m.id === p.method)?.name || p.method}`, detail: [p.reference, p.note].filter(Boolean).join(' · '), credit: p.amount, remove: () => run(() => api.bookings.removePayment(id, p.id), 'Payment removed') }))
    ].sort((x, y) => (x.date === y.date ? x.order - y.order : x.date < y.date ? -1 : 1));
    let running = 0;
    ledger.forEach((l) => {
        running = r2(running + (l.debit || 0) - (l.credit || 0));
        l.balance = running;
    });
    // GST and discounts are rounded per night; show the paisa difference so the folio always ties to the bill
    const roundOff = r2(bill.balance - running);
    if (roundOff !== 0) ledger.push({ key: 'round', date: ledger.length ? ledger[ledger.length - 1].date : b.checkIn, text: 'Rounding adjustment', detail: 'Paisa differences from per-night GST', debit: roundOff > 0 ? roundOff : undefined, credit: roundOff < 0 ? -roundOff : undefined, balance: bill.balance, muted: true });

    const primary =
        b.status === 'PENDING' ? (
            <Button variant="contained" onClick={() => act('confirm', 'Booking confirmed')}>Confirm booking</Button>
        ) : b.status === 'CONFIRMED' ? (
            <Tooltip title={arrivalOk ? '' : `Arrival is on ${formatDate(b.checkIn)}`}>
                <span><Button variant="contained" disabled={!arrivalOk} onClick={() => act('checkin', 'Guest checked in')}>Check in</Button></span>
            </Tooltip>
        ) : b.status === 'CHECKED_IN' ? (
            <Button variant="contained" onClick={() => setConfirm({ action: 'checkout', title: 'Check out this guest?', label: 'Check out', color: 'primary', text: bill.balance > 0 ? `${inr(bill.balance)} is still unpaid. You can record the payment now or after checkout.` : 'The folio is settled. The room will be marked for cleaning and the tax invoice issued.' })}>Check out</Button>
        ) : null;

    const moreItems = [
        ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(b.status) && { label: 'Edit booking', icon: <EditOutlinedIcon fontSize="small" />, onClick: () => setEditing(true) },
        b.status === 'PENDING' && arrivalOk && { label: 'Check in now', icon: <CheckIcon fontSize="small" />, onClick: () => act('checkin', 'Guest checked in') },
        ['CONFIRMED', 'PENDING'].includes(b.status) && b.checkIn <= today && { label: 'Mark as no-show', icon: <EventBusyOutlinedIcon fontSize="small" />, onClick: () => setConfirm({ action: 'noshow', title: 'Mark as no-show?', label: 'Mark no-show', color: 'error', text: 'The guest did not arrive. The room becomes free again.' }) },
        ['PENDING', 'CONFIRMED'].includes(b.status) && { label: 'Cancel booking', icon: <CancelOutlinedIcon fontSize="small" />, danger: true, onClick: () => setConfirm({ action: 'cancel', title: 'Cancel this booking?', label: 'Cancel booking', color: 'error', text: 'The room becomes free again.' + (bill.paid > 0 ? ` ${inr(bill.paid)} was received as advance; refund it separately.` : '') }) }
    ].filter(Boolean);

    return (
        <>
            <Button component={Link} to="/hotel/bookings" startIcon={<ArrowBackIcon />} color="inherit" size="small" sx={{ mb: 1, color: T.ink2, px: 0.5 }}>Reservations</Button>

            <Box sx={{ display: 'flex', alignItems: { md: 'flex-end' }, justifyContent: 'space-between', flexDirection: { xs: 'column', md: 'row' }, gap: 1.5, mb: 2 }}>
                <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                        <Typography variant="h4" component="h1">{b.customerName}</Typography>
                        <BookingChip status={b.status} />
                        {b.invoice && <Pill tone="brand" dot={false} label={`Invoice ${b.invoice.invoiceNumber}`} />}
                    </Box>
                    <Typography sx={{ mt: 0.25, fontSize: 13, color: T.ink2 }}>
                        <Box component="span" sx={{ fontWeight: 600, color: T.ink }}>{b.bookingNumber}</Box>
                        {b.companyName ? ` · ${b.companyName}` : ''} · Room {b.roomNumber}, {b.roomTypeName} · {formatDate(b.checkIn)} – {formatDate(b.checkOut)}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {active && <Button variant="outlined" color="inherit" startIcon={<SendOutlinedIcon />} onClick={() => setShareKind(b.status === 'CHECKED_OUT' ? 'bill' : 'confirmation')}>Send to guest</Button>}
                    {active && <Button variant="outlined" color="inherit" startIcon={<ReceiptLongOutlinedIcon />} onClick={() => window.open(`/print/booking/${id}`, '_blank')}>{b.invoice ? 'Tax invoice' : 'Proforma'}</Button>}
                    {moreItems.length > 0 && (
                        <IconButton aria-label="More actions" onClick={(e) => setMoreAnchor(e.currentTarget)} sx={{ border: `1px solid ${T.line2}`, width: 32, height: 32, bgcolor: T.panel }}>
                            <MoreHorizIcon fontSize="small" />
                        </IconButton>
                    )}
                    {primary}
                </Box>
            </Box>
            <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={() => setMoreAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
                {moreItems.map((m) => (
                    <MenuItem key={m.label} onClick={() => { setMoreAnchor(null); m.onClick(); }} sx={{ color: m.danger ? T.error : undefined }}>
                        <ListItemIcon sx={{ color: 'inherit' }}>{m.icon}</ListItemIcon>
                        {m.label}
                    </MenuItem>
                ))}
            </Menu>

            <StatusTrack status={b.status} />

            {justCreated && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setJustCreated(false)} action={<Button color="inherit" size="small" onClick={() => { setJustCreated(false); setShareKind('confirmation'); }}>Send confirmation</Button>}>
                    Booking created. Send the guest their confirmation on WhatsApp or email?
                </Alert>
            )}
            {b.status === 'CHECKED_OUT' && bill.balance > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => setPayOpen(true)}>Record payment</Button>}>
                    {inr(bill.balance)} is still due on this booking.
                </Alert>
            )}

            <Grid container spacing={2}>
                <Grid item xs={12} lg={8}>
                    <Panel title="Reservation">
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
                            <Field label="Arrival">{formatDate(b.checkIn)}</Field>
                            <Field label="Departure">{formatDate(b.checkOut)}</Field>
                            <Field label="Nights"><span className="num">{nights}</span></Field>
                            <Field label="Occupancy">{b.adults} adult{b.adults > 1 ? 's' : ''}{b.children ? `, ${b.children} child${b.children > 1 ? 'ren' : ''}` : ''}</Field>
                            <Field label="Room">{b.roomNumber} · {b.roomTypeName}</Field>
                            <Field label="Source">{BOOKING_SOURCES.find((s) => s.id === b.source)?.name || b.source}</Field>
                            <Field label="Checked in at">{b.checkedInAt ? new Date(b.checkedInAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</Field>
                            <Field label="Discount">{bill.discount > 0 ? inr(bill.discount) : '—'}</Field>
                        </Box>
                        {b.notes && (
                            <Box sx={{ mt: 2, p: 1.5, bgcolor: T.subtle, border: `1px solid ${T.line}`, borderRadius: '6px' }}>
                                <Typography sx={{ fontSize: 11.5, color: T.ink3, mb: 0.25 }}>Notes</Typography>
                                <Typography sx={{ fontSize: 13, whiteSpace: 'pre-line' }}>{b.notes}</Typography>
                            </Box>
                        )}
                    </Panel>

                    <Panel
                        title="Folio"
                        subtitle="Room nights, extras and payments in date order"
                        padded={false}
                        sx={{ mt: 2 }}
                        action={
                            <>
                                <Button size="small" variant="outlined" color="inherit" startIcon={<AddIcon />} onClick={() => setChargeOpen(true)} disabled={!canCharge}>Charge</Button>
                                <Button size="small" variant="outlined" color="inherit" startIcon={<AddIcon />} onClick={() => setPayOpen(true)} disabled={!active}>Payment</Button>
                            </>
                        }
                    >
                        <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small" sx={{ '& td[class*=alignRight], & th[class*=alignRight]': { whiteSpace: 'nowrap' } }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell sx={{ minWidth: 220 }}>Description</TableCell>
                                        <TableCell align="right">Amount</TableCell>
                                        <TableCell align="right">GST</TableCell>
                                        <TableCell align="right">Debit</TableCell>
                                        <TableCell align="right">Credit</TableCell>
                                        <TableCell align="right">Balance</TableCell>
                                        <TableCell sx={{ width: 36 }} />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {ledger.map((l) => (
                                        <TableRow key={l.key} hover>
                                            <TableCell sx={{ whiteSpace: 'nowrap', color: T.ink2 }}>{formatDate(l.date)}</TableCell>
                                            <TableCell>
                                                <Typography sx={{ fontSize: 13, fontWeight: l.credit && !l.muted ? 600 : 500, color: l.muted ? T.ink3 : l.credit ? T.success : T.ink }}>{l.text}</Typography>
                                                {l.detail && <Typography sx={{ fontSize: 12, color: T.ink3 }}>{l.detail}</Typography>}
                                            </TableCell>
                                            <TableCell align="right">{l.rate !== undefined ? inr(l.rate) : ''}</TableCell>
                                            <TableCell align="right" sx={{ color: T.ink2 }}>{l.gst !== undefined ? <Tooltip title={`${l.gstPercent}%`}><span>{inr(l.gst)}</span></Tooltip> : ''}</TableCell>
                                            <TableCell align="right">{l.debit ? inr(l.debit) : ''}</TableCell>
                                            <TableCell align="right" sx={{ color: T.success }}>{l.credit ? inr(l.credit) : ''}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>{inr(l.balance)}</TableCell>
                                            <TableCell align="right" sx={{ py: 0 }}>
                                                {l.remove && !locked && (
                                                    <IconButton size="small" aria-label={`Remove ${l.text}`} onClick={l.remove} sx={{ color: T.ink3, '&:hover': { color: T.error } }}>
                                                        <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                                                    </IconButton>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow sx={{ '& td': { bgcolor: T.subtle, fontWeight: 650, borderTop: `1px solid ${T.line2}` } }}>
                                        <TableCell colSpan={4}>Closing balance</TableCell>
                                        <TableCell align="right">{inr(bill.total)}</TableCell>
                                        <TableCell align="right" sx={{ color: T.success }}>{inr(bill.paid)}</TableCell>
                                        <TableCell align="right" sx={{ color: bill.balance > 0 ? T.error : T.success }}>{inr(bill.balance)}</TableCell>
                                        <TableCell />
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </Box>
                    </Panel>
                </Grid>

                <Grid item xs={12} lg={4}>
                    <Box sx={{ position: { lg: 'sticky' }, top: { lg: 72 }, display: 'grid', gap: 2 }}>
                        <Panel title="Folio summary">
                            <SumRow label="Room charges" sub={`(${nights} night${nights > 1 ? 's' : ''})`} value={inr(bill.roomSubtotal)} />
                            {bill.discount > 0 && <SumRow label="Discount" value={`− ${inr(bill.discount)}`} />}
                            <SumRow label="Food & other charges" value={inr(bill.chargesSubtotal)} />
                            <SumRow label="CGST" value={inr(r2(bill.taxTotal / 2))} />
                            <SumRow label="SGST" value={inr(r2(bill.taxTotal - r2(bill.taxTotal / 2)))} />
                            <Divider sx={{ my: 0.75 }} />
                            <SumRow label="Total" value={inr(bill.total)} strong />
                            <SumRow label="Received" value={inr(bill.paid)} color={T.success} />
                            <Box sx={{ mt: 1.25, p: 1.5, borderRadius: '6px', bgcolor: bill.balance > 0 ? '#FDF3F2' : '#F1F8F4', border: `1px solid ${bill.balance > 0 ? '#EFC5C1' : '#C3E0CF'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{ fontSize: 13, fontWeight: 600, color: bill.balance > 0 ? T.error : T.success }}>{bill.balance > 0 ? 'Balance due' : bill.balance < 0 ? 'To refund' : 'Settled'}</Typography>
                                <Typography className="num" sx={{ fontSize: 18, fontWeight: 700, color: bill.balance > 0 ? T.error : T.success }}>{inr(Math.abs(bill.balance))}</Typography>
                            </Box>
                            {active && bill.balance > 0 && <Button fullWidth variant="contained" sx={{ mt: 1.5 }} onClick={() => setPayOpen(true)}>Collect {inr(bill.balance)}</Button>}
                            <Typography sx={{ display: 'block', mt: 1.5, fontSize: 11.5, color: T.ink3 }}>Room nights stay at the rate quoted when booked; later rate changes don't affect this folio.</Typography>
                        </Panel>

                        <Panel title="Guest">
                            <Box sx={{ display: 'grid', gap: 1.5 }}>
                                <Field label="Name">{b.customerName}</Field>
                                {b.companyName && <Field label="Company">{b.companyName}</Field>}
                                <Field label="Phone">{b.customerPhone || '—'}</Field>
                                <Field label="Email">{b.customerEmail || '—'}</Field>
                                {b.customerGstin && <Field label="GSTIN">{b.customerGstin}</Field>}
                            </Box>
                            <Button component={Link} to={`/hotel/bookings?customerId=${b.customerId}`} size="small" color="inherit" sx={{ mt: 1.5, px: 0.5, color: T.brand }}>All stays of this guest</Button>
                        </Panel>
                    </Box>
                </Grid>
            </Grid>

            <ShareDialog open={Boolean(shareKind)} booking={b} defaultKind={shareKind || 'confirmation'} onClose={() => setShareKind(null)} />
            <BookingDialog open={editing} booking={b} onClose={() => setEditing(false)} onSaved={(u) => { setEditing(false); q.setData(u); }} />

            <FormDialog
                open={chargeOpen}
                title="Add charge"
                subtitle="Posts to the guest's folio and final invoice"
                fields={[
                    { name: 'category', label: 'Category', type: 'select', required: true, options: CHARGE_CATEGORIES, onChange: (v, set) => set('gstPercent', CHARGE_CATEGORIES.find((c) => c.id === v)?.gst ?? 18) },
                    { name: 'description', label: 'Description', type: 'text', placeholder: 'e.g. Dinner, 2 persons' },
                    { name: 'quantity', label: 'Quantity', type: 'number', half: true },
                    { name: 'unitPrice', label: 'Price each (₹)', type: 'number', half: true },
                    { name: 'gstPercent', label: 'GST %', type: 'number', half: true, helperText: 'Set from the category; change if needed' },
                    { name: 'chargeDate', label: 'Date', type: 'date', half: true }
                ]}
                initialValues={{ category: 'RESTAURANT', quantity: 1, gstPercent: 5, chargeDate: today }}
                validationSchema={chargeSchema}
                onSubmit={async (v) => { const u = await api.bookings.addCharge(id, { ...v, quantity: Number(v.quantity), unitPrice: Number(v.unitPrice), gstPercent: Number(v.gstPercent), description: v.description.trim() }); q.setData(u); setChargeOpen(false); toast.success('Charge added'); }}
                onClose={() => setChargeOpen(false)}
                submitLabel="Post charge"
            />

            <FormDialog
                open={payOpen}
                title="Record payment"
                subtitle={`Balance due ${inr(Math.max(bill.balance, 0))}`}
                fields={[
                    { name: 'amount', label: 'Amount (₹)', type: 'number' },
                    { name: 'method', label: 'Paid by', type: 'select', required: true, options: PAY_METHODS, half: true },
                    { name: 'reference', label: 'Reference / UPI id', type: 'text', half: true },
                    { name: 'note', label: 'Note', type: 'text' }
                ]}
                initialValues={{ amount: Math.max(bill.balance, 0) || '', method: 'CASH' }}
                validationSchema={paySchema}
                onSubmit={async (v) => { const u = await api.bookings.addPayment(id, { ...v, amount: Number(v.amount) }); q.setData(u); setPayOpen(false); toast.success('Payment recorded'); }}
                onClose={() => setPayOpen(false)}
                submitLabel="Record payment"
            />

            <ConfirmDialog
                open={Boolean(confirm)}
                title={confirm?.title}
                confirmLabel={confirm?.label}
                color={confirm?.color}
                onClose={() => setConfirm(null)}
                onConfirm={async () => { const c = confirm; setConfirm(null); await act(c.action, c.action === 'checkout' ? 'Guest checked out. The tax invoice is ready.' : undefined); if (c.action === 'cancel') navigate('/hotel/bookings'); }}
            >
                {confirm?.text}
            </ConfirmDialog>
        </>
    );
};

export default BookingDetail;
