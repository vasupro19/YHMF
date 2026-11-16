import { Box, Button, GlobalStyles, Typography } from '@mui/material';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import { useSearchParams } from 'react-router-dom';
import useHotel from 'hooks/useHotel';
import useAsync from 'hooks/useAsync';
import { GENDERS } from 'utils/constants';
import { formatDate } from 'utils/format';
import { ageOf, idLabel } from './GuestRegister';

const stamp = (v) => (v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');
const cell = { border: '1px solid #999', p: '4px 5px', verticalAlign: 'top', fontSize: 10.5, lineHeight: 1.35 };

// The guest register in the columns police stations ask for, on landscape A4.
const RegisterPrint = () => {
    const { api } = useHotel();
    const [params] = useSearchParams();
    const from = params.get('from');
    const to = params.get('to');
    const rows = useAsync(() => api.register({ from, to }), { deps: [from, to] });
    const settings = useAsync(() => api.settings.get(), { initial: null });
    const s = settings.data || {};

    return (
        <Box sx={{ bgcolor: '#fff', minHeight: '100vh', p: 3, color: '#111', '@media print': { p: 0 } }}>
            <GlobalStyles styles={{ '@page': { size: 'A4 landscape', margin: '10mm' } }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                    <Typography sx={{ fontSize: 18, fontWeight: 700 }}>{s.hotelName || 'Hotel'}: Guest register</Typography>
                    <Typography sx={{ fontSize: 12 }}>{s.address}{s.phone ? ` · ${s.phone}` : ''}{s.gstin ? ` · GSTIN ${s.gstin}` : ''}</Typography>
                    <Typography sx={{ fontSize: 12, mt: 0.5 }}>Arrivals from {formatDate(from)} to {formatDate(to)} · {rows.data.length} guest{rows.data.length === 1 ? '' : 's'}</Typography>
                </Box>
                <Button variant="contained" startIcon={<PrintOutlinedIcon />} onClick={() => window.print()} sx={{ '@media print': { display: 'none' } }}>Print / save as PDF</Button>
            </Box>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        {['S.No', 'Arrival date & time', "Name, father's / husband's name", 'Age / gender', 'Nationality', 'Address', 'Mobile', 'Photo ID', 'Coming from', 'Going to', 'Purpose', 'Room', 'Persons', 'Departure date & time', 'Signature'].map((h) => (
                            <Box component="th" key={h} sx={{ ...cell, bgcolor: '#eee', fontWeight: 700, textAlign: 'left' }}>{h}</Box>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.data.map((r, i) => (
                        <tr key={r.id}>
                            <Box component="td" sx={cell}>{i + 1}</Box>
                            <Box component="td" sx={{ ...cell, whiteSpace: 'nowrap' }}>{stamp(r.checkedInAt)}</Box>
                            <Box component="td" sx={cell}><b>{r.name}</b>{r.careOf ? <><br />{r.careOf}</> : null}{r.otherGuests ? <><br /><i>With: {r.otherGuests.replace(/\n/g, '; ')}</i></> : null}</Box>
                            <Box component="td" sx={cell}>{[r.dob ? ageOf(r.dob, r.checkedInAt) : '', GENDERS.find((g) => g.id === r.gender)?.name].filter((x) => x !== '' && x !== undefined).join(' / ')}</Box>
                            <Box component="td" sx={cell}>{r.nationality || 'Indian'}{r.foreign && r.foreignDetails?.passportNo ? <><br />PP {r.foreignDetails.passportNo}<br />Visa {r.foreignDetails.visaNo || '—'}</> : null}</Box>
                            <Box component="td" sx={{ ...cell, maxWidth: 180 }}>{r.address}</Box>
                            <Box component="td" sx={cell}>{r.phone}</Box>
                            <Box component="td" sx={cell}>{idLabel(r)}</Box>
                            <Box component="td" sx={cell}>{r.comingFrom}</Box>
                            <Box component="td" sx={cell}>{r.goingTo}</Box>
                            <Box component="td" sx={cell}>{r.purpose}</Box>
                            <Box component="td" sx={cell}>{r.roomNumber}</Box>
                            <Box component="td" sx={cell}>{r.adults + (r.children || 0)}</Box>
                            <Box component="td" sx={{ ...cell, whiteSpace: 'nowrap' }}>{stamp(r.checkedOutAt)}</Box>
                            <Box component="td" sx={{ ...cell, width: 70 }} />
                        </tr>
                    ))}
                </tbody>
            </Box>
            {!rows.loading && rows.data.length === 0 && <Typography sx={{ mt: 2, fontSize: 13 }}>No guests checked in during these dates.</Typography>}
        </Box>
    );
};

export default RegisterPrint;
