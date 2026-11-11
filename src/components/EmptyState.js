import { Box, Typography } from '@mui/material';

const EmptyState = ({ icon, title, text, action }) => (
    <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
        {icon && (
            <Box
                sx={{
                    width: 64,
                    height: 64,
                    mx: 'auto',
                    mb: 2,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: 'action.hover',
                    color: 'text.secondary'
                }}
            >
                {icon}
            </Box>
        )}
        <Typography variant="h6">{title}</Typography>
        {text && (
            <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 420, mx: 'auto' }}>
                {text}
            </Typography>
        )}
        {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
);

export default EmptyState;
