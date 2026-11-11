import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import QRCode from 'qrcode';

// scannable payment code on a white, bordered tile so every UPI app can read it
const UpiQr = ({ link, size = 200 }) => {
    const [src, setSrc] = useState('');
    useEffect(() => {
        let live = true;
        QRCode.toDataURL(link, { width: size * 2, margin: 1, errorCorrectionLevel: 'M' }).then((url) => live && setSrc(url)).catch(() => live && setSrc(''));
        return () => {
            live = false;
        };
    }, [link, size]);
    if (!src) return null;
    return (
        <Box sx={{ bgcolor: '#fff', p: 1, borderRadius: '6px', border: '1px solid #E5E2DD', display: 'inline-block', lineHeight: 0 }}>
            <img src={src} width={size} height={size} alt="UPI payment QR code" />
        </Box>
    );
};

export default UpiQr;
