import { useEffect, useRef, useState } from 'react';
import { Box, Button, CircularProgress, IconButton, Tooltip, Typography } from '@mui/material';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { T } from './Theme';
import { shrinkPhoto } from 'utils/image';

// one slot per side of the ID card. `load` returns a Blob (staff) or nothing (guest page, which can't read photos back)
export const PhotoSlot = ({ label, has, load, upload, remove, onChanged }) => {
    const input = useRef(null);
    const [url, setUrl] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(has);

    useEffect(() => setDone(has), [has]);
    useEffect(() => {
        let alive = true;
        let made = '';
        if (has && load) {
            load()
                .then((blob) => {
                    if (!alive) return;
                    made = URL.createObjectURL(blob);
                    setUrl(made);
                })
                .catch(() => {});
        } else setUrl('');
        return () => {
            alive = false;
            if (made) URL.revokeObjectURL(made);
        };
    }, [has, load]);

    const pick = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setBusy(true);
        setError('');
        try {
            const small = await shrinkPhoto(file);
            await upload(small);
            setUrl(URL.createObjectURL(small));
            setDone(true);
            onChanged?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Box sx={{ border: `1px solid ${T.line}`, borderRadius: '6px', overflow: 'hidden', bgcolor: T.panel }}>
            <Box sx={{ height: 120, bgcolor: T.subtle, display: 'grid', placeItems: 'center', position: 'relative' }}>
                {url ? (
                    <Box component="img" src={url} alt={label} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : done ? (
                    <Typography sx={{ fontSize: 12.5, color: T.success, fontWeight: 600 }}>Photo added</Typography>
                ) : (
                    <Typography sx={{ fontSize: 12, color: T.ink3 }}>No photo yet</Typography>
                )}
                {busy && <CircularProgress size={22} sx={{ position: 'absolute' }} />}
            </Box>
            <Box sx={{ px: 1, py: 0.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>{label}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {done && remove && (
                        <Tooltip title="Remove photo">
                            <IconButton size="small" onClick={async () => { await remove(); setUrl(''); setDone(false); onChanged?.(); }} sx={{ color: T.ink3 }}>
                                <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                        </Tooltip>
                    )}
                    <Button size="small" startIcon={<PhotoCameraOutlinedIcon sx={{ fontSize: 16 }} />} onClick={() => input.current?.click()} disabled={busy}>
                        {done ? 'Retake' : 'Take photo'}
                    </Button>
                </Box>
                <input ref={input} type="file" accept="image/*" capture="environment" hidden onChange={pick} />
            </Box>
            {error && <Typography sx={{ px: 1, pb: 0.75, fontSize: 12, color: T.error }}>{error}</Typography>}
        </Box>
    );
};

const IdPhotos = ({ front, back }) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
        <PhotoSlot label="Front of ID" {...front} />
        <PhotoSlot label="Back of ID" {...back} />
    </Box>
);

export default IdPhotos;
