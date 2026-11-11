import { useMemo, useRef, useState } from 'react';
import { Alert, Box, Button, Card, CircularProgress, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Typography } from '@mui/material';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import useHotel from 'hooks/useHotel';
import { useToast } from 'context/Toast';
import PageHeader from 'components/PageHeader';
import { Pill } from 'components/StatusChip';
import { T } from 'components/Theme';
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

const Step = ({ n, title, done, children }) => (
    <Box sx={{ display: 'flex', gap: 1.5, py: 2, borderTop: `1px solid ${T.line}`, '&:first-of-type': { borderTop: 0, pt: 0 } }}>
        <Box sx={{ width: 22, height: 22, flexShrink: 0, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11.5, fontWeight: 700, border: `1.5px solid ${done ? T.brand : T.line2}`, bgcolor: done ? T.brand : T.panel, color: done ? '#fff' : T.ink2 }}>{n}</Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 13.5, fontWeight: 650, mb: 0.75 }}>{title}</Typography>
            {children}
        </Box>
    </Box>
);

const tableBox = { overflowX: 'auto', border: `1px solid ${T.line}`, borderRadius: '6px' };

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
                <Box sx={{ px: 1.5, borderBottom: `1px solid ${T.line}` }}>
                    <Tabs value={kind} onChange={(_, v) => { setKind(v); reset(); }} variant="scrollable" aria-label="What to import">
                        {Object.entries(KINDS).map(([id, v]) => <Tab key={id} value={id} label={v.label} />)}
                    </Tabs>
                </Box>
                <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
                    <Box sx={{ mb: 2.5, p: 1.5, bgcolor: T.subtle, border: `1px solid ${T.line}`, borderRadius: '6px' }}>
                        <Typography sx={{ fontSize: 13 }}>{k.help}</Typography>
                        <Typography sx={{ fontSize: 12.5, color: T.ink2, mt: 0.5 }}>
                            Columns: <Box component="span" sx={{ fontWeight: 600, color: T.ink }}>{k.columns}</Box>. Names are matched loosely and the order doesn't matter.
                        </Typography>
                    </Box>

                    <Step n={1} title="Get the template" done={Boolean(file || report)}>
                        <Button variant="outlined" color="inherit" startIcon={<FileDownloadOutlinedIcon />} onClick={() => downloadText(`yhm-${kind}-template.csv`, k.sample)}>Download {k.label.toLowerCase()} template</Button>
                    </Step>

                    <Step n={2} title="Choose your CSV file" done={Boolean(file || report)}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Button variant={file ? 'outlined' : 'contained'} color={file ? 'inherit' : 'primary'} startIcon={<FileUploadOutlinedIcon />} onClick={() => input.current.click()}>{file ? 'Choose another file' : 'Choose CSV file'}</Button>
                            <input ref={input} type="file" accept=".csv,.txt,.tsv,text/csv" hidden onChange={load} data-testid="csv-input" />
                            <Typography sx={{ fontSize: 12, color: T.ink3 }}>Using Excel? Choose File → Save As → CSV. Nothing is saved until you press Import.</Typography>
                        </Box>
                        {error && <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setError('')}>{error}</Alert>}

                        {file && !report?.committed && (
                            <Box sx={{ mt: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                    <InsertDriveFileOutlinedIcon sx={{ fontSize: 18, color: T.ink3 }} />
                                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{file.name}</Typography>
                                    <Pill dot={false} label={`${file.rows.length} row${file.rows.length > 1 ? 's' : ''}`} />
                                    <Box sx={{ flexGrow: 1 }} />
                                    <Button size="small" onClick={reset} color="inherit">Remove</Button>
                                </Box>
                                <Box sx={tableBox}>
                                    <Table size="small">
                                        <TableHead><TableRow>{file.headers.map((h) => <TableCell key={h}>{h}</TableCell>)}</TableRow></TableHead>
                                        <TableBody>{file.rows.slice(0, 5).map((r, i) => <TableRow key={i}>{file.headers.map((h) => <TableCell key={h}>{r[h]}</TableCell>)}</TableRow>)}</TableBody>
                                    </Table>
                                </Box>
                                {file.rows.length > 5 && <Typography sx={{ fontSize: 12, color: T.ink3, mt: 0.5 }}>Showing the first 5 rows.</Typography>}
                            </Box>
                        )}
                    </Step>

                    <Step n={3} title="Check and import" done={Boolean(report?.committed)}>
                        {!file && !report && <Typography sx={{ fontSize: 12.5, color: T.ink3 }}>Choose a file first. It is checked before anything is saved.</Typography>}
                        {file && !report && (
                            <Button variant="contained" onClick={() => run(false)} disabled={busy} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}>Check file</Button>
                        )}
                        {report && (
                            <Box>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <Pill tone="success" label={`${report.valid} ready`} />
                                    {report.invalid > 0 && <Pill tone="error" label={`${report.invalid} with problems`} />}
                                    {report.skipped > 0 && <Pill tone="warning" label={`${report.skipped} skipped (already there)`} />}
                                    {report.committed && <Pill tone="brand" label="Imported" />}
                                </Box>

                                {problems.length > 0 && (
                                    <Box sx={{ ...tableBox, mt: 1.5 }}>
                                        <Table size="small">
                                            <TableHead><TableRow><TableCell sx={{ width: 70 }}>Row</TableCell><TableCell sx={{ width: 110 }}>Result</TableCell><TableCell>Reason</TableCell></TableRow></TableHead>
                                            <TableBody>
                                                {problems.map((r) => (
                                                    <TableRow key={r.row}>
                                                        <TableCell className="num">{r.row}</TableCell>
                                                        <TableCell><Pill tone={COLOR[r.status]} label={r.status === 'error' ? 'Problem' : 'Skipped'} /></TableCell>
                                                        <TableCell sx={{ color: T.ink2 }}>{r.message}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </Box>
                                )}

                                {!report.committed && report.valid > 0 && (
                                    <Box sx={{ mt: 1.5 }}>
                                        {report.invalid > 0 && <Alert severity="warning" sx={{ mb: 1.5 }}>The rows with problems will be left out. Row numbers match your file, counting the header as row 1. Fix them and import again, or import the good rows now.</Alert>}
                                        <Button variant="contained" onClick={() => run(true)} disabled={busy} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}>Import {report.valid} {k.label.toLowerCase()}</Button>
                                    </Box>
                                )}
                                {!report.committed && report.valid === 0 && <Alert severity="info" sx={{ mt: 1.5 }}>Nothing in this file can be imported yet. Fix the problems above and choose the file again.</Alert>}
                            </Box>
                        )}
                    </Step>
                </Box>
            </Card>
        </>
    );
};

export default Import;
