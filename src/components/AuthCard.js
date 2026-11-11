import { Box, Typography } from '@mui/material';
import Logo from './Logo';
import { T } from './Theme';

// centred panel used by the forgot / reset password pages
const AuthCard = ({ title, subtitle, children }) => (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3, bgcolor: T.page }}>
        <Box sx={{ width: '100%', maxWidth: 420 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Logo size={34} showText />
            </Box>
            <Box sx={{ bgcolor: T.panel, borderRadius: '10px', border: `1px solid ${T.line}`, boxShadow: '0 1px 2px rgba(28,26,25,.04)', p: { xs: 3, sm: 4 } }}>
                <Typography component="h1" sx={{ fontSize: 20, fontWeight: 650 }}>{title}</Typography>
                {subtitle && <Typography sx={{ mt: 0.75, mb: 3, fontSize: 13.5, color: T.ink2 }}>{subtitle}</Typography>}
                {children}
            </Box>
        </Box>
    </Box>
);

export default AuthCard;
