import { useCallback, useState } from 'react';
import { Alert, Autocomplete, Box, Button, Grid, MenuItem, TextField, Typography } from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import QrScanner from './QrScanner';
import { T } from './Theme';
import { GENDERS, ID_TYPES, PURPOSES, isIndian } from 'utils/constants';
import { readAadhaarQr } from 'utils/aadhaarQr';

const NATIONALITIES = ['Indian', 'American', 'Australian', 'Bangladeshi', 'British', 'Canadian', 'Chinese', 'Dutch', 'French', 'German', 'Israeli', 'Italian', 'Japanese', 'Korean', 'Malaysian', 'Nepali', 'Russian', 'Singaporean', 'Spanish', 'Sri Lankan', 'Swiss', 'Thai'];

// empty form values from a booking / guest record
export const guestValues = (g = {}) => ({
    name: g.name || g.customerName || '',
    phone: g.phone || g.customerPhone || '',
    email: g.email ?? g.customerEmail ?? '',
    nationality: g.nationality || 'Indian',
    gender: g.gender || '',
    dob: g.dob || '',
    careOf: g.careOf || '',
    address: g.address || g.customerAddress || '',
    idType: g.idType || '',
    idNumber: g.idNumber || '',
    comingFrom: g.comingFrom || '',
    goingTo: g.goingTo || '',
    purpose: g.purpose || '',
    otherGuests: g.otherGuests || '',
    foreignDetails: g.foreignDetails || {}
});

const Section = ({ children }) => <Typography sx={{ fontSize: 11.5, fontWeight: 650, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.ink3, mt: 1 }}>{children}</Typography>;

// The register fields; used by the front desk and by the guest's own online check-in page.
const GuestFields = ({ values, set, photos, showEmail = false, guestFacing = false }) => {
    const [scanning, setScanning] = useState(false);
    const [scanNote, setScanNote] = useState(null);
    const foreign = !isIndian(values.nationality);
    const f = values.foreignDetails || {};
    const setF = (k, v) => set('foreignDetails', { ...f, [k]: v });

    const onScan = useCallback(
        (text) => {
            setScanning(false);
            try {
                const a = readAadhaarQr(text);
                if (a.name) set('name', a.name);
                if (a.dob) set('dob', a.dob);
                if (a.gender) set('gender', a.gender);
                if (a.careOf) set('careOf', a.careOf);
                if (a.address) set('address', a.address);
                set('nationality', 'Indian');
                set('idType', 'AADHAAR');
                if (a.idLast4) set('idNumber', `XXXX XXXX ${a.idLast4}`);
                setScanNote({ severity: 'success', text: `Read from Aadhaar: ${a.name}${a.dobYearOnly ? ' (card shows only the birth year)' : ''}. Check the details below.` });
            } catch (e) {
                setScanNote({ severity: 'error', text: e.message });
            }
        },
        [set]
    );

    const field = (name, label, props = {}) => (
        <TextField label={label} value={values[name] ?? ''} onChange={(e) => set(name, e.target.value)} fullWidth {...props} />
    );

    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <Box sx={{ p: 1.5, border: `1px dashed ${T.line2}`, borderRadius: '6px', bgcolor: T.subtle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
                    <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{guestFacing ? 'Have your Aadhaar card?' : 'Indian guest with Aadhaar?'}</Typography>
                        <Typography sx={{ fontSize: 12, color: T.ink2 }}>Scan the QR code on the card to fill name, date of birth and address.</Typography>
                    </Box>
                    <Button variant="outlined" startIcon={<QrCodeScannerIcon />} onClick={() => setScanning(true)}>Scan Aadhaar QR</Button>
                </Box>
                {scanNote && <Alert severity={scanNote.severity} sx={{ mt: 1 }} onClose={() => setScanNote(null)}>{scanNote.text}</Alert>}
            </Grid>

            <Grid item xs={12}><Section>Guest</Section></Grid>
            <Grid item xs={12} sm={7}>{field('name', 'Full name', { required: true })}</Grid>
            <Grid item xs={12} sm={5}>{field('phone', 'Mobile number', { type: 'tel' })}</Grid>
            {showEmail && <Grid item xs={12}>{field('email', 'Email', { type: 'email' })}</Grid>}
            <Grid item xs={12} sm={6}>
                <Autocomplete
                    freeSolo
                    options={NATIONALITIES}
                    value={values.nationality || null}
                    inputValue={values.nationality || ''}
                    onChange={(_, v) => set('nationality', v || '')}
                    onInputChange={(_, v) => set('nationality', v)}
                    renderInput={(p) => <TextField {...p} label="Nationality" />}
                />
            </Grid>
            <Grid item xs={6} sm={3}>
                <TextField select label="Gender" value={values.gender} onChange={(e) => set('gender', e.target.value)} fullWidth>
                    <MenuItem value=""><em>—</em></MenuItem>
                    {GENDERS.map((g) => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={6} sm={3}>{field('dob', 'Date of birth', { type: 'date', InputLabelProps: { shrink: true } })}</Grid>
            <Grid item xs={12}>{field('careOf', "Father's / husband's name", { placeholder: 'e.g. S/O Ram Sharma' })}</Grid>
            <Grid item xs={12}>{field('address', foreign ? 'Address in India (if any)' : 'Home address', { multiline: true, minRows: 2 })}</Grid>

            <Grid item xs={12}><Section>Photo ID</Section></Grid>
            <Grid item xs={12} sm={5}>
                <TextField select label="ID type" value={values.idType} onChange={(e) => set('idType', e.target.value)} fullWidth>
                    <MenuItem value=""><em>—</em></MenuItem>
                    {ID_TYPES.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} sm={7}>
                {field('idNumber', 'ID number', { helperText: values.idType === 'AADHAAR' ? 'Only the last 4 digits are kept, as UIDAI requires' : undefined })}
            </Grid>
            {photos && <Grid item xs={12}>{photos}</Grid>}

            {foreign && (
                <>
                    <Grid item xs={12}>
                        <Section>Passport and visa (Form C)</Section>
                        <Typography sx={{ fontSize: 12, color: T.ink2, mt: 0.5 }}>Foreign guests must be reported on Form C within 24 hours of arrival.</Typography>
                    </Grid>
                    {[
                        ['passportNo', 'Passport number', 6],
                        ['passportIssuePlace', 'Passport issued at', 6],
                        ['passportIssueDate', 'Passport issue date', 6, 'date'],
                        ['passportExpiry', 'Passport valid till', 6, 'date'],
                        ['visaNo', 'Visa number', 6],
                        ['visaType', 'Visa type', 6],
                        ['visaIssueDate', 'Visa issue date', 6, 'date'],
                        ['visaExpiry', 'Visa valid till', 6, 'date'],
                        ['arrivalInIndia', 'Arrived in India on', 6, 'date'],
                        ['portOfArrival', 'Port of arrival', 6],
                        ['arrivedFromCountry', 'Arrived from (country)', 6],
                        ['nextDestinationCountry', 'Next destination (country)', 6],
                        ['addressAbroad', 'Address in home country', 12]
                    ].map(([k, label, w, type]) => (
                        <Grid item xs={12} sm={w} key={k}>
                            <TextField label={label} value={f[k] || ''} onChange={(e) => setF(k, e.target.value)} type={type || 'text'} InputLabelProps={type === 'date' ? { shrink: true } : undefined} fullWidth />
                        </Grid>
                    ))}
                </>
            )}

            <Grid item xs={12}><Section>Travel</Section></Grid>
            <Grid item xs={12} sm={6}>{field('comingFrom', 'Coming from (city)')}</Grid>
            <Grid item xs={12} sm={6}>{field('goingTo', 'Going to next (city)')}</Grid>
            <Grid item xs={12} sm={6}>
                <TextField select label="Purpose of visit" value={values.purpose} onChange={(e) => set('purpose', e.target.value)} fullWidth>
                    <MenuItem value=""><em>—</em></MenuItem>
                    {PURPOSES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12}>{field('otherGuests', 'Others staying in the room', { multiline: true, minRows: 2, placeholder: 'Name, age and relation, one per line' })}</Grid>

            <QrScanner open={scanning} onClose={() => setScanning(false)} onResult={onScan} title="Scan the Aadhaar QR code" hint="Hold the card flat. The QR code is on the back of the card, or on the right of an e-Aadhaar print." />
        </Grid>
    );
};

export default GuestFields;
