import { useRef, useState } from 'react';
import { Box, Button, Chip, CircularProgress, Typography } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { files } from 'api';
import { useToast } from 'context/Toast';
import { fileName, fileUrl } from 'utils/format';

const MAX_MB = 8;

// value: [{ link }] ; uploads each picked file to the backend and keeps the returned path
const AttachmentsField = ({ value = [], onChange, label }) => {
    const toast = useToast();
    const input = useRef(null);
    const [busy, setBusy] = useState(false);

    const pick = async (event) => {
        const picked = Array.from(event.target.files || []);
        event.target.value = '';
        if (!picked.length) return;
        const tooBig = picked.find((f) => f.size > MAX_MB * 1024 * 1024);
        if (tooBig) return toast.error(`${tooBig.name} is larger than ${MAX_MB} MB`);

        setBusy(true);
        try {
            const uploaded = [];
            for (const f of picked) uploaded.push({ link: await files.upload(f) });
            onChange([...(value || []), ...uploaded]);
        } catch (e) {
            toast.error(e.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75 }}>
                {label}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                {(value || []).map((a, i) => (
                    <Chip
                        key={a.link}
                        component="a"
                        href={fileUrl(a.link)}
                        target="_blank"
                        rel="noreferrer"
                        clickable
                        icon={<AttachFileIcon />}
                        label={fileName(a.link)}
                        onDelete={() => onChange(value.filter((_, j) => j !== i))}
                        sx={{ maxWidth: 240 }}
                    />
                ))}
                <input ref={input} type="file" multiple hidden onChange={pick} data-testid="attachment-input" />
                <Button size="small" variant="outlined" onClick={() => input.current.click()} disabled={busy} startIcon={busy ? <CircularProgress size={14} /> : <AttachFileIcon />}>
                    {busy ? 'Uploading…' : 'Add files'}
                </Button>
            </Box>
        </Box>
    );
};

export default AttachmentsField;
