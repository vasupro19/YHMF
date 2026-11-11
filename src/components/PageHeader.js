import { Box, Typography } from '@mui/material';
import { T } from './Theme';

// page title row: title + one line of context on the left, actions on the right
const PageHeader = ({ title, subtitle, actions, meta }) => (
    <Box sx={{ display: 'flex', alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, mb: 2 }}>
        <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                <Typography variant="h4" component="h1">{title}</Typography>
                {meta}
            </Box>
            {subtitle && <Typography sx={{ mt: 0.25, fontSize: 13, color: T.ink2 }}>{subtitle}</Typography>}
        </Box>
        {actions && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flexShrink: 0 }}>{actions}</Box>}
    </Box>
);

export default PageHeader;
