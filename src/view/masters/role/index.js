//React
import { Chip } from '@mui/material';
import useSnackbarAlert from 'customHook/alert';
import React, { useState } from 'react';
import * as Yup from 'yup';
import useAuth from 'customHook/useAuth';

// csutome datatable
import DataTable from 'componets/DataTable';

// model
import DynamicForm from 'componets/DynamicForm';

// api
import { createRole, getRole, updateRole } from 'api/role/roleApi';

//icons
import EditIcon from '@mui/icons-material/Edit';

// constant
import { Dialog } from '@mui/material';
import { fontFamily } from 'constant/constant';

const Driver = () => {
    const { user } = useAuth();
    const { openTostar, SnackbarComponent } = useSnackbarAlert();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rows, setRows] = useState([]);
    const [selectedRole, setSelectedRole] = useState({});
    const [modelEvent, setModelEvent] = useState(false);
    const [roleList, setRoleList] = useState([]);

    // fetch prescription list
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
                setRoleList(response || []);
                setRows(response || []);
            }
        } catch (error) {
            console.log(error);
        }
    };

    // set the headers and actions

    const headers = [
        { id: 'name', label: 'NAME', align: 'center', render: (row) => row?.name },
        { id: 'roleId', label: 'MANAGING ROLE', align: 'center', render: (row) => row?.role?.name }
    ];

    // feilds for form
    const fields = [
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'roleId', label: 'Managing Role', type: 'select', options: roleList }
    ];

    // validation schema
    const validationSchema = Yup.object().shape({
        name: Yup.string().trim().required('This field is required')
    });

    const actions = [
        {
            title: 'Update Role',
            icon: <EditIcon />,
            handler: (row) => {
                setModelEvent(true);
                setSelectedRole(row);
                setIsModalOpen(true);
            }
        }
    ];

    // handle add button click
    const addButton = () => {
        setModelEvent(false);
        setIsModalOpen(true);
    };
    // -=-=-=-=-=-=-=- end of setter of header and action buttons -=-=-=-=-=-=-=-=-=-

    // close the modal
    const handleModalClose = () => {
        setModelEvent(false);
        setIsModalOpen(false);
        setSelectedRole({});
    };

    // create the dirver
    const handleRoleCreate = async (data) => {
        try {
            data.clientId = user.clientId;
            const response = await createRole(data);
            if (typeof response === 'string') {
                openTostar(response, 'error');
            } else {
                openTostar(response.data.message, 'success');
                setIsModalOpen(false);
                fetchRoleList();
            }
        } catch (error) {
            console.log(error);
        }
    };

    // update the dirver
    const handleRoleUpdate = async (id, data) => {
        try {
            const response = await updateRole(id, data);
            if (typeof response === 'string') {
                openTostar(response, 'error');
            } else {
                openTostar(response.data.message, 'success');
                setIsModalOpen(false);
                fetchRoleList();
            }
        } catch (error) {
            console.log(error);
        }
    };

    React.useEffect(() => {
        fetchRoleList();
    }, []);

    return (
        <>
            <SnackbarComponent />
            <div {...(isModalOpen ? { inert: 'true' } : {})}>
                <DataTable
                    headers={headers}
                    tableTitle="Role List"
                    actions={actions}
                    data={rows}
                    fontFamily={fontFamily}
                    addButton={addButton}
                />
            </div>
            <Dialog maxWidth="md" fullWidth onClose={handleModalClose} open={isModalOpen} sx={{ '& .MuiDialog-paper': { p: 0 } }}>
                <DynamicForm
                    initialData={selectedRole}
                    onSubmit={(data) => {
                        if (modelEvent) {
                            handleRoleUpdate(selectedRole.id, data);
                        } else {
                            handleRoleCreate(data);
                        }
                    }}
                    title="Role Form"
                    onClose={handleModalClose}
                    fields={fields}
                    fontFamily={fontFamily}
                    validationSchema={validationSchema}
                />
            </Dialog>
        </>
    );
};

export default Driver;

// {
//     id: 'status',
//     label: 'STATUS',
//     align: 'center',
//     render: (row) => (
//         <Chip
//             label={row.activeStatus === true ? 'Active' : 'In Active'}
//             color={handleStatusColor(row.activeStatus)}
//             sx={{ fontFamily }}
//         />
//     )
// }
