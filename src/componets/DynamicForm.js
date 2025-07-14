import { Button, Dialog, Divider, Grid, MenuItem, TextField, Typography } from '@mui/material';
import { useFormik } from 'formik';
import PropTypes from 'prop-types';
import { useState } from 'react';

// single image uploader
import SingleImageUploader from './SingleImageUploader';

// multiple image uploader
import MultipleImageUploader from './MultipleImageUploader';

const DynamicForm = ({ initialData = {}, fields = [], onSubmit, onClose, title, fontFamily, validationSchema }) => {
    const [previewImage, setPreviewImage] = useState(null);
    const [singleImage, setSingleImage] = useState(null);

    const formik = useFormik({
        initialValues: fields.reduce((acc, field) => {
            acc[field?.name] = initialData[field?.name] || (field.type === 'number' ? '' : '');
            return acc;
        }, {}),
        validationSchema: validationSchema || null,
        onSubmit: async (values) => {
            if (singleImage) {
                values[fields.find((field) => field.type === 'image').name] = singleImage;
            }

            onSubmit(values);
        }
    });

    return (
        <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3} p={3}>
                <Grid item xs={12}>
                    <Typography variant="h5" fontWeight="bold" sx={{ fontFamily: fontFamily, color: 'primary.main' }}>
                        {title}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                </Grid>
                {Array.isArray(initialData.images) && initialData.images.length > 0 && (
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ fontFamily: fontFamily, mb: 1 }}>
                            Uploaded Images:
                        </Typography>
                        <Grid container spacing={2}>
                            {initialData.images.map((img, index) => (
                                <Grid item key={index}>
                                    <img
                                        src={img.imageUrl}
                                        alt={`Prescription ${index + 1}`}
                                        style={{
                                            width: 80,
                                            height: 80,
                                            objectFit: 'cover',
                                            borderRadius: 6,
                                            border: '1px solid #ccc',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setPreviewImage(img.imageUrl)}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                        <Divider sx={{ my: 2 }} />
                    </Grid>
                )}

                {fields.map(({ name, label, type, options, render, multiple }) => (
                    <Grid item xs={12} sm={type === 'image' ? 12 : 6} key={name}>
                        <Typography variant="subtitle1" sx={{ fontFamily }}>
                            {label}
                        </Typography>

                        {type === 'image' ? (
                            <>
                                {multiple ? (
                                    <MultipleImageUploader
                                        attachments={formik.values[name]}
                                        handleFileTable={(rows) => {
                                            formik.setFieldValue(name, rows);
                                        }}
                                        documentType={name}
                                        preview={false}
                                        fontFamily={fontFamily}
                                    />
                                ) : (
                                    <SingleImageUploader
                                        name={name}
                                        value={formik.values[name]}
                                        onChange={(name, base64) => setSingleImage(base64)}
                                        fontFamily={fontFamily}
                                    />
                                )}

                                {formik.touched[name] && formik.errors[name] && (
                                    <Typography variant="caption" color="error" sx={{ fontFamily }}>
                                        {formik.errors[name]}
                                    </Typography>
                                )}
                            </>
                        ) : (
                            <TextField
                                fullWidth
                                size="small"
                                multiline={type === 'textarea'}
                                rows={type === 'textarea' ? 4 : undefined}
                                select={type === 'select'}
                                type={type !== 'select' && type !== 'textarea' ? type : undefined}
                                name={name}
                                value={formik.values[name]}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched[name] && Boolean(formik.errors[name])}
                                helperText={
                                    formik.touched[name] && formik.errors[name] ? (
                                        <span style={{ fontFamily, fontSize: '12px', color: 'red' }}>{formik.errors[name]}</span>
                                    ) : null
                                }
                                InputProps={{ sx: { fontFamily } }}
                            >
                                {type === 'select' &&
                                    options.map((option) => (
                                        <MenuItem key={option?.id} value={option?.id} sx={{ fontFamily }}>
                                            {option?.name}
                                        </MenuItem>
                                    ))}
                            </TextField>
                        )}
                    </Grid>
                ))}

                <Grid item xs={12} mt={2} sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Button type="submit" variant="contained" color="primary" sx={{ fontFamily: fontFamily }}>
                        Submit
                    </Button>
                    <Button variant="outlined" color="error" onClick={onClose} sx={{ ml: 2, fontFamily: fontFamily }}>
                        Cancel
                    </Button>
                </Grid>
            </Grid>
            <Dialog open={!!previewImage} onClose={() => setPreviewImage(null)} maxWidth="md">
                <img src={previewImage} alt="Preview" style={{ width: '100%', height: '70vh' }} />
            </Dialog>
        </form>
    );
};

DynamicForm.propTypes = {
    initialData: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
    onClose: PropTypes.func
};

export default DynamicForm;
