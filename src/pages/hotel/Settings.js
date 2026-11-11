import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Grid, TextField, Typography } from '@mui/material';
import { useAuth } from 'context/Auth';
import useHotel from 'hooks/useHotel';
import useAsync from 'hooks/useAsync';
import { useToast } from 'context/Toast';
import PageHeader from 'components/PageHeader';
import { GST_REGEX } from 'utils/constants';
import { files } from 'api';
import { fileUrl } from 'utils/format';

const Settings = () => {
    const { api } = useHotel();
    const { user } = useAuth();
    const toast = useToast();
    const loaded = useAsync(() => api.settings.get(), { initial: null });
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [uploading, setUploading] = useState(false);

    const pickLogo = async (e) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f) return;
        if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(f.type)) return toast.error('Choose a PNG, JPG, WebP or SVG image');
        if (f.size > 2 * 1024 * 1024) return toast.error('The logo must be smaller than 2 MB');
        setUploading(true);
        try {
            const path = await files.upload(f);
            setForm((x) => ({ ...x, logoPath: String(path).replace(/\\/g, '/') }));
            toast.info('Logo added. Press Save changes to keep it.');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        if (loaded.data) setForm({ ...loaded.data, hotelName: loaded.data.hotelName || user.name });
    }, [loaded.data, user.name]);

    if (!form) return <PageHeader title="Hotel settings" />;
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const save = async (e) => {
        e.preventDefault();
        const err = {};
        if (!form.hotelName?.trim()) err.hotelName = 'Hotel name is required';
        if (form.gstin && !GST_REGEX.test(form.gstin.toUpperCase())) err.gstin = 'Not a valid GSTIN';
        ['roomGstLow', 'roomGstHigh'].forEach((k) => {
            if (!(Number(form[k]) >= 0 && Number(form[k]) <= 100)) err[k] = 'Enter 0 to 100';
        });
        if (!(Number(form.gstThreshold) >= 0)) err.gstThreshold = 'Enter an amount';
        if (form.upiId && !/^[A-Za-z0-9._-]{2,}@[A-Za-z0-9]{2,}$/.test(form.upiId)) err.upiId = 'It should look like name@bank';
        setErrors(err);
        if (Object.keys(err).length) return;
        setSaving(true);
        try {
            toast.success(await api.settings.save({ ...form, gstin: (form.gstin || '').toUpperCase() }));
            loaded.reload();
        } catch (e2) {
            toast.error(e2.message);
        } finally {
            setSaving(false);
        }
    };

    const field = (k, label, props = {}) => <TextField label={label} value={form[k] ?? ''} onChange={set(k)} error={Boolean(errors[k])} helperText={errors[k] || props.helperText} {...props} />;

    return (
        <Box component="form" onSubmit={save} noValidate>
            <PageHeader title="Hotel settings" subtitle="Appears on every bill and sets how tax is worked out" actions={<Button type="submit" variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>Save changes</Button>} />
            <Grid container spacing={2.5}>
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>Hotel details</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>{field('hotelName', 'Hotel name')}</Grid>
                                <Grid item xs={12}>{field('address', 'Address', { multiline: true, minRows: 2 })}</Grid>
                                <Grid item xs={12} sm={6}>{field('phone', 'Phone')}</Grid>
                                <Grid item xs={12} sm={6}>{field('email', 'Email')}</Grid>
                                <Grid item xs={12}>{field('gstin', 'GSTIN', { helperText: errors.gstin || 'Printed on invoices' })}</Grid>
                                <Grid item xs={12}>{field('upiId', 'UPI id for payments', { placeholder: 'yourhotel@bank', helperText: errors.upiId || 'Guests can pay the balance from their bill link and QR code' })}</Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75 }}>Logo</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ width: 72, height: 72, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: '#fff', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                                            {form.logoPath ? <img src={fileUrl(form.logoPath)} alt="Hotel logo" style={{ maxWidth: '100%', maxHeight: '100%' }} /> : <Typography variant="caption" color="text.secondary">No logo</Typography>}
                                        </Box>
                                        <Button component="label" variant="outlined" disabled={uploading}>{uploading ? 'Uploading…' : form.logoPath ? 'Change logo' : 'Upload logo'}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={pickLogo} /></Button>
                                        {form.logoPath && <Button color="inherit" onClick={() => setForm((x) => ({ ...x, logoPath: '' }))}>Remove</Button>}
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>{field('checkInTime', 'Check-in time', { type: 'time', InputLabelProps: { shrink: true } })}</Grid>
                                <Grid item xs={6}>{field('checkOutTime', 'Check-out time', { type: 'time', InputLabelProps: { shrink: true } })}</Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card sx={{ mb: 2.5 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 0.5 }}>Room GST</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Each night is taxed by its price: at or below the limit uses the lower rate, above it uses the higher rate.
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>{field('gstThreshold', 'Price limit (₹/night)', { type: 'number' })}</Grid>
                                <Grid item xs={6} sm={4}>{field('roomGstLow', 'Rate at or below (%)', { type: 'number' })}</Grid>
                                <Grid item xs={6} sm={4}>{field('roomGstHigh', 'Rate above (%)', { type: 'number' })}</Grid>
                            </Grid>
                            <Alert severity="info" sx={{ mt: 2 }}>Defaults are 5% up to ₹7,500 and 18% above. Confirm the current rules with your accountant.</Alert>
                        </CardContent>
                    </Card>
                    <Card sx={{ mb: 2.5 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 0.5 }}>Terms on the bill</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Cancellation policy, check-out rules or a thank-you note. Printed at the bottom of every invoice.</Typography>
                            {field('policy', 'Terms and policies', { multiline: true, minRows: 3 })}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>Numbering</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>{field('bookingPrefix', 'Booking prefix', { helperText: errors.bookingPrefix || 'e.g. BK-00012' })}</Grid>
                                <Grid item xs={6}>{field('invoicePrefix', 'Invoice prefix', { helperText: errors.invoicePrefix || 'e.g. INV-2026-00012' })}</Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Settings;
