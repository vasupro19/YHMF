import { useMemo, useState } from 'react';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LockPersonOutlinedIcon from '@mui/icons-material/LockPersonOutlined';
import * as Yup from 'yup';
import { clients, menus, roles, users } from 'api';
import { useAuth } from 'context/Auth';
import { useToast } from 'context/Toast';
import useAsync from 'hooks/useAsync';
import useDialogState from 'hooks/useDialogState';
import DataTable from 'components/DataTable';
import FormDialog from 'components/FormDialog';
import MenuAccessDialog from 'components/MenuAccessDialog';
import PageHeader from 'components/PageHeader';
import { ActiveChip } from 'components/StatusChip';

const phone = Yup.string().matches(/^\d{10}$/, 'Enter a 10 digit number');

const Users = () => {
    const toast = useToast();
    const { user, isAdmin, menu } = useAuth();
    const dialog = useDialogState();
    const [access, setAccess] = useState(null);
    const [accessMenus, setAccessMenus] = useState([]);

    const list = useAsync(() => users.list(isAdmin ? {} : { clientId: user.clientId }));
    const roleList = useAsync(() => roles.list());
    const clientList = useAsync(() => clients.list(), { enabled: isAdmin });

    const staffRoles = roleList.data.filter((r) => !['ADMIN', 'CLIENT'].includes(r.name));
    const clientName = (id) => clientList.data.find((c) => c.id === id)?.name || '-';

    const columns = useMemo(
        () => [
            { id: 'name', label: 'Name' },
            { id: 'email', label: 'Email' },
            { id: 'phoneNumber', label: 'Phone', value: (r) => r.phoneNumber || '-' },
            { id: 'role', label: 'Role', value: (r) => r.role?.name?.replace(/_/g, ' ') || '-' },
            ...(isAdmin ? [{ id: 'client', label: 'Client', value: (r) => clientName(r.clientId) }] : []),
            { id: 'active', label: 'Status', value: (r) => (r.active ? 'Active' : 'Inactive'), render: (r) => <ActiveChip active={r.active} /> }
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [isAdmin, clientList.data]
    );

    const editing = Boolean(dialog.editing);
    const fields = [
        { name: 'name', label: 'Full name', type: 'text' },
        { name: 'email', label: 'Email', type: 'email', disabled: editing },
        { name: 'password', label: editing ? 'New password' : 'Password', type: 'password', helperText: editing ? 'Leave blank to keep the current password' : undefined },
        { name: 'phoneNumber', label: 'Phone', type: 'tel', half: true },
        { name: 'whatsAppNo', label: 'WhatsApp', type: 'tel', half: true },
        { name: 'roleId', label: 'Role', type: 'select', required: true, options: staffRoles, half: true },
        { name: 'active', label: 'Account is active', type: 'switch', hidden: !editing }
    ];
    const schema = Yup.object({
        name: Yup.string().trim().required('Name is required'),
        email: Yup.string().email('Enter a valid email').required('Email is required'),
        password: editing ? Yup.string().min(8, 'At least 8 characters') : Yup.string().min(8, 'At least 8 characters').required('Password is required'),
        phoneNumber: phone.required('Phone is required'),
        whatsAppNo: phone,
        roleId: Yup.number().typeError('Choose a role').required('Choose a role')
    });

    const save = async (v) => {
        const body = {
            name: v.name.trim(),
            email: v.email.trim(),
            phoneNumber: v.phoneNumber,
            whatsAppNo: v.whatsAppNo || undefined,
            roleId: Number(v.roleId),
            ...(v.password ? { password: v.password } : {}),
            ...(editing ? { active: v.active } : { clientId: user.clientId })
        };
        const msg = editing ? await users.update(dialog.editing.id, body) : await users.create(body);
        toast.success(msg);
        dialog.close();
        list.reload();
    };

    const openAccess = async (row) => {
        try {
            setAccessMenus(isAdmin ? await menus.forClient(row.clientId) : menu);
            setAccess(row);
        } catch (e) {
            toast.error(e.message);
        }
    };

    return (
        <>
            <PageHeader title="Users" subtitle={isAdmin ? 'People across every client' : 'Your team members and what they can open'} />
            <DataTable
                columns={columns}
                rows={list.data}
                loading={list.loading}
                onAdd={isAdmin ? undefined : dialog.openAdd}
                addLabel="Add user"
                searchPlaceholder="Search users…"
                exportName="users"
                emptyText={isAdmin ? 'Client staff will appear here.' : 'Add your first team member.'}
                actions={[
                    { title: 'Edit', icon: <EditOutlinedIcon fontSize="small" />, onClick: dialog.openEdit },
                    { title: 'Screen access', icon: <LockPersonOutlinedIcon fontSize="small" />, onClick: openAccess }
                ]}
            />
            <FormDialog
                open={dialog.open}
                title={editing ? 'Edit user' : 'Add user'}
                fields={fields}
                initialValues={editing ? { ...dialog.editing, password: '', roleId: dialog.editing.roleId } : { active: true }}
                validationSchema={schema}
                onSubmit={save}
                onClose={dialog.close}
            />
            <MenuAccessDialog open={Boolean(access)} target={access} availableMenus={accessMenus} onClose={() => setAccess(null)} />
        </>
    );
};

export default Users;
