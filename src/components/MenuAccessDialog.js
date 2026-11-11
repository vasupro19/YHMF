import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Checkbox, CircularProgress, Drawer, FormControlLabel, IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { menus } from 'api';
import { useToast } from 'context/Toast';
import { GROUP_LABELS, GROUP_ORDER } from 'layout/navigation';
import { ROLE_PRESETS } from 'utils/constants';
import { T } from './Theme';

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

    const chosen = Object.values(selected).filter(Boolean).length;
    const toggleGroup = (items, on) => setSelected((s) => ({ ...s, ...Object.fromEntries(items.map((m) => [m.id, on])) }));

    return (
        <Drawer anchor="right" open={open} onClose={() => onClose(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, display: 'flex', flexDirection: 'column' } }}>
            <Box sx={{ px: 2.5, py: 1.75, pr: 7, borderBottom: `1px solid ${T.line}`, position: 'relative' }}>
                <Typography component="h2" sx={{ fontSize: 16, fontWeight: 650 }}>Screen access</Typography>
                <Typography noWrap sx={{ fontSize: 12.5, color: T.ink2, mt: 0.25 }}>{target?.name} · {target?.email}</Typography>
                <IconButton aria-label="Close" onClick={() => onClose(false)} sx={{ position: 'absolute', right: 12, top: 12, color: T.ink3 }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2 }}>
                {loading ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (availableMenus || []).length === 0 ? (
                    <Alert severity="info">There are no screens to assign yet.</Alert>
                ) : (
                    <>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: T.ink2, mb: 0.75 }}>Start from a standard role, then adjust</Typography>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" rowGap={0.75} sx={{ mb: 2.5 }}>
                            {ROLE_PRESETS.map((p) => (
                                <Button key={p.id} size="small" variant="outlined" color="inherit" onClick={() => applyPreset(p)}>
                                    {p.name}
                                </Button>
                            ))}
                        </Stack>
                        {Object.entries(groups).sort(([a], [b]) => (GROUP_ORDER.indexOf(a) + 1 || 99) - (GROUP_ORDER.indexOf(b) + 1 || 99)).map(([group, items]) => {
                            const on = items.filter((m) => selected[m.id]).length;
                            return (
                                <Box key={group} sx={{ mb: 1.5, border: `1px solid ${T.line}`, borderRadius: '6px', overflow: 'hidden' }}>
                                    <Box sx={{ px: 1.5, py: 0.75, bgcolor: T.subtle, borderBottom: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.ink2 }}>
                                            {GROUP_LABELS[group] || group}
                                            <Box component="span" className="num" sx={{ ml: 0.75, color: T.ink3, letterSpacing: 0 }}>{on}/{items.length}</Box>
                                        </Typography>
                                        <Button size="small" color="inherit" sx={{ minHeight: 22, py: 0, px: 0.75, fontSize: 12, color: T.brand }} onClick={() => toggleGroup(items, on < items.length)}>
                                            {on < items.length ? 'Select all' : 'Clear'}
                                        </Button>
                                    </Box>
                                    {items.map((m, i) => (
                                        <FormControlLabel
                                            key={m.id}
                                            sx={{ display: 'flex', m: 0, px: 0.75, py: 0.1, borderTop: i ? `1px solid ${T.line}` : 0, '&:hover': { bgcolor: T.subtle }, '& .MuiFormControlLabel-label': { fontSize: 13 } }}
                                            control={<Checkbox size="small" checked={Boolean(selected[m.id])} onChange={(e) => setSelected((s) => ({ ...s, [m.id]: e.target.checked }))} />}
                                            label={m.label}
                                        />
                                    ))}
                                </Box>
                            );
                        })}
                    </>
                )}
            </Box>

            <Box sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, bgcolor: T.subtle, borderTop: `1px solid ${T.line}` }}>
                <Typography className="num" sx={{ fontSize: 12.5, color: T.ink3, flex: 1 }}>{loading ? '' : `${chosen} screen${chosen === 1 ? '' : 's'} selected`}</Typography>
                <Button color="inherit" onClick={() => onClose(false)} disabled={saving}>
                    Cancel
                </Button>
                <Button variant="contained" onClick={save} disabled={saving || loading} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
                    Save access
                </Button>
            </Box>
        </Drawer>
    );
};

export default MenuAccessDialog;
