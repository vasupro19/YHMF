import { Alert, Box, Button, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import { useParams } from 'react-router-dom';
import { publicBill } from 'api';
import UpiQr from 'components/UpiQr';
import Loader from 'components/Loader';
import { TONES } from 'components/StatusChip';
import useAsync from 'hooks/useAsync';
import { BOOKING_STATUSES, CHARGE_CATEGORIES, PAY_METHODS } from 'utils/constants';
import { daysBetween, fileUrl, formatDate, inr, upiLink } from 'utils/format';
import { APP_NAME } from 'utils/constants';

const BRAND = '#7A1F2B';
const LINE = '#D9D5CF';
const INK = '#1C1A19';
const MUTED = '#6B6660';

// what the guest sees when they open their bill link: no login, made for a phone
const GuestBill = () => {
    const { token } = useParams();
    const q = useAsync(() => publicBill(token), { initial: null, deps: [token] });
    if (q.loading && !q.data) return <Loader />;
    if (!q.data) return (
        <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3, textAlign: 'center' }}>
            <Box><Typography sx={{ fontSize: 18, fontWeight: 650 }}>We couldn't open this bill</Typography><Typography sx={{ mt: 1, fontSize: 13.5, color: MUTED, maxWidth: 420 }}>{q.error?.message || 'The link may be wrong or may have been replaced. Please ask the hotel for a new one.'}</Typography></Box>
        </Box>
    );

    const { hotel: h, booking: b } = q.data;
    const bill = b.bill;
    const nights = daysBetween(b.checkIn, b.checkOut);
    const status = BOOKING_STATUSES[b.status];
    const rateGroups = Object.values(bill.roomLines.reduce((m, l) => { const k = `${l.unitPrice}|${l.gstPercent}`; m[k] = m[k] || { ...l, qty: 0, total: 0 }; m[k].qty += 1; m[k].total += l.amount; return m; }, {}));
    const canPay = h.upiId && bill.balance > 0 && !['CANCELLED', 'NO_SHOW'].includes(b.status);
    const pay = canPay ? upiLink({ upiId: h.upiId, name: h.name, amount: bill.balance, note: `Booking ${b.bookingNumber}` }) : '';

    const tone = TONES[status?.color] || TONES.default;
    const label = { fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED };
    const cell = { fontSize: 12.5, color: INK, borderColor: LINE, py: 1, px: 1.25 };

    return (
        <Box sx={{ bgcolor: '#EDEBE7', minHeight: '100vh', py: { xs: 0, sm: 4 }, px: { xs: 0, sm: 2 }, color: INK, '@media print': { bgcolor: '#fff', p: 0 } }}>
            <Box sx={{ maxWidth: 660, mx: 'auto', bgcolor: '#fff', borderTop: `4px solid ${BRAND}`, boxShadow: { sm: '0 1px 3px rgba(0,0,0,.08), 0 8px 24px rgba(0,0,0,.06)' }, '@media print': { boxShadow: 'none' } }}>
                {/* letterhead */}
                <Box sx={{ px: { xs: 2.5, sm: 4 }, pt: 3, pb: 2.5, display: 'flex', gap: 2, alignItems: 'flex-start', borderBottom: `1px solid ${LINE}` }}>
                    {h.logoPath && <img src={fileUrl(h.logoPath)} alt="" style={{ maxHeight: 52, maxWidth: 100, objectFit: 'contain' }} />}
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em' }}>{h.name || 'Your hotel'}</Typography>
                        {h.address && <Typography sx={{ fontSize: 12, color: MUTED, whiteSpace: 'pre-line' }}>{h.address}</Typography>}
                        <Typography sx={{ fontSize: 12, color: MUTED }}>{[h.phone, h.email].filter(Boolean).join('  ·  ')}</Typography>
                    </Box>
                </Box>

                <Box sx={{ px: { xs: 2.5, sm: 4 }, py: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5 }}>
                        <Box>
                            <Typography sx={label}>{b.invoiceNumber ? 'Tax invoice' : 'Booking statement'}</Typography>
                            <Typography sx={{ fontSize: 17, fontWeight: 700, color: BRAND }}>{b.invoiceNumber || b.bookingNumber}</Typography>
                        </Box>
                        {status && (
                            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, height: 24, px: 1, borderRadius: '4px', fontSize: 12, fontWeight: 500, color: tone.fg, bgcolor: tone.bg, border: `1px solid ${tone.line}` }}>
                                <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: tone.dot }} />
                                {status.label}
                            </Box>
                        )}
                    </Box>

                    {/* balance callout */}
                    {!['CANCELLED', 'NO_SHOW'].includes(b.status) && (
                        <Box sx={{ mt: 2.5, p: 2, border: `1px solid ${bill.balance > 0 ? '#EFC5C1' : '#C3E0CF'}`, bgcolor: bill.balance > 0 ? '#FDF3F2' : '#F1F8F4', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                            <Box>
                                <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: bill.balance > 0 ? '#A01F15' : '#17643F' }}>{bill.balance > 0 ? 'Amount due' : bill.balance < 0 ? 'Refundable to you' : 'Fully paid'}</Typography>
                                <Typography sx={{ fontSize: 12, color: MUTED }}>Total {inr(bill.total)} · Paid {inr(bill.paid)}</Typography>
                            </Box>
                            <Typography sx={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: bill.balance > 0 ? '#A01F15' : '#17643F' }}>{bill.balance === 0 ? inr(bill.total) : inr(Math.abs(bill.balance))}</Typography>
                        </Box>
                    )}

                    {/* stay facts */}
                    <Box sx={{ mt: 2.5, display: 'grid', gridTemplateColumns: '1fr 1fr', border: `1px solid ${LINE}`, borderRadius: '4px' }}>
                        {[
                            ['Guest', b.companyName || b.guestName],
                            ['Room', `${b.roomTypeName}${b.roomNumber ? ` · ${b.roomNumber}` : ''}`],
                            ['Check-in', `${formatDate(b.checkIn)}${h.checkInTime ? ` · from ${h.checkInTime}` : ''}`],
                            ['Check-out', `${formatDate(b.checkOut)}${h.checkOutTime ? ` · by ${h.checkOutTime}` : ''}`],
                            ['Stay', `${nights} night${nights > 1 ? 's' : ''}, ${b.adults} adult${b.adults > 1 ? 's' : ''}${b.children ? `, ${b.children} child${b.children > 1 ? 'ren' : ''}` : ''}`],
                            ['Booking no.', b.bookingNumber]
                        ].map(([k, v], i) => (
                            <Box key={k} sx={{ px: 1.5, py: 1, borderLeft: i % 2 ? `1px solid ${LINE}` : 0, borderTop: i > 1 ? `1px solid ${LINE}` : 0, minWidth: 0 }}>
                                <Typography sx={label}>{k}</Typography>
                                <Typography sx={{ fontSize: 13, fontWeight: 600, overflowWrap: 'anywhere' }}>{v}</Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* lines */}
                    <Box sx={{ overflowX: 'auto', mt: 2.5 }}>
                        <Table size="small" sx={{ border: `1px solid ${LINE}`, '& td, & th': { borderColor: LINE } }}>
                            <TableHead>
                                <TableRow>
                                    {['Item', 'Qty', 'Amount'].map((x, i) => (
                                        <TableCell key={x} align={i ? 'right' : 'left'} sx={{ ...cell, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: MUTED, bgcolor: '#F7F5F2' }}>{x}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rateGroups.map((g) => (
                                    <TableRow key={`${g.unitPrice}${g.gstPercent}`}>
                                        <TableCell sx={cell}><Box sx={{ fontWeight: 600 }}>Room tariff</Box><Box sx={{ fontSize: 11.5, color: MUTED }}>{inr(g.unitPrice)} per night</Box></TableCell>
                                        <TableCell sx={cell} align="right">{g.qty}</TableCell>
                                        <TableCell sx={cell} align="right">{inr(g.total)}</TableCell>
                                    </TableRow>
                                ))}
                                {bill.discount > 0 && (
                                    <TableRow>
                                        <TableCell sx={cell} colSpan={2}>Discount</TableCell>
                                        <TableCell sx={cell} align="right">− {inr(bill.discount)}</TableCell>
                                    </TableRow>
                                )}
                                {bill.chargeLines.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell sx={cell}><Box sx={{ fontWeight: 600 }}>{c.description}</Box><Box sx={{ fontSize: 11.5, color: MUTED }}>{CHARGE_CATEGORIES.find((x) => x.id === c.category)?.name || c.category} · {formatDate(c.date)}</Box></TableCell>
                                        <TableCell sx={cell} align="right">{c.quantity}</TableCell>
                                        <TableCell sx={cell} align="right">{inr(c.amount)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>

                    <Box sx={{ mt: 1.5, ml: 'auto', maxWidth: 320, border: `1px solid ${LINE}`, borderRadius: '4px' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1.5, py: 0.75, fontSize: 12.5 }}><span>GST</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{inr(bill.taxTotal)}</span></Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1.5, py: 1, bgcolor: '#F7F5F2', borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}`, fontWeight: 700, fontSize: 14.5 }}><span>Total</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{inr(bill.total)}</span></Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1.5, py: 0.75, fontSize: 12.5 }}><span>Paid</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{inr(bill.paid)}</span></Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1.5, py: 0.75, fontSize: 13, fontWeight: 700, color: bill.balance > 0 ? '#B42318' : '#1F7A4D' }}>
                            <span>{bill.balance > 0 ? 'Balance to pay' : 'Balance'}</span>
                            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{bill.balance > 0 ? inr(bill.balance) : bill.balance < 0 ? `${inr(-bill.balance)} refundable` : 'Nil'}</span>
                        </Box>
                    </Box>

                    {canPay && (
                        <Box sx={{ mt: 3, p: 2.5, borderRadius: '6px', border: `1px solid ${LINE}`, bgcolor: '#FAF9F7', textAlign: 'center', '@media print': { display: 'none' } }}>
                            <Button href={pay} variant="contained" size="large" startIcon={<PaymentsOutlinedIcon />} fullWidth sx={{ display: { sm: 'none' } }}>Pay {inr(bill.balance)} by UPI</Button>
                            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                                <Typography sx={{ fontSize: 14, fontWeight: 650, mb: 1.25 }}>Scan with any UPI app to pay {inr(bill.balance)}</Typography>
                                <UpiQr link={pay} size={176} />
                            </Box>
                            <Typography sx={{ display: 'block', mt: 1.25, fontSize: 12, color: MUTED }}>Pays to {h.upiId}. The hotel marks it received once it arrives.</Typography>
                        </Box>
                    )}
                    {b.status === 'CANCELLED' && <Alert severity="warning" sx={{ mt: 2 }}>This booking was cancelled.</Alert>}

                    {b.payments.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography sx={{ ...label, mb: 0.75 }}>Payments received</Typography>
                            {b.payments.map((p, i) => (
                                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.6, borderBottom: `1px solid ${LINE}`, fontSize: 12.5, '&:last-child': { borderBottom: 0 } }}>
                                    <span>{new Date(p.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · {PAY_METHODS.find((m) => m.id === p.method)?.name || p.method}</span>
                                    <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{inr(p.amount)}</span>
                                </Box>
                            ))}
                        </Box>
                    )}

                    <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${LINE}` }}>
                        {h.gstin && <Typography sx={{ fontSize: 12, fontWeight: 600 }}>Hotel GSTIN: {h.gstin}</Typography>}
                        {h.policy && <Typography sx={{ display: 'block', mt: 0.75, fontSize: 11.5, color: MUTED, whiteSpace: 'pre-line' }}>{h.policy}</Typography>}
                        <Button onClick={() => window.print()} startIcon={<PrintOutlinedIcon />} variant="outlined" color="inherit" sx={{ mt: 2, '@media print': { display: 'none' } }}>Print or save as PDF</Button>
                    </Box>
                </Box>
                <Box sx={{ py: 1.25, textAlign: 'center', bgcolor: '#FAF9F7', borderTop: `1px solid ${LINE}` }}>
                    <Typography sx={{ fontSize: 11.5, color: MUTED }}>Statement by {APP_NAME} · Hotel Manager</Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default GuestBill;
