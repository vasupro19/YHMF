import { useMemo, useState } from 'react';
import { Box, Button, IconButton, TextField, Typography } from '@mui/material';
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
import { KpiStrip } from 'components/Panel';
import { Pill } from 'components/StatusChip';
import { T } from 'components/Theme';
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
const dash = <Box component="span" sx={{ color: T.ink3 }}>—</Box>;

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

    const columns = useMemo(
        () => [
            {
                id: 'name',
                label: 'Staff',
                value: (r) => r.name,
                render: (r) => (
                    <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{r.name}</Typography>
                        <Typography sx={{ fontSize: 12, color: T.ink3 }}>{r.designation}</Typography>
                    </Box>
                )
            },
            { id: 'salary', label: 'Salary', align: 'right', value: (r) => (r.paymentId ? r.baseSalary : r.monthlySalary), render: (r) => inr(r.paymentId ? r.baseSalary : r.monthlySalary) },
            { id: 'bonus', label: 'Bonus', align: 'right', value: (r) => r.bonus || 0, render: (r) => (r.paymentId ? inr(r.bonus) : dash) },
            { id: 'deductions', label: 'Deductions', align: 'right', value: (r) => r.deductions || 0, render: (r) => (r.paymentId ? inr(r.deductions) : dash) },
            { id: 'netPaid', label: 'Net paid', align: 'right', value: (r) => r.netPaid || 0, render: (r) => (r.paymentId ? <Box component="span" sx={{ fontWeight: 600 }}>{inr(r.netPaid)}</Box> : dash) },
            {
                id: 'status',
                label: 'Status',
                value: (r) => (r.paymentId ? 'Paid' : 'Pending'),
                render: (r) =>
                    r.paymentId ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Pill tone="success" label="Paid" />
                            <Typography sx={{ fontSize: 12, color: T.ink3, whiteSpace: 'nowrap' }}>{formatDate(r.paidOn).slice(0, 6)} · {METHODS.find((m) => m.id === r.method)?.name || r.method}</Typography>
                        </Box>
                    ) : (
                        <Pill tone="warning" label="Pending" />
                    )
            }
        ],
        []
    );

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
            <PageHeader
                title="Payroll"
                subtitle={`Salaries for ${monthLabel(month)}, recorded as they are paid`}
                actions={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid ${T.line2}`, borderRadius: '6px', height: 32, overflow: 'hidden', bgcolor: T.panel }}>
                            <IconButton size="small" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month" sx={{ borderRadius: 0, height: '100%' }}><ChevronLeftIcon fontSize="small" /></IconButton>
                            <Button color="inherit" onClick={() => setMonth(thisMonth())} sx={{ borderRadius: 0, minHeight: 30, borderLeft: `1px solid ${T.line2}`, borderRight: `1px solid ${T.line2}` }}>This month</Button>
                            <IconButton size="small" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month" sx={{ borderRadius: 0, height: '100%' }}><ChevronRightIcon fontSize="small" /></IconButton>
                        </Box>
                        <TextField type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} sx={{ width: 160, '& .MuiOutlinedInput-root': { height: 32 } }} inputProps={{ 'aria-label': 'Month' }} />
                    </Box>
                }
            />
            <Box sx={{ mb: 2 }}>
                <KpiStrip
                    loading={list.loading}
                    items={[
                        { label: `Paid in ${monthLabel(month)}`, value: inr(totals.paidAmount), sub: `${totals.paidCount} staff`, color: T.success },
                        { label: 'Still to pay', value: inr(totals.pendingAmount), sub: `${totals.pendingCount} staff`, color: totals.pendingAmount > 0 ? T.warning : undefined },
                        { label: 'Whole payroll', value: inr(totals.paidAmount + totals.pendingAmount), sub: 'paid + pending' }
                    ]}
                />
            </Box>
            <DataTable
                columns={columns}
                rows={list.data}
                loading={list.loading}
                rowKey="staffId"
                searchPlaceholder="Search staff"
                exportName={`payroll-${month}`}
                emptyText="Add staff first, then record their salary here."
                actions={[
                    { title: (r) => (r.paymentId ? 'Edit payment' : 'Record salary'), icon: <PaymentsOutlinedIcon fontSize="small" />, onClick: dialog.openEdit },
                    { title: 'Undo payment', icon: <UndoIcon fontSize="small" />, onClick: setUndo, hidden: (r) => !r.paymentId }
                ]}
            />
            <FormDialog open={dialog.open} title={row ? `${row.name} · ${monthLabel(month)}` : ''} subtitle={row ? `Usual salary ${inr(row.monthlySalary)}` : undefined} fields={fields} initialValues={row ? { baseSalary: row.paymentId ? row.baseSalary : row.monthlySalary, bonus: row.bonus || 0, deductions: row.deductions || 0, method: row.method || 'CASH', paidOn: row.paidOn || todayISO(), note: row.note || '' } : {}} validationSchema={schema} onSubmit={save} onClose={dialog.close} submitLabel="Save payment" />
            <ConfirmDialog open={Boolean(undo)} title="Undo this salary payment?" confirmLabel="Undo payment" color="error" onClose={() => setUndo(null)} onConfirm={async () => { try { toast.success(await api.payroll.remove(undo.paymentId)); setUndo(null); list.reload(); } catch (e) { toast.error(e.message); } }}>
                {undo && <>{undo.name}'s payment of {inr(undo.netPaid)} for {monthLabel(month)} will be removed and shown as pending.</>}
            </ConfirmDialog>
        </>
    );
};

export default Payroll;
