import { Box, Button, Divider, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import { useParams } from 'react-router-dom';
import { useAuth } from 'context/Auth';
import useHotel from 'hooks/useHotel';
import useAsync from 'hooks/useAsync';
import Loader from 'components/Loader';
import { BOOKING_SOURCES, CHARGE_CATEGORIES } from 'utils/constants';
import { daysBetween, fileUrl, formatDate, inr } from 'utils/format';

const half = (n) => Math.round((n / 2) * 100) / 100;

// the bill handed to the guest; opens on its own page so it prints cleanly
const Invoice = () => {
    const { id } = useParams();
    const { api } = useHotel();
    const { user } = useAuth();
    const q = useAsync(() => api.bookings.invoice(id), { initial: null, deps: [id] });
    if (!q.data) return q.loading ? <Loader /> : <Typography sx={{ p: 4 }}>Bill not found.</Typography>;
    const { booking: b, settings: s, proforma } = q.data;
    const bill = b.bill;
    const nights = daysBetween(b.checkIn, b.checkOut);
    const rateGroups = Object.values(bill.roomLines.reduce((m, l) => { const k = `${l.unitPrice}|${l.gstPercent}`; m[k] = m[k] || { ...l, qty: 0, total: 0 }; m[k].qty += 1; m[k].total += l.amount; return m; }, {}));

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 3, '@media print': { bgcolor: '#fff', py: 0 } }}>
            <Box sx={{ maxWidth: 820, mx: 'auto', mb: 2, display: 'flex', justifyContent: 'flex-end', gap: 1, '@media print': { display: 'none' } }}>
                <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>Print / save as PDF</Button>
            </Box>
            <Box sx={{ maxWidth: 820, mx: 'auto', bgcolor: '#fff', color: '#111', p: { xs: 3, sm: 5 }, boxShadow: 2, borderRadius: 2, '@media print': { boxShadow: 'none', p: 0, maxWidth: 'none' } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                        {s.logoPath && <img src={fileUrl(s.logoPath)} alt="" style={{ maxHeight: 64, maxWidth: 120, objectFit: 'contain' }} />}
                        <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>{s.hotelName || user.name}</Typography>
                        {s.address && <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{s.address}</Typography>}
                        <Typography variant="body2">{[s.phone, s.email].filter(Boolean).join(' · ')}</Typography>
                        {s.gstin && <Typography variant="body2">GSTIN: {s.gstin}</Typography>}
                        </Box>
                    </Box>
                    <Box sx={{ textAlign: { sm: 'right' } }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 1 }}>{proforma ? 'PROFORMA BILL' : 'TAX INVOICE'}</Typography>
                        <Typography variant="body2">{b.invoice ? `Invoice no: ${b.invoice.invoiceNumber}` : 'Not final. The stay is not checked out.'}</Typography>
                        <Typography variant="body2">{b.invoice ? `Date: ${new Date(b.invoice.issuedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}` : `Date: ${formatDate(new Date().toISOString().slice(0, 10))}`}</Typography>
                        <Typography variant="body2">Booking: {b.bookingNumber}</Typography>
                    </Box>
                </Box>
                <Divider sx={{ my: 2.5 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <Box>
                        <Typography variant="overline" sx={{ color: "#666" }}>Billed to</Typography>
                        <Typography sx={{ fontWeight: 600 }}>{b.companyName || b.customerName}</Typography>
                        {b.companyName && <Typography variant="body2">Attn: {b.customerName}</Typography>}
                        {b.customerAddress && <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{b.customerAddress}</Typography>}
                        {b.customerPhone && <Typography variant="body2">{b.customerPhone}</Typography>}
                        {b.customerGstin && <Typography variant="body2">GSTIN: {b.customerGstin}</Typography>}
                    </Box>
                    <Box>
                        <Typography variant="overline" sx={{ color: "#666" }}>Stay</Typography>
                        <Typography variant="body2">Room {b.roomNumber} · {b.roomTypeName}</Typography>
                        <Typography variant="body2">{formatDate(b.checkIn)} to {formatDate(b.checkOut)} ({nights} night{nights > 1 ? 's' : ''})</Typography>
                        <Typography variant="body2">{b.adults} adult{b.adults > 1 ? 's' : ''}{b.children ? `, ${b.children} child${b.children > 1 ? 'ren' : ''}` : ''}</Typography>
                        <Typography variant="body2">Booked via {BOOKING_SOURCES.find((x) => x.id === b.source)?.name || b.source}</Typography>
                    </Box>
                </Box>

                <Table size="small" sx={{ mt: 3, '& td, & th': { color: '#111', borderColor: '#ddd' } }}>
                    <TableHead><TableRow><TableCell>Description</TableCell><TableCell align="right">Qty</TableCell><TableCell align="right">Rate</TableCell><TableCell align="right">GST</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
                    <TableBody>
                        {rateGroups.map((g) => (
                            <TableRow key={`${g.unitPrice}${g.gstPercent}`}><TableCell>Room tariff, {b.roomTypeName} (Room {b.roomNumber})</TableCell><TableCell align="right">{g.qty} night{g.qty > 1 ? 's' : ''}</TableCell><TableCell align="right">{inr(g.unitPrice)}</TableCell><TableCell align="right">{g.gstPercent}%</TableCell><TableCell align="right">{inr(g.total)}</TableCell></TableRow>
                        ))}
                        {bill.discount > 0 && <TableRow><TableCell colSpan={4}>Discount</TableCell><TableCell align="right">− {inr(bill.discount)}</TableCell></TableRow>}
                        {bill.chargeLines.map((c) => (
                            <TableRow key={c.id}><TableCell>{c.description} <Typography component="span" variant="caption" sx={{ color: '#666' }}>({CHARGE_CATEGORIES.find((x) => x.id === c.category)?.name || c.category}, {formatDate(c.date)})</Typography></TableCell><TableCell align="right">{c.quantity}</TableCell><TableCell align="right">{inr(c.unitPrice)}</TableCell><TableCell align="right">{c.gstPercent}%</TableCell><TableCell align="right">{inr(c.amount)}</TableCell></TableRow>
                        ))}
                    </TableBody>
                </Table>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap', mt: 3 }}>
                    <Box sx={{ minWidth: 260 }}>
                        <Typography variant="overline" sx={{ color: "#666" }}>GST summary</Typography>
                        <Table size="small" sx={{ '& td, & th': { color: '#111', borderColor: '#ddd', py: 0.5 } }}>
                            <TableHead><TableRow><TableCell>Rate</TableCell><TableCell align="right">Taxable</TableCell><TableCell align="right">CGST</TableCell><TableCell align="right">SGST</TableCell></TableRow></TableHead>
                            <TableBody>{bill.gstBreakup.map((g) => <TableRow key={g.percent}><TableCell>{g.percent}%</TableCell><TableCell align="right">{inr(g.taxable)}</TableCell><TableCell align="right">{inr(half(g.tax))}</TableCell><TableCell align="right">{inr(g.tax - half(g.tax))}</TableCell></TableRow>)}</TableBody>
                        </Table>
                    </Box>
                    <Box sx={{ minWidth: 260, flex: '0 1 320px' }}>
                        {[['Room charges', bill.roomSubtotal - bill.discount], ['Food & other charges', bill.chargesSubtotal], ['GST', bill.taxTotal]].map(([l, v]) => (
                            <Box key={l} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}><span>{l}</span><span>{inr(v)}</span></Box>
                        ))}
                        <Divider sx={{ my: 0.75 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18 }}><span>Total</span><span>{inr(bill.total)}</span></Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}><span>Paid</span><span>{inr(bill.paid)}</span></Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}><span>{bill.balance > 0 ? 'Balance due' : 'Balance'}</span><span>{bill.balance > 0 ? inr(bill.balance) : bill.balance < 0 ? `${inr(-bill.balance)} refundable` : 'Nil'}</span></Box>
                    </Box>
                </Box>

                {b.payments.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="overline" sx={{ color: "#666" }}>Payments received</Typography>
                        {b.payments.map((p) => <Typography key={p.id} variant="body2">{new Date(p.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · {p.method}{p.reference ? ` (${p.reference})` : ''} · {inr(p.amount)}</Typography>)}
                    </Box>
                )}
                <Divider sx={{ my: 3 }} />
                {s.policy && <Typography variant="caption" sx={{ color: '#555', display: 'block', whiteSpace: 'pre-line', mb: 1.5 }}>{s.policy}</Typography>}
                <Typography variant="body2" sx={{ color: '#555', textAlign: 'center' }}>Thank you for staying with us. Check-out time {s.checkOutTime}.</Typography>
            </Box>
        </Box>
    );
};

export default Invoice;
