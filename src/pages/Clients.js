import { useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LockPersonOutlinedIcon from '@mui/icons-material/LockPersonOutlined';
import * as Yup from 'yup';
import { clients, menus } from 'api';
import { useToast } from 'context/Toast';
import useAsync from 'hooks/useAsync';
import useDialogState from 'hooks/useDialogState';
import DataTable from 'components/DataTable';
import FormDialog from 'components/FormDialog';
import MenuAccessDialog from 'components/MenuAccessDialog';
import PageHeader from 'components/PageHeader';
import { Pill } from 'components/StatusChip';
import { T } from 'components/Theme';
import { GST_REGEX, PAN_REGEX } from 'utils/constants';

const Clients = () => {
    const toast = useToast();
    const dialog = useDialogState();
    const list = useAsync(() => clients.list());
    const allMenus = useAsync(() => menus.all());
    const [access, setAccess] = useState(null);
    const editing = Boolean(dialog.editing);

    const columns = useMemo(
        () => [
            { id: 'name', label: 'Hotel', render: (r) => <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{r.name}</Typography> },
            { id: 'email', label: 'Login email', render: (r) => <Typography sx={{ fontSize: 13, color: T.ink2 }}>{r.email}</Typography> },
            { id: 'phoneNumber', label: 'Phone', render: (r) => <span className="num">{r.phoneNumber || '—'}</span> },
            { id: 'address', label: 'Address', render: (r) => <Typography noWrap sx={{ fontSize: 13, maxWidth: 280, color: T.ink2 }} title={r.address}>{r.address || '—'}</Typography> },
            { id: 'gst', label: 'GSTIN', value: (r) => r.gst || '', render: (r) => (r.gst ? <span className="num">{r.gst}</span> : <Box component="span" sx={{ color: T.ink3 }}>—</Box>) }
        ],
        []
    );

    const fields = [
        { name: 'name', label: 'Hotel / business name', type: 'text' },
        { name: 'email', label: 'Login email', type: 'email', disabled: editing, helperText: editing ? 'The login email cannot be changed' : undefined },
        { name: 'password', label: 'Password', type: 'password', hidden: editing, helperText: 'The hotel owner signs in with this email and password' },
        { name: 'phoneNumber', label: 'Phone', type: 'tel', half: true },
        { name: 'address', label: 'Address', type: 'text', half: true },
        { name: 'gst', label: 'GST number', type: 'text', half: true },
        { name: 'pan', label: 'PAN', type: 'text', half: true }
    ];
    const schema = Yup.object({
        name: Yup.string().trim().required('Name is required'),
        email: Yup.string().email('Enter a valid email').required('Email is required'),
        password: editing ? Yup.string() : Yup.string().min(8, 'At least 8 characters').required('Password is required'),
        phoneNumber: Yup.string().matches(/^\d{10}$/, 'Enter a 10 digit number').required('Phone is required'),
        address: Yup.string().trim().required('Address is required'),
        gst: Yup.string().transform((v) => v?.toUpperCase()).matches(GST_REGEX, { message: 'Not a valid GST number', excludeEmptyString: true }),
        pan: Yup.string().transform((v) => v?.toUpperCase()).matches(PAN_REGEX, { message: 'Not a valid PAN', excludeEmptyString: true })
    });

    const save = async (v) => {
        const body = { name: v.name.trim(), phoneNumber: v.phoneNumber, address: v.address.trim(), gst: v.gst.toUpperCase(), pan: v.pan.toUpperCase() };
        const msg = editing ? await clients.update(dialog.editing.id, body) : await clients.create({ ...body, email: v.email.trim(), password: v.password });
        toast.success(msg);
        dialog.close();
        list.reload();
    };

    return (
        <>
            <PageHeader title="Hotels" subtitle="Register a hotel to give it its own private workspace, login and database" meta={!list.loading && <Pill tone="default" dot={false} label={`${list.data.length} registered`} />} />
            <DataTable
                columns={columns}
                rows={list.data}
                loading={list.loading}
                onAdd={dialog.openAdd}
                addLabel="Register hotel"
                searchPlaceholder="Search hotel, email, phone, GSTIN"
                exportName="hotels"
                emptyText="Register your first hotel to give it a workspace."
                actions={[
                    { title: 'Edit', icon: <EditOutlinedIcon fontSize="small" />, onClick: dialog.openEdit },
                    { title: 'Screen access', icon: <LockPersonOutlinedIcon fontSize="small" />, onClick: (row) => setAccess(row) }
                ]}
            />
            <FormDialog open={dialog.open} title={editing ? 'Edit hotel' : 'Register hotel'} subtitle={editing ? 'Business details shown to the platform admin' : 'Creates a private workspace and the owner\'s login'} fields={fields} initialValues={dialog.editing || {}} validationSchema={schema} onSubmit={save} onClose={dialog.close} />
            <MenuAccessDialog open={Boolean(access)} target={access} availableMenus={allMenus.data} onClose={() => setAccess(null)} />
        </>
    );
};

export default Clients;
