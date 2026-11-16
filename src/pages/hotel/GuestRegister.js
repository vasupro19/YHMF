import { useMemo, useState } from 'react';
import { Alert, Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle, Tab, Tabs, TextField, Typography } from '@mui/material';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useHotel from 'hooks/useHotel';
import useAsync from 'hooks/useAsync';
import { useToast } from 'context/Toast';
import DataTable from 'components/DataTable';
import PageHeader from 'components/PageHeader';
import { Pill } from 'components/StatusChip';
import { T } from 'components/Theme';
import { GENDERS, ID_TYPES } from 'utils/constants';
import { addDays, formatDate, todayISO } from 'utils/format';

export const FRRO_URL = 'https://indianfrro.gov.in/frro/FormC';
const stamp = (v) => (v ? new Date(v).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '');
export const ageOf = (dob, on) => {
    if (!dob) return '';
    const a = new Date(`${dob}T00:00:00Z`);
    const b = new Date(`${(on || todayISO()).slice(0, 10)}T00:00:00Z`);
    let age = b.getUTCFullYear() - a.getUTCFullYear();
    if (b.getUTCMonth() < a.getUTCMonth() || (b.getUTCMonth() === a.getUTCMonth() && b.getUTCDate() < a.getUTCDate())) age -= 1;
    return age;
};
export const idLabel = (r) => (r.idType ? `${ID_TYPES.find((t) => t.id === r.idType)?.name || r.idType} ${r.idNumber || ''}` : '');

// everything Form C asks for, in the order of the FRRO form, ready to copy across
const formCText = (r) => {
    const f = r.foreignDetails || {};
    return [
        ['Name', r.name],
        ['Gender', GENDERS.find((g) => g.id === r.gender)?.name],
        ['Date of birth', r.dob && formatDate(r.dob)],
        ['Nationality', r.nationality],
        ['Address in home country', f.addressAbroad],
        ['Passport number', f.passportNo],
        ['Passport issued at', f.passportIssuePlace],
        ['Passport issue date', f.passportIssueDate && formatDate(f.passportIssueDate)],
        ['Passport valid till', f.passportExpiry && formatDate(f.passportExpiry)],
        ['Visa number', f.visaNo],
        ['Visa type', f.visaType],
        ['Visa issue date', f.visaIssueDate && formatDate(f.visaIssueDate)],
        ['Visa valid till', f.visaExpiry && formatDate(f.visaExpiry)],
        ['Arrived in India on', f.arrivalInIndia && formatDate(f.arrivalInIndia)],
        ['Port of arrival', f.portOfArrival],
        ['Arrived from (country)', f.arrivedFromCountry],
        ['Arrived at hotel', stamp(r.checkedInAt) || formatDate(r.checkIn)],
        ['Expected departure', formatDate(r.checkOut)],
        ['Coming from (city)', r.comingFrom],
        ['Going to (city)', r.goingTo],
        ['Next destination (country)', f.nextDestinationCountry],
        ['Purpose of visit', r.purpose],
        ['Mobile', r.phone],
        ['Room', r.roomNumber]
    ]
        .map(([k, v]) => `${k}: ${v || '—'}`)
        .join('\n');
};

const GuestRegister = () => {
    const { api } = useHotel();
    const toast = useToast();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const tab = params.get('tab') === 'formc' ? 'formc' : 'register';
    const [from, setFrom] = useState(addDays(todayISO(), -6));
    const [to, setTo] = useState(todayISO());
    const [showAll, setShowAll] = useState(false);
    const [filing, setFiling] = useState(null);
    const [ref, setRef] = useState('');
    const valid = from && to && to >= from;
    const reg = useAsync(() => api.register({ from, to }), { enabled: tab === 'register' && Boolean(valid), deps: [from, to, tab] });
    const fc = useAsync(() => api.formC(showAll ? 'all' : 'due'), { enabled: tab === 'formc', deps: [showAll, tab] });

    const regColumns = useMemo(
        () => [
            { id: 'checkedInAt', label: 'Arrived', value: (r) => r.checkedInAt, render: (r) => <Typography sx={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>{stamp(r.checkedInAt)}</Typography> },
            {
                id: 'name',
                label: 'Guest',
                value: (r) => `${r.name} ${r.phone || ''}`,
                render: (r) => (
                    <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{r.name}</Typography>
                        <Typography sx={{ fontSize: 12, color: T.ink3 }}>{[r.careOf, r.gender, r.dob && `${ageOf(r.dob, r.checkedInAt)} yrs`].filter(Boolean).join(' · ')}</Typography>
                    </Box>
                )
            },
            { id: 'nationality', label: 'Nationality', value: (r) => r.nationality || 'Indian' },
            { id: 'id', label: 'Photo ID', value: (r) => idLabel(r), render: (r) => <Typography sx={{ fontSize: 12.5 }}>{idLabel(r) || '—'}{r.hasIdFront ? '' : <Box component="span" sx={{ color: T.ink3 }}> · no photo</Box>}</Typography> },
            { id: 'roomNumber', label: 'Room', value: (r) => r.roomNumber },
            { id: 'travel', label: 'From → to', value: (r) => `${r.comingFrom || ''} ${r.goingTo || ''}`, render: (r) => <Typography sx={{ fontSize: 12.5 }}>{r.comingFrom || '—'} → {r.goingTo || '—'}</Typography> },
            { id: 'checkedOutAt', label: 'Left', value: (r) => r.checkedOutAt, render: (r) => <Typography sx={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>{r.checkedOutAt ? stamp(r.checkedOutAt) : 'In house'}</Typography> },
            { id: 'missing', label: 'Register', value: (r) => r.missing.length, render: (r) => (r.missing.length ? <Pill tone="warning" label={`Missing ${r.missing.length}`} /> : <Pill tone="success" label="Complete" />) }
        ],
        []
    );

    const fcColumns = useMemo(
        () => [
            { id: 'name', label: 'Guest', value: (r) => r.name, render: (r) => <Box><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{r.name}</Typography><Typography sx={{ fontSize: 12, color: T.ink3 }}>{r.nationality} · {r.foreignDetails?.passportNo || 'no passport no.'}</Typography></Box> },
            { id: 'checkIn', label: 'Arrival', value: (r) => r.checkedInAt || r.checkIn, render: (r) => (r.checkedInAt ? stamp(r.checkedInAt) : `${formatDate(r.checkIn)} (expected)`) },
            { id: 'due', label: 'File by', value: (r) => r.checkedInAt, render: (r) => {
                if (r.formCSubmittedAt) return <Pill tone="success" label={`Filed${r.formCRef ? ` · ${r.formCRef}` : ''}`} />;
                if (!r.checkedInAt) return <Typography sx={{ fontSize: 12.5, color: T.ink3 }}>After arrival</Typography>;
                const by = new Date(new Date(r.checkedInAt).getTime() + 24 * 3600 * 1000);
                return <Pill tone={by < new Date() ? 'error' : 'warning'} label={`${by < new Date() ? 'Overdue since' : 'By'} ${stamp(by)}`} />;
            } },
            { id: 'missing', label: 'Details', value: (r) => r.missing.length, render: (r) => (r.missing.length ? <Typography sx={{ fontSize: 12.5, color: '#9A6A12' }}>Missing {r.missing.join(', ')}</Typography> : <Typography sx={{ fontSize: 12.5, color: T.success }}>Ready to file</Typography>) }
        ],
        []
    );

    const copy = async (r) => {
        try {
            await navigator.clipboard.writeText(formCText(r));
            toast.success('Form C details copied');
        } catch (e) {
            toast.error('Could not copy');
        }
    };

    const markFiled = async () => {
        try {
            toast.success(await api.markFormC(filing.id, { ref: ref.trim() || undefined }));
            setFiling(null);
            setRef('');
            fc.reload();
        } catch (e) {
            toast.error(e.message);
        }
    };

    const dateField = { width: 150, '& .MuiOutlinedInput-root': { height: 32 } };

    return (
        <>
            <PageHeader
                title="Guest register"
                subtitle="The register the police ask to see, and Form C for foreign guests"
                actions={tab === 'register' && <Button variant="outlined" color="inherit" startIcon={<PrintOutlinedIcon />} disabled={!valid} onClick={() => window.open(`/print/register?from=${from}&to=${to}`, '_blank')}>Print register</Button>}
            />
            <Tabs value={tab} onChange={(_, v) => setParams(v === 'formc' ? { tab: 'formc' } : {})} sx={{ mb: 2, borderBottom: `1px solid ${T.line}` }}>
                <Tab value="register" label="Register" />
                <Tab value="formc" label="Form C (foreign guests)" />
            </Tabs>

            {tab === 'register' ? (
                <>
                    <Card sx={{ mb: 2, px: 1.5, py: 1, display: 'flex', gap: 1.25, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: 12.5, color: T.ink2, fontWeight: 500 }}>Arrivals from</Typography>
                        <TextField type="date" value={from} onChange={(e) => setFrom(e.target.value)} sx={dateField} inputProps={{ 'aria-label': 'From' }} />
                        <Typography sx={{ fontSize: 12.5, color: T.ink2 }}>to</Typography>
                        <TextField type="date" value={to} onChange={(e) => setTo(e.target.value)} sx={dateField} inputProps={{ 'aria-label': 'To' }} />
                    </Card>
                    <DataTable
                        columns={regColumns}
                        rows={reg.data}
                        loading={reg.loading}
                        searchPlaceholder="Search name or phone"
                        exportName="guest-register"
                        onRowClick={(r) => navigate(`/hotel/bookings/${r.id}`)}
                        emptyText="No guests checked in during these dates."
                    />
                </>
            ) : (
                <>
                    <Alert severity="info" sx={{ mb: 2 }} action={<Button color="inherit" size="small" endIcon={<OpenInNewIcon />} href={FRRO_URL} target="_blank" rel="noopener">FRRO site</Button>}>
                        Every foreign guest must be reported on Form C within 24 hours of arrival. Copy a guest's details, file them on the FRRO site, then mark them as filed here.
                    </Alert>
                    <DataTable
                        columns={fcColumns}
                        rows={fc.data}
                        loading={fc.loading}
                        searchPlaceholder="Search name"
                        exportName="form-c"
                        toolbarExtra={<Button size="small" onClick={() => setShowAll((s) => !s)}>{showAll ? 'Show only not filed' : 'Show filed too'}</Button>}
                        actions={[
                            { title: 'Copy details for Form C', icon: <ContentCopyIcon fontSize="small" />, onClick: copy },
                            { title: 'Open booking', icon: <OpenInNewIcon fontSize="small" />, onClick: (r) => navigate(`/hotel/bookings/${r.id}`) },
                            { title: 'Mark as filed', icon: <Typography sx={{ fontSize: 12, fontWeight: 650, color: T.brand }}>Filed</Typography>, onClick: (r) => setFiling(r), hidden: (r) => Boolean(r.formCSubmittedAt) }
                        ]}
                        emptyText={showAll ? 'No foreign guests yet.' : 'Nothing to file. Every foreign guest is reported.'}
                    />
                </>
            )}

            <Dialog open={Boolean(filing)} onClose={() => setFiling(null)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontSize: 16, fontWeight: 650 }}>Mark Form C as filed</DialogTitle>
                <DialogContent>
                    <Typography sx={{ fontSize: 13, color: T.ink2, mb: 2 }}>{filing?.name}. Enter the application number the FRRO site gave you, if any.</Typography>
                    <TextField label="FRRO application number" value={ref} onChange={(e) => setRef(e.target.value)} fullWidth />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button color="inherit" onClick={() => setFiling(null)}>Cancel</Button>
                    <Button variant="contained" onClick={markFiled}>Mark filed</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default GuestRegister;
