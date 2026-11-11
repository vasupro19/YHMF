import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import useHotel from 'hooks/useHotel';
import useAsync from 'hooks/useAsync';
import useDialogState from 'hooks/useDialogState';
import { useToast } from 'context/Toast';
import DataTable from 'components/DataTable';
import FormDialog from 'components/FormDialog';
import PageHeader from 'components/PageHeader';
import { KpiStrip } from 'components/Panel';
import { Pill } from 'components/StatusChip';
import { T } from 'components/Theme';
import { GST_REGEX } from 'utils/constants';

const ID_TYPES = [{ id: 'AADHAAR', name: 'Aadhaar' }, { id: 'PASSPORT', name: 'Passport' }, { id: 'DRIVING_LICENCE', name: 'Driving licence' }, { id: 'VOTER_ID', name: 'Voter ID' }, { id: 'PAN', name: 'PAN' }, { id: 'OTHER', name: 'Other' }];

const schema = Yup.object({
    name: Yup.string().trim().required('Name is required'),
    phone: Yup.string().matches(/^[0-9+\-\s]{7,15}$/, { message: 'Enter a valid phone number', excludeEmptyString: true }),
    email: Yup.string().email('Enter a valid email'),
    gstin: Yup.string().transform((v) => v?.toUpperCase()).matches(GST_REGEX, { message: 'Not a valid GSTIN', excludeEmptyString: true })
});

const Customers = () => {
    const { api } = useHotel();
    const toast = useToast();
    const navigate = useNavigate();
    const dialog = useDialogState();
    const list = useAsync(() => api.customers.list(''));
    const editing = Boolean(dialog.editing);

    const columns = useMemo(() => [
        {
            id: 'name',
            label: 'Guest',
            value: (c) => `${c.name} ${c.companyName || ''}`,
            render: (c) => (
                <Box>
                    <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, minWidth: 160 }}>{c.name}</Typography>
                    {c.companyName && <Typography noWrap sx={{ fontSize: 12, color: T.ink3 }}>{c.companyName}</Typography>}
                </Box>
            )
        },
        { id: 'type', label: 'Type', value: (c) => (c.type === 'COMPANY' ? 'Company' : 'Individual'), render: (c) => <Pill tone={c.type === 'COMPANY' ? 'brand' : 'default'} dot={false} label={c.type === 'COMPANY' ? 'Company' : 'Individual'} /> },
        { id: 'phone', label: 'Phone', value: (c) => c.phone || '', render: (c) => (c.phone ? <Box component="span" sx={{ whiteSpace: 'nowrap' }}>{c.phone}</Box> : null) || <Box component="span" sx={{ color: T.ink3 }}>—</Box> },
        { id: 'email', label: 'Email', value: (c) => c.email || '', render: (c) => c.email || <Box component="span" sx={{ color: T.ink3 }}>—</Box> },
        { id: 'gstin', label: 'GSTIN', value: (c) => c.gstin || '', render: (c) => (c.gstin ? <Box component="span" className="num" sx={{ fontSize: 12.5 }}>{c.gstin}</Box> : <Box component="span" sx={{ color: T.ink3 }}>—</Box>) },
        { id: 'bookingCount', label: 'Stays', align: 'right', value: (c) => Number(c.bookingCount) || 0 }
    ], []);

    const fields = [
        { name: 'type', label: 'Guest type', type: 'select', required: true, options: [{ id: 'INDIVIDUAL', name: 'Individual' }, { id: 'COMPANY', name: 'Company' }] },
        { name: 'name', label: 'Contact / guest name', type: 'text' },
        { name: 'companyName', label: 'Company name', type: 'text', hidden: false },
        { name: 'phone', label: 'Phone', type: 'tel', half: true },
        { name: 'email', label: 'Email', type: 'email', half: true },
        { name: 'gstin', label: 'GSTIN (for company bills)', type: 'text' },
        { name: 'address', label: 'Address', type: 'textarea' },
        { name: 'idType', label: 'ID proof', type: 'select', options: ID_TYPES, half: true },
        { name: 'idNumber', label: 'ID number', type: 'text', half: true },
        { name: 'notes', label: 'Notes', type: 'textarea' }
    ];

    const save = async (v) => {
        const body = { ...v, name: v.name.trim(), gstin: (v.gstin || '').toUpperCase() };
        await api.customers.save(dialog.editing?.id, body);
        toast.success(editing ? 'Guest updated' : 'Guest added');
        dialog.close();
        list.reload();
    };

    return (
        <>
            <PageHeader title="Guests" subtitle="Guest and company profiles. Click a guest to see their stays." />
            <Box sx={{ mb: 2 }}>
                <KpiStrip
                    loading={list.loading}
                    items={[
                        { label: 'Guest profiles', value: list.data.length, sub: 'people and companies' },
                        { label: 'Companies', value: list.data.filter((c) => c.type === 'COMPANY').length, sub: 'corporate accounts' },
                        { label: 'Repeat guests', value: list.data.filter((c) => Number(c.bookingCount) > 1).length, sub: 'more than one stay' },
                        { label: 'With GSTIN', value: list.data.filter((c) => c.gstin).length, sub: 'billed for input credit' }
                    ]}
                />
            </Box>
            <DataTable columns={columns} rows={list.data} loading={list.loading} onAdd={dialog.openAdd} addLabel="Add guest" searchPlaceholder="Search name, company, phone, GSTIN" exportName="guests" emptyText="Guests are added here, or while creating a booking."
                onRowClick={(c) => navigate(`/hotel/bookings?customerId=${c.id}`)}
                actions={[{ title: 'Edit', icon: <EditOutlinedIcon fontSize="small" />, onClick: dialog.openEdit }]} />
            <FormDialog open={dialog.open} title={editing ? 'Edit guest' : 'Add guest'} subtitle="Contact, billing and ID details" fields={fields} initialValues={editing ? dialog.editing : { type: 'INDIVIDUAL' }} validationSchema={schema} onSubmit={save} onClose={dialog.close} />
        </>
    );
};

export default Customers;
