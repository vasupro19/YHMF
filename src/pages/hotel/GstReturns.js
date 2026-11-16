import { useState } from 'react';
import { Alert, Box, Button, Card, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Typography } from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import DataObjectIcon from '@mui/icons-material/DataObject';
import useHotel from 'hooks/useHotel';
import useAsync from 'hooks/useAsync';
import PageHeader from 'components/PageHeader';
import Panel, { KpiStrip } from 'components/Panel';
import { T } from 'components/Theme';
import { inr, todayISO } from 'utils/format';

const download = (name, content, type = 'text/csv') => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};
const csv = (head, rows) => [head, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
const prevMonth = () => {
    const [y, m] = todayISO().split('-').map(Number);
    return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
};

// the CSV layouts of the GST offline tool's sheets
const CSV = {
    b2b: (d) => csv(['GSTIN/UIN of Recipient', 'Receiver Name', 'Invoice Number', 'Invoice date', 'Invoice Value', 'Place Of Supply', 'Reverse Charge', 'Applicable % of Tax Rate', 'Invoice Type', 'E-Commerce GSTIN', 'Rate', 'Taxable Value', 'Cess Amount'], d.b2b.flatMap((i) => i.rates.map((r) => [i.ctin, i.name, i.inum, i.idt, i.val, i.pos, 'N', '', 'Regular B2B', '', r.rt, r.txval, 0]))),
    b2cs: (d) => csv(['Type', 'Place Of Supply', 'Applicable % of Tax Rate', 'Rate', 'Taxable Value', 'Cess Amount', 'E-Commerce GSTIN'], d.b2cs.map((r) => ['OE', d.pos, '', r.rt, r.txval, 0, ''])),
    hsn: (rows) => csv(['HSN', 'Description', 'UQC', 'Total Quantity', 'Total Value', 'Taxable Value', 'Integrated Tax Amount', 'Central Tax Amount', 'State/UT Tax Amount', 'Cess Amount', 'Rate'], rows.map((h) => [h.hsn_sc, h.desc, 'NA', 0, Math.round((h.txval + h.tax) * 100) / 100, h.txval, 0, h.camt, h.samt, 0, h.rt])),
    docs: (d) => csv(['Nature of Document', 'Sr. No. From', 'Sr. No. To', 'Total Number', 'Cancelled'], d.docs.map((x) => [x.series, x.from, x.to, x.total, x.cancelled]))
};

const SimpleTable = ({ head, rows, empty }) => (
    <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
            <TableHead><TableRow>{head.map((h, i) => <TableCell key={h} align={i >= head.length - 3 ? 'right' : 'left'}>{h}</TableCell>)}</TableRow></TableHead>
            <TableBody>
                {rows.length === 0 && <TableRow><TableCell colSpan={head.length} sx={{ color: T.ink3 }}>{empty}</TableCell></TableRow>}
                {rows.map((r, i) => <TableRow key={i} hover>{r.map((c, j) => <TableCell key={j} align={j >= head.length - 3 ? 'right' : 'left'} className={j >= head.length - 3 ? 'num' : undefined}>{c}</TableCell>)}</TableRow>)}
            </TableBody>
        </Table>
    </Box>
);

// GSTR-1 for a month, ready for the accountant: tables to check, CSVs for the offline tool, and the JSON upload file
const GstReturns = () => {
    const { api } = useHotel();
    const [month, setMonth] = useState(prevMonth());
    const [tab, setTab] = useState('b2b');
    const q = useAsync(() => api.gstr1(month), { initial: null, deps: [month] });
    const d = q.data;
    const tag = month.replace('-', '');

    return (
        <>
            <PageHeader
                title="GST returns"
                subtitle="GSTR-1 from your tax invoices: check it here, then download the files for your CA or the GST portal"
                actions={
                    d && (
                        <>
                            <Button variant="outlined" color="inherit" startIcon={<FileDownloadOutlinedIcon />} onClick={() => { download(`b2b_${tag}.csv`, CSV.b2b(d)); download(`b2cs_${tag}.csv`, CSV.b2cs(d)); download(`hsn_b2b_${tag}.csv`, CSV.hsn(d.hsnB2B)); download(`hsn_b2c_${tag}.csv`, CSV.hsn(d.hsnB2C)); download(`docs_${tag}.csv`, CSV.docs(d)); }}>CSV files</Button>
                            <Button variant="contained" startIcon={<DataObjectIcon />} onClick={() => download(`GSTR1_${d.gstin || 'GSTIN'}_${d.json.fp}.json`, JSON.stringify(d.json, null, 1), 'application/json')}>GSTR-1 JSON</Button>
                        </>
                    )
                }
            />
            <Card sx={{ mb: 2, px: 1.5, py: 1, display: 'flex', gap: 1.25, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography sx={{ fontSize: 12.5, color: T.ink2, fontWeight: 500 }}>Return period</Typography>
                <TextField type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} sx={{ width: 170, '& .MuiOutlinedInput-root': { height: 32 } }} inputProps={{ 'aria-label': 'Month' }} />
                <Typography sx={{ ml: 'auto', fontSize: 12.5, color: T.ink3 }}>{d?.gstin ? `GSTIN ${d.gstin}` : ''}</Typography>
            </Card>

            {d?.warnings?.map((w) => <Alert key={w} severity="warning" sx={{ mb: 1.5 }}>{w}</Alert>)}

            <KpiStrip
                loading={q.loading}
                items={[
                    { label: 'Tax invoices', value: d ? d.totals.invoices : '–', sub: d ? `${d.b2b.length} to businesses` : '' },
                    { label: 'Invoice value', value: d ? inr(d.totals.value) : '–' },
                    { label: 'Taxable value', value: d ? inr(d.totals.taxable) : '–' },
                    { label: 'CGST', value: d ? inr(d.totals.camt) : '–' },
                    { label: 'SGST', value: d ? inr(d.totals.samt) : '–' }
                ]}
            />

            {d && (
                <Panel padded={false} sx={{ mt: 2 }}>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ px: 1, borderBottom: `1px solid ${T.line}` }}>
                        <Tab value="b2b" label={`B2B (4A) · ${d.b2b.length}`} />
                        <Tab value="b2cs" label="B2C small (7)" />
                        <Tab value="hsn" label="HSN / SAC (12)" />
                        <Tab value="docs" label="Documents (13)" />
                    </Tabs>
                    {tab === 'b2b' && (
                        <SimpleTable
                            head={['Guest GSTIN', 'Name', 'Invoice', 'Date', 'Rate', 'Taxable', 'CGST + SGST', 'Invoice value']}
                            rows={d.b2b.flatMap((i) => i.rates.map((r, k) => [i.ctin, i.name, i.inum, i.idt, `${r.rt}%`, inr(r.txval), inr(r.camt + r.samt), k === 0 ? inr(i.val) : '']))}
                            empty="No invoices to guests with a GSTIN this month."
                        />
                    )}
                    {tab === 'b2cs' && <SimpleTable head={['Supply', 'Place of supply', 'Rate', 'Taxable', 'CGST', 'SGST']} rows={d.b2cs.map((r) => ['Intra-state', d.pos || '—', `${r.rt}%`, inr(r.txval), inr(r.camt), inr(r.samt)])} empty="No invoices to guests without a GSTIN this month." />}
                    {tab === 'hsn' && (
                        <SimpleTable
                            head={['For', 'SAC', 'Description', 'Rate', 'Taxable', 'CGST', 'SGST']}
                            rows={[...d.hsnB2B.map((h) => ['B2B', h.hsn_sc, h.desc, `${h.rt}%`, inr(h.txval), inr(h.camt), inr(h.samt)]), ...d.hsnB2C.map((h) => ['B2C', h.hsn_sc, h.desc, `${h.rt}%`, inr(h.txval), inr(h.camt), inr(h.samt)])]}
                            empty="Nothing to summarise this month."
                        />
                    )}
                    {tab === 'docs' && <SimpleTable head={['Document', 'From', 'To', 'Total', 'Cancelled']} rows={d.docs.map((x) => [x.series, x.from, x.to, x.total, x.cancelled])} empty="No invoices issued this month." />}
                </Panel>
            )}
            <Typography sx={{ mt: 2, fontSize: 12, color: T.ink3 }}>
                Hotel stays are taxed where the property is, so every invoice is intra-state (CGST + SGST). Ask your CA to review before filing; credit notes and amendments are not included.
            </Typography>
        </>
    );
};

export default GstReturns;
