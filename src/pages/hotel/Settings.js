import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Grid, TextField, Typography } from '@mui/material';
import { useAuth } from 'context/Auth';
import useHotel from 'hooks/useHotel';
import useAsync from 'hooks/useAsync';
import { useToast } from 'context/Toast';
import PageHeader from 'components/PageHeader';
import Panel from 'components/Panel';
import { T } from 'components/Theme';
import { GST_REGEX } from 'utils/constants';
import { files } from 'api';
import { fileUrl } from 'utils/format';

// settings section: description on the left, fields on the right
const Section = ({ title, text, children }) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '260px minmax(0, 1fr)' }, gap: { xs: 1.5, md: 3 }, py: 2.5, borderTop: `1px solid ${T.line}`, '&:first-of-type': { borderTop: 0, pt: 0.5 }, '&:last-of-type': { pb: 0.5 } }}>
        <Box>
            <Typography component="h2" sx={{ fontSize: 13.5, fontWeight: 650 }}>{title}</Typography>
            {text && <Typography sx={{ fontSize: 12.5, color: T.ink2, mt: 0.5, lineHeight: 1.5 }}>{text}</Typography>}
        </Box>
        <Box sx={{ maxWidth: 640 }}>{children}</Box>
    </Box>
);

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

    if (!form) return <PageHeader title="Hotel settings" subtitle="Loading…" />;
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

    // label above the input, ERP style
    const field = (k, label, props = {}) => (
        <Box>
            <Typography component="label" htmlFor={`set-${k}`} sx={{ display: 'block', fontSize: 12.5, fontWeight: 600, mb: 0.5 }}>{label}</Typography>
            <TextField id={`set-${k}`} value={form[k] ?? ''} onChange={set(k)} error={Boolean(errors[k])} helperText={errors[k] || props.helperText} {...props} />
        </Box>
    );

    const saveButton = (
        <Button type="submit" variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
            Save changes
        </Button>
    );

    return (
        <Box component="form" onSubmit={save} noValidate>
            <PageHeader title="Hotel settings" subtitle="Appears on every bill and sets how tax is worked out" actions={saveButton} />
            <Panel>
                <Section title="Property details" text="Your registered business details. They print on every invoice and guest message.">
                    <Grid container spacing={2}>
                        <Grid item xs={12}>{field('hotelName', 'Hotel name')}</Grid>
                        <Grid item xs={12}>{field('address', 'Address', { multiline: true, minRows: 2 })}</Grid>
                        <Grid item xs={12} sm={6}>{field('phone', 'Phone')}</Grid>
                        <Grid item xs={12} sm={6}>{field('email', 'Email')}</Grid>
                        <Grid item xs={12} sm={6}>{field('gstin', 'GSTIN', { helperText: errors.gstin || 'Printed on tax invoices' })}</Grid>
                        <Grid item xs={12} sm={6}>{field('upiId', 'UPI ID for payments', { placeholder: 'yourhotel@bank', helperText: errors.upiId || 'Guests pay the balance from their bill link and QR code' })}</Grid>
                    </Grid>
                </Section>

                <Section title="Logo" text="Shown on invoices and the guest bill page. PNG, JPG, WebP or SVG, under 2 MB.">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ width: 88, height: 64, borderRadius: '6px', border: `1px solid ${T.line}`, bgcolor: T.subtle, display: 'grid', placeItems: 'center', overflow: 'hidden', p: 0.75 }}>
                            {form.logoPath ? <img src={fileUrl(form.logoPath)} alt="Hotel logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <Typography sx={{ fontSize: 12, color: T.ink3 }}>No logo</Typography>}
                        </Box>
                        <Button component="label" variant="outlined" color="inherit" disabled={uploading}>
                            {uploading ? 'Uploading…' : form.logoPath ? 'Change logo' : 'Upload logo'}
                            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={pickLogo} />
                        </Button>
                        {form.logoPath && <Button color="inherit" onClick={() => setForm((x) => ({ ...x, logoPath: '' }))}>Remove</Button>}
                    </Box>
                </Section>

                <Section title="Check-in and check-out" text="Standard times printed on confirmations and invoices.">
                    <Grid container spacing={2}>
                        <Grid item xs={6} sm={4}>{field('checkInTime', 'Check-in time', { type: 'time' })}</Grid>
                        <Grid item xs={6} sm={4}>{field('checkOutTime', 'Check-out time', { type: 'time' })}</Grid>
                    </Grid>
                </Section>

                <Section title="Room GST" text="Each night is taxed by its price: at or below the limit uses the lower rate, above it uses the higher rate.">
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>{field('gstThreshold', 'Price limit (₹ per night)', { type: 'number' })}</Grid>
                        <Grid item xs={6} sm={4}>{field('roomGstLow', 'Rate at or below (%)', { type: 'number' })}</Grid>
                        <Grid item xs={6} sm={4}>{field('roomGstHigh', 'Rate above (%)', { type: 'number' })}</Grid>
                    </Grid>
                    <Alert severity="info" sx={{ mt: 2 }}>Defaults are 5% up to ₹7,500 and 18% above. Confirm the current rules with your accountant.</Alert>
                </Section>

                <Section title="Terms on the bill" text="Cancellation policy, check-out rules or a thank-you note. Printed at the bottom of every invoice.">
                    {field('policy', 'Terms and policies', { multiline: true, minRows: 4 })}
                </Section>

                <Section title="Document numbering" text="Prefixes used for new booking and invoice numbers.">
                    <Grid container spacing={2}>
                        <Grid item xs={6} sm={4}>{field('bookingPrefix', 'Booking prefix', { helperText: errors.bookingPrefix || 'e.g. BK-00012' })}</Grid>
                        <Grid item xs={6} sm={4}>{field('invoicePrefix', 'Invoice prefix', { helperText: errors.invoicePrefix || 'e.g. INV-2026-00012' })}</Grid>
                    </Grid>
                </Section>
            </Panel>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>{saveButton}</Box>
        </Box>
    );
};

export default Settings;
