import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Dialog, DialogContent, IconButton, Typography } from '@mui/material';
import React from 'react';

const ImageViewer = ({ open, onClose, images = [], startIndex = 0 }) => {
    const [currentIndex, setCurrentIndex] = React.useState(startIndex);

    React.useEffect(() => {
        setCurrentIndex(startIndex);
    }, [startIndex, open]);

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogContent
                sx={{
                    position: 'relative',
                    p: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#000'
                }}
            >
                {/* Close Button */}
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: '#fff',
                        zIndex: 2
                    }}
                >
                    <CloseIcon />
                </IconButton>

                {/* Left Arrow */}
                <IconButton
                    onClick={handlePrev}
                    disabled={images.length <= 1}
                    sx={{
                        position: 'absolute',
                        left: 8,
                        color: '#fff',
                        zIndex: 2,
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.6)' }
                    }}
                >
                    <ArrowBackIosNewIcon />
                </IconButton>

                {/* Image */}
                <Box
                    component="img"
                    src={images[currentIndex]}
                    alt={`Image ${currentIndex + 1}`}
                    sx={{
                        width: '100%',
                        maxHeight: '80vh',
                        objectFit: 'contain',
                        borderRadius: 2
                    }}
                />

                {/* Right Arrow */}
                <IconButton
                    onClick={handleNext}
                    disabled={images.length <= 1}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        color: '#fff',
                        zIndex: 2,
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.6)' }
                    }}
                >
                    <ArrowForwardIosIcon />
                </IconButton>

                {/* Counter */}
                <Typography
                    variant="body2"
                    sx={{
                        position: 'absolute',
                        bottom: 8,
                        color: '#fff',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        px: 1,
                        borderRadius: 1
                    }}
                >
                    {currentIndex + 1} / {images.length}
                </Typography>
            </DialogContent>
        </Dialog>
    );
};

export default ImageViewer;
