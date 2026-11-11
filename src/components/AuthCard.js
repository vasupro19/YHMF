import { Box, Stack, Typography } from '@mui/material';
import Logo from './Logo';
import { APP_NAME, APP_TAGLINE } from 'utils/constants';

// centred card used by the forgot / reset password pages
const AuthCard = ({ title, subtitle, children }) => (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3, bgcolor: 'background.default', backgroundImage: 'radial-gradient(700px 360px at 50% -10%, rgba(31,58,115,.18), transparent 70%)' }}>
        <Box sx={{ width: '100%', maxWidth: 420 }}>
            <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="center" sx={{ mb: 3 }}>
                <Logo size={40} />
                <Box><Typography sx={{ fontWeight: 800, fontSize: 22, lineHeight: 1 }}>{APP_NAME}</Typography><Typography variant="caption" color="text.secondary">{APP_TAGLINE}</Typography></Box>
            </Stack>
            <Box sx={{ bgcolor: 'background.paper', borderRadius: '20px', border: 1, borderColor: 'divider', boxShadow: 3, p: { xs: 3, sm: 4 } }}>
                <Typography variant="h5" component="h1">{title}</Typography>
                {subtitle && <Typography color="text.secondary" sx={{ mt: 0.75, mb: 3 }}>{subtitle}</Typography>}
                {children}
            </Box>
        </Box>
    </Box>
);

export default AuthCard;
