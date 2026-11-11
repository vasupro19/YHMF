import { Box, Typography } from '@mui/material';

const PageHeader = ({ title, subtitle, actions }) => (
    <Box sx={{ display: 'flex', alignItems: { sm: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Box>
            <Typography variant="h4" component="h1">
                {title}
            </Typography>
            {subtitle && (
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    {subtitle}
                </Typography>
            )}
        </Box>
        {actions && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actions}</Box>}
    </Box>
);

export default PageHeader;
