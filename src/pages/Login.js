import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, IconButton, InputAdornment, Link, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import Logo from 'components/Logo';
import { useAuth } from 'context/Auth';
import { APP_NAME, APP_TAGLINE } from 'utils/constants';

const POINTS = [
    [EventAvailableOutlinedIcon, 'A live room calendar', 'See every room, every night and every price at a glance.'],
    [ReceiptLongOutlinedIcon, 'Bookings to bill', 'Confirm, check in, add food charges and hand over one clean GST bill.'],
    [GroupsOutlinedIcon, 'Staff and salaries', 'Keep your team and monthly payroll in the same place.']
];

// soft building outline drawn with svg, no image files needed
const Skyline = () => (
    <Box component="svg" viewBox="0 0 600 220" preserveAspectRatio="xMidYMax slice" aria-hidden sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: "100%", height: 150, opacity: 0.13 }}>
        <g fill="none" stroke="#fff" strokeWidth="1.5">
            <path d="M20 220V120h70v100M90 150h60v70M150 220V80h80v140M230 220V130h50v90M280 220V40h90v180M370 220V110h60v90M430 100h70v120M500 220V140h80v80" />
            {[...Array(7)].map((_, r) => [...Array(4)].map((__, c) => <rect key={`${r}-${c}`} x={292 + c * 20} y={55 + r * 22} width="10" height="12" rx="2" />))}
        </g>
    </Box>
);

const Login = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [show, setShow] = useState(false);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password) return setError('Enter your email and password.');
        setBusy(true);
        setError('');
        try {
            await login({ email: email.trim(), password });
        } catch (err) {
            setError(err.message);
            setBusy(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' } }}>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, position: 'relative', overflow: 'hidden', flexDirection: 'column', justifyContent: 'space-between', p: 7, color: '#fff', background: 'radial-gradient(900px 500px at 15% 0%, #2c4a8a 0%, transparent 60%), radial-gradient(700px 400px at 100% 100%, #7a5518 0%, transparent 55%), linear-gradient(160deg, #10234a 0%, #0a1630 100%)' }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Logo size={46} />
                    <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: 26, lineHeight: 1, letterSpacing: '0.02em' }}>{APP_NAME}</Typography>
                        <Typography sx={{ fontSize: 12.5, opacity: 0.7, letterSpacing: '0.05em' }}>{APP_TAGLINE}</Typography>
                    </Box>
                </Stack>
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography variant="h3" sx={{ maxWidth: 520, fontSize: { md: 38, lg: 46 }, lineHeight: 1.1 }}>Run your whole hotel from one screen.</Typography>
                    <Stack spacing={2.5} sx={{ mt: 5, maxWidth: 480 }}>
                        {POINTS.map(([Icon, title, text]) => (
                            <Stack key={title} direction="row" spacing={2}>
                                <Box sx={{ width: 42, height: 42, borderRadius: '12px', display: 'grid', placeItems: 'center', flexShrink: 0, bgcolor: 'rgba(229,180,90,0.16)', color: '#e5b45a' }}><Icon /></Box>
                                <Box><Typography sx={{ fontWeight: 650 }}>{title}</Typography><Typography variant="body2" sx={{ opacity: 0.7 }}>{text}</Typography></Box>
                            </Stack>
                        ))}
                    </Stack>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.55, position: 'relative', zIndex: 1 }}>© {new Date().getFullYear()} {APP_NAME} · {APP_TAGLINE}</Typography>
                <Skyline />
            </Box>

            <Box sx={{ display: 'grid', placeItems: 'center', p: 3, bgcolor: 'background.default' }}>
                <Box component="form" onSubmit={submit} noValidate sx={{ width: '100%', maxWidth: 400 }}>
                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ display: { xs: 'flex', md: 'none' }, mb: 4 }}>
                        <Logo size={38} />
                        <Box><Typography sx={{ fontWeight: 800, fontSize: 20, lineHeight: 1 }}>{APP_NAME}</Typography><Typography variant="caption" color="text.secondary">{APP_TAGLINE}</Typography></Box>
                    </Stack>
                    <Typography variant="h4" component="h1">Welcome back</Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.75, mb: 3.5 }}>Sign in to manage your hotel</Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus sx={{ mb: 2 }} InputProps={{ sx: { height: 50 } }} />
                    <TextField
                        label="Password"
                        type={show ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        sx={{ mb: 3 }}
                        InputProps={{
                            sx: { height: 50 },
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton size="small" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((s) => !s)} edge="end">
                                        {show ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <Button type="submit" variant="contained" size="large" fullWidth disabled={busy} sx={{ height: 50, fontSize: 15 }} startIcon={busy ? <CircularProgress size={18} color="inherit" /> : null}>Sign in</Button>
                    <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}><Link component={RouterLink} to="/forgot-password" underline="hover">Forgot your password?</Link></Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default Login;
