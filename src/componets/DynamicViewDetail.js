import CloseIcon from '@mui/icons-material/Close';
import { Backdrop, Box, Divider, Grid, IconButton, Typography } from '@mui/material';
import { useState } from 'react';

const DynamicViewDetail = ({ title, data = {}, fields = [], fontFamily = 'sans-serif' }) => {
    const [previewImage, setPreviewImage] = useState(null);

    return (
        <Box p={3}>
            <Typography variant="h5" fontWeight="bold" sx={{ fontFamily, color: 'primary.main' }}>
                {title}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Grid container spacing={3}>
                {fields.map(({ name, label }) => (
                    <Grid item xs={12} sm={6} key={name}>
                        <Typography variant="subtitle2" sx={{ fontFamily, color: 'gray' }}>
                            {label}
                        </Typography>
                        <Typography variant="body1" sx={{ fontFamily }}>
                            {data?.[name]}
                        </Typography>
                    </Grid>
                ))}

                {Array.isArray(data.images) && data.images.length > 0 && (
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" sx={{ fontFamily, mb: 1 }}>
                            Uploaded Images:
                        </Typography>
                        <Grid container spacing={2}>
                            {data.images.map((img, idx) => (
                                <Grid item key={idx}>
                                    <img
                                        src={img.imageUrl}
                                        alt={`image-${idx}`}
                                        style={{
                                            width: 80,
                                            height: 80,
                                            objectFit: 'cover',
                                            borderRadius: 6,
                                            cursor: 'pointer',
                                            border: '1px solid #ccc'
                                        }}
                                        onClick={() => setPreviewImage(img.imageUrl)}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>
                )}
            </Grid>

            {/* Image Preview Modal */}
            {previewImage && (
                <Backdrop
                    open={true}
                    sx={{
                        zIndex: 1300,
                        color: '#fff',
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                    onClick={() => setPreviewImage(null)}
                >
                    <IconButton
                        onClick={() => setPreviewImage(null)}
                        sx={{
                            position: 'absolute',
                            top: 20,
                            right: 20,
                            color: 'white',
                            zIndex: 1400
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                    <img
                        src={previewImage}
                        alt="Preview"
                        style={{
                            maxHeight: '90vh',
                            maxWidth: '90vw',
                            borderRadius: 8,
                            boxShadow: '0 0 20px rgba(0,0,0,0.5)'
                        }}
                    />
                </Backdrop>
            )}
        </Box>
    );
};

export default DynamicViewDetail;
