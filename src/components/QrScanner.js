import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import jsQR from 'jsqr';
import { T } from './Theme';

// reads a QR code from a canvas; tries the built-in detector first (fast on Android), then jsQR
const detect = async (canvas) => {
    if ('BarcodeDetector' in window) {
        try {
            const found = await new window.BarcodeDetector({ formats: ['qr_code'] }).detect(canvas);
            if (found[0]?.rawValue) return found[0].rawValue;
        } catch (e) {
            /* fall back to jsQR */
        }
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' })?.data || null;
};

// a photo of the card may be large or small: try a few sizes
const readFromFile = (file) =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = async () => {
            URL.revokeObjectURL(img.src);
            for (const max of [1600, 2400, 1000, 3200]) {
                const scale = Math.min(1, max / Math.max(img.width, img.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                // eslint-disable-next-line no-await-in-loop
                const text = await detect(canvas);
                if (text) return resolve(text);
            }
            return reject(new Error('No QR code found in this photo. Take it closer, flat and in good light.'));
        };
        img.onerror = () => reject(new Error('Could not open this picture.'));
        img.src = URL.createObjectURL(file);
    });

// camera view that closes itself as soon as a QR code is read
const QrScanner = ({ open, onClose, onResult, title = 'Scan the QR code', hint }) => {
    const videoRef = useRef(null);
    const fileRef = useRef(null);
    const [error, setError] = useState('');
    const [noCamera, setNoCamera] = useState(false);

    useEffect(() => {
        if (!open) return undefined;
        let stream;
        let timer;
        let stopped = false;
        setError('');
        const canvas = document.createElement('canvas');
        (async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
                if (stopped) return;
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                const scan = async () => {
                    if (stopped) return;
                    const v = videoRef.current;
                    if (v && v.videoWidth) {
                        canvas.width = v.videoWidth;
                        canvas.height = v.videoHeight;
                        canvas.getContext('2d').drawImage(v, 0, 0);
                        const text = await detect(canvas);
                        if (text && !stopped) {
                            stopped = true;
                            onResult(text);
                            return;
                        }
                    }
                    timer = setTimeout(scan, 250);
                };
                scan();
            } catch (e) {
                setNoCamera(true);
            }
        })();
        return () => {
            stopped = true;
            clearTimeout(timer);
            stream?.getTracks().forEach((t) => t.stop());
        };
    }, [open, onResult]);

    const fromPhoto = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setError('');
        try {
            onResult(await readFromFile(file));
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ fontSize: 16, fontWeight: 650 }}>{title}</DialogTitle>
            <DialogContent>
                {hint && <Typography sx={{ fontSize: 13, color: T.ink2, mb: 1.5 }}>{hint}</Typography>}
                {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
                {noCamera ? (
                    <Alert severity="info">The camera isn't available here. Take a photo of the QR code instead.</Alert>
                ) : (
                    <Box sx={{ position: 'relative', bgcolor: '#111', borderRadius: '6px', overflow: 'hidden', aspectRatio: '4 / 3' }}>
                        <Box component="video" ref={videoRef} muted playsInline sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        <Box sx={{ position: 'absolute', inset: '12%', border: '2px solid rgba(255,255,255,.85)', borderRadius: '8px', pointerEvents: 'none' }} />
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
                <Button startIcon={<PhotoCameraOutlinedIcon />} onClick={() => fileRef.current?.click()}>Use a photo</Button>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={fromPhoto} />
                <Button color="inherit" onClick={onClose}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
};

export default QrScanner;
