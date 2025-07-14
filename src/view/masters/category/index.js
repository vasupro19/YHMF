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
import { getDepartment } from 'api/department/departmentApi';
import { createCategory, getCategory, updateCategory } from 'api/category/categoryApi';

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
    const [departmentList, setDepartmentList] = useState([]);
    const [initialData, setInitialData] = useState({});

    // fetch department request list
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

    // fetch category request list
    const fetchCategoryList = async () => {
        try {
            const response = await getCategory({ clientId: user.clientId });
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
    const headers = [
        { id: 'name', label: 'NAME', align: 'center', render: (row) => row?.name },
        { id: 'departmentId', label: 'DEPARTMENT', align: 'center', render: (row) => row?.department_name }
    ];

    // feilds for form
    const fields = [
        { name: 'name', label: 'Name', type: 'text' },
        {
            name: 'departmentId',
            label: 'Department',
            type: 'select',
            options: departmentList
        }
    ];

    // validation schema
    const customValidationSchema = Yup.object().shape({
        name: Yup.string().required('This field is required'),
        departmentId: Yup.string().required('This field is required')
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
    const handleCreateUpdateCategory = async (values) => {
        values.clientId = user.clientId;
        try {
            let response = null;

            if (initialData.id) {
                response = await updateCategory(initialData.id, values);
            } else {
                response = await createCategory(values);
            }

            if (typeof response === 'string') {
                openTostar(response, 'error');
            } else {
                openTostar(response.data.message, 'success');
                handleModalClose();
                fetchCategoryList();
            }
        } catch (error) {
            console.log(error);
        }
    };

    React.useEffect(() => {
        fetchDepartmentList();
        fetchCategoryList();
    }, []);

    return (
        <>
            <SnackbarComponent />
            <div {...(isModalOpen ? { inert: 'true' } : {})}>
                <DataTable
                    headers={headers}
                    tableTitle="Category List"
                    actions={actions}
                    data={data}
                    fontFamily={fontFamily}
                    addButton={addButton}
                />
            </div>
            <Dialog maxWidth="sm" fullWidth onClose={handleModalClose} open={isModalOpen} sx={{ '& .MuiDialog-paper': { p: 0 } }}>
                <DynamicForm
                    initialData={initialData}
                    onSubmit={handleCreateUpdateCategory}
                    title="Category Form"
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
