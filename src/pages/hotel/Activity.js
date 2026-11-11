import { useMemo, useState } from 'react';
import { Box, MenuItem, TextField, Typography } from '@mui/material';
import useHotel from 'hooks/useHotel';
import useAsync from 'hooks/useAsync';
import DataTable from 'components/DataTable';
import PageHeader from 'components/PageHeader';
import { Pill } from 'components/StatusChip';
import { T } from 'components/Theme';
import { initials } from 'utils/format';

const ENTITIES = [['', 'All activity'], ['Booking', 'Bookings'], ['Room', 'Rooms'], ['RoomType', 'Prices & room types'], ['Customer', 'Guests'], ['Staff', 'Staff & payroll'], ['Settings', 'Settings']];

const COLOR = { CREATE: 'success', UPDATE: 'info', CHARGE_ADDED: 'warning', CHARGE_REMOVED: 'error', PAYMENT_ADDED: 'success', PAYMENT_REMOVED: 'error', SALARY_REMOVED: 'error', CANCEL: 'error', NOSHOW: 'error', CHECKIN: 'success', CHECKOUT: 'info' };
const label = (a) => a.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());

const Activity = () => {
    const { api } = useHotel();
    const [entity, setEntity] = useState('');
    const list = useAsync(() => api.activity(entity ? { entity } : {}), { deps: [entity] });

    const columns = useMemo(
        () => [
            {
                id: 'createdAt',
                label: 'When',
                width: 130,
                value: (r) => r.createdAt,
                render: (r) => (
                    <Box sx={{ whiteSpace: 'nowrap' }}>
                        <Typography component="span" sx={{ fontSize: 13, fontWeight: 500 }}>{new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Typography>
                        <Typography component="span" sx={{ fontSize: 12, color: T.ink3, ml: 0.75 }}>{new Date(r.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Typography>
                    </Box>
                )
            },
            {
                id: 'userName',
                label: 'User',
                value: (r) => r.userName || 'Unknown',
                render: (r) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 600, bgcolor: T.subtle, border: `1px solid ${T.line}`, color: T.ink2, flexShrink: 0 }}>{initials(r.userName || '?')}</Box>
                        <Typography sx={{ fontSize: 13 }}>{r.userName || 'Unknown'}</Typography>
                    </Box>
                )
            },
            { id: 'action', label: 'Action', value: (r) => label(r.action), render: (r) => <Pill tone={COLOR[r.action] || 'default'} label={label(r.action)} /> },
            { id: 'summary', label: 'Details', render: (r) => <Typography sx={{ fontSize: 13, color: T.ink2 }}>{r.summary}</Typography> }
        ],
        []
    );

    return (
        <>
            <PageHeader title="Activity log" subtitle="Who changed what, newest first. Entries can't be edited or deleted." />
            <DataTable
                columns={columns}
                rows={list.data}
                loading={list.loading}
                searchPlaceholder="Search people or details"
                exportName="activity-log"
                emptyText="Actions such as bookings, payments and price changes will be listed here."
                toolbarExtra={
                    <TextField select value={entity} onChange={(e) => setEntity(e.target.value)} sx={{ width: 200, '& .MuiOutlinedInput-root': { height: 32 } }} SelectProps={{ displayEmpty: true }} inputProps={{ 'aria-label': 'Show' }}>
                        {ENTITIES.map(([v, l]) => (
                            <MenuItem key={v} value={v}>{l}</MenuItem>
                        ))}
                    </TextField>
                }
            />
        </>
    );
};

export default Activity;
