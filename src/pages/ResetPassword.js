import { useState } from 'react';
import { Alert, Button, CircularProgress, Link, TextField } from '@mui/material';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { auth } from 'api';
import AuthCard from 'components/AuthCard';

const ResetPassword = () => {
    const [params] = useSearchParams();
    const token = params.get('token') || '';
    const [password, setPassword] = useState('');
    const [again, setAgain] = useState('');
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState('');
    const [error, setError] = useState('');

    const submit = async (e) => {
        e.preventDefault();
        if (password.length < 8) return setError('Use at least 8 characters.');
        if (password !== again) return setError('The two passwords are not the same.');
        setBusy(true);
        setError('');
        try {
            setDone(await auth.resetPassword(token, password));
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <AuthCard title="Choose a new password" subtitle="Pick something you don't use anywhere else.">
            {!token ? (
                <Alert severity="error">This reset link is not valid. <Link component={RouterLink} to="/forgot-password">Ask for a new one</Link>.</Alert>
            ) : done ? (
                <>
                    <Alert severity="success" sx={{ mb: 2 }}>{done}</Alert>
                    <Button component={RouterLink} to="/login" variant="contained" size="large" fullWidth sx={{ height: 40 }}>Go to sign in</Button>
                </>
            ) : (
                <form onSubmit={submit} noValidate>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <TextField label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus autoComplete="new-password" helperText="At least 8 characters" sx={{ mb: 2 }} />
                    <TextField label="Repeat new password" type="password" value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" sx={{ mb: 2.5 }} />
                    <Button type="submit" variant="contained" size="large" fullWidth sx={{ height: 40 }} disabled={busy} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}>Change password</Button>
                </form>
            )}
        </AuthCard>
    );
};

export default ResetPassword;
