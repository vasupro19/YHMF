import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, Typography } from '@mui/material';
import { menus } from 'api';
import { useToast } from 'context/Toast';
import { GROUP_LABELS } from 'layout/navigation';
import { ROLE_PRESETS } from 'utils/constants';

/** Lets an admin (for a client) or a client (for staff) choose which screens a user can open. */
const MenuAccessDialog = ({ open, target, availableMenus, onClose }) => {
    const toast = useToast();
    const [selected, setSelected] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open || !target) return;
        let cancelled = false;
        setLoading(true);
        menus
            .configOf(target.email)
            .then((cfg) => !cancelled && setSelected(Object.fromEntries((cfg || []).map((c) => [c.menuId, true]))))
            .catch((e) => toast.error(e.message))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [open, target, toast]);

    const groups = useMemo(() => {
        const g = {};
        (availableMenus || []).forEach((m) => (g[m.group] = [...(g[m.group] || []), m]));
        return g;
    }, [availableMenus]);

    const applyPreset = (preset) =>
        setSelected(Object.fromEntries((availableMenus || []).filter((m) => preset.urls.includes(m.url)).map((m) => [m.id, true])));

    const save = async () => {
        setSaving(true);
        try {
            const ids = Object.keys(selected).filter((id) => selected[id]).map(Number);
            toast.success(await menus.saveConfig(target.email, ids));
            onClose(true);
        } catch (e) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={() => onClose(false)} fullWidth maxWidth="xs">
            <DialogTitle>
                Screen access
                <Typography variant="body2" color="text.secondary">
                    {target?.name} · {target?.email}
                </Typography>
            </DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress size={28} />
                    </Box>
                ) : (availableMenus || []).length === 0 ? (
                    <Alert severity="info">There are no screens to assign yet.</Alert>
                ) : (
                    <>
                    <Typography variant="caption" color="text.secondary">Start from a standard role, then adjust:</Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" rowGap={0.75} sx={{ mt: 0.75, mb: 2 }}>
                        {ROLE_PRESETS.map((p) => <Chip key={p.id} size="small" variant="outlined" clickable label={p.name} onClick={() => applyPreset(p)} />)}
                    </Stack>
                    {Object.entries(groups).map(([group, items]) => (
                        <Box key={group} sx={{ mb: 1.5 }}>
                            <Typography variant="overline" color="text.secondary">
                                {GROUP_LABELS[group] || group}
                            </Typography>
                            {items.map((m) => (
                                <Box key={m.id}>
                                    <FormControlLabel
                                        control={<Checkbox checked={Boolean(selected[m.id])} onChange={(e) => setSelected((s) => ({ ...s, [m.id]: e.target.checked }))} />}
                                        label={m.label}
                                    />
                                </Box>
                            ))}
                        </Box>
                    ))}
                    </>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button color="inherit" onClick={() => onClose(false)} disabled={saving}>
                    Cancel
                </Button>
                <Button variant="contained" onClick={save} disabled={saving || loading}>
                    Save access
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MenuAccessDialog;
