import { Box } from '@mui/material';
import { BOOKING_STATUSES, HK_STATUSES, TASK_STATUSES } from 'utils/constants';

// one muted look for every status in the app: a small dot + label on a tinted background
export const TONES = {
    info: { fg: '#1F4D93', bg: '#EEF3FB', line: '#D3DFF2', dot: '#2F6BD0' },
    success: { fg: '#17643F', bg: '#EDF7F1', line: '#CBE6D6', dot: '#24995F' },
    warning: { fg: '#8A4F00', bg: '#FDF5E7', line: '#F0DDB5', dot: '#D98B12' },
    error: { fg: '#A01F15', bg: '#FDF0EF', line: '#F2CDC9', dot: '#D64535' },
    default: { fg: '#55504A', bg: '#F3F1EE', line: '#E2DED8', dot: '#9A948C' },
    brand: { fg: '#7A1F2B', bg: '#F7EDEF', line: '#E9D3D7', dot: '#7A1F2B' }
};

export const Pill = ({ tone = 'default', label, dot = true, sx }) => {
    const t = TONES[tone] || TONES.default;
    return (
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, height: 22, px: 1, borderRadius: '4px', fontSize: 12, fontWeight: 500, lineHeight: 1, whiteSpace: 'nowrap', color: t.fg, bgcolor: t.bg, border: `1px solid ${t.line}`, ...sx }}>
            {dot && <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: t.dot, flexShrink: 0 }} />}
            {label}
        </Box>
    );
};

export const StatusChip = ({ status }) => {
    const s = TASK_STATUSES.find((x) => x.id === status);
    return <Pill tone={s?.color} label={s?.name || status} />;
};

export const ActiveChip = ({ active }) => <Pill tone={active ? 'success' : 'default'} label={active ? 'Active' : 'Inactive'} />;

export const BookingChip = ({ status }) => {
    const s = BOOKING_STATUSES[status];
    return <Pill tone={s?.color} label={s?.label || status} />;
};

export const HousekeepingChip = ({ status }) => {
    const s = HK_STATUSES.find((x) => x.id === status);
    return <Pill tone={s?.color} label={s?.name || status} />;
};
