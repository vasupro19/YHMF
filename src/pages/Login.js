import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, IconButton, InputAdornment, Link, TextField, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Logo from 'components/Logo';
import { T } from 'components/Theme';
import { useAuth } from 'context/Auth';

// a quiet product glimpse for the brand panel: a few rows of a room calendar
const ROWS = [
    ['101', 'Deluxe', [[0, 3, 'In house'], [4, 6, 'Confirmed']]],
    ['102', 'Deluxe', [[1, 5, 'Confirmed']]],
    ['201', 'Suite', [[0, 2, 'Checked out'], [3, 7, 'Confirmed']]],
    ['202', 'Suite', [[2, 4, 'In house']]],
    ['301', 'Family', [[0, 7, 'In house']]]
];
const BAR = { 'In house': 'rgba(255,255,255,.92)', Confirmed: 'rgba(255,255,255,.55)', 'Checked out': 'rgba(255,255,255,.22)' };
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const Glimpse = () => (
    <Box aria-hidden sx={{ border: '1px solid rgba(255,255,255,.14)', borderRadius: '8px', bgcolor: 'rgba(0,0,0,.14)', overflow: 'hidden', maxWidth: 460 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '64px repeat(7, 1fr)', borderBottom: '1px solid rgba(255,255,255,.12)' }}>
            <Box />
            {DAYS.map((d) => <Box key={d} sx={{ py: 0.75, textAlign: 'center', fontSize: 10.5, letterSpacing: '0.04em', color: 'rgba(255,255,255,.55)', borderLeft: '1px solid rgba(255,255,255,.08)' }}>{d}</Box>)}
        </Box>
        {ROWS.map(([room, type, bars]) => (
            <Box key={room} sx={{ display: 'grid', gridTemplateColumns: '64px repeat(7, 1fr)', height: 30, borderBottom: '1px solid rgba(255,255,255,.08)', position: 'relative' }}>
                <Box sx={{ px: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: '#fff' }}>{room}</Typography>
                    <Typography sx={{ fontSize: 9.5, color: 'rgba(255,255,255,.45)' }}>{type}</Typography>
                </Box>
                {bars.map(([s, e, status]) => (
                    <Box key={s} sx={{ gridColumn: `${s + 2} / ${e + 2}`, gridRow: 1, m: '7px 2px', borderRadius: '3px', bgcolor: BAR[status] }} />
                ))}
            </Box>
        ))}
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
        <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(440px, 0.85fr)' }, bgcolor: T.panel }}>
            <Box
                sx={{
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    p: { md: 6, lg: 8 },
                    color: '#fff',
                    bgcolor: '#5A1720',
                    backgroundImage: 'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)',
                    backgroundSize: '32px 32px'
                }}
            >
                <Logo size={36} showText tone="inverse" />
                <Box>
                    <Typography sx={{ fontSize: { md: 32, lg: 38 }, fontWeight: 650, lineHeight: 1.15, letterSpacing: '-0.02em', maxWidth: 520 }}>
                        Front desk, billing and back office for independent hotels.
                    </Typography>
                    <Typography sx={{ mt: 2, fontSize: 15, color: 'rgba(255,255,255,.72)', maxWidth: 480, lineHeight: 1.6 }}>
                        Room calendar, reservations, folios with GST invoices, housekeeping and payroll, in one system your whole team can use.
                    </Typography>
                    <Box sx={{ mt: 5 }}>
                        <Glimpse />
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 3, fontSize: 12.5, color: 'rgba(255,255,255,.55)' }}>
                    <span>© {new Date().getFullYear()} YHM</span>
                    <span>GST-ready invoicing</span>
                    <span>Data kept separate for every hotel</span>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: { xs: 3, sm: 6 } }}>
                <Box component="form" onSubmit={submit} noValidate sx={{ width: '100%', maxWidth: 380 }}>
                    <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 5 }}>
                        <Logo size={34} showText />
                    </Box>
                    <Typography component="h1" sx={{ fontSize: 24, fontWeight: 650, letterSpacing: '-0.015em' }}>Sign in</Typography>
                    <Typography sx={{ mt: 0.75, mb: 3.5, fontSize: 13.5, color: T.ink2 }}>Use the email and password set up for your hotel account.</Typography>

                    {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

                    <Typography component="label" htmlFor="login-email" sx={{ display: 'block', fontSize: 13, fontWeight: 600, mb: 0.75 }}>Email</Typography>
                    <TextField id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus placeholder="you@hotel.com" sx={{ mb: 2.25 }} InputProps={{ sx: { height: 42 } }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.75 }}>
                        <Typography component="label" htmlFor="login-password" sx={{ fontSize: 13, fontWeight: 600 }}>Password</Typography>
                        <Link component={RouterLink} to="/forgot-password" underline="hover" sx={{ fontSize: 12.5, fontWeight: 500 }}>Forgot password?</Link>
                    </Box>
                    <TextField
                        id="login-password"
                        type={show ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        sx={{ mb: 3 }}
                        InputProps={{
                            sx: { height: 42 },
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton size="small" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((s) => !s)} edge="end" sx={{ color: T.ink3 }}>
                                        {show ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <Button type="submit" variant="contained" size="large" fullWidth disabled={busy} sx={{ height: 42 }} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}>
                        Sign in
                    </Button>
                    <Box sx={{ mt: 4, pt: 2.5, borderTop: `1px solid ${T.line}`, display: 'flex', gap: 1, alignItems: 'center', color: T.ink3 }}>
                        <LockOutlinedIcon sx={{ fontSize: 15 }} />
                        <Typography sx={{ fontSize: 12, color: T.ink3 }}>Encrypted connection. Repeated failed attempts are blocked for a while.</Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default Login;
