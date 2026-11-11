import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, DialogActions, DialogContent, Drawer, FormControlLabel, Grid, IconButton, MenuItem, Switch, TextField, Typography } from '@mui/material';
import { T } from './Theme';
import CloseIcon from '@mui/icons-material/Close';
import { Formik } from 'formik';
import AttachmentsField from './AttachmentsField';

/**
 * fields: [{ name, label, type: text|email|password|tel|number|date|select|textarea|switch|attachments,
 *            options?: [{id,name}] | (values)=>[{id,name}], half?, hidden?, disabled?, helperText?, placeholder? }]
 * onSubmit(values) may throw; the message is shown in the dialog.
 */
// opens as a panel from the right so the page behind stays visible
const FormDialog = ({ open, title, subtitle, fields, initialValues = {}, validationSchema, onSubmit, onClose, submitLabel = 'Save', width = 520 }) => {
    const [submitError, setSubmitError] = useState('');

    const startValues = fields.reduce((acc, f) => {
        const v = initialValues[f.name];
        acc[f.name] = v ?? (f.type === 'switch' ? true : f.type === 'attachments' ? [] : '');
        return acc;
    }, {});

    const close = () => {
        setSubmitError('');
        onClose();
    };

    return (
        <Drawer anchor="right" open={open} onClose={close} PaperProps={{ sx: { width: { xs: '100%', sm: width }, display: 'flex' } }}>
            {/* re-mount Formik on every open so a previous edit never leaks into "Add" */}
            {open && (
                <Formik
                    initialValues={startValues}
                    validationSchema={validationSchema}
                    onSubmit={async (values, helpers) => {
                        setSubmitError('');
                        try {
                            await onSubmit(values);
                        } catch (e) {
                            setSubmitError(e.message);
                        } finally {
                            helpers.setSubmitting(false);
                        }
                    }}
                >
                    {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, isSubmitting }) => (
                        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <Box sx={{ px: 2.5, py: 1.75, pr: 7, borderBottom: `1px solid ${T.line}`, position: 'relative' }}>
                                <Typography component="h2" sx={{ fontSize: 16, fontWeight: 650 }}>{title}</Typography>
                                {subtitle && <Typography sx={{ fontSize: 12.5, color: T.ink2, mt: 0.25 }}>{subtitle}</Typography>}
                                <IconButton aria-label="Close" onClick={close} sx={{ position: 'absolute', right: 12, top: 12, color: T.ink3 }}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>
                            <DialogContent sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2.5 }}>
                                {submitError && (
                                    <Alert severity="error" sx={{ mb: 2 }}>
                                        {submitError}
                                    </Alert>
                                )}
                                <Grid container spacing={2}>
                                    {fields
                                        .filter((f) => !f.hidden)
                                        .map((f) => {
                                            const options = typeof f.options === 'function' ? f.options(values) : f.options || [];
                                            const error = touched[f.name] && errors[f.name];
                                            return (
                                                <Grid item xs={12} sm={f.half ? 6 : 12} key={f.name}>
                                                    {f.type === 'attachments' ? (
                                                        <AttachmentsField label={f.label} value={values[f.name]} onChange={(v) => setFieldValue(f.name, v)} />
                                                    ) : f.type === 'switch' ? (
                                                        <FormControlLabel
                                                            control={<Switch checked={Boolean(values[f.name])} onChange={(e) => setFieldValue(f.name, e.target.checked)} />}
                                                            label={f.label}
                                                        />
                                                    ) : (
                                                        <TextField
                                                            name={f.name}
                                                            label={f.label}
                                                            placeholder={f.placeholder}
                                                            type={['select', 'textarea'].includes(f.type) ? undefined : f.type || 'text'}
                                                            select={f.type === 'select'}
                                                            multiline={f.type === 'textarea'}
                                                            minRows={f.type === 'textarea' ? 3 : undefined}
                                                            value={values[f.name]}
                                                            onChange={(e) => {
                                                                handleChange(e);
                                                                f.onChange?.(e.target.value, setFieldValue);
                                                            }}
                                                            onBlur={handleBlur}
                                                            disabled={f.disabled}
                                                            error={Boolean(error)}
                                                            helperText={error || f.helperText}
                                                            InputLabelProps={f.type === 'date' ? { shrink: true } : undefined}
                                                            autoComplete={f.type === 'password' ? 'new-password' : 'off'}
                                                        >
                                                            {f.type === 'select' && [
                                                                !f.required && (
                                                                    <MenuItem key="__none" value="">
                                                                        <em>None</em>
                                                                    </MenuItem>
                                                                ),
                                                                ...options.map((o) => (
                                                                    <MenuItem key={o.id} value={o.id}>
                                                                        {o.name}
                                                                    </MenuItem>
                                                                ))
                                                            ]}
                                                        </TextField>
                                                    )}
                                                </Grid>
                                            );
                                        })}
                                </Grid>
                            </DialogContent>
                            <DialogActions sx={{ px: 2.5, py: 1.5 }}>
                                <Button onClick={close} color="inherit" disabled={isSubmitting}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="contained" disabled={isSubmitting} startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}>
                                    {submitLabel}
                                </Button>
                            </DialogActions>
                        </Box>
                    )}
                </Formik>
            )}
        </Drawer>
    );
};

export default FormDialog;
