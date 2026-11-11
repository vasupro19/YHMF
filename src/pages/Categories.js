import { useMemo } from 'react';
import { Alert } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import * as Yup from 'yup';
import { categories, departments } from 'api';
import { useToast } from 'context/Toast';
import useAsync from 'hooks/useAsync';
import useDialogState from 'hooks/useDialogState';
import useTenant from 'hooks/useTenant';
import DataTable from 'components/DataTable';
import FormDialog from 'components/FormDialog';
import PageHeader from 'components/PageHeader';

const schema = Yup.object({
    name: Yup.string().trim().required('Name is required'),
    departmentId: Yup.number().typeError('Choose a department').required('Choose a department')
});

const Categories = () => {
    const toast = useToast();
    const { clientId, picker, noClients } = useTenant();
    const dialog = useDialogState();
    const deps = { enabled: Boolean(clientId), deps: [clientId] };
    const list = useAsync(() => categories.list({ clientId }), deps);
    const depts = useAsync(() => departments.list({ clientId }), deps);

    const columns = useMemo(
        () => [
            { id: 'name', label: 'Category' },
            { id: 'department_name', label: 'Department' }
        ],
        []
    );
    const fields = [
        { name: 'name', label: 'Category name', type: 'text', placeholder: 'e.g. Room cleaning' },
        { name: 'departmentId', label: 'Department', type: 'select', required: true, options: depts.data }
    ];

    const save = async (values) => {
        const body = { name: values.name.trim(), departmentId: Number(values.departmentId), clientId };
        const msg = dialog.editing ? await categories.update(dialog.editing.id, body) : await categories.create(body);
        toast.success(msg);
        dialog.close();
        list.reload();
    };

    return (
        <>
            <PageHeader title="Categories" subtitle="Kinds of work inside each department" actions={picker} />
            {noClients && <Alert severity="info">Create a client first. Categories belong to a client.</Alert>}
            {clientId && !depts.loading && depts.data.length === 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Add a department first. Every category sits inside one.
                </Alert>
            )}
            <DataTable
                columns={columns}
                rows={list.data}
                loading={list.loading}
                onAdd={clientId && depts.data.length ? dialog.openAdd : undefined}
                addLabel="Add category"
                searchPlaceholder="Search categories…"
                exportName="categories"
                actions={[{ title: 'Edit', icon: <EditOutlinedIcon fontSize="small" />, onClick: dialog.openEdit }]}
            />
            <FormDialog open={dialog.open} title={dialog.editing ? 'Edit category' : 'Add category'} fields={fields} initialValues={dialog.editing || {}} validationSchema={schema} onSubmit={save} onClose={dialog.close} />
        </>
    );
};

export default Categories;
