import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Card, IconButton, MenuItem, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useHotel from 'hooks/useHotel';
import useAsync from 'hooks/useAsync';
import BookingDialog from 'components/BookingDialog';
import PageHeader from 'components/PageHeader';
import { TONES } from 'components/StatusChip';
import { T } from 'components/Theme';
import { addDays, dateRange, dayOfMonth, formatDate, inr, monthShort, num, todayISO, weekdayShort } from 'utils/format';
import { BOOKING_STATUSES } from 'utils/constants';

const LABEL_W = 148;
const CELL_W = 56;
const ROW_H = 36;

const tone = (status) => TONES[BOOKING_STATUSES[status]?.color] || TONES.default;
const isWeekend = (d) => ['Sat', 'Sun'].includes(weekdayShort(d));

const Calendar = () => {
    const { api } = useHotel();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const [from, setFrom] = useState(todayISO());
    const [days, setDays] = useState(14);
    const [typeFilter, setTypeFilter] = useState('');
    const [dialog, setDialog] = useState(null); // { roomId, checkIn, checkOut } | {}
    const to = addDays(from, days);
    const cal = useAsync(() => api.calendar({ from, to }), { initial: null, deps: [from, days] });

    // the header's "New booking" button lands here with ?new=1
    useEffect(() => {
        if (params.get('new')) {
            setDialog({});
            setParams({}, { replace: true });
        }
    }, [params, setParams]);

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
    const colBg = (d) => (d === today ? 'rgba(122,31,43,0.05)' : isWeekend(d) ? T.subtle : undefined);
    const stickyLabel = { position: 'sticky', left: 0, zIndex: 2, bgcolor: T.panel, borderRight: `1px solid ${T.line}` };

    return (
        <>
            <PageHeader title="Room calendar" subtitle="Availability, bookings and nightly rates by room. Click a free cell to book it." />

            <Card sx={{ mb: 1.5, px: 1.5, py: 1, display: 'flex', gap: 1.25, flexWrap: 'wrap', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid ${T.line2}`, borderRadius: '6px', height: 32, overflow: 'hidden' }}>
                    <IconButton size="small" onClick={() => setFrom(addDays(from, -step))} aria-label="Earlier" sx={{ borderRadius: 0, height: '100%' }}><ChevronLeftIcon fontSize="small" /></IconButton>
                    <Button color="inherit" onClick={() => setFrom(todayISO())} sx={{ borderRadius: 0, minHeight: 30, borderLeft: `1px solid ${T.line2}`, borderRight: `1px solid ${T.line2}` }}>Today</Button>
                    <IconButton size="small" onClick={() => setFrom(addDays(from, step))} aria-label="Later" sx={{ borderRadius: 0, height: '100%' }}><ChevronRightIcon fontSize="small" /></IconButton>
                </Box>
                <TextField type="date" value={from} onChange={(e) => e.target.value && setFrom(e.target.value)} sx={{ width: 150, '& .MuiOutlinedInput-root': { height: 32 } }} inputProps={{ 'aria-label': 'Start date' }} />
                <ToggleButtonGroup size="small" exclusive value={days} onChange={(_, v) => v && setDays(v)} aria-label="Days shown" sx={{ height: 32 }}>
                    <ToggleButton value={7}>Week</ToggleButton>
                    <ToggleButton value={14}>2 weeks</ToggleButton>
                    <ToggleButton value={30}>Month</ToggleButton>
                </ToggleButtonGroup>
                <TextField select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} sx={{ width: 170, '& .MuiOutlinedInput-root': { height: 32 } }} SelectProps={{ displayEmpty: true }} inputProps={{ 'aria-label': 'Room type' }}>
                    <MenuItem value="">All room types</MenuItem>
                    {(view?.types || []).map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                </TextField>
                <Box sx={{ flexGrow: 1 }} />
                <Box sx={{ display: 'flex', gap: 1.75, alignItems: 'center', flexWrap: 'wrap' }}>
                    {['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'].map((s) => (
                        <Box key={s} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                            <Box sx={{ width: 14, height: 10, borderRadius: '2px', bgcolor: tone(s).bg, borderLeft: `3px solid ${tone(s).dot}` }} />
                            <Typography sx={{ fontSize: 12, color: T.ink2 }}>{BOOKING_STATUSES[s].label}</Typography>
                        </Box>
                    ))}
                    <Typography sx={{ fontSize: 12, color: T.ink3, pl: 1.5, borderLeft: `1px solid ${T.line}` }}>Free cells show the night's rate (₹). <Box component="span" sx={{ color: T.warning, fontWeight: 600 }}>Amber</Box> = special rate</Typography>
                </Box>
            </Card>

            {view && view.groups.length === 0 && !cal.loading && <Alert severity="info">No rooms yet. Add room types and rooms under Property, and the calendar will appear here.</Alert>}

            {view && view.groups.length > 0 && (
                <Card sx={{ overflow: 'auto', maxHeight: 'calc(100vh - 230px)' }}>
                    <Box sx={{ minWidth: LABEL_W + dates.length * CELL_W }}>
                        {/* date header */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: template, position: 'sticky', top: 0, zIndex: 3, bgcolor: T.panel, borderBottom: `1px solid ${T.line2}` }}>
                            <Box sx={{ ...stickyLabel, zIndex: 4, px: 1.5, display: 'flex', alignItems: 'center' }}>
                                <Typography sx={{ fontSize: 12, fontWeight: 600, color: T.ink2 }}>{monthShort(from)} {from.slice(0, 4)}</Typography>
                            </Box>
                            {dates.map((d) => (
                                <Box key={d} sx={{ textAlign: 'center', pt: 0.75, pb: 0.5, bgcolor: colBg(d), borderLeft: `1px solid ${T.line}`, boxShadow: d === today ? `inset 0 2px 0 ${T.brand}` : undefined }}>
                                    <Typography sx={{ fontSize: 10.5, letterSpacing: '0.04em', textTransform: 'uppercase', color: d === today ? T.brand : T.ink3, fontWeight: 600, lineHeight: 1.2 }}>{weekdayShort(d)}</Typography>
                                    <Typography className="num" sx={{ fontSize: 14, fontWeight: d === today ? 700 : 600, color: d === today ? T.brand : T.ink, lineHeight: 1.3 }}>
                                        {dayOfMonth(d)}
                                        {dayOfMonth(d) === 1 && <Box component="span" sx={{ fontSize: 10.5, color: T.ink3, fontWeight: 500 }}> {monthShort(d)}</Box>}
                                    </Typography>
                                </Box>
                            ))}
                            {/* availability row */}
                            <Box sx={{ ...stickyLabel, zIndex: 4, px: 1.5, py: 0.5, borderTop: `1px solid ${T.line}`, display: 'flex', alignItems: 'center' }}>
                                <Typography sx={{ fontSize: 11.5, color: T.ink3 }}>Available</Typography>
                            </Box>
                            {dates.map((d, i) => (
                                <Tooltip key={d} title={`${view.free[i]} of ${view.sellable} rooms free on ${formatDate(d)}`}>
                                    <Box className="num" sx={{ textAlign: 'center', py: 0.5, fontSize: 12, fontWeight: 600, borderTop: `1px solid ${T.line}`, borderLeft: `1px solid ${T.line}`, bgcolor: colBg(d), color: view.free[i] === 0 ? T.error : view.free[i] <= Math.ceil(view.sellable * 0.2) ? T.warning : T.success }}>
                                        {view.free[i]}
                                    </Box>
                                </Tooltip>
                            ))}
                        </Box>

                        {view.groups.map((g) => (
                            <Box key={g.typeId}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: template, bgcolor: '#F1EFEB', borderBottom: `1px solid ${T.line}` }}>
                                    <Box sx={{ ...stickyLabel, bgcolor: '#F1EFEB', px: 1.5, py: 0.6 }}>
                                        <Typography noWrap sx={{ fontSize: 12, fontWeight: 650, color: T.ink }}>{g.name}</Typography>
                                    </Box>
                                    <Box sx={{ gridColumn: `2 / span ${dates.length}`, px: 1.25, display: 'flex', alignItems: 'center' }}>
                                        <Typography sx={{ fontSize: 11.5, color: T.ink3 }}>{g.rooms.length} room{g.rooms.length > 1 ? 's' : ''} · rack rate {inr(view.base[g.typeId])}</Typography>
                                    </Box>
                                </Box>
                                {g.rooms.map((room) => {
                                    const list = view.byRoom[room.id] || [];
                                    const taken = (d) => list.some((b) => b.checkIn <= d && b.checkOut > d);
                                    return (
                                        <Box key={room.id} sx={{ display: 'grid', gridTemplateColumns: template, gridAutoRows: ROW_H, borderBottom: `1px solid ${T.line}` }}>
                                            <Box sx={{ ...stickyLabel, gridColumn: 1, gridRow: 1, px: 1.5, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                <Typography className="num" sx={{ fontSize: 13, fontWeight: 600 }}>{room.roomNumber}</Typography>
                                                {Boolean(room.outOfService) && <Typography sx={{ fontSize: 11, color: T.error }}>Out of order</Typography>}
                                                {!room.outOfService && room.status === 'DIRTY' && (
                                                    <Tooltip title="Needs cleaning"><Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: TONES.warning.dot }} /></Tooltip>
                                                )}
                                            </Box>
                                            {dates.map((d, i) => {
                                                if (taken(d)) return <Box key={d} sx={{ gridColumn: i + 2, gridRow: 1, borderLeft: `1px solid ${T.line}`, bgcolor: colBg(d) }} />;
                                                const special = view.override[`${room.roomTypeId}|${d}`] !== undefined;
                                                const price = special ? view.override[`${room.roomTypeId}|${d}`] : view.base[room.roomTypeId];
                                                const open = () => !room.outOfService && setDialog({ roomId: room.id, checkIn: d, checkOut: addDays(d, 1) });
                                                const past = d < today;
                                                return (
                                                    <Box
                                                        key={d}
                                                        role="button"
                                                        tabIndex={room.outOfService ? -1 : 0}
                                                        aria-label={`Room ${room.roomNumber}, ${formatDate(d)}, free, ${price} rupees`}
                                                        onClick={open}
                                                        onKeyDown={(e) => e.key === 'Enter' && open()}
                                                        className="num"
                                                        sx={{
                                                            gridColumn: i + 2,
                                                            gridRow: 1,
                                                            borderLeft: `1px solid ${T.line}`,
                                                            display: 'grid',
                                                            placeItems: 'center',
                                                            fontSize: 11.5,
                                                            cursor: room.outOfService ? 'default' : 'pointer',
                                                            color: special ? T.warning : T.ink3,
                                                            fontWeight: special ? 600 : 400,
                                                            bgcolor: room.outOfService ? '#F6EEED' : past ? '#F3F2EF' : colBg(d),
                                                            opacity: past ? 0.7 : 1,
                                                            backgroundImage: room.outOfService ? 'repeating-linear-gradient(135deg, transparent 0 5px, rgba(180,35,24,.08) 5px 6px)' : undefined,
                                                            '&:hover': room.outOfService ? undefined : { bgcolor: T.brandTint, color: T.brand }
                                                        }}
                                                    >
                                                        {room.outOfService ? '' : num(price)}
                                                    </Box>
                                                );
                                            })}
                                            {list.map((b) => {
                                                const s = Math.max(0, dates.indexOf(b.checkIn < from ? from : b.checkIn));
                                                const endDate = b.checkOut > to ? to : b.checkOut;
                                                const e = dates.indexOf(endDate) === -1 ? dates.length : dates.indexOf(endDate);
                                                const name = b.companyName || b.customerName;
                                                const t = tone(b.status);
                                                return (
                                                    <Tooltip key={b.id} title={`${b.bookingNumber} · ${name} · ${formatDate(b.checkIn)} → ${formatDate(b.checkOut)} · ${BOOKING_STATUSES[b.status].label}`}>
                                                        <Box
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={() => navigate(`/hotel/bookings/${b.id}`)}
                                                            onKeyDown={(ev) => ev.key === 'Enter' && navigate(`/hotel/bookings/${b.id}`)}
                                                            sx={{
                                                                gridColumn: `${s + 2} / ${e + 2}`,
                                                                gridRow: 1,
                                                                zIndex: 1,
                                                                m: '5px 1px',
                                                                px: 1,
                                                                borderRadius: '3px',
                                                                bgcolor: t.bg,
                                                                border: `1px solid ${t.line}`,
                                                                borderLeft: `3px solid ${t.dot}`,
                                                                color: t.fg,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 0.75,
                                                                cursor: 'pointer',
                                                                overflow: 'hidden',
                                                                fontSize: 12,
                                                                fontWeight: 600,
                                                                whiteSpace: 'nowrap',
                                                                '&:hover': { filter: 'brightness(0.97)', boxShadow: '0 1px 4px rgba(28,26,25,.15)' }
                                                            }}
                                                        >
                                                            <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</Box>
                                                            <Box component="span" sx={{ fontWeight: 400, opacity: 0.75, display: e - s > 2 ? 'inline' : 'none' }}>{b.bookingNumber}</Box>
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
