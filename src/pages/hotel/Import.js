import { useMemo, useRef, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Typography } from '@mui/material';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import useHotel from 'hooks/useHotel';
import { useToast } from 'context/Toast';
import PageHeader from 'components/PageHeader';
import { downloadText, parseCsv } from 'utils/csv';

const KINDS = {
    rooms: {
        label: 'Rooms',
        help: 'One row per room. The room type must already exist under Room types & rates.',
        columns: 'Room Number, Room Type, Floor, Notes',
        sample: 'Room Number,Room Type,Floor,Notes\n101,Deluxe,1,Garden view\n102,Deluxe,1,\n201,Suite,2,Corner room\n'
    },
    guests: {
        label: 'Guests',
        help: 'People and companies you have hosted. Guests whose phone number already exists are skipped.',
        columns: 'Name, Phone, Email, Company, GSTIN, Address, ID Type, ID Number, Notes',
        sample: 'Name,Phone,Email,Company,GSTIN,Address,ID Type,ID Number,Notes\nAnil Kapoor,9811111111,anil@example.com,,,,Aadhaar,,\nKapoor Traders,9822222222,,Kapoor Traders Pvt Ltd,29ABCDE1234F1Z5,"12 MG Road, Bengaluru",,,\n'
    },
    staff: {
        label: 'Staff',
        help: 'Your team, with their monthly salary.',
        columns: 'Name, Designation, Department, Phone, Email, Monthly Salary, Join Date, Active',
        sample: 'Name,Designation,Department,Phone,Email,Monthly Salary,Join Date,Active\nSita Devi,Receptionist,Front desk,9800000001,,18000,01/04/2024,yes\nMohan,Cook,Kitchen,9800000002,,22000,15/08/2023,yes\n'
    },
    bookings: {
        label: 'Bookings',
        help: 'Past, current or future stays. Rooms must exist, and a room cannot be booked twice on the same night. Rate is the price per night; leave it empty to use your current prices. Dates can be 21/10/2026 or 2026-10-21.',
        columns: 'Guest, Phone, Room, Check In, Check Out, Adults, Children, Status, Rate, Paid, Source, Notes',
        sample: 'Guest,Phone,Room,Check In,Check Out,Adults,Children,Status,Rate,Paid,Source,Notes\nAnil Kapoor,9811111111,101,05/10/2026,08/10/2026,2,0,Checked out,3200,10080,Direct,\nNeha Rao,9833333333,201,02/11/2026,04/11/2026,2,1,Confirmed,,2000,Phone,Needs extra bed\n'
    }
};

const COLOR = { ok: 'success', error: 'error', skipped: 'warning' };

const Import = () => {
    const { api } = useHotel();
    const toast = useToast();
    const input = useRef(null);
    const [kind, setKind] = useState('rooms');
    const [file, setFile] = useState(null); // { name, rows }
    const [report, setReport] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const k = KINDS[kind];

    const reset = () => { setFile(null); setReport(null); setError(''); };

    const load = async (e) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f) return;
        reset();
        if (!/\.(csv|txt|tsv)$/i.test(f.name)) return setError('Please choose a CSV file. In Excel use File → Save As → CSV.');
        try {
            const { headers, rows } = parseCsv(await f.text());
            if (!headers.length || !rows.length) return setError('That file has no rows.');
            setFile({ name: f.name, headers, rows });
        } catch (err) {
            setError('Could not read that file.');
        }
    };

    const run = async (commit) => {
        setBusy(true);
        setError('');
        try {
            const result = await api.import(kind, file.rows, commit ? { commit: true, skipInvalid: true } : {});
            setReport(result);
            if (commit) { toast.success(`Imported ${result.valid} ${k.label.toLowerCase()}`); setFile(null); }
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    const problems = useMemo(() => (report?.results || []).filter((r) => r.status !== 'ok' && r.status !== 'empty'), [report]);

    return (
        <>
            <PageHeader title="Import data" subtitle="Bring your existing rooms, guests, staff and bookings from a spreadsheet" />
            <Card>
                <Tabs value={kind} onChange={(_, v) => { setKind(v); reset(); }} variant="scrollable" sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
                    {Object.entries(KINDS).map(([id, v]) => <Tab key={id} value={id} label={v.label} />)}
                </Tabs>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Typography sx={{ mb: 1 }}>{k.help}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Columns: <b>{k.columns}</b>. Column names are matched loosely, and the order does not matter.</Typography>
                    <Stack direction="row" spacing={1.5} flexWrap="wrap" rowGap={1.5}>
                        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => downloadText(`yhm-${kind}-template.csv`, k.sample)}>Download template</Button>
                        <Button variant="contained" startIcon={<FileUploadOutlinedIcon />} onClick={() => input.current.click()}>Choose CSV file</Button>
                        <input ref={input} type="file" accept=".csv,.txt,.tsv,text/csv" hidden onChange={load} data-testid="csv-input" />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Using Excel? Choose File → Save As → CSV. Nothing is saved until you press Import.</Typography>

                    {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>{error}</Alert>}

                    {file && !report?.committed && (
                        <Box sx={{ mt: 3 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" rowGap={1}>
                                <Typography variant="h6">{file.name}</Typography>
                                <Chip size="small" label={`${file.rows.length} row${file.rows.length > 1 ? 's' : ''}`} />
                                <Box sx={{ flexGrow: 1 }} />
                                <Button onClick={reset} color="inherit">Remove</Button>
                                <Button variant="contained" onClick={() => run(false)} disabled={busy} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}>Check file</Button>
                            </Stack>
                            <Box sx={{ overflowX: 'auto', mt: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                                <Table size="small">
                                    <TableHead><TableRow>{file.headers.map((h) => <TableCell key={h}>{h}</TableCell>)}</TableRow></TableHead>
                                    <TableBody>{file.rows.slice(0, 5).map((r, i) => <TableRow key={i}>{file.headers.map((h) => <TableCell key={h}>{r[h]}</TableCell>)}</TableRow>)}</TableBody>
                                </Table>
                            </Box>
                            {file.rows.length > 5 && <Typography variant="caption" color="text.secondary">Showing the first 5 rows.</Typography>}
                        </Box>
                    )}

                    {report && (
                        <Box sx={{ mt: 3 }}>
                            <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1} alignItems="center">
                                <Chip color="success" label={`${report.valid} ready`} />
                                {report.invalid > 0 && <Chip color="error" label={`${report.invalid} with problems`} />}
                                {report.skipped > 0 && <Chip color="warning" label={`${report.skipped} skipped (already there)`} />}
                                {report.committed && <Chip color="primary" label="Imported" />}
                            </Stack>

                            {problems.length > 0 && (
                                <Box sx={{ mt: 2, overflowX: 'auto', border: 1, borderColor: 'divider', borderRadius: 2 }}>
                                    <Table size="small">
                                        <TableHead><TableRow><TableCell>Row</TableCell><TableCell>Result</TableCell><TableCell>Why</TableCell></TableRow></TableHead>
                                        <TableBody>{problems.map((r) => <TableRow key={r.row}><TableCell>{r.row}</TableCell><TableCell><Chip size="small" variant="outlined" color={COLOR[r.status]} label={r.status === 'error' ? 'Problem' : 'Skipped'} /></TableCell><TableCell>{r.message}</TableCell></TableRow>)}</TableBody>
                                    </Table>
                                </Box>
                            )}

                            {!report.committed && report.valid > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    {report.invalid > 0 && <Alert severity="warning" sx={{ mb: 1.5 }}>The rows with problems will be left out. Row numbers match your file, counting the header as row 1. Fix them and import again, or import the good rows now.</Alert>}
                                    <Button variant="contained" size="large" onClick={() => run(true)} disabled={busy} startIcon={busy ? <CircularProgress size={18} color="inherit" /> : null}>Import {report.valid} {k.label.toLowerCase()}</Button>
                                </Box>
                            )}
                            {!report.committed && report.valid === 0 && <Alert severity="info" sx={{ mt: 2 }}>Nothing in this file can be imported yet. Fix the problems above and choose the file again.</Alert>}
                        </Box>
                    )}
                </CardContent>
            </Card>
        </>
    );
};

export default Import;
