import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, Grid, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import useHotel from 'hooks/useHotel';
import useAsync from 'hooks/useAsync';
import { useToast } from 'context/Toast';
import PageHeader from 'components/PageHeader';
import Panel from 'components/Panel';
import { T } from 'components/Theme';
import { inr } from 'utils/format';

const when = (v) => new Date(v).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

// End of shift: count the cash in hand, compare with what the system says you took, close the drawer.
const CashDrawer = () => {
    const { api } = useHotel();
    const toast = useToast();
    const q = useAsync(() => api.cash.drawer(), { initial: null });
    const [counted, setCounted] = useState('');
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const d = q.data;
    const diff = d && counted !== '' ? Math.round((Number(counted) - d.expected) * 100) / 100 : null;

    const close = async () => {
        setBusy(true);
        setError('');
        try {
            const r = await api.cash.close({ counted: Number(counted), note: note.trim() || undefined });
            toast.success(r.message);
            setCounted('');
            setNote('');
            q.reload();
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <PageHeader title="Cash drawer" subtitle="Count the cash you took and close your drawer at the end of each shift" />
            <Grid container spacing={2}>
                <Grid item xs={12} lg={7}>
                    <Panel title="Cash you have taken" subtitle={d?.lastClose ? `Since your last close on ${when(d.lastClose.closedAt)}` : 'Since you started'} padded={false}>
                        <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>When</TableCell>
                                        <TableCell>Booking</TableCell>
                                        <TableCell>Guest</TableCell>
                                        <TableCell align="right">Cash</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {d && d.payments.length === 0 && (
                                        <TableRow><TableCell colSpan={4} sx={{ color: T.ink3 }}>No cash taken since your last close.</TableCell></TableRow>
                                    )}
                                    {d?.payments.map((p) => (
                                        <TableRow key={p.id} hover>
                                            <TableCell sx={{ color: T.ink2, whiteSpace: 'nowrap' }}>{when(p.paidAt)}</TableCell>
                                            <TableCell><Link to={`/hotel/bookings/${p.bookingId}`} style={{ color: T.brand, fontWeight: 600, textDecoration: 'none' }}>{p.bookingNumber}</Link></TableCell>
                                            <TableCell>{p.customerName}</TableCell>
                                            <TableCell align="right" className="num">{inr(p.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {d && (
                                        <TableRow sx={{ '& td': { bgcolor: T.subtle, fontWeight: 650 } }}>
                                            <TableCell colSpan={3}>Should be in your drawer</TableCell>
                                            <TableCell align="right" className="num">{inr(d.expected)}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Box>
                    </Panel>
                </Grid>
                <Grid item xs={12} lg={5}>
                    <Panel title="Close my drawer">
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        <Typography sx={{ fontSize: 13, color: T.ink2, mb: 2 }}>Count the notes and coins you have from guests, then enter the total. The owner sees every close.</Typography>
                        <TextField label="Cash counted (₹)" type="number" value={counted} onChange={(e) => setCounted(e.target.value)} fullWidth inputProps={{ min: 0, step: '0.01' }} />
                        {diff !== null && (
                            <Box sx={{ mt: 1.5, p: 1.25, borderRadius: '6px', bgcolor: diff === 0 ? '#F1F8F4' : '#FDF3F2', border: `1px solid ${diff === 0 ? '#C3E0CF' : '#EFC5C1'}` }}>
                                <Typography sx={{ fontSize: 13, fontWeight: 600, color: diff === 0 ? T.success : T.error }}>
                                    {diff === 0 ? 'Matches the system' : `${inr(Math.abs(diff))} ${diff < 0 ? 'short' : 'over'}`}
                                </Typography>
                            </Box>
                        )}
                        <TextField label={diff ? 'Why is it different? (required)' : 'Note (optional)'} value={note} onChange={(e) => setNote(e.target.value)} fullWidth multiline minRows={2} sx={{ mt: 2 }} />
                        <Button fullWidth variant="contained" sx={{ mt: 2 }} disabled={busy || counted === '' || !d} onClick={close} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}>
                            Close drawer
                        </Button>
                    </Panel>
                    {d?.recent?.length > 0 && (
                        <Panel title="My recent closes" sx={{ mt: 2 }}>
                            {d.recent.map((c) => (
                                <Box key={c.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                    <Typography sx={{ fontSize: 13, color: T.ink2 }}>{when(c.closedAt)}</Typography>
                                    <Typography className="num" sx={{ fontSize: 13, fontWeight: 600, color: c.difference < 0 ? T.error : c.difference > 0 ? '#9A6A12' : T.success }}>
                                        {inr(c.counted)} · {c.difference === 0 ? 'matched' : `${c.difference < 0 ? 'short' : 'over'} ${inr(Math.abs(c.difference))}`}
                                    </Typography>
                                </Box>
                            ))}
                        </Panel>
                    )}
                </Grid>
            </Grid>
        </>
    );
};

export default CashDrawer;
