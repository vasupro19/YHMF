//React
import { Dialog } from '@mui/material';
import useSnackbarAlert from 'customHook/alert';
import React, { useState } from 'react';
import * as Yup from 'yup';
import useAuth from 'customHook/useAuth';

// csutome datatable
import DataTable from 'componets/DataTable';

// User model
import UserConfig from './UserConfig';
import DynamicForm from 'componets/DynamicForm';

// api
import { getClientMenuList } from 'api/menu/menuApi';
import { createUser, getUser, updateUser, updateUserMenuConfig } from 'api/user/useApi';
import { getRole } from 'api/role/roleApi';
import { getDepartment } from 'api/department/departmentApi';

//icons
import EditIcon from '@mui/icons-material/Edit';
import SettingsIcon from '@mui/icons-material/Settings';

// constant
import { fontFamily } from 'constant/constant';

const User = () => {
    const { user } = useAuth();
    const { openTostar, SnackbarComponent } = useSnackbarAlert();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userDetail, setUserDetail] = useState({});
    const [roleList, setRoleList] = useState([]);
    const [departmentList, setDepartmentList] = useState([]);
    const [data, setData] = useState([]);
    const [showUserConfig, setShowUserConfig] = useState(false);
    const [menuList, setMenuList] = useState([]);
    const [initialData, setInitialData] = useState({});

    // fetch User list
    const fetchUsers = async () => {
        try {
            let query = {};
            if (user?.clientId) {
                query.clientId = user.clientId;
            }
            const response = await getUser(query);
            if (typeof response === 'string') {
                openTostar(response, 'error');
            } else {
                const transformedData = response.map((item) => ({
                    ...item,
                    role: item.role?.name || '-',
                    phoneNumber: item.phoneNumber || '-'
                }));
                setData(transformedData);
            }
        } catch (error) {
            console.log('Error:', error);
        }
    };

    // fetch menu list
    const fetchMenuList = async () => {
        try {
            const response = await getClientMenuList({ clientId: user.clientId });
            if (typeof response === 'string') {
                openTostar(response, 'error');
            } else {
                setMenuList(response || []);
            }
        } catch (error) {
            console.log(error);
        }
    };

    // update User
    const handleUpdate = async (id, data) => {
        try {
            const response = await updateUser(id, data);
            if (typeof response === 'string') {
                openTostar(response, 'error');
            } else {
                openTostar(response.data.message, 'success');
                fetchUsers();
                handleModalClose();
            }
        } catch (error) {
            console.log('Error:', error);
        }
    };

    // update menu config
    const handleUpdateClientMenuConfig = async (data) => {
        try {
            const response = await updateUserMenuConfig(data);
            if (typeof response === 'string') {
                openTostar(response, 'error');
            } else {
                openTostar(response.data.message, 'success');
                fetchUsers();
                handleModalClose();
            }
        } catch (error) {
            console.log('Error:', error);
        }
    };

    // fetch role
    const fetchRoleList = async () => {
        try {
            let query = {};
            if (user.role.name !== 'ADMIN') {
                query = { name: { notIn: ['ADMIN', 'CLIENT'] } };
            }
            const response = await getRole(query);
            if (typeof response === 'string') {
                openTostar(response, 'error');
            } else {
                setRoleList(response);
            }
        } catch (error) {
            console.log(error);
        }
    };

    // fetch department
    const fetchDepartmentList = async () => {
        try {
            const response = await getDepartment({ clientId: user.clientId });
            if (typeof response === 'string') {
                openTostar(response, 'error');
            } else {
                setDepartmentList(response);
            }
        } catch (error) {
            console.log(error);
        }
    };

    // set the headers and actions
    const headers = [
        { id: 'name', label: 'NAME', align: 'center' },
        { id: 'email', label: 'EMAIL', align: 'center' },
        { id: 'phoneNumber', label: 'PHONE NUMBER', align: 'center' },
        { id: 'role', label: 'ROLE', align: 'center' }
    ];

    // feilds for form
    const fields = [
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'password', label: 'Password', type: 'password' },
        { name: 'phoneNumber', label: 'Phone Number', type: 'text' },
        { name: 'whatsAppNo', label: 'Whatsapp Number', type: 'text' },
        { name: 'roleId', label: 'Role', type: 'select', options: roleList },
        { name: 'departmentId', label: 'Detpartment', type: 'select', options: departmentList }
    ];

    // validation schema
    const customValidationSchema = Yup.object().shape({
        name: Yup.string().required('This field is required'),
        email: Yup.string().required('This field is required'),
        password: Yup.string().required('This field is required'),
        phoneNumber: Yup.string()
            .required('This field is required')
            .matches(/^\d{10}$/, 'Number must be exactly 10 digits'),
        whatsAppNo: Yup.string()
            .required('This field is required')
            .matches(/^\d{10}$/, 'Number must be exactly 10 digits'),
        roleId: Yup.number().required('This field is required'),
        departmentId: Yup.number().required('This field is required')
    });

    // handle create user
    const handleCreateUser = async (values) => {
        try {
            const response = await createUser(values);
            if (typeof response === 'string') {
                openTostar(response, 'error');
            } else {
                openTostar(response.data.message, 'success');
                handleModalClose();
                fetchUsers();
            }
        } catch (error) {
            console.log(error);
        }
    };

    const actions = [
        {
            title: 'Edit',
            icon: <EditIcon />,
            handler: (row) => {
                setInitialData(row);
                setIsModalOpen(true);
            }
        },
        {
            title: 'Settings',
            icon: <SettingsIcon />,
            handler: (row) => {
                setUserDetail(row);
                setShowUserConfig(true);
            }
        }
    ];
    // -=-=-=-=-=-=-=- end of setter of header and action buttons -=-=-=-=-=-=-=-=-=-

    // close the modal
    const handleModalClose = () => {
        setShowUserConfig(false);
        setIsModalOpen(false);
        setInitialData({});
    };

    // handle add button click
    const addButton = () => {
        setIsModalOpen(true);
    };

    React.useEffect(() => {
        fetchRoleList();
        fetchUsers();
        fetchMenuList();
        fetchDepartmentList();
    }, []);

    return (
        <>
            <SnackbarComponent />
            <div {...(isModalOpen ? { inert: 'true' } : {})}>
                <DataTable
                    headers={headers}
                    tableTitle="User List"
                    addButton={addButton}
                    actions={actions}
                    data={data}
                    fontFamily={fontFamily}
                />
            </div>
            <Dialog maxWidth="sm" fullWidth onClose={handleModalClose} open={isModalOpen} sx={{ '& .MuiDialog-paper': { p: 0 } }}>
                <DynamicForm
                    initialData={initialData}
                    onSubmit={(values) => {
                        if (initialData.id) {
                            handleUpdate(initialData.id, values);
                        } else {
                            values.clientId = user.clientId;
                            handleCreateUser(values);
                        }
                    }}
                    title="Prescription Form"
                    onClose={handleModalClose}
                    fields={fields}
                    fontFamily={fontFamily}
                    validationSchema={customValidationSchema}
                />
            </Dialog>
            <Dialog maxWidth="lg" fullWidth onClose={handleModalClose} open={showUserConfig} sx={{ '& .MuiDialog-paper': { p: 0 } }}>
                <UserConfig
                    handleCancel={handleModalClose}
                    userDetail={userDetail}
                    menuList={menuList}
                    updateUserConfig={handleUpdateClientMenuConfig}
                    fontFamily={fontFamily}
                />
            </Dialog>
        </>
    );
};

export default User;
