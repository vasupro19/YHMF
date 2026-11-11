import { useMemo } from 'react';
import { Alert, Box } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import * as Yup from 'yup';
import { departments } from 'api';
import { useToast } from 'context/Toast';
import useAsync from 'hooks/useAsync';
import useDialogState from 'hooks/useDialogState';
import useTenant from 'hooks/useTenant';
import DataTable from 'components/DataTable';
import FormDialog from 'components/FormDialog';
import PageHeader from 'components/PageHeader';

const fields = [{ name: 'name', label: 'Department name', type: 'text', placeholder: 'e.g. Housekeeping' }];
const schema = Yup.object({ name: Yup.string().trim().required('Name is required') });

const Departments = () => {
    const toast = useToast();
    const { clientId, picker, noClients } = useTenant();
    const dialog = useDialogState();
    const list = useAsync(() => departments.list({ clientId }), { enabled: Boolean(clientId), deps: [clientId] });

    const columns = useMemo(() => [{ id: 'name', label: 'Name' }], []);

    const save = async (values) => {
        const body = { name: values.name.trim(), clientId };
        const msg = dialog.editing ? await departments.update(dialog.editing.id, body) : await departments.create(body);
        toast.success(msg);
        dialog.close();
        list.reload();
    };

    return (
        <>
            <PageHeader title="Departments" subtitle="The teams that tasks are assigned to" actions={picker} />
            {noClients && <Alert severity="info">Create a client first. Departments belong to a client.</Alert>}
            <Box>
                <DataTable
                    columns={columns}
                    rows={list.data}
                    loading={list.loading}
                    onAdd={clientId ? dialog.openAdd : undefined}
                    addLabel="Add department"
                    searchPlaceholder="Search departments…"
                    exportName="departments"
                    emptyText="Add your first department, for example Housekeeping or Front Desk."
                    actions={[{ title: 'Edit', icon: <EditOutlinedIcon fontSize="small" />, onClick: dialog.openEdit }]}
                />
            </Box>
            <FormDialog open={dialog.open} title={dialog.editing ? 'Edit department' : 'Add department'} fields={fields} initialValues={dialog.editing || {}} validationSchema={schema} onSubmit={save} onClose={dialog.close} />
        </>
    );
};

export default Departments;
