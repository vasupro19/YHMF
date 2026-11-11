import { useState } from 'react';
import { Alert, Button, CircularProgress, Link, TextField, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { auth } from 'api';
import AuthCard from 'components/AuthCard';
import { T } from 'components/Theme';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState('');
    const [error, setError] = useState('');

    const submit = async (e) => {
        e.preventDefault();
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter the email you sign in with.');
        setBusy(true);
        setError('');
        try {
            setDone(await auth.forgotPassword(email.trim()));
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <AuthCard title="Forgot your password?" subtitle="Enter your email and we'll send you a link to choose a new one.">
            {done ? (
                <>
                    <Alert severity="success" sx={{ mb: 2 }}>{done}</Alert>
                    <Typography sx={{ fontSize: 13, color: T.ink2 }}>The link works for 30 minutes. Check your spam folder if it doesn't arrive.</Typography>
                </>
            ) : (
                <form onSubmit={submit} noValidate>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus autoComplete="email" sx={{ mb: 2.5 }} />
                    <Button type="submit" variant="contained" size="large" fullWidth sx={{ height: 40 }} disabled={busy} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}>Send reset link</Button>
                </form>
            )}
            <Typography sx={{ mt: 3, pt: 2, borderTop: `1px solid ${T.line}`, textAlign: 'center', fontSize: 13 }}><Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 500 }}>← Back to sign in</Link></Typography>
        </AuthCard>
    );
};

export default ForgotPassword;
