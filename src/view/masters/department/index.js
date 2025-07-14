//React
import useSnackbarAlert from 'customHook/alert';
import React, { useState } from 'react';
import * as Yup from 'yup';
import useAuth from 'customHook/useAuth';

// csutome datatable
import DataTable from 'componets/DataTable';

// model
import DynamicForm from 'componets/DynamicForm';

// api
import { createDepartment, getDepartment, updateDepartment } from 'api/department/departmentApi';

//icons
import EditIcon from '@mui/icons-material/Edit';

// constant
import { Dialog } from '@mui/material';
import { fontFamily } from 'constant/constant';

const Department = () => {
    const { user } = useAuth();
    const { openTostar, SnackbarComponent } = useSnackbarAlert();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [data, setData] = useState([]);
    const [initialData, setInitialData] = useState({});

    // fetch prescription request list
    const fetchDepartmentList = async () => {
        try {
            const response = await getDepartment({ clientId: user.clientId });
            if (typeof response === 'string') {
                openTostar(response, 'error');
            } else {
                setData(response);
            }
        } catch (error) {
            console.log(error);
        }
    };

    // set the headers and actions
    const headers = [{ id: 'name', label: 'NAME', align: 'center' }];

    // feilds for form
    const fields = [{ name: 'name', label: 'Name', type: 'text' }];

    // validation schema
    const customValidationSchema = Yup.object().shape({
        name: Yup.string().required('Name is required')
    });

    const actions = [
        {
            title: 'Edit',
            icon: <EditIcon />,
            handler: (row) => {
                setInitialData(row);
                setIsModalOpen(true);
            }
        }
    ];
    // -=-=-=-=-=-=-=- end of setter of header and action buttons -=-=-=-=-=-=-=-=-=-

    // add button
    const addButton = () => {
        setIsModalOpen(true);
    };

    // close the modal
    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    // handle create or update department
    const handleCreateUpdateDepartment = async (values) => {
        values.clientId = user.clientId;
        try {
            let response = null;

            if (initialData.id) {
                response = await updateDepartment(initialData.id, values);
            } else {
                response = await createDepartment(values);
            }

            if (typeof response === 'string') {
                openTostar(response, 'error');
            } else {
                openTostar(response.data.message, 'success');
                handleModalClose();
                fetchDepartmentList();
            }
        } catch (error) {
            console.log(error);
        }
    };

    React.useEffect(() => {
        fetchDepartmentList();
    }, []);

    return (
        <>
            <SnackbarComponent />
            <div {...(isModalOpen ? { inert: 'true' } : {})}>
                <DataTable
                    headers={headers}
                    tableTitle="Department List"
                    actions={actions}
                    data={data}
                    fontFamily={fontFamily}
                    addButton={addButton}
                />
            </div>
            <Dialog maxWidth="sm" fullWidth onClose={handleModalClose} open={isModalOpen} sx={{ '& .MuiDialog-paper': { p: 0 } }}>
                <DynamicForm
                    initialData={initialData}
                    onSubmit={handleCreateUpdateDepartment}
                    title="Department Form"
                    onClose={handleModalClose}
                    fields={fields}
                    fontFamily={fontFamily}
                    validationSchema={customValidationSchema}
                />
            </Dialog>
        </>
    );
};

export default Department;
