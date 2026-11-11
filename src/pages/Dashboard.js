import { alpha } from '@mui/material/styles';
import { Alert, Avatar, Box, Button, Card, CardContent, Chip, Divider, Grid, List, ListItem, ListItemText, Skeleton, Stack, Tooltip, Typography } from '@mui/material';
import KingBedOutlinedIcon from '@mui/icons-material/KingBedOutlined';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import AddIcon from '@mui/icons-material/Add';
import { Link, Navigate } from 'react-router-dom';
import { clients, users } from 'api';
import { useAuth } from 'context/Auth';
import useAsync from 'hooks/useAsync';
import useHotel from 'hooks/useHotel';
import PageHeader from 'components/PageHeader';
import { HK_STATUSES } from 'utils/constants';
import { formatDate, initials, inr, weekdayShort } from 'utils/format';

const Stat = ({ icon, label, value, color = 'primary', loading, to, hint }) => (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden', transition: 'transform .15s, box-shadow .15s', '&:hover': to ? { transform: 'translateY(-2px)', boxShadow: 3 } : undefined }}>
        <Box sx={{ position: 'absolute', inset: '0 auto 0 0', width: 4, bgcolor: `${color}.main` }} />
        <CardContent component={to ? Link : 'div'} to={to} sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'inherit', textDecoration: 'none', '&:last-child': { pb: 2 }, py: 2.25 }}>
            <Box sx={(t) => ({ width: 48, height: 48, borderRadius: '14px', display: 'grid', placeItems: 'center', bgcolor: alpha(t.palette[color].main, 0.14), color: `${color}.main`, flexShrink: 0 })}>{icon}</Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                {loading ? <Skeleton width={56} height={38} /> : <Typography variant="h4" sx={{ lineHeight: 1.2 }}>{value}</Typography>}
                {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
            </Box>
        </CardContent>
    </Card>
);

// circular occupancy gauge
const Gauge = ({ percent }) => {
    const r = 52;
    const c = 2 * Math.PI * r;
    return (
        <Box sx={{ position: 'relative', width: 132, height: 132, flexShrink: 0 }}>
            <Box component="svg" viewBox="0 0 132 132" sx={{ transform: 'rotate(-90deg)' }}>
                <circle cx="66" cy="66" r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="11" />
                <circle cx="66" cy="66" r={r} fill="none" stroke="#e5b45a" strokeWidth="11" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * Math.min(percent, 100)) / 100} style={{ transition: 'stroke-dashoffset .6s ease' }} />
            </Box>
            <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                <Box><Typography sx={{ fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{percent}%</Typography><Typography variant="caption" sx={{ opacity: 0.7 }}>tonight</Typography></Box>
            </Box>
        </Box>
    );
};

const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const AdminDashboard = () => {
    const c = useAsync(() => clients.list());
    const u = useAsync(() => users.list());
    const recent = [...c.data].sort((a, b) => b.id - a.id).slice(0, 6);

    return (
        <>
            <PageHeader title="Overview" subtitle="Every client on the platform" actions={<Button component={Link} to="/master/client" variant="contained" startIcon={<AddIcon />}>New client</Button>} />
            <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                    <Stat icon={<HotelOutlinedIcon />} label="Clients" value={c.data.length} loading={c.loading} to="/master/client" />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Stat icon={<PeopleAltOutlinedIcon />} label="Users" value={u.data.length} color="secondary" loading={u.loading} to="/master/user" />
                </Grid>
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Recently added clients</Typography>
                            <List disablePadding>
                                {recent.map((x) => (
                                    <ListItem key={x.id} divider disableGutters>
                                        <ListItemText primary={x.name} secondary={`${x.email} · ${x.phoneNumber}`} />
                                    </ListItem>
                                ))}
                                {!c.loading && recent.length === 0 && <Typography color="text.secondary" sx={{ py: 3 }}>No clients yet.</Typography>}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </>
    );
};

const WorkspaceDashboard = () => {
    const { user, accessibleUrls } = useAuth();
    const { api } = useHotel();
    const hotelOn = accessibleUrls.includes('/hotel/bookings');
    const d = useAsync(() => api.dashboard(), { initial: null, enabled: hotelOn });
    const data = d.data;
    if (data?.needsSetup && accessibleUrls.includes('/hotel/settings')) return <Navigate to="/setup" replace />;

    const bookingList = (title, rows, empty, accent) => (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="h6">{title}</Typography>
                    <Chip size="small" label={rows.length} color={accent} />
                </Box>
                {d.loading ? <Skeleton height={80} /> : rows.length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 3 }}>{empty}</Typography>
                ) : (
                    <List disablePadding>
                        {rows.map((b) => (
                            <ListItem key={b.id} divider disableGutters component={Link} to={`/hotel/bookings/${b.id}`} sx={{ color: 'inherit', textDecoration: 'none', gap: 1.5, '&:hover': { bgcolor: 'action.hover' }, borderRadius: 1.5, px: 0.5 }}>
                                <Avatar sx={(t) => ({ width: 38, height: 38, fontSize: 13, fontWeight: 700, bgcolor: alpha(t.palette[accent].main, 0.16), color: `${accent}.main` })}>{initials(b.customerName)}</Avatar>
                                <ListItemText primary={b.customerName} secondary={`${b.bookingNumber} · until ${formatDate(b.checkOut)}`} primaryTypographyProps={{ fontWeight: 600 }} />
                                <Chip size="small" variant="outlined" label={`Room ${b.roomNumber}`} />
                            </ListItem>
                        ))}
                    </List>
                )}
            </CardContent>
        </Card>
    );

    const free = data ? Math.max(data.rooms - data.occupiedTonight, 0) : 0;

    return (
        <>
            {!hotelOn && <Alert severity="info" sx={{ mb: 2 }}>Hotel screens aren't enabled for your account.</Alert>}
            {data?.needsSetup && <Alert severity="info" sx={{ mb: 2 }}>This hotel hasn't been set up yet. Ask the owner to finish the setup.</Alert>}
            {hotelOn && (
                <Grid container spacing={2.5}>
                    <Grid item xs={12}>
                        <Card sx={{ border: 0, color: '#fff', background: 'radial-gradient(600px 260px at 90% 0%, rgba(229,180,90,.28) 0%, transparent 60%), linear-gradient(135deg, #1f3a73 0%, #10234a 100%)' }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap', p: { xs: 3, sm: 4 } }}>
                                <Box sx={{ minWidth: 240 }}>
                                    <Typography sx={{ opacity: 0.75 }}>{data ? formatDate(data.today) : ''}</Typography>
                                    <Typography variant="h4" sx={{ mt: 0.5 }}>{greeting()}, {user.name.split(' ')[0]}</Typography>
                                    <Typography sx={{ opacity: 0.75, mt: 1, maxWidth: 440 }}>
                                        {data ? `${data.arrivals.length} arriving, ${data.departures.length} leaving and ${data.inHouseCount} in house. ${free} of ${data.rooms} rooms free tonight.` : 'Loading today’s picture…'}
                                    </Typography>
                                    <Stack direction="row" spacing={1.25} sx={{ mt: 2.5, flexWrap: 'wrap', rowGap: 1 }}>
                                        <Button component={Link} to="/hotel/calendar" variant="contained" color="secondary" startIcon={<AddIcon />}>New booking</Button>
                                        <Button component={Link} to="/hotel/bookings" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,.35)', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,.08)' } }} variant="outlined">All bookings</Button>
                                    </Stack>
                                </Box>
                                {data && <Gauge percent={data.occupancyPercent} />}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} lg={3}><Stat icon={<LoginIcon />} label="Arriving today" value={data?.arrivals.length} loading={d.loading} color="info" to="/hotel/bookings" /></Grid>
                    <Grid item xs={12} sm={6} lg={3}><Stat icon={<LogoutIcon />} label="Leaving today" value={data?.departures.length} loading={d.loading} color="warning" to="/hotel/bookings" /></Grid>
                    <Grid item xs={12} sm={6} lg={3}><Stat icon={<PeopleAltOutlinedIcon />} label="In house" value={data?.inHouseCount} loading={d.loading} color="success" to="/hotel/bookings" /></Grid>
                    <Grid item xs={12} sm={6} lg={3}><Stat icon={<KingBedOutlinedIcon />} label="Free tonight" value={data ? `${free}` : ''} hint={data ? `of ${data.rooms} rooms` : ''} loading={d.loading} color="secondary" to="/hotel/calendar" /></Grid>

                    <Grid item xs={12} md={6}>{bookingList('Arrivals today', data?.arrivals || [], 'No arrivals today.', 'info')}</Grid>
                    <Grid item xs={12} md={6}>{bookingList('Departures today', data?.departures || [], 'No one is due to leave today.', 'warning')}</Grid>

                    <Grid item xs={12} md={7}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6">Next 7 nights</Typography>
                                <Typography variant="body2" color="text.secondary">Share of rooms booked each night</Typography>
                                {d.loading ? <Skeleton height={140} /> : (
                                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end', mt: 2.5 }}>
                                        {(data?.next7Days || []).map((x, i) => (
                                            <Tooltip key={x.date} title={`${x.occupied} of ${data.rooms} rooms booked`}>
                                                <Box sx={{ flex: 1, textAlign: 'center' }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{x.percent}%</Typography>
                                                    <Box sx={{ height: 110, display: 'flex', alignItems: 'flex-end' }}>
                                                        <Box sx={(t) => ({ width: '100%', height: `${Math.max(x.percent, 4)}%`, borderRadius: '8px 8px 4px 4px', background: i === 0 ? `linear-gradient(180deg, ${t.palette.secondary.main}, ${alpha(t.palette.secondary.main, 0.6)})` : `linear-gradient(180deg, ${t.palette.primary.main}, ${alpha(t.palette.primary.main, 0.45)})`, opacity: x.percent ? 1 : 0.35 })} />
                                                    </Box>
                                                    <Typography variant="caption" color={i === 0 ? 'secondary.main' : 'text.secondary'} sx={{ fontWeight: i === 0 ? 700 : 400 }}>{i === 0 ? 'Today' : `${weekdayShort(x.date)} ${Number(x.date.slice(8))}`}</Typography>
                                                </Box>
                                            </Tooltip>
                                        ))}
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 1 }}>{data?.outstanding === null ? 'Rooms' : 'This month'}</Typography>
                                {d.loading ? <Skeleton height={140} /> : (<>
                                    {data.outstanding !== null && (<>
                                        {[['Room revenue', data.roomRevenueThisMonth], ['Payments received', data.paymentsThisMonth]].map(([l, v]) => (
                                            <Box key={l} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: 1, borderColor: 'divider' }}><Typography color="text.secondary">{l}</Typography><Typography sx={{ fontWeight: 700 }}>{inr(v)}</Typography></Box>
                                        ))}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}><Typography color="text.secondary">Still owed by guests</Typography><Typography sx={{ fontWeight: 700 }} color={data.outstanding > 0 ? 'error.main' : 'success.main'}>{inr(data.outstanding)}</Typography></Box>
                                        <Divider sx={{ my: 1.5 }} />
                                    </>)}
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Housekeeping</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {HK_STATUSES.map((s) => <Chip key={s.id} component={Link} to="/hotel/rooms" clickable label={`${data.housekeeping[s.id] || 0} ${s.name.toLowerCase()}`} color={s.color} variant="outlined" />)}
                                    </Box>
                                    {data.pendingBookings > 0 && <Alert severity="warning" sx={{ mt: 2 }}>{data.pendingBookings} booking(s) are on hold and need confirming.</Alert>}
                                </>)}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </>
    );
};

const Dashboard = () => {
    const { isAdmin, user } = useAuth();
    if (isAdmin) return <AdminDashboard />;
    if (!user.clientId) return <PageHeader title="Dashboard" subtitle="Your account isn't linked to a client yet." />;
    return <WorkspaceDashboard />;
};

export default Dashboard;
