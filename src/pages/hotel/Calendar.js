import { useMemo, useState } from 'react';
import { Alert, Box, Button, Card, IconButton, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import { alpha, darken } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate } from 'react-router-dom';
import useHotel from 'hooks/useHotel';
import useAsync from 'hooks/useAsync';
import BookingDialog from 'components/BookingDialog';
import PageHeader from 'components/PageHeader';
import { addDays, dateRange, dayOfMonth, formatDate, inr, monthShort, num, todayISO, weekdayShort } from 'utils/format';
import { BOOKING_STATUSES } from 'utils/constants';

const LABEL_W = 132;
const CELL_W = 58;
const ROW_H = 44;

const barColor = (theme, status) => {
    const key = BOOKING_STATUSES[status]?.color;
    const base = key === 'default' ? (theme.palette.mode === 'dark' ? '#5b6b87' : '#8a97b1') : theme.palette[key]?.main || theme.palette.primary.main;
    return { bg: `linear-gradient(135deg, ${base} 0%, ${darken(base, 0.22)} 100%)`, solid: base, fg: '#fff' };
};

const isWeekend = (d) => ['Sat', 'Sun'].includes(weekdayShort(d));

const Calendar = () => {
    const { api } = useHotel();
    const navigate = useNavigate();
    const [from, setFrom] = useState(todayISO());
    const [days, setDays] = useState(14);
    const [typeFilter, setTypeFilter] = useState('');
    const [dialog, setDialog] = useState(null); // { roomId, checkIn, checkOut } | {}
    const to = addDays(from, days);
    const cal = useAsync(() => api.calendar({ from, to }), { initial: null, deps: [from, days] });

    const dates = useMemo(() => dateRange(from, to), [from, to]);
    const today = todayISO();

    const view = useMemo(() => {
        if (!cal.data) return null;
        const { rooms, types, rates, bookings } = cal.data;
        const base = Object.fromEntries(types.map((t) => [t.id, t.basePrice]));
        const override = Object.fromEntries(rates.map((r) => [`${r.roomTypeId}|${r.date}`, r.price]));
        const byRoom = {};
        bookings.forEach((b) => (byRoom[b.roomId] = [...(byRoom[b.roomId] || []), b]));
        const shown = rooms.filter((r) => !typeFilter || r.roomTypeId === typeFilter);
        const groups = [];
        shown.forEach((r) => {
            let g = groups[groups.length - 1];
            if (!g || g.typeId !== r.roomTypeId) groups.push((g = { typeId: r.roomTypeId, name: r.roomTypeName, rooms: [] }));
            g.rooms.push(r);
        });
        // how many sellable rooms are still free on each date
        const sellable = shown.filter((r) => !r.outOfService);
        const free = dates.map((d) => sellable.filter((r) => !(byRoom[r.id] || []).some((b) => b.checkIn <= d && b.checkOut > d)).length);
        return { base, override, byRoom, groups, free, sellable: sellable.length, types };
    }, [cal.data, typeFilter, dates]);

    const template = `${LABEL_W}px repeat(${dates.length}, minmax(${CELL_W}px, 1fr))`;
    const step = days >= 14 ? 7 : days;

    const stickyLabel = { position: 'sticky', left: 0, zIndex: 2, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' };

    return (
        <>
            <PageHeader title="Calendar" subtitle="Which rooms are taken, which are free, and what each night costs" actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({})}>New booking</Button>} />

            <Stack direction="row" spacing={1.5} sx={{ mb: 2, flexWrap: 'wrap', rowGap: 1.5, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={() => setFrom(addDays(from, -step))} aria-label="Earlier"><ChevronLeftIcon /></IconButton>
                    <Button color="inherit" variant="outlined" onClick={() => setFrom(todayISO())}>Today</Button>
                    <IconButton onClick={() => setFrom(addDays(from, step))} aria-label="Later"><ChevronRightIcon /></IconButton>
                </Box>
                <TextField type="date" value={from} onChange={(e) => e.target.value && setFrom(e.target.value)} sx={{ width: 160 }} inputProps={{ 'aria-label': 'Start date' }} />
                <ToggleButtonGroup size="small" exclusive value={days} onChange={(_, v) => v && setDays(v)} aria-label="Days shown">
                    <ToggleButton value={7}>7 days</ToggleButton><ToggleButton value={14}>14 days</ToggleButton><ToggleButton value={30}>30 days</ToggleButton>
                </ToggleButtonGroup>
                <TextField select label="Room type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} sx={{ width: 180 }}>
                    <MenuItem value=""><em>All types</em></MenuItem>
                    {(view?.types || []).map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                </TextField>
                <Box sx={{ flexGrow: 1 }} />
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    {['CONFIRMED', 'PENDING', 'CHECKED_IN', 'CHECKED_OUT'].map((s) => (
                        <Box key={s} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={(t) => ({ width: 12, height: 12, borderRadius: 0.5, background: barColor(t, s).bg })} /><Typography variant="caption">{BOOKING_STATUSES[s].label}</Typography>
                        </Box>
                    ))}
                    <Typography variant="caption" color="text.secondary" sx={{ pl: 1, borderLeft: 1, borderColor: 'divider' }}>Figures are the price per night (₹)</Typography>
                </Stack>
            </Stack>

            {view && view.groups.length === 0 && !cal.loading && <Alert severity="info">No rooms yet. Add room types and rooms first (Property menu), then your calendar appears here.</Alert>}

            {view && view.groups.length > 0 && (
                <Card sx={{ overflow: 'auto', maxHeight: 'calc(100vh - 260px)' }}>
                    <Box sx={{ minWidth: LABEL_W + dates.length * CELL_W }}>
                        {/* dates */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: template, position: 'sticky', top: 0, zIndex: 3, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
                            <Box sx={{ ...stickyLabel, zIndex: 4, p: 1, display: 'flex', alignItems: 'end' }}><Typography variant="caption" color="text.secondary">{formatDate(from).slice(3)}</Typography></Box>
                            {dates.map((d, i) => (
                                <Box key={d} sx={(t) => ({ textAlign: 'center', py: 0.75, bgcolor: d === today ? alpha(t.palette.primary.main, 0.14) : isWeekend(d) ? alpha(t.palette.secondary.main, 0.08) : undefined, borderLeft: 1, borderColor: 'divider', borderTop: d === today ? 3 : 0, borderTopColor: 'secondary.main' })}>
                                    <Typography variant="caption" color={['Sat', 'Sun'].includes(weekdayShort(d)) ? 'warning.main' : 'text.secondary'} sx={{ display: 'block', lineHeight: 1.1 }}>{weekdayShort(d)}</Typography>
                                    <Typography variant="subtitle2" sx={{ lineHeight: 1.3 }}>{dayOfMonth(d)}{(i === 0 || dayOfMonth(d) === 1) && <Typography component="span" variant="caption" color="text.secondary"> {monthShort(d)}</Typography>}</Typography>
                                    <Tooltip title={`${view.free[i]} of ${view.sellable} rooms free`}><Typography variant="caption" sx={{ color: view.free[i] === 0 ? 'error.main' : 'success.main', fontWeight: 600 }}>{view.free[i]} free</Typography></Tooltip>
                                </Box>
                            ))}
                        </Box>

                        {view.groups.map((g) => (
                            <Box key={g.typeId}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: template, bgcolor: 'action.hover' }}>
                                    <Box sx={{ ...stickyLabel, bgcolor: 'background.paper', px: 1.25, py: 0.75 }}><Typography variant="overline" sx={{ fontWeight: 800, color: 'primary.main' }}>{g.name}</Typography></Box>
                                    <Box sx={{ gridColumn: `2 / span ${dates.length}`, px: 1, display: 'flex', alignItems: 'center' }}><Typography variant="caption" color="text.secondary">{g.rooms.length} room(s) · usual {inr(view.base[g.typeId])}</Typography></Box>
                                </Box>
                                {g.rooms.map((room) => {
                                    const list = view.byRoom[room.id] || [];
                                    const taken = (d) => list.some((b) => b.checkIn <= d && b.checkOut > d);
                                    return (
                                        <Box key={room.id} sx={{ display: 'grid', gridTemplateColumns: template, gridAutoRows: ROW_H, borderBottom: 1, borderColor: 'divider' }}>
                                            <Box sx={{ ...stickyLabel, gridColumn: 1, gridRow: 1, px: 1.25, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                <Typography variant="subtitle2">{room.roomNumber}</Typography>
                                                {Boolean(room.outOfService) && <Typography variant="caption" color="error">out of service</Typography>}
                                                {!room.outOfService && room.status === 'DIRTY' && <Tooltip title="Needs cleaning"><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} /></Tooltip>}
                                            </Box>
                                            {dates.map((d, i) => {
                                                if (taken(d)) return null;
                                                const price = view.override[`${room.roomTypeId}|${d}`] ?? view.base[room.roomTypeId];
                                                const special = view.override[`${room.roomTypeId}|${d}`] !== undefined;
                                                return (
                                                    <Box key={d} role="button" tabIndex={room.outOfService ? -1 : 0} aria-label={`Room ${room.roomNumber}, ${formatDate(d)}, free, ${price} rupees`}
                                                        onClick={() => !room.outOfService && setDialog({ roomId: room.id, checkIn: d, checkOut: addDays(d, 1) })}
                                                        onKeyDown={(e) => e.key === 'Enter' && !room.outOfService && setDialog({ roomId: room.id, checkIn: d, checkOut: addDays(d, 1) })}
                                                        sx={(t) => ({ gridColumn: i + 2, gridRow: 1, borderLeft: 1, borderColor: 'divider', display: 'grid', placeItems: 'center', cursor: room.outOfService ? 'not-allowed' : 'pointer', fontSize: 12, color: special ? 'warning.main' : 'text.secondary', fontWeight: special ? 700 : 400, bgcolor: room.outOfService ? alpha(t.palette.error.main, 0.1) : d === today ? alpha(t.palette.primary.main, 0.08) : d < today ? t.palette.action.hover : isWeekend(d) ? alpha(t.palette.secondary.main, 0.07) : undefined, '&:hover': room.outOfService ? undefined : { bgcolor: alpha(t.palette.primary.main, 0.16), color: 'text.primary' } })}>
                                                        {room.outOfService ? '–' : num(price)}
                                                    </Box>
                                                );
                                            })}
                                            {list.map((b) => {
                                                const s = Math.max(0, dates.indexOf(b.checkIn < from ? from : b.checkIn));
                                                const endDate = b.checkOut > to ? to : b.checkOut;
                                                const e = dates.indexOf(endDate) === -1 ? dates.length : dates.indexOf(endDate);
                                                const name = b.companyName || b.customerName;
                                                return (
                                                    <Tooltip key={b.id} title={`${b.bookingNumber} · ${name} · ${formatDate(b.checkIn)} → ${formatDate(b.checkOut)} · ${BOOKING_STATUSES[b.status].label}`}>
                                                        <Box role="button" tabIndex={0} onClick={() => navigate(`/hotel/bookings/${b.id}`)} onKeyDown={(ev) => ev.key === 'Enter' && navigate(`/hotel/bookings/${b.id}`)}
                                                            sx={(t) => ({ gridColumn: `${s + 2} / ${e + 2}`, gridRow: 1, m: '6px 2px', px: 1.25, borderRadius: '10px', background: barColor(t, b.status).bg, color: barColor(t, b.status).fg, display: 'flex', alignItems: 'center', cursor: 'pointer', overflow: 'hidden', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', boxShadow: '0 1px 3px rgba(0,0,0,.25)', '&:hover': { filter: 'brightness(1.1)', boxShadow: '0 3px 8px rgba(0,0,0,.3)' } })}>
                                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
                                                        </Box>
                                                    </Tooltip>
                                                );
                                            })}
                                        </Box>
                                    );
                                })}
                            </Box>
                        ))}
                    </Box>
                </Card>
            )}

            <BookingDialog open={Boolean(dialog)} initial={dialog || {}} onClose={() => setDialog(null)} onSaved={(b) => { setDialog(null); cal.reload(); navigate(`/hotel/bookings/${b.id}`, { state: { created: true } }); }} />
        </>
    );
};

export default Calendar;
