import { Chip } from '@mui/material';
import { BOOKING_STATUSES, HK_STATUSES, TASK_STATUSES } from 'utils/constants';

export const StatusChip = ({ status }) => {
    const s = TASK_STATUSES.find((x) => x.id === status);
    return <Chip size="small" label={s?.name || status} color={s?.color || 'default'} variant="outlined" />;
};

export const ActiveChip = ({ active }) => <Chip size="small" label={active ? 'Active' : 'Inactive'} color={active ? 'success' : 'default'} variant="outlined" />;

export const BookingChip = ({ status }) => {
    const s = BOOKING_STATUSES[status];
    return <Chip size="small" label={s?.label || status} color={s?.color || 'default'} variant={status === 'CHECKED_OUT' ? 'outlined' : 'filled'} />;
};

export const HousekeepingChip = ({ status }) => {
    const s = HK_STATUSES.find((x) => x.id === status);
    return <Chip size="small" label={s?.name || status} color={s?.color || 'default'} variant="outlined" />;
};
