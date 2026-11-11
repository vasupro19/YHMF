import { useMemo, useState } from 'react';
import { Box, Button, Card, Grid, TextField, Tooltip, Typography } from '@mui/material';
import useHotel from 'hooks/useHotel';
import useAsync from 'hooks/useAsync';
import DataTable from 'components/DataTable';
import PageHeader from 'components/PageHeader';
import Panel, { KpiStrip } from 'components/Panel';
import { T } from 'components/Theme';
import { CHARGE_CATEGORIES } from 'utils/constants';
import { addDays, formatDate, inr, num, todayISO } from 'utils/format';

const ROOMS = T.brand;
const OTHER = T.brass;

const Legend = ({ color, label }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: color }} />
        <Typography sx={{ fontSize: 12, color: T.ink2 }}>{label}</Typography>
    </Box>
);

const Reports = () => {
    const { api } = useHotel();
    const [from, setFrom] = useState(`${todayISO().slice(0, 8)}01`);
    const [to, setTo] = useState(todayISO());
    const valid = from && to && to >= from;
    const q = useAsync(() => api.report({ from, to }), { initial: null, enabled: Boolean(valid), deps: [from, to] });
    const d = q.data;

    const columns = useMemo(
        () => [
            { id: 'date', label: 'Date', value: (r) => r.date, render: (r) => formatDate(r.date) },
            { id: 'occupied', label: 'Rooms occupied', align: 'right' },
            { id: 'occupancyPercent', label: 'Occupancy', align: 'right', value: (r) => r.occupancyPercent, render: (r) => `${r.occupancyPercent}%` },
            { id: 'roomRevenue', label: 'Room revenue', align: 'right', value: (r) => r.roomRevenue, render: (r) => inr(r.roomRevenue) },
            { id: 'otherRevenue', label: 'Food & other', align: 'right', value: (r) => r.otherRevenue, render: (r) => inr(r.otherRevenue) },
            { id: 'paymentsReceived', label: 'Payments received', align: 'right', value: (r) => r.paymentsReceived, render: (r) => inr(r.paymentsReceived) }
        ],
        []
    );

    const preset = (days) => {
        setTo(todayISO());
        setFrom(addDays(todayISO(), -(days - 1)));
    };
    const thisMonthRange = () => {
        setFrom(`${todayISO().slice(0, 8)}01`);
        setTo(todayISO());
    };
    const maxCat = Math.max(1, ...(d?.byCategory || []).map((c) => c.amount));
    const maxRev = Math.max(1, ...(d?.rows || []).map((r) => r.roomRevenue + r.otherRevenue));
    const dateField = { width: 150, '& .MuiOutlinedInput-root': { height: 32 } };

    return (
        <>
            <PageHeader title="Reports" subtitle={valid ? `Occupancy and income before tax, ${formatDate(from)} to ${formatDate(to)}` : 'Occupancy and income before tax, day by day'} />

            <Card sx={{ mb: 2, px: 1.5, py: 1, display: 'flex', gap: 1.25, flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography sx={{ fontSize: 12.5, color: T.ink2, fontWeight: 500 }}>Period</Typography>
                <TextField type="date" value={from} onChange={(e) => setFrom(e.target.value)} sx={dateField} inputProps={{ 'aria-label': 'From' }} />
                <Typography sx={{ fontSize: 12.5, color: T.ink3 }}>to</Typography>
                <TextField type="date" value={to} onChange={(e) => setTo(e.target.value)} sx={dateField} error={!valid} inputProps={{ 'aria-label': 'To' }} />
                {!valid && <Typography sx={{ fontSize: 12, color: T.error }}>End is before start</Typography>}
                <Box sx={{ width: '1px', alignSelf: 'stretch', bgcolor: T.line, mx: 0.5 }} />
                <Button size="small" color="inherit" variant="outlined" onClick={() => preset(7)}>Last 7 days</Button>
                <Button size="small" color="inherit" variant="outlined" onClick={() => preset(30)}>Last 30 days</Button>
                <Button size="small" color="inherit" variant="outlined" onClick={thisMonthRange}>This month</Button>
            </Card>

            {d && (
                <>
                    <KpiStrip
                        loading={q.loading}
                        items={[
                            { label: 'Room revenue', value: inr(d.totals.roomRevenue), color: T.brand },
                            { label: 'Food & other', value: inr(d.totals.otherRevenue) },
                            { label: 'Payments received', value: inr(d.totals.paymentsReceived) },
                            { label: 'Occupancy', value: `${d.totals.occupancyPercent}%`, sub: `${num(d.totals.occupiedNights)} room-nights` },
                            { label: 'ADR', value: inr(d.totals.adr), sub: 'per occupied night' },
                            { label: 'RevPAR', value: inr(d.totals.revpar), sub: 'per available night' }
                        ]}
                    />

                    <Grid container spacing={2} sx={{ mt: 0, mb: 2 }}>
                        <Grid item xs={12} md={8}>
                            <Panel title="Income per day" subtitle="Before tax" sx={{ height: '100%' }} action={<Box sx={{ display: 'flex', gap: 1.75 }}><Legend color={ROOMS} label="Rooms" /><Legend color={OTHER} label="Food & other" /></Box>}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: 180, overflowX: 'auto', borderBottom: `1px solid ${T.line2}` }}>
                                    {d.rows.map((r) => (
                                        <Tooltip key={r.date} title={`${formatDate(r.date)} · rooms ${inr(r.roomRevenue)} · other ${inr(r.otherRevenue)} · occupancy ${r.occupancyPercent}%`}>
                                            <Box sx={{ flex: '1 0 8px', maxWidth: 36, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', '&:hover > *': { opacity: 0.85 } }}>
                                                <Box sx={{ height: `${(r.otherRevenue / maxRev) * 100}%`, bgcolor: OTHER, borderRadius: '2px 2px 0 0' }} />
                                                <Box sx={{ height: `${(r.roomRevenue / maxRev) * 100}%`, bgcolor: ROOMS, borderRadius: r.otherRevenue ? 0 : '2px 2px 0 0', minHeight: r.roomRevenue ? 2 : 0 }} />
                                            </Box>
                                        </Tooltip>
                                    ))}
                                </Box>
                                {d.rows.length > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75 }}>
                                        <Typography sx={{ fontSize: 11.5, color: T.ink3 }}>{formatDate(d.rows[0].date)}</Typography>
                                        <Typography sx={{ fontSize: 11.5, color: T.ink3 }}>Highest day {inr(maxRev)}</Typography>
                                        <Typography sx={{ fontSize: 11.5, color: T.ink3 }}>{formatDate(d.rows[d.rows.length - 1].date)}</Typography>
                                    </Box>
                                )}
                            </Panel>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Panel title="Food & other charges" subtitle="By type, before tax" sx={{ height: '100%' }}>
                                {d.byCategory.length === 0 ? (
                                    <Typography sx={{ fontSize: 13, color: T.ink3 }}>No extra charges in this period.</Typography>
                                ) : (
                                    d.byCategory.map((c) => (
                                        <Box key={c.category} sx={{ mb: 1.5, '&:last-child': { mb: 0 } }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography sx={{ fontSize: 12.5, color: T.ink2 }}>{CHARGE_CATEGORIES.find((x) => x.id === c.category)?.name || c.category}</Typography>
                                                <Typography className="num" sx={{ fontSize: 12.5, fontWeight: 600 }}>{inr(c.amount)}</Typography>
                                            </Box>
                                            <Box sx={{ height: 5, borderRadius: '2px', bgcolor: T.line, mt: 0.5 }}>
                                                <Box sx={{ height: '100%', width: `${(c.amount / maxCat) * 100}%`, bgcolor: OTHER, borderRadius: '2px' }} />
                                            </Box>
                                        </Box>
                                    ))
                                )}
                            </Panel>
                        </Grid>
                    </Grid>

                    <DataTable columns={columns} rows={d.rows} loading={q.loading} rowKey="date" exportName={`report-${from}-to-${to}`} searchPlaceholder="Search dates" defaultRowsPerPage={50} />
                </>
            )}
        </>
    );
};

export default Reports;
