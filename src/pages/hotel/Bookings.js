import { useMemo, useState } from 'react';
import { Box, Chip, Tab, Tabs, Typography } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useHotel from 'hooks/useHotel';
import useAsync from 'hooks/useAsync';
import BookingDialog from 'components/BookingDialog';
import DataTable from 'components/DataTable';
import PageHeader from 'components/PageHeader';
import { BookingChip } from 'components/StatusChip';
import { T } from 'components/Theme';
import { BOOKING_SOURCES } from 'utils/constants';
import { daysBetween, formatDate, inr, todayISO } from 'utils/format';

// saved views: [id, label, filter(booking, today)]
const VIEWS = [
    ['ALL', 'All bookings', () => true],
    ['ARRIVALS', 'Arrivals today', (b, t) => ['PENDING', 'CONFIRMED'].includes(b.status) && b.checkIn === t],
    ['INHOUSE', 'In house', (b) => b.status === 'CHECKED_IN'],
    ['DEPARTURES', 'Due out', (b, t) => b.status === 'CHECKED_IN' && b.checkOut <= t],
    ['UPCOMING', 'Upcoming', (b) => ['PENDING', 'CONFIRMED'].includes(b.status)],
    ['DUE', 'Balance due', (b) => !['CANCELLED', 'NO_SHOW'].includes(b.status) && b.balance > 0],
    ['PAST', 'Checked out', (b) => b.status === 'CHECKED_OUT'],
    ['CANCELLED', 'Cancelled', (b) => ['CANCELLED', 'NO_SHOW'].includes(b.status)]
];

const Bookings = () => {
    const { api } = useHotel();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const customerId = params.get('customerId');
    const q = params.get('q') || '';
    const [view, setView] = useState('ALL');
    const [creating, setCreating] = useState(false);
    const list = useAsync(() => api.bookings.list(customerId ? { customerId } : {}), { deps: [customerId] });
    const today = todayISO();

    const filterOf = (id) => VIEWS.find((v) => v[0] === id)[2];
    const rows = useMemo(() => list.data.filter((b) => filterOf(view)(b, today)), [list.data, view, today]);
    const count = (id) => list.data.filter((b) => filterOf(id)(b, today)).length;

    const columns = useMemo(
        () => [
            { id: 'bookingNumber', label: 'Booking no.', render: (b) => <Typography sx={{ fontSize: 13, fontWeight: 600, color: T.brand }}>{b.bookingNumber}</Typography> },
            {
                id: 'customerName',
                label: 'Guest',
                value: (b) => `${b.customerName} ${b.companyName || ''} ${b.customerPhone || ''}`,
                render: (b) => (
                    <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{b.customerName}</Typography>
                        {b.companyName && <Typography sx={{ fontSize: 12, color: T.ink3 }}>{b.companyName}</Typography>}
                    </Box>
                )
            },
            { id: 'roomNumber', label: 'Room', value: (b) => `${b.roomNumber} ${b.roomTypeName}`, render: (b) => <Box><Typography sx={{ fontSize: 13, fontWeight: 600 }} className="num">{b.roomNumber}</Typography><Typography sx={{ fontSize: 12, color: T.ink3 }}>{b.roomTypeName}</Typography></Box> },
            { id: 'checkIn', label: 'Arrival', value: (b) => b.checkIn, render: (b) => formatDate(b.checkIn) },
            { id: 'checkOut', label: 'Departure', value: (b) => b.checkOut, render: (b) => formatDate(b.checkOut) },
            { id: 'nights', label: 'Nights', align: 'right', value: (b) => daysBetween(b.checkIn, b.checkOut) },
            { id: 'source', label: 'Source', value: (b) => BOOKING_SOURCES.find((s) => s.id === b.source)?.name || b.source },
            { id: 'status', label: 'Status', value: (b) => b.status, render: (b) => <BookingChip status={b.status} /> },
            { id: 'total', label: 'Total', value: (b) => b.total, render: (b) => inr(b.total), align: 'right' },
            {
                id: 'balance',
                label: 'Balance',
                value: (b) => b.balance,
                align: 'right',
                render: (b) =>
                    ['CANCELLED', 'NO_SHOW'].includes(b.status) ? (
                        <Box component="span" sx={{ color: T.ink3 }}>—</Box>
                    ) : b.balance > 0 ? (
                        <Typography component="span" sx={{ fontSize: 13, fontWeight: 600, color: T.error }}>{inr(b.balance)}</Typography>
                    ) : (
                        <Typography component="span" sx={{ fontSize: 12.5, color: T.success }}>Settled</Typography>
                    )
            }
        ],
        []
    );

    return (
        <>
            <PageHeader title="Reservations" subtitle="Every booking from enquiry to checkout" />
            <DataTable
                columns={columns}
                rows={rows}
                loading={list.loading}
                onAdd={() => setCreating(true)}
                addLabel="New booking"
                searchPlaceholder="Search booking no., guest, phone, room"
                initialQuery={q}
                exportName="bookings"
                rowKey="id"
                onRowClick={(b) => navigate(`/hotel/bookings/${b.id}`)}
                emptyText="No bookings in this view."
                header={
                    <Tabs value={view} onChange={(_, v) => setView(v)} variant="scrollable" scrollButtons="auto" aria-label="Booking views">
                        {VIEWS.map(([id, label]) => (
                            <Tab
                                key={id}
                                value={id}
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                        {label}
                                        <Box component="span" className="num" sx={{ fontSize: 11.5, fontWeight: 600, px: 0.75, py: '1px', borderRadius: '10px', bgcolor: view === id ? T.brandTint : '#EFEDE9', color: view === id ? T.brand : T.ink2 }}>
                                            {list.loading ? '·' : count(id)}
                                        </Box>
                                    </Box>
                                }
                            />
                        ))}
                    </Tabs>
                }
                toolbarExtra={customerId && <Chip size="small" label="Showing one guest" onDelete={() => setParams({})} />}
            />
            <BookingDialog open={creating} onClose={() => setCreating(false)} onSaved={(b) => { setCreating(false); navigate(`/hotel/bookings/${b.id}`, { state: { created: true } }); }} />
        </>
    );
};

export default Bookings;
