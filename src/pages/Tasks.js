import { useMemo, useState } from 'react';
import { Alert, Chip, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ReplayIcon from '@mui/icons-material/Replay';
import * as Yup from 'yup';
import { categories, departments, tasks, users } from 'api';
import { useAuth } from 'context/Auth';
import { useToast } from 'context/Toast';
import useAsync from 'hooks/useAsync';
import useDialogState from 'hooks/useDialogState';
import useTenant from 'hooks/useTenant';
import DataTable from 'components/DataTable';
import FormDialog from 'components/FormDialog';
import PageHeader from 'components/PageHeader';
import { StatusChip } from 'components/StatusChip';
import { TASK_STATUSES } from 'utils/constants';
import { formatDate, isOverdue } from 'utils/format';

const schema = Yup.object({
    taskTitle: Yup.string().trim().required('Title is required'),
    departmentId: Yup.number().typeError('Choose a department').required('Choose a department'),
    categoryId: Yup.number().typeError('Choose a category').required('Choose a category'),
    raisedTo: Yup.number().typeError('Choose who it is for').required('Choose who it is for'),
    closeDate: Yup.string().required('Pick a due date')
});

const Tasks = () => {
    const toast = useToast();
    const { user } = useAuth();
    const { clientId, picker, noClients } = useTenant();
    const dialog = useDialogState();
    const [filter, setFilter] = useState('ALL');
    const opts = { enabled: Boolean(clientId), deps: [clientId] };

    const list = useAsync(() => tasks.list({ clientId }), opts);
    const depts = useAsync(() => departments.list({ clientId }), opts);
    const cats = useAsync(() => categories.list({ clientId }), opts);
    const people = useAsync(() => users.list({ clientId }), opts);

    // the client owner isn't in their own staff list but can still be assigned work
    const assignees = useMemo(() => {
        const everyone = [...people.data];
        if (user.clientId === clientId && !everyone.some((p) => p.id === user.id)) everyone.unshift(user);
        return everyone;
    }, [people.data, user, clientId]);

    const editing = Boolean(dialog.editing);

    const counts = useMemo(() => {
        const c = { ALL: list.data.length, OVERDUE: list.data.filter(isOverdue).length };
        TASK_STATUSES.forEach((s) => (c[s.id] = list.data.filter((t) => t.status === s.id).length));
        return c;
    }, [list.data]);

    const rows = useMemo(() => {
        if (filter === 'ALL') return list.data;
        if (filter === 'OVERDUE') return list.data.filter(isOverdue);
        return list.data.filter((t) => t.status === filter);
    }, [list.data, filter]);

    const columns = useMemo(
        () => [
            {
                id: 'taskTitle',
                label: 'Task',
                render: (t) => (
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{t.taskTitle}</Typography>
                        {t.attachments?.length > 0 && <Chip size="small" variant="outlined" icon={<AttachFileIcon />} label={t.attachments.length} />}
                    </Stack>
                )
            },
            { id: 'department_name', label: 'Department' },
            { id: 'category_name', label: 'Category' },
            { id: 'raisedTo_name', label: 'Assigned to' },
            {
                id: 'closeDate',
                label: 'Due',
                render: (t) => (
                    <Stack direction="row" spacing={1} alignItems="center">
                        <span>{formatDate(t.closeDate)}</span>
                        {isOverdue(t) && <Chip size="small" color="error" label="Overdue" />}
                    </Stack>
                )
            },
            { id: 'status', label: 'Status', render: (t) => <StatusChip status={t.status} /> }
        ],
        []
    );

    const fields = [
        { name: 'taskTitle', label: 'Title', type: 'text' },
        { name: 'departmentId', label: 'Department', type: 'select', required: true, options: depts.data, half: true },
        { name: 'categoryId', label: 'Category', type: 'select', required: true, half: true, options: (v) => cats.data.filter((c) => !v.departmentId || c.departmentId === v.departmentId) },
        { name: 'raisedTo', label: 'Assign to', type: 'select', required: true, options: assignees, half: true },
        { name: 'closeDate', label: 'Due date', type: 'date', half: true },
        { name: 'status', label: 'Status', type: 'select', required: true, options: TASK_STATUSES, hidden: !editing },
        { name: 'taskBody', label: 'Details', type: 'textarea' },
        { name: 'attachments', label: 'Attachments', type: 'attachments' }
    ];

    const save = async (v) => {
        const body = {
            taskTitle: v.taskTitle.trim(),
            departmentId: Number(v.departmentId),
            categoryId: Number(v.categoryId),
            raisedTo: Number(v.raisedTo),
            closeDate: v.closeDate,
            taskBody: v.taskBody || '',
            attachments: v.attachments,
            clientId,
            ...(editing ? { status: v.status } : {})
        };
        const msg = editing ? await tasks.update(dialog.editing.id, body) : await tasks.create(body);
        toast.success(msg);
        dialog.close();
        list.reload();
    };

    const toggleClosed = async (t) => {
        try {
            toast.success(await tasks.update(t.id, { clientId, status: t.status === 'CLOSED' ? 'OPEN' : 'CLOSED' }));
            list.reload();
        } catch (e) {
            toast.error(e.message);
        }
    };

    const initialValues = editing ? { ...dialog.editing, attachments: (dialog.editing.attachments || []).map((link) => ({ link })) } : {};

    return (
        <>
            <PageHeader title="Tasks" subtitle="Work assigned across your departments" actions={picker} />
            {noClients && <Alert severity="info">Create a client first. Tasks belong to a client.</Alert>}
            {clientId && !depts.loading && (depts.data.length === 0 || cats.data.length === 0) && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Before adding tasks, create at least one department and a category inside it.
                </Alert>
            )}
            <DataTable
                columns={columns}
                rows={rows}
                loading={list.loading}
                onAdd={clientId && depts.data.length && cats.data.length ? dialog.openAdd : undefined}
                addLabel="New task"
                searchPlaceholder="Search tasks…"
                exportName="tasks"
                emptyText="No tasks match this view."
                toolbarExtra={
                    <ToggleButtonGroup size="small" exclusive value={filter} onChange={(_, v) => v && setFilter(v)} aria-label="Filter by status">
                        <ToggleButton value="ALL">All {counts.ALL}</ToggleButton>
                        {TASK_STATUSES.map((s) => (
                            <ToggleButton key={s.id} value={s.id}>{s.name} {counts[s.id]}</ToggleButton>
                        ))}
                        <ToggleButton value="OVERDUE" sx={{ color: counts.OVERDUE ? 'error.main' : undefined }}>Overdue {counts.OVERDUE}</ToggleButton>
                    </ToggleButtonGroup>
                }
                actions={[
                    { title: 'Edit', icon: <EditOutlinedIcon fontSize="small" />, onClick: dialog.openEdit },
                    { title: (t) => (t.status === 'CLOSED' ? 'Reopen' : 'Mark closed'), icon: (t) => (t.status === 'CLOSED' ? <ReplayIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />), onClick: toggleClosed }
                ]}
            />
            <FormDialog open={dialog.open} title={editing ? 'Edit task' : 'New task'} fields={fields} initialValues={initialValues} validationSchema={schema} onSubmit={save} onClose={dialog.close} />
        </>
    );
};

export default Tasks;
