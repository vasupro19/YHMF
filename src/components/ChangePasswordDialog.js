import * as Yup from 'yup';
import { auth } from 'api';
import { useToast } from 'context/Toast';
import FormDialog from './FormDialog';

const schema = Yup.object({
    currentPassword: Yup.string().required('Enter your current password'),
    newPassword: Yup.string().min(8, 'At least 8 characters').max(72).required('Enter a new password'),
    again: Yup.string().oneOf([Yup.ref('newPassword')], 'The passwords are not the same').required('Repeat the new password')
});

const fields = [
    { name: 'currentPassword', label: 'Current password', type: 'password' },
    { name: 'newPassword', label: 'New password', type: 'password' },
    { name: 'again', label: 'Repeat new password', type: 'password' }
];

const ChangePasswordDialog = ({ open, onClose }) => {
    const toast = useToast();
    return (
        <FormDialog open={open} title="Change password" fields={fields} initialValues={{}} validationSchema={schema} submitLabel="Change password" onClose={onClose}
            onSubmit={async (v) => { toast.success(await auth.changePassword(v.currentPassword, v.newPassword)); onClose(); }} />
    );
};

export default ChangePasswordDialog;
