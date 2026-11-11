import { useMemo, useState } from 'react';
import { Alert, Box, ListItemText, Menu, MenuItem, Tab, Tabs, Typography } from '@mui/material';
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
import { HousekeepingChip, Pill } from 'components/StatusChip';
import { KpiStrip } from 'components/Panel';
import { T } from 'components/Theme';
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

    const count = (id) => (id === 'ALL' ? list.data.length : list.data.filter((r) => (id === 'OOS' ? r.outOfService : !r.outOfService && r.status === id)).length);
    const occupied = list.data.filter((r) => r.guestName).length;

    const columns = useMemo(() => [
        { id: 'roomNumber', label: 'Room', render: (r) => <Typography className="num" sx={{ fontSize: 13, fontWeight: 650 }}>{r.roomNumber}</Typography> },
        { id: 'roomTypeName', label: 'Room type' },
        { id: 'floor', label: 'Floor', value: (r) => r.floor || '', render: (r) => r.floor || <Box component="span" sx={{ color: T.ink3 }}>—</Box> },
        { id: 'status', label: 'Housekeeping', value: (r) => (r.outOfService ? 'Out of service' : r.status), render: (r) => (r.outOfService ? <Pill tone="error" label="Out of service" /> : <HousekeepingChip status={r.status} />) },
        {
            id: 'guestName',
            label: 'Occupancy',
            value: (r) => (r.guestName ? `${r.guestName} until ${formatDate(r.guestCheckOut)}` : r.arrivingToday ? 'Arriving today' : 'Vacant'),
            render: (r) =>
                r.guestName ? (
                    <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{r.guestName}</Typography>
                        <Typography sx={{ fontSize: 12, color: T.ink3 }}>In house until {formatDate(r.guestCheckOut)}</Typography>
                    </Box>
                ) : r.arrivingToday ? (
                    <Pill tone="info" label="Arriving today" />
                ) : (
                    <Typography sx={{ fontSize: 12.5, color: T.ink3 }}>Vacant</Typography>
                )
        }
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
            <PageHeader title="Rooms" subtitle="Room status board: who is in each room and whether it is ready to sell" />
            <Box sx={{ mb: 2 }}>
                <KpiStrip
                    loading={list.loading}
                    items={[
                        { label: 'Rooms', value: list.data.length, sub: `${list.data.length - count('OOS')} in service` },
                        { label: 'Occupied', value: occupied, sub: 'guests in house' },
                        { label: 'Clean', value: count('CLEAN'), sub: 'ready to sell', color: T.success },
                        { label: 'Dirty', value: count('DIRTY'), sub: 'need cleaning', color: count('DIRTY') ? T.warning : undefined },
                        { label: 'Inspected', value: count('INSPECTED'), sub: 'checked by supervisor' },
                        { label: 'Out of service', value: count('OOS'), sub: 'cannot be booked', color: count('OOS') ? T.error : undefined }
                    ]}
                />
            </Box>
            {!types.loading && types.data.length === 0 && <Alert severity="info" sx={{ mb: 2 }}>Add a room type first (Room types & rates), then add rooms to it.</Alert>}
            <DataTable columns={columns} rows={rows} loading={list.loading} onAdd={canEdit && types.data.length ? dialog.openAdd : undefined} addLabel="Add room" searchPlaceholder="Search room, type, guest" exportName="rooms" emptyText="Add your rooms one by one."
                header={
                    <Tabs value={filter} onChange={(_, v) => setFilter(v)} variant="scrollable" scrollButtons="auto" aria-label="Filter rooms">
                        {[['ALL', 'All rooms'], ...HK_STATUSES.map((x) => [x.id, x.name]), ['OOS', 'Out of service']].map(([id, label]) => (
                            <Tab
                                key={id}
                                value={id}
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                        {label}
                                        <Box component="span" className="num" sx={{ fontSize: 11.5, fontWeight: 600, px: 0.75, py: '1px', borderRadius: '10px', bgcolor: filter === id ? T.brandTint : '#EFEDE9', color: filter === id ? T.brand : T.ink2 }}>
                                            {list.loading ? '·' : count(id)}
                                        </Box>
                                    </Box>
                                }
                            />
                        ))}
                    </Tabs>
                }
                actions={[
                    { title: 'Set housekeeping status', icon: <CleaningServicesOutlinedIcon fontSize="small" />, onClick: (room) => setMenu({ anchor: document.activeElement, room }), hidden: (r) => r.outOfService },
                    { title: 'Edit', icon: <EditOutlinedIcon fontSize="small" />, onClick: dialog.openEdit, hidden: () => !canEdit }
                ]} />
            <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
                {HK_STATUSES.map((s) => (
                    <MenuItem key={s.id} selected={menu?.room.status === s.id} onClick={() => setHk(s.id)}><ListItemText primaryTypographyProps={{ fontSize: 13 }}>Mark {s.name.toLowerCase()}</ListItemText></MenuItem>
                ))}
            </Menu>
            <FormDialog open={dialog.open} title={editing ? `Edit room ${dialog.editing.roomNumber}` : 'Add room'} subtitle="Rooms marked out of service can't be booked" fields={fields} initialValues={editing ? { ...dialog.editing, outOfService: Boolean(dialog.editing.outOfService) } : { outOfService: false }} validationSchema={schema} onSubmit={save} onClose={dialog.close} />
        </>
    );
};

export default Rooms;
