import { Box, Typography } from '@mui/material';
import { T } from './Theme';

const EmptyState = ({ icon, title, text, action, compact = false }) => (
    <Box sx={{ textAlign: 'center', py: compact ? 4 : 7, px: 2 }}>
        {icon && (
            <Box sx={{ width: 44, height: 44, mx: 'auto', mb: 1.5, borderRadius: '8px', display: 'grid', placeItems: 'center', bgcolor: T.subtle, border: `1px solid ${T.line}`, color: T.ink3, '& svg': { fontSize: 22 } }}>
                {icon}
            </Box>
        )}
        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{title}</Typography>
        {text && <Typography sx={{ mt: 0.5, maxWidth: 420, mx: 'auto', fontSize: 13, color: T.ink2 }}>{text}</Typography>}
        {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
);

export default EmptyState;
