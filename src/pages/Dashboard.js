import { Alert, Box, Button, Grid, LinearProgress, Skeleton, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { clients, users } from 'api';
import { useAuth } from 'context/Auth';
import useAsync from 'hooks/useAsync';
import useHotel from 'hooks/useHotel';
import PageHeader from 'components/PageHeader';
import Panel, { KpiStrip } from 'components/Panel';
import { T } from 'components/Theme';
import { HK_STATUSES } from 'utils/constants';
import { formatDate, inr, weekdayShort } from 'utils/format';

const longDate = (ymd) => (ymd ? new Date(`${ymd}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '');

const AdminDashboard = () => {
    const navigate = useNavigate();
    const c = useAsync(() => clients.list());
    const u = useAsync(() => users.list());
    const recent = [...c.data].sort((a, b) => b.id - a.id).slice(0, 8);

    return (
        <>
            <PageHeader title="Overview" subtitle="Hotels and users on the YHM platform" actions={<Button component={Link} to="/master/client" variant="contained" startIcon={<AddIcon />}>Register hotel</Button>} />
            <KpiStrip
                loading={c.loading || u.loading}
                items={[
                    { label: 'Hotels', value: c.data.length, sub: 'registered workspaces', onClick: () => navigate('/master/client') },
                    { label: 'Users', value: u.data.length, sub: 'across all hotels', onClick: () => navigate('/master/user') },
                    { label: 'Active users', value: u.data.filter((x) => x.active).length, sub: 'can sign in' }
                ]}
            />
            <Panel title="Recently registered hotels" action={<Button component={Link} to="/master/client" size="small" color="inherit">View all</Button>} padded={false} sx={{ mt: 2 }}>
                <Table size="small">
                    <TableHead><TableRow><TableCell>Hotel</TableCell><TableCell>Login email</TableCell><TableCell>Phone</TableCell><TableCell>GSTIN</TableCell></TableRow></TableHead>
                    <TableBody>
                        {recent.map((x) => (
                            <TableRow key={x.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate('/master/client')}>
                                <TableCell sx={{ fontWeight: 600 }}>{x.name}</TableCell>
                                <TableCell>{x.email}</TableCell>
                                <TableCell>{x.phoneNumber || '—'}</TableCell>
                                <TableCell>{x.gst || '—'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {!c.loading && recent.length === 0 && <Typography sx={{ p: 3, color: T.ink2, fontSize: 13 }}>No hotels yet. Use Register hotel to add the first one.</Typography>}
            </Panel>
        </>
    );
};

// compact arrivals / departures list
const MovementTable = ({ rows, loading, empty, navigate, dateLabel }) =>
    loading ? (
        <Box sx={{ p: 2 }}><Skeleton /><Skeleton /><Skeleton width="60%" /></Box>
    ) : rows.length === 0 ? (
        <Typography sx={{ px: 2, py: 3, fontSize: 13, color: T.ink3 }}>{empty}</Typography>
    ) : (
        <Table size="small">
            <TableHead><TableRow><TableCell>Booking</TableCell><TableCell>Guest</TableCell><TableCell>Room</TableCell><TableCell align="right">{dateLabel}</TableCell></TableRow></TableHead>
            <TableBody>
                {rows.map((b) => (
                    <TableRow key={b.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/hotel/bookings/${b.id}`)}>
                        <TableCell sx={{ color: T.ink2 }}>{b.bookingNumber}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{b.customerName}</TableCell>
                        <TableCell>{b.roomNumber}</TableCell>
                        <TableCell align="right" sx={{ color: T.ink2 }}>{formatDate(b.checkOut)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

const WorkspaceDashboard = () => {
    const { accessibleUrls } = useAuth();
    const { api } = useHotel();
    const navigate = useNavigate();
    const hotelOn = accessibleUrls.includes('/hotel/bookings');
    const d = useAsync(() => api.dashboard(), { initial: null, enabled: hotelOn });
    const data = d.data;
    if (data?.needsSetup && accessibleUrls.includes('/hotel/settings')) return <Navigate to="/setup" replace />;

    const loading = d.loading || !data;
    const free = data ? Math.max(data.rooms - data.occupiedTonight, 0) : 0;
    const hkTotal = data ? HK_STATUSES.reduce((s, x) => s + (data.housekeeping[x.id] || 0), 0) : 0;
    const money = data && data.outstanding !== null;

    return (
        <>
            <PageHeader
                title="Today"
                subtitle={data ? longDate(data.today) : ' '}
                actions={
                    hotelOn && (
                        <>
                            <Button component={Link} to="/hotel/calendar" variant="outlined" color="inherit" startIcon={<CalendarMonthOutlinedIcon />}>Room calendar</Button>
                            <Button component={Link} to="/hotel/bookings" variant="outlined" color="inherit">All bookings</Button>
                        </>
                    )
                }
            />
            {!hotelOn && <Alert severity="info" sx={{ mb: 2 }}>Front-desk screens aren't enabled for your account. Ask your hotel administrator for access.</Alert>}
            {data?.needsSetup && <Alert severity="info" sx={{ mb: 2 }}>This hotel hasn't been set up yet. Ask the owner to finish the setup.</Alert>}
            {data?.pendingBookings > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }} action={<Button color="inherit" size="small" component={Link} to="/hotel/bookings">Review</Button>}>
                    {data.pendingBookings} booking{data.pendingBookings > 1 ? 's are' : ' is'} on hold and need{data.pendingBookings > 1 ? '' : 's'} confirming.
                </Alert>
            )}

            {hotelOn && (
                <>
                    <KpiStrip
                        loading={loading}
                        items={[
                            { label: 'Occupancy tonight', value: `${data?.occupancyPercent ?? 0}%`, sub: data ? `${data.occupiedTonight} of ${data.rooms} rooms sold` : '', color: T.brand, onClick: () => navigate('/hotel/calendar') },
                            { label: 'Arrivals', value: data?.arrivals.length, sub: 'due to check in today', onClick: () => navigate('/hotel/bookings') },
                            { label: 'Departures', value: data?.departures.length, sub: 'due to check out', onClick: () => navigate('/hotel/bookings') },
                            { label: 'In house', value: data?.inHouseCount, sub: 'stays checked in', onClick: () => navigate('/hotel/bookings') },
                            { label: 'Vacant tonight', value: free, sub: 'rooms still to sell', onClick: () => navigate('/hotel/calendar') },
                            { label: 'Rooms to clean', value: data?.housekeeping?.DIRTY || 0, sub: `of ${hkTotal} in service`, color: (data?.housekeeping?.DIRTY || 0) > 0 ? T.warning : undefined, onClick: () => navigate('/hotel/rooms') }
                        ]}
                    />

                    <Grid container spacing={2} sx={{ mt: 0 }}>
                        <Grid item xs={12} lg={6}>
                            <Panel title="Arrivals" subtitle="Confirmed and on-hold bookings arriving today" padded={false} sx={{ height: '100%' }} action={<Typography className="num" sx={{ fontSize: 12.5, color: T.ink3 }}>{data?.arrivals.length ?? ''}</Typography>}>
                                <MovementTable rows={data?.arrivals || []} loading={loading} empty="No arrivals expected today." navigate={navigate} dateLabel="Leaves" />
                            </Panel>
                        </Grid>
                        <Grid item xs={12} lg={6}>
                            <Panel title="Departures" subtitle="Checked-in guests due out today or overdue" padded={false} sx={{ height: '100%' }} action={<Typography className="num" sx={{ fontSize: 12.5, color: T.ink3 }}>{data?.departures.length ?? ''}</Typography>}>
                                <MovementTable rows={data?.departures || []} loading={loading} empty="No departures due today." navigate={navigate} dateLabel="Due out" />
                            </Panel>
                        </Grid>

                        <Grid item xs={12} lg={money ? 7 : 8}>
                            <Panel title="Occupancy forecast" subtitle="Rooms sold for the next 7 nights" sx={{ height: '100%' }}>
                                {loading ? <Skeleton variant="rectangular" height={150} /> : (
                                    <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-end', height: 170 }}>
                                        {data.next7Days.map((x, i) => (
                                            <Tooltip key={x.date} title={`${formatDate(x.date)}: ${x.occupied} of ${data.rooms} rooms`}>
                                                <Box sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5 }}>
                                                    <Typography className="num" sx={{ fontSize: 12, fontWeight: 600, color: i === 0 ? T.brand : T.ink2 }}>{x.percent}%</Typography>
                                                    <Box sx={{ width: '100%', maxWidth: 56, flex: 1, display: 'flex', alignItems: 'flex-end', bgcolor: T.subtle, borderRadius: '3px', border: `1px solid ${T.line}` }}>
                                                        <Box sx={{ width: '100%', height: `${Math.max(x.percent, 2)}%`, bgcolor: i === 0 ? T.brand : '#B7848B', borderRadius: '2px' }} />
                                                    </Box>
                                                    <Typography sx={{ fontSize: 11.5, color: i === 0 ? T.ink : T.ink3, fontWeight: i === 0 ? 600 : 400 }}>{i === 0 ? 'Tonight' : `${weekdayShort(x.date)} ${Number(x.date.slice(8))}`}</Typography>
                                                </Box>
                                            </Tooltip>
                                        ))}
                                    </Box>
                                )}
                            </Panel>
                        </Grid>

                        <Grid item xs={12} lg={money ? 5 : 4}>
                            <Box sx={{ display: 'grid', gap: 2, height: '100%' }}>
                                {money && (
                                    <Panel title="Month to date" action={<Button component={Link} to="/hotel/reports" size="small" color="inherit">Reports</Button>} padded={false}>
                                        {[
                                            ['Room revenue', inr(data.roomRevenueThisMonth)],
                                            ['Payments received', inr(data.paymentsThisMonth)],
                                            ['Outstanding from guests', inr(data.outstanding), data.outstanding > 0 ? T.error : T.success]
                                        ].map(([l, v, color]) => (
                                            <Box key={l} sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 1.1, borderBottom: `1px solid ${T.line}`, '&:last-child': { borderBottom: 0 } }}>
                                                <Typography sx={{ fontSize: 13, color: T.ink2 }}>{l}</Typography>
                                                <Typography className="num" sx={{ fontSize: 13, fontWeight: 600, color }}>{v}</Typography>
                                            </Box>
                                        ))}
                                    </Panel>
                                )}
                                <Panel title="Housekeeping" action={<Button component={Link} to="/hotel/rooms" size="small" color="inherit">Rooms</Button>}>
                                    {loading ? <Skeleton /> : HK_STATUSES.map((s) => {
                                        const n = data.housekeeping[s.id] || 0;
                                        return (
                                            <Box key={s.id} sx={{ mb: 1.25, '&:last-child': { mb: 0 } }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Typography sx={{ fontSize: 12.5, color: T.ink2 }}>{s.name}</Typography>
                                                    <Typography className="num" sx={{ fontSize: 12.5, fontWeight: 600 }}>{n}</Typography>
                                                </Box>
                                                <LinearProgress variant="determinate" value={hkTotal ? (n / hkTotal) * 100 : 0} color={s.color} sx={{ height: 5 }} />
                                            </Box>
                                        );
                                    })}
                                </Panel>
                            </Box>
                        </Grid>
                    </Grid>
                </>
            )}
        </>
    );
};

const Dashboard = () => {
    const { isAdmin, user } = useAuth();
    if (isAdmin) return <AdminDashboard />;
    if (!user.clientId) return <PageHeader title="Today" subtitle="Your account isn't linked to a hotel yet." />;
    return <WorkspaceDashboard />;
};

export default Dashboard;
