import { useMemo, useState } from 'react';
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
            { id: 'name', label: 'Name' },
            { id: 'email', label: 'Email' },
            { id: 'phoneNumber', label: 'Phone' },
            { id: 'address', label: 'Address' },
            { id: 'gst', label: 'GST', value: (r) => r.gst || '-' }
        ],
        []
    );

    const fields = [
        { name: 'name', label: 'Business name', type: 'text' },
        { name: 'email', label: 'Login email', type: 'email', disabled: editing, helperText: editing ? 'The login email cannot be changed' : undefined },
        { name: 'password', label: 'Password', type: 'password', hidden: editing, helperText: 'The client signs in with this' },
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
            <PageHeader title="Clients" subtitle="Each client gets a private workspace of their own" />
            <DataTable
                columns={columns}
                rows={list.data}
                loading={list.loading}
                onAdd={dialog.openAdd}
                addLabel="Add client"
                searchPlaceholder="Search clients…"
                exportName="clients"
                emptyText="Add your first client to give them a workspace."
                actions={[
                    { title: 'Edit', icon: <EditOutlinedIcon fontSize="small" />, onClick: dialog.openEdit },
                    { title: 'Screen access', icon: <LockPersonOutlinedIcon fontSize="small" />, onClick: (row) => setAccess(row) }
                ]}
            />
            <FormDialog open={dialog.open} title={editing ? 'Edit client' : 'Add client'} subtitle={editing ? undefined : 'A private workspace is created for them'} fields={fields} initialValues={dialog.editing || {}} validationSchema={schema} onSubmit={save} onClose={dialog.close} />
            <MenuAccessDialog open={Boolean(access)} target={access} availableMenus={allMenus.data} onClose={() => setAccess(null)} />
        </>
    );
};

export default Clients;
