import { useMemo, useState } from 'react';
import { Box, Card, CardContent, Chip, Grid, IconButton, TextField, Typography } from '@mui/material';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import UndoIcon from '@mui/icons-material/Undo';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import * as Yup from 'yup';
import useHotel from 'hooks/useHotel';
import useAsync from 'hooks/useAsync';
import useDialogState from 'hooks/useDialogState';
import { useToast } from 'context/Toast';
import ConfirmDialog from 'components/ConfirmDialog';
import DataTable from 'components/DataTable';
import FormDialog from 'components/FormDialog';
import PageHeader from 'components/PageHeader';
import { formatDate, inr, thisMonth, todayISO } from 'utils/format';

const METHODS = [{ id: 'CASH', name: 'Cash' }, { id: 'BANK', name: 'Bank transfer' }, { id: 'UPI', name: 'UPI' }, { id: 'CHEQUE', name: 'Cheque' }, { id: 'OTHER', name: 'Other' }];
const schema = Yup.object({
    baseSalary: Yup.number().typeError('Enter an amount').min(0).required('Required'),
    bonus: Yup.number().typeError('Enter an amount').min(0),
    deductions: Yup.number().typeError('Enter an amount').min(0),
    paidOn: Yup.string().required('Pick a date')
});

const shiftMonth = (m, n) => {
    const [y, mo] = m.split('-').map(Number);
    const d = new Date(Date.UTC(y, mo - 1 + n, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};
const monthLabel = (m) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });

const Payroll = () => {
    const { api } = useHotel();
    const toast = useToast();
    const [month, setMonth] = useState(thisMonth());
    const dialog = useDialogState();
    const [undo, setUndo] = useState(null);
    const list = useAsync(() => api.payroll.list(month), { deps: [month] });

    const totals = useMemo(() => {
        const paid = list.data.filter((r) => r.paymentId);
        return {
            paidAmount: paid.reduce((s, r) => s + r.netPaid, 0),
            pendingAmount: list.data.filter((r) => !r.paymentId && r.active).reduce((s, r) => s + r.monthlySalary, 0),
            paidCount: paid.length,
            pendingCount: list.data.filter((r) => !r.paymentId && r.active).length
        };
    }, [list.data]);

    const columns = useMemo(() => [
        { id: 'name', label: 'Staff', render: (r) => <Box><Typography variant="body2" sx={{ fontWeight: 600 }}>{r.name}</Typography><Typography variant="caption" color="text.secondary">{r.designation}</Typography></Box>, value: (r) => r.name },
        { id: 'salary', label: 'Salary', value: (r) => (r.paymentId ? r.baseSalary : r.monthlySalary), render: (r) => inr(r.paymentId ? r.baseSalary : r.monthlySalary) },
        { id: 'bonus', label: 'Bonus', value: (r) => r.bonus || 0, render: (r) => (r.paymentId ? inr(r.bonus) : '-') },
        { id: 'deductions', label: 'Deductions', value: (r) => r.deductions || 0, render: (r) => (r.paymentId ? inr(r.deductions) : '-') },
        { id: 'netPaid', label: 'Net paid', value: (r) => r.netPaid || 0, render: (r) => (r.paymentId ? <strong>{inr(r.netPaid)}</strong> : '-') },
        { id: 'status', label: 'Status', value: (r) => (r.paymentId ? 'Paid' : 'Pending'), render: (r) => (r.paymentId ? <Chip size="small" color="success" variant="outlined" label={`Paid ${formatDate(r.paidOn).slice(0, 6)} · ${r.method.toLowerCase()}`} /> : <Chip size="small" color="warning" variant="outlined" label="Pending" />) }
    ], []);

    const fields = [
        { name: 'baseSalary', label: 'Salary for the month (₹)', type: 'number', helperText: 'Change it if they worked part of the month' },
        { name: 'bonus', label: 'Bonus (₹)', type: 'number', half: true },
        { name: 'deductions', label: 'Deductions / advance recovered (₹)', type: 'number', half: true },
        { name: 'method', label: 'Paid by', type: 'select', required: true, options: METHODS, half: true },
        { name: 'paidOn', label: 'Paid on', type: 'date', half: true },
        { name: 'note', label: 'Note', type: 'text' }
    ];

    const save = async (v) => {
        toast.success(await api.payroll.pay({ staffId: dialog.editing.staffId, month, baseSalary: Number(v.baseSalary), bonus: Number(v.bonus || 0), deductions: Number(v.deductions || 0), method: v.method, paidOn: v.paidOn, note: v.note }));
        dialog.close();
        list.reload();
    };

    const row = dialog.editing;

    return (
        <>
            <PageHeader title="Payroll" subtitle="Record each month's salary as it is paid"
                actions={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month"><ChevronLeftIcon /></IconButton>
                        <TextField type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} sx={{ width: 170 }} inputProps={{ 'aria-label': 'Month' }} />
                        <IconButton onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month"><ChevronRightIcon /></IconButton>
                    </Box>
                } />
            <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                <Grid item xs={12} sm={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Paid in {monthLabel(month)}</Typography><Typography variant="h5">{inr(totals.paidAmount)}</Typography><Typography variant="caption" color="text.secondary">{totals.paidCount} staff</Typography></CardContent></Card></Grid>
                <Grid item xs={12} sm={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Still to pay</Typography><Typography variant="h5">{inr(totals.pendingAmount)}</Typography><Typography variant="caption" color="text.secondary">{totals.pendingCount} staff</Typography></CardContent></Card></Grid>
                <Grid item xs={12} sm={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Whole payroll</Typography><Typography variant="h5">{inr(totals.paidAmount + totals.pendingAmount)}</Typography><Typography variant="caption" color="text.secondary">paid + pending</Typography></CardContent></Card></Grid>
            </Grid>
            <DataTable columns={columns} rows={list.data} loading={list.loading} rowKey="staffId" searchPlaceholder="Search staff…" exportName={`payroll-${month}`} emptyText="Add staff first, then record their salary here."
                actions={[
                    { title: (r) => (r.paymentId ? 'Edit payment' : 'Record salary'), icon: <PaymentsOutlinedIcon fontSize="small" />, onClick: dialog.openEdit },
                    { title: 'Undo payment', icon: <UndoIcon fontSize="small" />, onClick: setUndo, hidden: (r) => !r.paymentId }
                ]} />
            <FormDialog open={dialog.open} title={row ? `${row.name} · ${monthLabel(month)}` : ''} subtitle={row ? `Usual salary ${inr(row.monthlySalary)}` : undefined} fields={fields} initialValues={row ? { baseSalary: row.paymentId ? row.baseSalary : row.monthlySalary, bonus: row.bonus || 0, deductions: row.deductions || 0, method: row.method || 'CASH', paidOn: row.paidOn || todayISO(), note: row.note || '' } : {}} validationSchema={schema} onSubmit={save} onClose={dialog.close} submitLabel="Save payment" />
            <ConfirmDialog open={Boolean(undo)} title="Undo this salary payment?" confirmLabel="Undo payment" color="error" onClose={() => setUndo(null)} onConfirm={async () => { try { toast.success(await api.payroll.remove(undo.paymentId)); setUndo(null); list.reload(); } catch (e) { toast.error(e.message); } }}>
                {undo && <>{undo.name}'s payment of {inr(undo.netPaid)} for {monthLabel(month)} will be removed and shown as pending.</>}
            </ConfirmDialog>
        </>
    );
};

export default Payroll;
