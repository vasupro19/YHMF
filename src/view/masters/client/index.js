//React
import { Dialog } from '@mui/material';
import useSnackbarAlert from 'customHook/alert';
import React, { useState } from 'react';
import * as Yup from 'yup';
import useAuth from 'customHook/useAuth';

// csutome datatable
import DataTable from 'componets/DataTable';

// User model
import ClientConfig from './ClientConfig';
import DynamicForm from 'componets/DynamicForm';

// api
import { getMenu } from 'api/menu/menuApi';
import { getRoleForCreateCliet } from 'api/role/roleApi';
import { getClient, createClient, updateClient } from 'api/client/clientApi';
import { updateUserMenuConfig } from 'api/user/useApi';

//icons
import EditIcon from '@mui/icons-material/Edit';
import SettingsIcon from '@mui/icons-material/Settings';

// constant
import { fontFamily } from 'constant/constant';

const Client = () => {
    const { user } = useAuth();
    const { openTostar, SnackbarComponent } = useSnackbarAlert();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userDetail, setUserDetail] = useState({});
    const [roleList, setRoleList] = useState([]);
    const [data, setData] = useState([]);
    const [showClientConfig, setShowClientConfig] = useState(false);
    const [menuList, setMenuList] = useState([]);
    const [initialData, setInitialData] = useState({});

    // fetch User list
    const fetchClients = async () => {
        try {
            const response = await getClient();
            if (typeof response === 'string') {
                openTostar(response, 'error');
            } else {
                setData(response);
            }
        } catch (error) {
            console.log('Error:', error);
        }
    };

    // fetch menu list
    const fetchMenuList = async () => {
        try {
            const response = await getMenu();
            if (typeof response === 'string') {
                openTostar(response, 'error');
            } else {
                setMenuList(response);
            }
        } catch (error) {
            console.log(error);
        }
    };

    // update User
    const handleUpdateClientMenuConfig = async (data) => {
        try {
            const response = await updateUserMenuConfig(data);
            if (typeof response === 'string') {
                openTostar(response, 'error');
            } else {
                openTostar(response.data.message, 'success');
                fetchClients();
                handleModalClose();
            }
        } catch (error) {
            console.log('Error:', error);
        }
    };

    // fetch role
    const fetchRoleList = async () => {
        try {
            const response = await getRoleForCreateCliet();
            if (typeof response === 'string') {
                openTostar(response, 'error');
            } else {
                setRoleList(response);
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
        { id: 'gst', label: 'GST', align: 'center' }
    ];

    // feilds for form
    const fields = [
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'password', label: 'Password', type: 'password' },
        { name: 'phoneNumber', label: 'Phone Number', type: 'text' },
        { name: 'address', label: 'Address', type: 'text' },
        { name: 'gst', label: 'GST', type: 'text' },
        { name: 'pan', label: 'PAN', type: 'text' },
        { name: 'roleId', label: 'Role', type: 'select', options: roleList }
    ];

    // validation schema
    const customValidationSchema = Yup.object().shape({
        name: Yup.string().required('This field is required'),
        email: Yup.string().required('This field is required'),
        phoneNumber: Yup.string()
            .required('This field is required')
            .matches(/^\d{10}$/, 'Number must be exactly 10 digits'),
        address: Yup.string().required('This field is required'),
        gst: Yup.string().required('This field is required'),
        pan: Yup.string().required('This field is required'),
        roleId: Yup.number().required('This field is required')
    });

    // handle create client
    const handleCreateClient = async (values) => {
        try {
            let response = null;

            if (initialData?.id) {
                response = await updateClient(initialData.id, values);
            } else {
                response = await createClient(values);
            }

            if (typeof response === 'string') {
                openTostar(response, 'error');
            } else {
                openTostar(response.data.message, 'success');
                handleModalClose();
                fetchClients();
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
                setShowClientConfig(true);
            }
        }
    ];
    // -=-=-=-=-=-=-=- end of setter of header and action buttons -=-=-=-=-=-=-=-=-=-

    // close the modal
    const handleModalClose = () => {
        setShowClientConfig(false);
        setIsModalOpen(false);
        setInitialData({});
    };

    // handle add button click
    const addButton = () => {
        setIsModalOpen(true);
    };

    React.useEffect(() => {
        fetchRoleList();
        fetchClients();
        fetchMenuList();
    }, []);

    return (
        <>
            <SnackbarComponent />
            <div {...(isModalOpen ? { inert: 'true' } : {})}>
                <DataTable
                    headers={headers}
                    tableTitle="Client List"
                    addButton={addButton}
                    actions={actions}
                    data={data}
                    fontFamily={fontFamily}
                />
            </div>
            <Dialog maxWidth="sm" fullWidth onClose={handleModalClose} open={isModalOpen} sx={{ '& .MuiDialog-paper': { p: 0 } }}>
                <DynamicForm
                    initialData={initialData}
                    onSubmit={handleCreateClient}
                    title="Client Form"
                    onClose={handleModalClose}
                    fields={fields}
                    fontFamily={fontFamily}
                    validationSchema={customValidationSchema}
                />
            </Dialog>
            <Dialog maxWidth="lg" fullWidth onClose={handleModalClose} open={showClientConfig} sx={{ '& .MuiDialog-paper': { p: 0 } }}>
                <ClientConfig
                    handleCancel={handleModalClose}
                    userDetail={userDetail}
                    menuList={menuList}
                    updateClientConfig={handleUpdateClientMenuConfig}
                    fontFamily={fontFamily}
                />
            </Dialog>
        </>
    );
};

export default Client;
