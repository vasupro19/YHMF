import { useMemo } from 'react';
import { Chip } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import * as Yup from 'yup';
import { roles } from 'api';
import { useAuth } from 'context/Auth';
import { useToast } from 'context/Toast';
import useAsync from 'hooks/useAsync';
import useDialogState from 'hooks/useDialogState';
import DataTable from 'components/DataTable';
import FormDialog from 'components/FormDialog';
import PageHeader from 'components/PageHeader';

const RESERVED = ['ADMIN', 'CLIENT'];
const fields = [{ name: 'name', label: 'Role name', type: 'text', placeholder: 'e.g. Supervisor' }];
const schema = Yup.object({ name: Yup.string().trim().required('Name is required') });

const Roles = () => {
    const toast = useToast();
    const { user } = useAuth();
    const dialog = useDialogState();
    const list = useAsync(() => roles.list());

    const columns = useMemo(
        () => [
            { id: 'name', label: 'Role', render: (r) => (RESERVED.includes(r.name) ? <Chip size="small" label={r.name} /> : r.name) },
            { id: 'createdAt', label: 'Created', value: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-') }
        ],
        []
    );

    const save = async (values) => {
        const body = { name: values.name.trim(), clientId: user.clientId ?? null };
        const msg = dialog.editing ? await roles.update(dialog.editing.id, body) : await roles.create(body);
        toast.success(msg);
        dialog.close();
        list.reload();
    };

    return (
        <>
            <PageHeader title="Roles" subtitle="Job roles you can give to your team, such as Supervisor or Housekeeper" />
            <DataTable
                columns={columns}
                rows={list.data}
                loading={list.loading}
                onAdd={dialog.openAdd}
                addLabel="Add role"
                searchPlaceholder="Search roles…"
                exportName="roles"
                actions={[{ title: 'Edit', icon: <EditOutlinedIcon fontSize="small" />, onClick: dialog.openEdit, hidden: (r) => RESERVED.includes(r.name) }]}
            />
            <FormDialog open={dialog.open} title={dialog.editing ? 'Edit role' : 'Add role'} fields={fields} initialValues={dialog.editing || {}} validationSchema={schema} onSubmit={save} onClose={dialog.close} />
        </>
    );
};

export default Roles;
