import { useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, Grid, Stack, TextField, Tooltip, Typography } from '@mui/material';
import useHotel from 'hooks/useHotel';
import useAsync from 'hooks/useAsync';
import DataTable from 'components/DataTable';
import PageHeader from 'components/PageHeader';
import { CHARGE_CATEGORIES } from 'utils/constants';
import { addDays, formatDate, inr, num, todayISO } from 'utils/format';

const Metric = ({ label, value, hint }) => (
    <Card sx={{ height: '100%' }}><CardContent><Typography variant="body2" color="text.secondary">{label}</Typography><Typography variant="h5">{value}</Typography>{hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}</CardContent></Card>
);

const Reports = () => {
    const { api } = useHotel();
    const [from, setFrom] = useState(`${todayISO().slice(0, 8)}01`);
    const [to, setTo] = useState(todayISO());
    const valid = from && to && to >= from;
    const q = useAsync(() => api.report({ from, to }), { initial: null, enabled: Boolean(valid), deps: [from, to] });
    const d = q.data;

    const columns = useMemo(() => [
        { id: 'date', label: 'Date', value: (r) => r.date, render: (r) => formatDate(r.date) },
        { id: 'occupied', label: 'Rooms occupied' },
        { id: 'occupancyPercent', label: 'Occupancy', value: (r) => r.occupancyPercent, render: (r) => `${r.occupancyPercent}%` },
        { id: 'roomRevenue', label: 'Room revenue', align: 'right', value: (r) => r.roomRevenue, render: (r) => inr(r.roomRevenue) },
        { id: 'otherRevenue', label: 'Food & other', align: 'right', value: (r) => r.otherRevenue, render: (r) => inr(r.otherRevenue) },
        { id: 'paymentsReceived', label: 'Payments received', align: 'right', value: (r) => r.paymentsReceived, render: (r) => inr(r.paymentsReceived) }
    ], []);

    const preset = (days) => { setTo(todayISO()); setFrom(addDays(todayISO(), -(days - 1))); };
    const maxCat = Math.max(1, ...(d?.byCategory || []).map((c) => c.amount));
    const maxRev = Math.max(1, ...(d?.rows || []).map((r) => r.roomRevenue + r.otherRevenue));

    return (
        <>
            <PageHeader title="Reports" subtitle="Occupancy and income before tax, day by day" />
            <Stack direction="row" spacing={1.5} sx={{ mb: 2.5, flexWrap: 'wrap', rowGap: 1.5, alignItems: 'center' }}>
                <TextField type="date" label="From" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 170 }} />
                <TextField type="date" label="To" value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 170 }} error={!valid} helperText={!valid ? 'End is before start' : undefined} />
                <Button color="inherit" variant="outlined" onClick={() => preset(7)}>Last 7 days</Button>
                <Button color="inherit" variant="outlined" onClick={() => preset(30)}>Last 30 days</Button>
                <Button color="inherit" variant="outlined" onClick={() => { setFrom(`${todayISO().slice(0, 8)}01`); setTo(todayISO()); }}>This month</Button>
            </Stack>

            {d && (
                <>
                    <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                        <Grid item xs={6} md={4} lg={2}><Metric label="Room revenue" value={inr(d.totals.roomRevenue)} /></Grid>
                        <Grid item xs={6} md={4} lg={2}><Metric label="Food & other" value={inr(d.totals.otherRevenue)} /></Grid>
                        <Grid item xs={6} md={4} lg={2}><Metric label="Payments received" value={inr(d.totals.paymentsReceived)} /></Grid>
                        <Grid item xs={6} md={4} lg={2}><Metric label="Occupancy" value={`${d.totals.occupancyPercent}%`} hint={`${num(d.totals.occupiedNights)} room-nights`} /></Grid>
                        <Grid item xs={6} md={4} lg={2}><Metric label="Avg. room rate" value={inr(d.totals.adr)} hint="per occupied night" /></Grid>
                        <Grid item xs={6} md={4} lg={2}><Metric label="Revenue per room" value={inr(d.totals.revpar)} hint="per available night" /></Grid>
                    </Grid>

                    <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                        <Grid item xs={12} md={8}>
                            <Card sx={{ height: '100%' }}><CardContent>
                                <Typography variant="h6">Income per day</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: 170, mt: 2, overflowX: 'auto' }}>
                                    {d.rows.map((r) => (
                                        <Tooltip key={r.date} title={`${formatDate(r.date)} · rooms ${inr(r.roomRevenue)} · other ${inr(r.otherRevenue)} · occupancy ${r.occupancyPercent}%`}>
                                            <Box sx={{ flex: '1 0 8px', maxWidth: 40, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                                                <Box sx={{ height: `${(r.otherRevenue / maxRev) * 100}%`, bgcolor: 'secondary.main', borderRadius: '3px 3px 0 0' }} />
                                                <Box sx={{ height: `${(r.roomRevenue / maxRev) * 100}%`, bgcolor: 'primary.main', borderRadius: r.otherRevenue ? 0 : '3px 3px 0 0', minHeight: r.roomRevenue ? 2 : 0 }} />
                                            </Box>
                                        </Tooltip>
                                    ))}
                                </Box>
                                <Stack direction="row" spacing={2} sx={{ mt: 1.5 }}>
                                    <Typography variant="caption"><Box component="span" sx={{ display: 'inline-block', width: 10, height: 10, bgcolor: 'primary.main', borderRadius: 0.5, mr: 0.5 }} />Rooms</Typography>
                                    <Typography variant="caption"><Box component="span" sx={{ display: 'inline-block', width: 10, height: 10, bgcolor: 'secondary.main', borderRadius: 0.5, mr: 0.5 }} />Food & other</Typography>
                                </Stack>
                            </CardContent></Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card sx={{ height: '100%' }}><CardContent>
                                <Typography variant="h6" sx={{ mb: 1 }}>Food & other charges by type</Typography>
                                {d.byCategory.length === 0 ? <Typography color="text.secondary" variant="body2">No extra charges in this period.</Typography> : d.byCategory.map((c) => (
                                    <Box key={c.category} sx={{ mb: 1.5 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">{CHARGE_CATEGORIES.find((x) => x.id === c.category)?.name || c.category}</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{inr(c.amount)}</Typography></Box>
                                        <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover', mt: 0.5 }}><Box sx={{ height: '100%', width: `${(c.amount / maxCat) * 100}%`, bgcolor: 'secondary.main', borderRadius: 3 }} /></Box>
                                    </Box>
                                ))}
                            </CardContent></Card>
                        </Grid>
                    </Grid>

                    <DataTable columns={columns} rows={d.rows} loading={q.loading} rowKey="date" exportName={`report-${from}-to-${to}`} searchPlaceholder="Search dates…" />
                </>
            )}
        </>
    );
};

export default Reports;
