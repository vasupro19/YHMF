import { useMemo, useState } from 'react';
import { Alert, Chip, ListItemText, Menu, MenuItem, ToggleButton, ToggleButtonGroup } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CleaningServicesOutlinedIcon from '@mui/icons-material/CleaningServicesOutlined';
import * as Yup from 'yup';
import { useAuth } from 'context/Auth';
import useHotel from 'hooks/useHotel';
import useAsync from 'hooks/useAsync';
import useDialogState from 'hooks/useDialogState';
import { useToast } from 'context/Toast';
import DataTable from 'components/DataTable';
import FormDialog from 'components/FormDialog';
import PageHeader from 'components/PageHeader';
import { HousekeepingChip } from 'components/StatusChip';
import { HK_STATUSES } from 'utils/constants';
import { formatDate } from 'utils/format';

const schema = Yup.object({
    roomNumber: Yup.string().trim().required('Room number is required'),
    roomTypeId: Yup.number().typeError('Choose a room type').required('Choose a room type')
});

const Rooms = () => {
    const { api } = useHotel();
    const { accessibleUrls } = useAuth();
    const canEdit = accessibleUrls.includes('/hotel/room-types');
    const toast = useToast();
    const dialog = useDialogState();
    const [filter, setFilter] = useState('ALL');
    const [menu, setMenu] = useState(null); // { anchor, room }
    const list = useAsync(() => api.rooms.list());
    const types = useAsync(() => api.roomTypes.list(), { enabled: canEdit });
    const editing = Boolean(dialog.editing);

    const rows = useMemo(() => (filter === 'ALL' ? list.data : list.data.filter((r) => (filter === 'OOS' ? r.outOfService : !r.outOfService && r.status === filter))), [list.data, filter]);

    const columns = useMemo(() => [
        { id: 'roomNumber', label: 'Room', render: (r) => <strong>{r.roomNumber}</strong> },
        { id: 'roomTypeName', label: 'Type' },
        { id: 'floor', label: 'Floor', value: (r) => r.floor || '-' },
        { id: 'status', label: 'Housekeeping', value: (r) => (r.outOfService ? 'Out of service' : r.status), render: (r) => (r.outOfService ? <Chip size="small" label="Out of service" color="error" variant="outlined" /> : <HousekeepingChip status={r.status} />) },
        { id: 'guestName', label: 'In house', value: (r) => (r.guestName ? `${r.guestName} until ${formatDate(r.guestCheckOut)}` : r.arrivingToday ? 'Arriving today' : '-') }
    ], []);

    const fields = [
        { name: 'roomNumber', label: 'Room number', type: 'text', half: true },
        { name: 'floor', label: 'Floor', type: 'text', half: true },
        { name: 'roomTypeId', label: 'Room type', type: 'select', required: true, options: types.data.filter((t) => t.active || t.id === dialog.editing?.roomTypeId) },
        { name: 'notes', label: 'Notes', type: 'textarea' },
        { name: 'outOfService', label: 'Out of service (cannot be booked)', type: 'switch' }
    ];

    const save = async (v) => {
        toast.success(await api.rooms.save(dialog.editing?.id, { roomNumber: v.roomNumber.trim(), floor: v.floor, roomTypeId: Number(v.roomTypeId), notes: v.notes, outOfService: v.outOfService }));
        dialog.close();
        list.reload();
    };

    const setHk = async (status) => {
        const room = menu.room;
        setMenu(null);
        try {
            toast.success(await api.rooms.housekeeping(room.id, status));
            list.reload();
        } catch (e) {
            toast.error(e.message);
        }
    };

    return (
        <>
            <PageHeader title="Rooms" subtitle="Every room, who is in it, and whether it is ready" />
            {!types.loading && types.data.length === 0 && <Alert severity="info" sx={{ mb: 2 }}>Add a room type first (Room types & rates), then add rooms to it.</Alert>}
            <DataTable columns={columns} rows={rows} loading={list.loading} onAdd={canEdit && types.data.length ? dialog.openAdd : undefined} addLabel="Add room" searchPlaceholder="Search rooms…" exportName="rooms" emptyText="Add your rooms one by one."
                toolbarExtra={
                    <ToggleButtonGroup size="small" exclusive value={filter} onChange={(_, v) => v && setFilter(v)} aria-label="Filter rooms">
                        <ToggleButton value="ALL">All</ToggleButton>
                        {HK_STATUSES.map((s) => <ToggleButton key={s.id} value={s.id}>{s.name}</ToggleButton>)}
                        <ToggleButton value="OOS">Out of service</ToggleButton>
                    </ToggleButtonGroup>
                }
                actions={[
                    { title: 'Set housekeeping status', icon: <CleaningServicesOutlinedIcon fontSize="small" />, onClick: (room) => setMenu({ anchor: document.activeElement, room }), hidden: (r) => r.outOfService },
                    { title: 'Edit', icon: <EditOutlinedIcon fontSize="small" />, onClick: dialog.openEdit, hidden: () => !canEdit }
                ]} />
            <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
                {HK_STATUSES.map((s) => (
                    <MenuItem key={s.id} selected={menu?.room.status === s.id} onClick={() => setHk(s.id)}><ListItemText>Mark {s.name.toLowerCase()}</ListItemText></MenuItem>
                ))}
            </Menu>
            <FormDialog open={dialog.open} title={editing ? `Edit room ${dialog.editing.roomNumber}` : 'Add room'} fields={fields} initialValues={editing ? { ...dialog.editing, outOfService: Boolean(dialog.editing.outOfService) } : { outOfService: false }} validationSchema={schema} onSubmit={save} onClose={dialog.close} />
        </>
    );
};

export default Rooms;
