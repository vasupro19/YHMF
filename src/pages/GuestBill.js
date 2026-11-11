import { Alert, Box, Button, Chip, Divider, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import { useParams } from 'react-router-dom';
import { publicBill } from 'api';
import UpiQr from 'components/UpiQr';
import Loader from 'components/Loader';
import useAsync from 'hooks/useAsync';
import { BOOKING_STATUSES, CHARGE_CATEGORIES } from 'utils/constants';
import { daysBetween, fileUrl, formatDate, inr, upiLink } from 'utils/format';
import { APP_NAME } from 'utils/constants';

// what the guest sees when they open their bill link: no login, made for a phone
const GuestBill = () => {
    const { token } = useParams();
    const q = useAsync(() => publicBill(token), { initial: null, deps: [token] });
    if (q.loading && !q.data) return <Loader />;
    if (!q.data) return (
        <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3, textAlign: 'center' }}>
            <Box><Typography variant="h5">We couldn't open this bill</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>{q.error?.message || 'The link may be wrong or may have been replaced. Please ask the hotel for a new one.'}</Typography></Box>
        </Box>
    );

    const { hotel: h, booking: b } = q.data;
    const bill = b.bill;
    const nights = daysBetween(b.checkIn, b.checkOut);
    const status = BOOKING_STATUSES[b.status];
    const rateGroups = Object.values(bill.roomLines.reduce((m, l) => { const k = `${l.unitPrice}|${l.gstPercent}`; m[k] = m[k] || { ...l, qty: 0, total: 0 }; m[k].qty += 1; m[k].total += l.amount; return m; }, {}));
    const canPay = h.upiId && bill.balance > 0 && !['CANCELLED', 'NO_SHOW'].includes(b.status);
    const pay = canPay ? upiLink({ upiId: h.upiId, name: h.name, amount: bill.balance, note: `Booking ${b.bookingNumber}` }) : '';

    return (
        <Box sx={{ bgcolor: '#f3f5fa', minHeight: '100vh', py: { xs: 0, sm: 4 }, color: '#111c33' }}>
            <Box sx={{ maxWidth: 640, mx: 'auto', bgcolor: '#fff', borderRadius: { xs: 0, sm: '20px' }, boxShadow: { sm: 3 }, overflow: 'hidden' }}>
                <Box sx={{ p: 3, color: '#fff', background: 'linear-gradient(135deg, #1f3a73 0%, #10234a 100%)', display: 'flex', gap: 2, alignItems: 'center' }}>
                    {h.logoPath && <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: 0.75, lineHeight: 0 }}><img src={fileUrl(h.logoPath)} alt="" style={{ maxHeight: 48, maxWidth: 90, objectFit: 'contain' }} /></Box>}
                    <Box>
                        <Typography variant="h5">{h.name || 'Your hotel'}</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>{[h.address, h.phone].filter(Boolean).join(' · ')}</Typography>
                    </Box>
                </Box>

                <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Box>
                            <Typography variant="overline" sx={{ color: '#5b6b87' }}>{b.invoiceNumber ? 'Tax invoice' : 'Your booking'}</Typography>
                            <Typography variant="h6">{b.invoiceNumber || b.bookingNumber}</Typography>
                        </Box>
                        {status && <Chip label={status.label} color={status.color} />}
                    </Box>

                    <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        {[['Guest', b.companyName || b.guestName], ['Room', `${b.roomTypeName}${b.roomNumber ? ` · ${b.roomNumber}` : ''}`], ['Check-in', `${formatDate(b.checkIn)}${h.checkInTime ? ` · from ${h.checkInTime}` : ''}`], ['Check-out', `${formatDate(b.checkOut)}${h.checkOutTime ? ` · by ${h.checkOutTime}` : ''}`], ['Stay', `${nights} night${nights > 1 ? 's' : ''}, ${b.adults} adult${b.adults > 1 ? 's' : ''}${b.children ? `, ${b.children} child${b.children > 1 ? 'ren' : ''}` : ''}`], ['Booking', b.bookingNumber]].map(([k, v]) => (
                            <Box key={k}><Typography variant="caption" sx={{ color: '#5b6b87' }}>{k}</Typography><Typography sx={{ fontWeight: 600 }}>{v}</Typography></Box>
                        ))}
                    </Box>

                    <Box sx={{ overflowX: 'auto', mt: 3 }}>
                        <Table size="small" sx={{ '& td, & th': { color: '#111c33', borderColor: '#e6eaf2' } }}>
                            <TableHead><TableRow><TableCell>Item</TableCell><TableCell align="right">Qty</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
                            <TableBody>
                                {rateGroups.map((g) => <TableRow key={`${g.unitPrice}${g.gstPercent}`}><TableCell>Room tariff<Typography variant="caption" sx={{ display: 'block', color: '#5b6b87' }}>{inr(g.unitPrice)} per night</Typography></TableCell><TableCell align="right">{g.qty}</TableCell><TableCell align="right">{inr(g.total)}</TableCell></TableRow>)}
                                {bill.discount > 0 && <TableRow><TableCell colSpan={2}>Discount</TableCell><TableCell align="right">− {inr(bill.discount)}</TableCell></TableRow>}
                                {bill.chargeLines.map((c) => <TableRow key={c.id}><TableCell>{c.description}<Typography variant="caption" sx={{ display: 'block', color: '#5b6b87' }}>{CHARGE_CATEGORIES.find((x) => x.id === c.category)?.name || c.category} · {formatDate(c.date)}</Typography></TableCell><TableCell align="right">{c.quantity}</TableCell><TableCell align="right">{inr(c.amount)}</TableCell></TableRow>)}
                            </TableBody>
                        </Table>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                        {[['GST', bill.taxTotal]].map(([l, v]) => <Box key={l} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}><span>{l}</span><span>{inr(v)}</span></Box>)}
                        <Divider sx={{ my: 0.75 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 19 }}><span>Total</span><span>{inr(bill.total)}</span></Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}><span>Paid</span><span>{inr(bill.paid)}</span></Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: bill.balance > 0 ? '#dc2626' : '#15803d' }}><span>{bill.balance > 0 ? 'Balance to pay' : 'Balance'}</span><span>{bill.balance > 0 ? inr(bill.balance) : bill.balance < 0 ? `${inr(-bill.balance)} refundable` : 'Nil'}</span></Box>
                    </Box>

                    {canPay && (
                        <Box sx={{ mt: 3, p: 2.5, borderRadius: '16px', border: '1px solid #e6eaf2', textAlign: 'center' }}>
                            <Button href={pay} variant="contained" size="large" startIcon={<PaymentsOutlinedIcon />} fullWidth sx={{ display: { sm: 'none' } }}>Pay {inr(bill.balance)} by UPI</Button>
                            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                                <Typography sx={{ fontWeight: 600, mb: 1 }}>Scan to pay {inr(bill.balance)}</Typography>
                                <UpiQr link={pay} size={180} />
                            </Box>
                            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#5b6b87' }}>Pays to {h.upiId}. The hotel will mark it received.</Typography>
                        </Box>
                    )}
                    {b.status === 'CANCELLED' && <Alert severity="warning" sx={{ mt: 2 }}>This booking was cancelled.</Alert>}

                    {b.payments.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="overline" sx={{ color: '#5b6b87' }}>Payments received</Typography>
                            {b.payments.map((p, i) => <Typography key={i} variant="body2">{new Date(p.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · {p.method.toLowerCase()} · {inr(p.amount)}</Typography>)}
                        </Box>
                    )}
                    {h.gstin && <Typography variant="caption" sx={{ display: 'block', mt: 3, color: '#5b6b87' }}>Hotel GSTIN: {h.gstin}</Typography>}
                    {h.policy && <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#5b6b87', whiteSpace: 'pre-line' }}>{h.policy}</Typography>}

                    <Button onClick={() => window.print()} startIcon={<PrintIcon />} color="inherit" sx={{ mt: 3, '@media print': { display: 'none' } }}>Print or save as PDF</Button>
                </Box>
                <Box sx={{ py: 1.5, textAlign: 'center', bgcolor: '#f8fafc', borderTop: '1px solid #e6eaf2' }}><Typography variant="caption" sx={{ color: '#5b6b87' }}>Bill by {APP_NAME} · Your Hotel Manager</Typography></Box>
            </Box>
        </Box>
    );
};

export default GuestBill;
