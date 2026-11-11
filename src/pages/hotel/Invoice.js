import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import { useParams } from 'react-router-dom';
import { useAuth } from 'context/Auth';
import useHotel from 'hooks/useHotel';
import useAsync from 'hooks/useAsync';
import Loader from 'components/Loader';
import { BOOKING_SOURCES, CHARGE_CATEGORIES, PAY_METHODS } from 'utils/constants';
import { daysBetween, fileUrl, formatDate, inr } from 'utils/format';

const r2 = (n) => Math.round(n * 100) / 100;
const half = (n) => r2(n / 2);
const money = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// services accounting codes printed on GST invoices
const SAC = { ROOM: '996311', RESTAURANT: '996331', FOOD: '996331', MINIBAR: '996331', LAUNDRY: '999712', SPA: '999722', TRANSPORT: '996601', OTHER: '999799' };

// 125050.5 -> "Rupees One Lakh Twenty-Five Thousand Fifty and Fifty Paise Only"
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const twoDigits = (n) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? `-${ONES[n % 10]}` : ''}`);
const threeDigits = (n) => [n >= 100 ? `${ONES[Math.floor(n / 100)]} Hundred` : '', twoDigits(n % 100)].filter(Boolean).join(' ');
const inWords = (amount) => {
    const value = Math.abs(Number(amount) || 0);
    let rupees = Math.floor(value);
    const paise = Math.round((value - rupees) * 100);
    const parts = [];
    [[10000000, 'Crore'], [100000, 'Lakh'], [1000, 'Thousand']].forEach(([size, name]) => {
        if (rupees >= size) {
            parts.push(`${size === 10000000 ? inWordsInt(Math.floor(rupees / size)) : twoDigits(Math.floor(rupees / size))} ${name}`);
            rupees %= size;
        }
    });
    if (rupees) parts.push(threeDigits(rupees));
    const words = parts.join(' ') || 'Zero';
    return `Rupees ${words}${paise ? ` and ${twoDigits(paise)} Paise` : ''} Only`;
};
function inWordsInt(n) {
    return inWords(n).replace(/^Rupees /, '').replace(/ Only$/, '');
}

const BRAND = '#7A1F2B';
const LINE = '#D9D5CF';
const INK = '#1C1A19';
const MUTED = '#6B6660';

const Label = ({ children }) => <Typography sx={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED, mb: 0.5 }}>{children}</Typography>;

// the bill handed to the guest; opens on its own page so it prints cleanly on A4
const Invoice = () => {
    const { id } = useParams();
    const { api } = useHotel();
    const { user } = useAuth();
    const q = useAsync(() => api.bookings.invoice(id), { initial: null, deps: [id] });
    if (!q.data) return q.loading ? <Loader /> : <Typography sx={{ p: 4 }}>Invoice not found.</Typography>;
    const { booking: b, settings: s, proforma } = q.data;
    const bill = b.bill;
    const nights = daysBetween(b.checkIn, b.checkOut);

    const roomGroups = Object.values(
        bill.roomLines.reduce((m, l) => {
            const k = `${l.unitPrice}|${l.gstPercent}`;
            m[k] = m[k] || { unitPrice: l.unitPrice, gstPercent: l.gstPercent, qty: 0, taxable: 0, tax: 0 };
            m[k].qty += 1;
            m[k].taxable = r2(m[k].taxable + l.taxable);
            m[k].tax = r2(m[k].tax + l.tax);
            return m;
        }, {})
    );
    const lines = [
        ...roomGroups.map((g) => ({
            key: `r${g.unitPrice}${g.gstPercent}`,
            text: `Room accommodation, ${b.roomTypeName} (Room ${b.roomNumber})`,
            detail: bill.discount > 0 ? `Tariff ${inr(g.unitPrice)} per night, after discount` : `${formatDate(b.checkIn)} to ${formatDate(b.checkOut)}`,
            sac: SAC.ROOM,
            qty: `${g.qty} night${g.qty > 1 ? 's' : ''}`,
            rate: r2(g.taxable / g.qty),
            taxable: g.taxable,
            gstPercent: g.gstPercent,
            tax: g.tax
        })),
        ...bill.chargeLines.map((c) => ({
            key: `c${c.id}`,
            text: c.description,
            detail: `${CHARGE_CATEGORIES.find((x) => x.id === c.category)?.name || c.category}, ${formatDate(c.date)}`,
            sac: SAC[c.category] || SAC.OTHER,
            qty: c.quantity,
            rate: c.unitPrice,
            taxable: c.amount,
            gstPercent: c.gstPercent,
            tax: c.tax
        }))
    ];
    const taxable = r2(lines.reduce((t, l) => t + l.taxable, 0));
    const cgst = half(bill.taxTotal);
    const sgst = r2(bill.taxTotal - cgst);
    const issued = b.invoice ? new Date(b.invoice.issuedAt) : new Date();
    const cell = { fontSize: 12, color: INK, borderColor: LINE, py: 0.9, px: 1.25 };
    const head = { ...cell, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: MUTED, bgcolor: '#F7F5F2' };

    return (
        <Box sx={{ bgcolor: '#EDEBE7', minHeight: '100vh', py: 4, px: 2, '@media print': { bgcolor: '#fff', p: 0 } }}>
            <Box sx={{ maxWidth: 860, mx: 'auto', mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', '@media print': { display: 'none' } }}>
                <Typography sx={{ fontSize: 13, color: MUTED }}>{proforma ? 'Proforma invoice: final figures are fixed at checkout.' : 'Tax invoice'}</Typography>
                <Button variant="contained" startIcon={<PrintOutlinedIcon />} onClick={() => window.print()}>Print / save as PDF</Button>
            </Box>

            <Box sx={{ maxWidth: 860, mx: 'auto', bgcolor: '#fff', color: INK, boxShadow: '0 1px 3px rgba(0,0,0,.08), 0 8px 24px rgba(0,0,0,.06)', borderTop: `4px solid ${BRAND}`, '@media print': { boxShadow: 'none', maxWidth: 'none' }, '@page': { size: 'A4', margin: '12mm' } }}>
                <Box sx={{ p: { xs: 3, sm: 5 }, '@media print': { p: 0, pt: 2 } }}>
                    {/* letterhead */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap', pb: 2.5, borderBottom: `1px solid ${LINE}` }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', minWidth: 0 }}>
                            {s.logoPath && <img src={fileUrl(s.logoPath)} alt="" style={{ maxHeight: 60, maxWidth: 120, objectFit: 'contain' }} />}
                            <Box>
                                <Typography sx={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>{s.hotelName || user.name}</Typography>
                                {s.address && <Typography sx={{ fontSize: 12, color: MUTED, whiteSpace: 'pre-line', mt: 0.25 }}>{s.address}</Typography>}
                                <Typography sx={{ fontSize: 12, color: MUTED }}>{[s.phone, s.email].filter(Boolean).join('  ·  ')}</Typography>
                                {s.gstin && <Typography sx={{ fontSize: 12, fontWeight: 600, mt: 0.25 }}>GSTIN: {s.gstin}</Typography>}
                            </Box>
                        </Box>
                        <Box sx={{ textAlign: { sm: 'right' } }}>
                            <Typography sx={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.08em', color: BRAND }}>{proforma ? 'PROFORMA INVOICE' : 'TAX INVOICE'}</Typography>
                            {!proforma && <Typography sx={{ fontSize: 11, color: MUTED }}>Original for recipient</Typography>}
                        </Box>
                    </Box>

                    {/* invoice facts */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, border: `1px solid ${LINE}`, borderRadius: '4px', mt: 2.5 }}>
                        {[
                            ['Invoice no.', b.invoice ? b.invoice.invoiceNumber : 'Not issued yet'],
                            ['Invoice date', issued.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
                            ['Booking no.', b.bookingNumber],
                            ['Booked via', BOOKING_SOURCES.find((x) => x.id === b.source)?.name || b.source]
                        ].map(([l, v], i) => (
                            <Box key={l} sx={{ px: 1.5, py: 1, borderLeft: { sm: i ? `1px solid ${LINE}` : 0, xs: i % 2 ? `1px solid ${LINE}` : 0 }, borderTop: { xs: i > 1 ? `1px solid ${LINE}` : 0, sm: 0 } }}>
                                <Label>{l}</Label>
                                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{v}</Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* parties */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mt: 2.5 }}>
                        <Box>
                            <Label>Billed to</Label>
                            <Typography sx={{ fontSize: 14, fontWeight: 650 }}>{b.companyName || b.customerName}</Typography>
                            {b.companyName && <Typography sx={{ fontSize: 12.5 }}>Guest: {b.customerName}</Typography>}
                            {b.customerAddress && <Typography sx={{ fontSize: 12.5, color: MUTED, whiteSpace: 'pre-line' }}>{b.customerAddress}</Typography>}
                            {b.customerPhone && <Typography sx={{ fontSize: 12.5, color: MUTED }}>{b.customerPhone}</Typography>}
                            {b.customerGstin && <Typography sx={{ fontSize: 12.5, fontWeight: 600, mt: 0.25 }}>GSTIN: {b.customerGstin}</Typography>}
                        </Box>
                        <Box>
                            <Label>Stay details</Label>
                            <Typography sx={{ fontSize: 12.5 }}>Room {b.roomNumber} · {b.roomTypeName}</Typography>
                            <Typography sx={{ fontSize: 12.5 }}>Arrival {formatDate(b.checkIn)} · Departure {formatDate(b.checkOut)}</Typography>
                            <Typography sx={{ fontSize: 12.5 }}>{nights} night{nights > 1 ? 's' : ''} · {b.adults} adult{b.adults > 1 ? 's' : ''}{b.children ? `, ${b.children} child${b.children > 1 ? 'ren' : ''}` : ''}</Typography>
                        </Box>
                    </Box>

                    {/* lines */}
                    <Box sx={{ mt: 3, overflowX: 'auto' }}>
                        <Table size="small" sx={{ border: `1px solid ${LINE}`, '& td, & th': { borderColor: LINE } }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ ...head, width: 28 }}>#</TableCell>
                                    <TableCell sx={head}>Description</TableCell>
                                    <TableCell sx={head}>SAC</TableCell>
                                    <TableCell sx={head} align="right">Qty</TableCell>
                                    <TableCell sx={head} align="right">Rate</TableCell>
                                    <TableCell sx={head} align="right">Taxable value</TableCell>
                                    <TableCell sx={head} align="right">GST</TableCell>
                                    <TableCell sx={head} align="right">Amount</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {lines.map((l, i) => (
                                    <TableRow key={l.key}>
                                        <TableCell sx={{ ...cell, color: MUTED }}>{i + 1}</TableCell>
                                        <TableCell sx={cell}>
                                            <Box sx={{ fontWeight: 600 }}>{l.text}</Box>
                                            <Box sx={{ fontSize: 11, color: MUTED }}>{l.detail}</Box>
                                        </TableCell>
                                        <TableCell sx={{ ...cell, color: MUTED }}>{l.sac}</TableCell>
                                        <TableCell sx={cell} align="right">{l.qty}</TableCell>
                                        <TableCell sx={cell} align="right">{money(l.rate)}</TableCell>
                                        <TableCell sx={cell} align="right">{money(l.taxable)}</TableCell>
                                        <TableCell sx={cell} align="right">
                                            {money(l.tax)}
                                            <Box sx={{ fontSize: 10.5, color: MUTED }}>{l.gstPercent}%</Box>
                                        </TableCell>
                                        <TableCell sx={{ ...cell, fontWeight: 600 }} align="right">{money(l.taxable + l.tax)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>

                    {/* tax summary + totals */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.2fr 1fr' }, gap: 3, mt: 2.5, alignItems: 'start' }}>
                        <Box>
                            <Label>GST summary</Label>
                            <Table size="small" sx={{ border: `1px solid ${LINE}`, '& td, & th': { borderColor: LINE } }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={head}>Rate</TableCell>
                                        <TableCell sx={head} align="right">Taxable</TableCell>
                                        <TableCell sx={head} align="right">CGST</TableCell>
                                        <TableCell sx={head} align="right">SGST</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {bill.gstBreakup.map((g) => (
                                        <TableRow key={g.percent}>
                                            <TableCell sx={cell}>{g.percent}%</TableCell>
                                            <TableCell sx={cell} align="right">{money(g.taxable)}</TableCell>
                                            <TableCell sx={cell} align="right">{money(half(g.tax))}<Box component="span" sx={{ color: MUTED, fontSize: 10.5 }}> @{g.percent / 2}%</Box></TableCell>
                                            <TableCell sx={cell} align="right">{money(g.tax - half(g.tax))}<Box component="span" sx={{ color: MUTED, fontSize: 10.5 }}> @{g.percent / 2}%</Box></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Box sx={{ mt: 2 }}>
                                <Label>Amount in words</Label>
                                <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>{inWords(bill.total)}</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ border: `1px solid ${LINE}`, borderRadius: '4px' }}>
                            {[
                                ['Taxable value', taxable],
                                ['CGST', cgst],
                                ['SGST', sgst]
                            ].map(([l, v]) => (
                                <Box key={l} sx={{ display: 'flex', justifyContent: 'space-between', px: 1.5, py: 0.75, fontSize: 12.5 }}>
                                    <span>{l}</span>
                                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{money(v)}</span>
                                </Box>
                            ))}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1.5, py: 1, bgcolor: '#F7F5F2', borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}`, fontWeight: 700, fontSize: 14.5 }}>
                                <span>Invoice total</span>
                                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{inr(bill.total)}</span>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1.5, py: 0.75, fontSize: 12.5 }}>
                                <span>Received</span>
                                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{money(bill.paid)}</span>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1.5, py: 0.75, fontSize: 13, fontWeight: 700, color: bill.balance > 0 ? '#B42318' : INK }}>
                                <span>{bill.balance > 0 ? 'Balance due' : bill.balance < 0 ? 'Refundable' : 'Balance'}</span>
                                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{bill.balance === 0 ? 'Nil' : inr(Math.abs(bill.balance))}</span>
                            </Box>
                        </Box>
                    </Box>

                    {b.payments.length > 0 && (
                        <Box sx={{ mt: 2.5 }}>
                            <Label>Payments received</Label>
                            {b.payments.map((p) => (
                                <Typography key={p.id} sx={{ fontSize: 12 }}>
                                    {new Date(p.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · {PAY_METHODS.find((m) => m.id === p.method)?.name || p.method}
                                    {p.reference ? ` (${p.reference})` : ''} · {inr(p.amount)}
                                </Typography>
                            ))}
                        </Box>
                    )}

                    {/* footer */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.4fr 1fr' }, gap: 3, mt: 4, pt: 2.5, borderTop: `1px solid ${LINE}`, alignItems: 'end' }}>
                        <Box>
                            {s.policy && (
                                <>
                                    <Label>Terms</Label>
                                    <Typography sx={{ fontSize: 11, color: MUTED, whiteSpace: 'pre-line' }}>{s.policy}</Typography>
                                </>
                            )}
                            <Typography sx={{ fontSize: 11, color: MUTED, mt: 1 }}>Check-out time {s.checkOutTime}. This is a computer-generated invoice.</Typography>
                        </Box>
                        <Box sx={{ textAlign: { sm: 'right' } }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>For {s.hotelName || user.name}</Typography>
                            <Box sx={{ height: 44 }} />
                            <Typography sx={{ fontSize: 11, color: MUTED, borderTop: `1px solid ${LINE}`, display: 'inline-block', pt: 0.5, minWidth: 180, textAlign: 'center' }}>Authorised signatory</Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default Invoice;
