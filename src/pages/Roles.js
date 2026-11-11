import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
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
import { Pill } from 'components/StatusChip';
import { T } from 'components/Theme';

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
            {
                id: 'name',
                label: 'Role',
                render: (r) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, textTransform: r.name === r.name.toUpperCase() ? 'capitalize' : 'none' }}>{r.name === r.name.toUpperCase() ? r.name.replace(/_/g, ' ').toLowerCase() : r.name}</Typography>
                        {RESERVED.includes(r.name) && <Pill tone="default" dot={false} label="System" />}
                    </Box>
                )
            },
            { id: 'type', label: 'Type', value: (r) => (RESERVED.includes(r.name) ? 'Built in, cannot be edited' : 'Custom'), render: (r) => <Typography sx={{ fontSize: 13, color: T.ink2 }}>{RESERVED.includes(r.name) ? 'Built in, cannot be edited' : 'Custom'}</Typography> },
            { id: 'createdAt', label: 'Created', value: (r) => r.createdAt || '', render: (r) => <Typography sx={{ fontSize: 13, color: T.ink2, whiteSpace: 'nowrap' }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</Typography> }
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
            <PageHeader title="Roles" subtitle="Job titles you can give your team, such as Supervisor or Housekeeper. Screen access is set per user." />
            <DataTable
                columns={columns}
                rows={list.data}
                loading={list.loading}
                onAdd={dialog.openAdd}
                addLabel="Add role"
                searchPlaceholder="Search roles"
                exportName="roles"
                actions={[{ title: 'Edit', icon: <EditOutlinedIcon fontSize="small" />, onClick: dialog.openEdit, hidden: (r) => RESERVED.includes(r.name) }]}
            />
            <FormDialog open={dialog.open} title={dialog.editing ? 'Edit role' : 'Add role'} subtitle="A name only; choose screens for each user under Users" width={440} fields={fields} initialValues={dialog.editing || {}} validationSchema={schema} onSubmit={save} onClose={dialog.close} />
        </>
    );
};

export default Roles;
