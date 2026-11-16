import { useMemo, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import useHotel from 'hooks/useHotel';
import useAsync from 'hooks/useAsync';
import { useToast } from 'context/Toast';
import DataTable from 'components/DataTable';
import FormDialog from 'components/FormDialog';
import PageHeader from 'components/PageHeader';
import { Pill } from 'components/StatusChip';
import { T } from 'components/Theme';

const when = (v) => (v ? new Date(v).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : 'Never');

// Travel agencies the hotel lets see live rooms and rates and send booking requests (from Travelytics or any partner app)
const TravelAgents = () => {
    const { api } = useHotel();
    const toast = useToast();
    const q = useAsync(() => api.agentLinks.list());
    const [adding, setAdding] = useState(false);
    const [shown, setShown] = useState(null); // { agencyName, key }

    const copy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success('Copied');
        } catch (e) {
            toast.error('Could not copy. Select it and copy by hand.');
        }
    };

    const columns = useMemo(
        () => [
            { id: 'agencyName', label: 'Agency', render: (a) => <Box><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{a.agencyName}</Typography>{a.contact && <Typography sx={{ fontSize: 12, color: T.ink3 }}>{a.contact}</Typography>}</Box> },
            { id: 'keyHint', label: 'Key', render: (a) => <Typography sx={{ fontSize: 12.5, fontFamily: 'monospace', color: T.ink2 }}>{a.keyHint}</Typography> },
            { id: 'bookings', label: 'Requests', align: 'right', value: (a) => a.bookings, render: (a) => <span>{a.bookings}{a.waiting ? <Box component="span" sx={{ color: '#9A6A12' }}> · {a.waiting} waiting</Box> : null}</span> },
            { id: 'lastUsedAt', label: 'Last used', value: (a) => a.lastUsedAt || '', render: (a) => when(a.lastUsedAt) },
            { id: 'active', label: 'Access', value: (a) => (a.active ? 1 : 0), render: (a) => <Pill tone={a.active ? 'success' : 'default'} label={a.active ? 'On' : 'Off'} /> }
        ],
        []
    );

    return (
        <>
            <PageHeader title="Travel agents" subtitle="Agencies you allow to see your live rooms and rates and send booking requests" actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setAdding(true)}>Add agency</Button>} />
            <Alert severity="info" sx={{ mb: 2 }}>
                Give each agency its own key. In Travelytics they add it under Partner hotels; other software can use the YHM partner API with it. Requests arrive in Reservations as "On hold" for you to confirm, and you can turn any agency off at any time.
            </Alert>
            <DataTable
                columns={columns}
                rows={q.data}
                loading={q.loading}
                searchPlaceholder="Search agency"
                emptyText="No agencies yet. Add one to give them a key."
                actions={[
                    { title: 'Turn access off', icon: <Typography sx={{ fontSize: 12, fontWeight: 650, color: T.error }}>Off</Typography>, hidden: (a) => !a.active, onClick: async (a) => { toast.success(await api.agentLinks.setActive(a.id, false)); q.reload(); } },
                    { title: 'Turn access on', icon: <Typography sx={{ fontSize: 12, fontWeight: 650, color: T.success }}>On</Typography>, hidden: (a) => a.active, onClick: async (a) => { toast.success(await api.agentLinks.setActive(a.id, true)); q.reload(); } },
                    { title: 'Make a new key (the old one stops working)', icon: <KeyOutlinedIcon fontSize="small" />, onClick: async (a) => { const r = await api.agentLinks.regenerate(a.id); setShown({ agencyName: a.agencyName, key: r.key }); q.reload(); } }
                ]}
            />
            <FormDialog
                open={adding}
                title="Add travel agency"
                subtitle="You'll get a key to send them"
                fields={[
                    { name: 'agencyName', label: 'Agency name' },
                    { name: 'contact', label: 'Contact person or phone (optional)' }
                ]}
                onSubmit={async (v) => {
                    if (!v.agencyName?.trim()) throw new Error('Enter the agency name');
                    const r = await api.agentLinks.create(v);
                    setAdding(false);
                    setShown({ agencyName: v.agencyName.trim(), key: r.key });
                    q.reload();
                }}
                onClose={() => setAdding(false)}
                submitLabel="Create key"
            />
            <Dialog open={Boolean(shown)} onClose={() => setShown(null)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontSize: 16, fontWeight: 650 }}>Key for {shown?.agencyName}</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>Copy it now. For safety it won't be shown again; you can always make a new one.</Alert>
                    <TextField value={shown?.key || ''} fullWidth InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: 13 } }} />
                    <Typography sx={{ fontSize: 13, color: T.ink2, mt: 2 }}>
                        Send this to the agency on WhatsApp. In Travelytics: Partner hotels → Add hotel → paste the key.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button startIcon={<ContentCopyIcon />} onClick={() => copy(shown.key)}>Copy key</Button>
                    <Button variant="contained" onClick={() => setShown(null)}>Done</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default TravelAgents;
