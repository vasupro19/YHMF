import { useMemo, useState } from 'react';
import { Box, Chip, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useHotel from 'hooks/useHotel';
import useAsync from 'hooks/useAsync';
import BookingDialog from 'components/BookingDialog';
import DataTable from 'components/DataTable';
import PageHeader from 'components/PageHeader';
import { BookingChip } from 'components/StatusChip';
import { daysBetween, formatDate, inr } from 'utils/format';

const VIEWS = [
    ['ALL', 'All', null],
    ['UPCOMING', 'Upcoming', ['PENDING', 'CONFIRMED']],
    ['INHOUSE', 'In house', ['CHECKED_IN']],
    ['PAST', 'Checked out', ['CHECKED_OUT']],
    ['CANCELLED', 'Cancelled', ['CANCELLED', 'NO_SHOW']]
];

const Bookings = () => {
    const { api } = useHotel();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const customerId = params.get('customerId');
    const [view, setView] = useState('ALL');
    const [creating, setCreating] = useState(false);
    const list = useAsync(() => api.bookings.list(customerId ? { customerId } : {}), { deps: [customerId] });

    const rows = useMemo(() => {
        const statuses = VIEWS.find((v) => v[0] === view)[2];
        return statuses ? list.data.filter((b) => statuses.includes(b.status)) : list.data;
    }, [list.data, view]);
    const count = (v) => { const s = VIEWS.find((x) => x[0] === v)[2]; return s ? list.data.filter((b) => s.includes(b.status)).length : list.data.length; };

    const columns = useMemo(() => [
        { id: 'bookingNumber', label: 'Booking', render: (b) => <strong>{b.bookingNumber}</strong> },
        { id: 'customerName', label: 'Guest', render: (b) => <Box><Typography variant="body2" sx={{ fontWeight: 600 }}>{b.customerName}</Typography>{b.companyName && <Typography variant="caption" color="text.secondary">{b.companyName}</Typography>}</Box>, value: (b) => `${b.customerName} ${b.companyName || ''}` },
        { id: 'roomNumber', label: 'Room', value: (b) => `${b.roomNumber} · ${b.roomTypeName}` },
        { id: 'checkIn', label: 'Stay', render: (b) => `${formatDate(b.checkIn)} → ${formatDate(b.checkOut)} (${daysBetween(b.checkIn, b.checkOut)}n)`, value: (b) => b.checkIn },
        { id: 'status', label: 'Status', value: (b) => b.status, render: (b) => <BookingChip status={b.status} /> },
        { id: 'total', label: 'Total', value: (b) => b.total, render: (b) => inr(b.total), align: 'right' },
        { id: 'balance', label: 'Due', value: (b) => b.balance, align: 'right', render: (b) => (['CANCELLED', 'NO_SHOW'].includes(b.status) ? '-' : <Typography variant="body2" color={b.balance > 0 ? 'error.main' : 'success.main'} sx={{ fontWeight: 600 }}>{b.balance > 0 ? inr(b.balance) : 'Settled'}</Typography>) }
    ], []);

    return (
        <>
            <PageHeader title="Bookings" subtitle="Every reservation, from enquiry to checkout" />
            <DataTable columns={columns} rows={rows} loading={list.loading} onAdd={() => setCreating(true)} addLabel="New booking" searchPlaceholder="Search booking, guest, room…" exportName="bookings" rowKey="id" onRowClick={(b) => navigate(`/hotel/bookings/${b.id}`)} emptyText="No bookings here yet. Use the calendar or New booking."
                toolbarExtra={
                    <>
                        <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)} aria-label="Filter bookings">
                            {VIEWS.map(([id, label]) => <ToggleButton key={id} value={id}>{label} {count(id)}</ToggleButton>)}
                        </ToggleButtonGroup>
                        {customerId && <Chip label="One guest only" onDelete={() => setParams({})} />}
                    </>
                } />
            <BookingDialog open={creating} onClose={() => setCreating(false)} onSaved={(b) => { setCreating(false); navigate(`/hotel/bookings/${b.id}`, { state: { created: true } }); }} />
        </>
    );
};

export default Bookings;
