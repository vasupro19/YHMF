import { useMemo } from 'react';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import * as Yup from 'yup';
import useHotel from 'hooks/useHotel';
import useAsync from 'hooks/useAsync';
import useDialogState from 'hooks/useDialogState';
import { useToast } from 'context/Toast';
import DataTable from 'components/DataTable';
import FormDialog from 'components/FormDialog';
import PageHeader from 'components/PageHeader';
import { ActiveChip } from 'components/StatusChip';
import { formatDate, inr } from 'utils/format';

const DEPARTMENTS = ['Front desk', 'Housekeeping', 'Kitchen', 'Restaurant', 'Maintenance', 'Security', 'Management', 'Other'].map((n) => ({ id: n, name: n }));

const schema = Yup.object({
    name: Yup.string().trim().required('Name is required'),
    designation: Yup.string().trim().required('Designation is required'),
    monthlySalary: Yup.number().typeError('Enter an amount').min(0, 'Cannot be negative').required('Salary is required'),
    email: Yup.string().email('Enter a valid email'),
    phone: Yup.string().matches(/^[0-9+\-\s]{7,15}$/, { message: 'Enter a valid phone number', excludeEmptyString: true })
});

const Staff = () => {
    const { api } = useHotel();
    const toast = useToast();
    const dialog = useDialogState();
    const list = useAsync(() => api.staff.list());
    const editing = Boolean(dialog.editing);

    const columns = useMemo(() => [
        { id: 'name', label: 'Name' },
        { id: 'designation', label: 'Designation' },
        { id: 'department', label: 'Department', value: (s) => s.department || '-' },
        { id: 'phone', label: 'Phone', value: (s) => s.phone || '-' },
        { id: 'monthlySalary', label: 'Monthly salary', value: (s) => s.monthlySalary, render: (s) => inr(s.monthlySalary) },
        { id: 'joinDate', label: 'Joined', value: (s) => (s.joinDate ? formatDate(s.joinDate) : '-') },
        { id: 'active', label: 'Status', value: (s) => (s.active ? 'Active' : 'Left'), render: (s) => <ActiveChip active={Boolean(s.active)} /> }
    ], []);

    const fields = [
        { name: 'name', label: 'Full name', type: 'text' },
        { name: 'designation', label: 'Designation', type: 'text', placeholder: 'e.g. Receptionist', half: true },
        { name: 'department', label: 'Department', type: 'select', options: DEPARTMENTS, half: true },
        { name: 'phone', label: 'Phone', type: 'tel', half: true },
        { name: 'email', label: 'Email', type: 'email', half: true },
        { name: 'monthlySalary', label: 'Monthly salary (₹)', type: 'number', half: true },
        { name: 'joinDate', label: 'Joining date', type: 'date', half: true },
        { name: 'address', label: 'Address', type: 'textarea' },
        { name: 'idNumber', label: 'ID number', type: 'text' },
        { name: 'active', label: 'Currently working here', type: 'switch' }
    ];

    const save = async (v) => {
        toast.success(await api.staff.save(dialog.editing?.id, { ...v, name: v.name.trim(), designation: v.designation.trim(), monthlySalary: Number(v.monthlySalary) }));
        dialog.close();
        list.reload();
    };

    return (
        <>
            <PageHeader title="Staff" subtitle="Your team and what they are paid" />
            <DataTable columns={columns} rows={list.data} loading={list.loading} onAdd={dialog.openAdd} addLabel="Add staff" searchPlaceholder="Search staff…" exportName="staff" emptyText="Add your team to track salaries."
                actions={[{ title: 'Edit', icon: <EditOutlinedIcon fontSize="small" />, onClick: dialog.openEdit }]} />
            <FormDialog open={dialog.open} title={editing ? 'Edit staff member' : 'Add staff member'} fields={fields} initialValues={editing ? { ...dialog.editing, active: Boolean(dialog.editing.active), joinDate: dialog.editing.joinDate || '' } : { active: true }} validationSchema={schema} onSubmit={save} onClose={dialog.close} />
        </>
    );
};

export default Staff;
