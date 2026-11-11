import { useMemo, useState } from 'react';
import { Box, Chip, MenuItem, TextField, Typography } from '@mui/material';
import useHotel from 'hooks/useHotel';
import useAsync from 'hooks/useAsync';
import DataTable from 'components/DataTable';
import PageHeader from 'components/PageHeader';

const ENTITIES = [['', 'Everything'], ['Booking', 'Bookings'], ['Room', 'Rooms'], ['RoomType', 'Prices & room types'], ['Customer', 'Guests'], ['Staff', 'Staff & payroll'], ['Settings', 'Settings']];

const COLOR = { CREATE: 'success', UPDATE: 'info', CHARGE_ADDED: 'warning', CHARGE_REMOVED: 'error', PAYMENT_ADDED: 'success', PAYMENT_REMOVED: 'error', SALARY_REMOVED: 'error', CANCEL: 'error', NOSHOW: 'error', CHECKIN: 'success', CHECKOUT: 'info' };
const label = (a) => a.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());

const Activity = () => {
    const { api } = useHotel();
    const [entity, setEntity] = useState('');
    const list = useAsync(() => api.activity(entity ? { entity } : {}), { deps: [entity] });

    const columns = useMemo(() => [
        { id: 'createdAt', label: 'When', value: (r) => r.createdAt, render: (r) => <Box><Typography variant="body2" sx={{ fontWeight: 600 }}>{new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Typography><Typography variant="caption" color="text.secondary">{new Date(r.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Typography></Box> },
        { id: 'userName', label: 'Who', value: (r) => r.userName || 'Unknown' },
        { id: 'action', label: 'What', value: (r) => label(r.action), render: (r) => <Chip size="small" variant="outlined" color={COLOR[r.action] || 'default'} label={label(r.action)} /> },
        { id: 'summary', label: 'Details' }
    ], []);

    return (
        <>
            <PageHeader title="Activity log" subtitle="Who changed what, newest first. Entries can't be edited or deleted." />
            <DataTable columns={columns} rows={list.data} loading={list.loading} searchPlaceholder="Search people or details…" exportName="activity-log" emptyText="Actions such as bookings, payments and price changes will be listed here."
                toolbarExtra={<TextField select label="Show" value={entity} onChange={(e) => setEntity(e.target.value)} sx={{ width: 210 }}>{ENTITIES.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}</TextField>} />
        </>
    );
};

export default Activity;
