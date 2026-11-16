import { useState } from 'react';
import { Box, Button, Card, Grid, IconButton, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { Link } from 'react-router-dom';
import useHotel from 'hooks/useHotel';
import useAsync from 'hooks/useAsync';
import { useToast } from 'context/Toast';
import PageHeader from 'components/PageHeader';
import Panel, { KpiStrip } from 'components/Panel';
import { T } from 'components/Theme';
import { CHARGE_CATEGORIES, PAY_METHODS } from 'utils/constants';
import { addDays, formatDate, inr, todayISO } from 'utils/format';

const LEVEL = {
    high: { color: T.error, bg: '#FDF3F2', line: '#EFC5C1', Icon: ErrorOutlineIcon },
    medium: { color: '#9A6A12', bg: '#FDF8EC', line: '#EBD9A8', Icon: InfoOutlinedIcon },
    low: { color: T.ink2, bg: T.subtle, line: T.line, Icon: InfoOutlinedIcon }
};
const time = (v) => (v ? new Date(v).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '');

// One page per day for the owner: what was sold, what came in, who holds the cash, and what needs a look.
const DayReport = () => {
    const { api } = useHotel();
    const toast = useToast();
    const [date, setDate] = useState(todayISO());
    const q = useAsync(() => api.dayReport(date), { initial: null, deps: [date] });
    const r = q.data;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(r.text);
            toast.success('Report copied');
        } catch (e) {
            toast.error('Could not copy');
        }
    };
    const whatsapp = () => window.open(`https://wa.me/${r.ownerPhone || ''}?text=${encodeURIComponent(r.text)}`, '_blank', 'noopener');
    const high = r ? r.alerts.filter((a) => a.level === 'high').length : 0;

    return (
        <>
            <PageHeader
                title="Day report"
                subtitle="Sales, money received, cash with staff, and anything that needs a look"
                actions={
                    r && (
                        <>
                            <Button variant="outlined" color="inherit" startIcon={<ContentCopyIcon />} onClick={copy}>Copy</Button>
                            <Tooltip title={r.ownerPhone ? '' : "Add the owner's WhatsApp number in Hotel settings to send it straight there"}>
                                <Button variant="contained" startIcon={<WhatsAppIcon />} onClick={whatsapp}>Send on WhatsApp</Button>
                            </Tooltip>
                        </>
                    )
                }
            />

            <Card sx={{ mb: 2, px: 1.5, py: 1, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <IconButton size="small" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}><ChevronLeftIcon /></IconButton>
                <TextField type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} sx={{ width: 160, '& .MuiOutlinedInput-root': { height: 32 } }} inputProps={{ 'aria-label': 'Date' }} />
                <IconButton size="small" aria-label="Next day" disabled={date >= todayISO()} onClick={() => setDate(addDays(date, 1))}><ChevronRightIcon /></IconButton>
                {date !== todayISO() && <Button size="small" onClick={() => setDate(todayISO())}>Today</Button>}
                <Typography sx={{ ml: 'auto', fontSize: 12.5, color: T.ink3 }}>{r?.ownerEmail ? `Emailed to ${r.ownerEmail} every night` : 'Add an email in Hotel settings to get this every night'}</Typography>
            </Card>

            <KpiStrip
                loading={q.loading}
                items={[
                    { label: 'Rooms sold', value: r ? `${r.roomsSold} / ${r.rooms}` : '–', sub: r ? `${r.occupancyPercent}% occupancy` : '' },
                    { label: 'Room revenue', value: r ? inr(r.roomRevenue) : '–', sub: r?.otherRevenue ? `+ ${inr(r.otherRevenue)} food & other` : 'before tax' },
                    { label: 'Money received', value: r ? inr(r.received) : '–', sub: r ? `${r.payments.length} payment${r.payments.length === 1 ? '' : 's'}` : '' },
                    { label: 'Check-ins / outs', value: r ? `${r.checkIns} / ${r.checkOuts}` : '–', sub: r ? `${r.newBookings} new booking${r.newBookings === 1 ? '' : 's'}` : '' },
                    { label: 'Needs a look', value: r ? r.alerts.length : '–', sub: high ? `${high} important` : 'nothing serious', color: high ? T.error : undefined }
                ]}
            />

            {r && (
                <Grid container spacing={2} sx={{ mt: 0 }}>
                    <Grid item xs={12} lg={7}>
                        <Panel title="Needs a look" subtitle="Deleted payments, rooms used without a booking, short cash and similar">
                            {r.alerts.length === 0 ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: T.success }}>
                                    <CheckCircleOutlineIcon fontSize="small" />
                                    <Typography sx={{ fontSize: 13 }}>Nothing unusual on {formatDate(date)}.</Typography>
                                </Box>
                            ) : (
                                <Box sx={{ display: 'grid', gap: 1 }}>
                                    {r.alerts.map((a, i) => {
                                        const L = LEVEL[a.level];
                                        return (
                                            <Box key={i} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start', p: 1.25, borderRadius: '6px', bgcolor: L.bg, border: `1px solid ${L.line}` }}>
                                                <L.Icon sx={{ fontSize: 18, color: L.color, mt: '1px' }} />
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography sx={{ fontSize: 13, fontWeight: a.level === 'high' ? 600 : 500 }}>{a.text}</Typography>
                                                    {(a.by || a.at) && <Typography sx={{ fontSize: 12, color: T.ink3 }}>{[a.by && `by ${a.by}`, time(a.at)].filter(Boolean).join(' at ')}</Typography>}
                                                </Box>
                                                {a.bookingId && <Button size="small" component={Link} to={`/hotel/bookings/${a.bookingId}`} sx={{ flexShrink: 0 }}>Open</Button>}
                                            </Box>
                                        );
                                    })}
                                </Box>
                            )}
                        </Panel>

                        <Panel title="Payments" subtitle="Every payment taken on this day" padded={false} sx={{ mt: 2 }}>
                            <Box sx={{ overflowX: 'auto' }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Time</TableCell>
                                            <TableCell>Booking</TableCell>
                                            <TableCell>Method</TableCell>
                                            <TableCell>Counted</TableCell>
                                            <TableCell align="right">Amount</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {r.payments.length === 0 && (
                                            <TableRow><TableCell colSpan={5} sx={{ color: T.ink3 }}>No payments on this day.</TableCell></TableRow>
                                        )}
                                        {r.payments.map((p) => (
                                            <TableRow key={p.id} hover>
                                                <TableCell sx={{ color: T.ink2 }}>{time(p.paidAt)}</TableCell>
                                                <TableCell><Link to={`/hotel/bookings/${p.bookingId}`} style={{ color: T.brand, fontWeight: 600, textDecoration: 'none' }}>{p.bookingNumber}</Link></TableCell>
                                                <TableCell>{PAY_METHODS.find((m) => m.id === p.method)?.name || p.method}</TableCell>
                                                <TableCell sx={{ color: T.ink3, fontSize: 12.5 }}>{p.method !== 'CASH' ? '' : p.cashCloseId ? 'In a closed drawer' : 'Not yet'}</TableCell>
                                                <TableCell align="right" className="num">{inr(p.amount)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        </Panel>
                    </Grid>

                    <Grid item xs={12} lg={5}>
                        <Box sx={{ display: 'grid', gap: 2 }}>
                            <Panel title="Money received">
                                {Object.keys(r.byMethod).length === 0 && <Typography sx={{ fontSize: 13, color: T.ink3 }}>Nothing received.</Typography>}
                                {Object.entries(r.byMethod).map(([m, a]) => (
                                    <Box key={m} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                        <Typography sx={{ fontSize: 13, color: T.ink2 }}>{PAY_METHODS.find((x) => x.id === m)?.name || m}</Typography>
                                        <Typography className="num" sx={{ fontSize: 13, fontWeight: 600 }}>{inr(a)}</Typography>
                                    </Box>
                                ))}
                                {r.byPerson.length > 0 && (
                                    <>
                                        <Typography sx={{ mt: 1.5, mb: 0.5, fontSize: 11.5, fontWeight: 650, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.ink3 }}>Taken by</Typography>
                                        {r.byPerson.map((p) => (
                                            <Box key={p.userId || 0} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                                <Typography sx={{ fontSize: 13 }}>{p.name}<Box component="span" sx={{ color: T.ink3 }}> · {p.count}</Box></Typography>
                                                <Typography className="num" sx={{ fontSize: 13, fontWeight: 600 }}>{inr(p.total)}{p.cash ? <Box component="span" sx={{ color: T.ink3, fontWeight: 400 }}> (cash {inr(p.cash)})</Box> : null}</Typography>
                                            </Box>
                                        ))}
                                    </>
                                )}
                            </Panel>

                            <Panel title="Cash with staff" subtitle="Cash taken that nobody has counted and closed yet">
                                {r.uncounted.length === 0 ? (
                                    <Typography sx={{ fontSize: 13, color: T.success }}>All cash is counted.</Typography>
                                ) : (
                                    r.uncounted.map((u) => (
                                        <Box key={u.userId || 0} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                            <Typography sx={{ fontSize: 13 }}>{u.name}<Box component="span" sx={{ color: T.ink3 }}> · since {formatDate(String(u.since).slice(0, 10))}</Box></Typography>
                                            <Typography className="num" sx={{ fontSize: 13, fontWeight: 650, color: '#9A6A12' }}>{inr(u.amount)}</Typography>
                                        </Box>
                                    ))
                                )}
                                {r.closes.length > 0 && (
                                    <>
                                        <Typography sx={{ mt: 1.5, mb: 0.5, fontSize: 11.5, fontWeight: 650, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.ink3 }}>Drawers closed</Typography>
                                        {r.closes.map((c) => (
                                            <Box key={c.id} sx={{ py: 0.5 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography sx={{ fontSize: 13 }}>{c.userName} at {time(c.closedAt)}</Typography>
                                                    <Typography className="num" sx={{ fontSize: 13, fontWeight: 600, color: c.difference < 0 ? T.error : c.difference > 0 ? '#9A6A12' : T.success }}>
                                                        {c.difference === 0 ? 'Matched' : `${c.difference < 0 ? 'Short' : 'Over'} ${inr(Math.abs(c.difference))}`}
                                                    </Typography>
                                                </Box>
                                                <Typography sx={{ fontSize: 12, color: T.ink3 }}>Expected {inr(c.expected)}, counted {inr(c.counted)}{c.note ? ` · ${c.note}` : ''}</Typography>
                                            </Box>
                                        ))}
                                    </>
                                )}
                            </Panel>

                            {r.charges.length > 0 && (
                                <Panel title="Food & other sales">
                                    {r.charges.map((c) => (
                                        <Box key={c.category} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                            <Typography sx={{ fontSize: 13, color: T.ink2 }}>{CHARGE_CATEGORIES.find((x) => x.id === c.category)?.name || c.category}</Typography>
                                            <Typography className="num" sx={{ fontSize: 13, fontWeight: 600 }}>{inr(c.amount)}</Typography>
                                        </Box>
                                    ))}
                                </Panel>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            )}
        </>
    );
};

export default DayReport;
