//React
import useSnackbarAlert from 'customHook/alert';
import React, { useState } from 'react';
import * as Yup from 'yup';
import useAuth from 'customHook/useAuth';
import { Chip } from '@mui/material';

// csutome datatable
import DataTable from 'componets/DataTable';

// model
import DynamicForm from 'componets/DynamicForm';

// api
import { getDepartment } from 'api/department/departmentApi';
import { getCategory } from 'api/category/categoryApi';
import { getUser } from 'api/user/useApi';
import { createTask, getTask, updateTask } from 'api/task/taskApi';

//icons
import EditIcon from '@mui/icons-material/Edit';

// constant
import { Dialog } from '@mui/material';
import { fontFamily } from 'constant/constant';

const Task = () => {
    const { user } = useAuth();
    const { openTostar, SnackbarComponent } = useSnackbarAlert();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [data, setData] = useState([]);
    const [departmentList, setDepartmentList] = useState([]);
    const [categoryList, setCategoryList] = useState([]);
    const [userList, setUserList] = useState([]);
    const [initialData, setInitialData] = useState({});

    // fetch task request list
    const fetchTaskList = async () => {
        try {
            const response = await getTask({ clientId: user.clientId });
            if (typeof response === 'string') {
                openTostar(response, 'error');
            } else {
                setData(response);
            }
        } catch (error) {
            console.log(error);
        }
    };

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
                setCategoryList(response);
            }
        } catch (error) {
            console.log(error);
        }
    };

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
                setUserList(response);
            }
        } catch (error) {
            console.log('Error:', error);
        }
    };

    // set the headers and actions
    const headers = [
        { id: 'taskTitle', label: 'TITLE', align: 'center', render: (row) => row?.taskTitle },
        { id: 'departmentId', label: 'DEPARTMENT', align: 'center', render: (row) => row?.department_name },
        { id: 'categoryId', label: 'CATEGORY', align: 'center', render: (row) => row?.category_name },
        { id: 'raiseTo', label: 'RAISED TO', align: 'center', render: (row) => row?.raisedTo_name },
        { id: 'closeDate', label: 'CLOSE DATE', align: 'center', render: (row) => row?.closeDate },
        { id: 'status', label: 'Status', align: 'center', render: (row) => <Chip label={row.status} color="default" sx={{ fontFamily }} /> }
    ];

    // feilds for form
    const fields = [
        { name: 'departmentId', label: 'Department', type: 'select', options: departmentList },
        { name: 'raisedTo', label: 'Recipient', type: 'select', options: userList },
        { name: 'categoryId', label: 'Category', type: 'select', options: categoryList },
        { name: 'taskTitle', label: 'Task Title', type: 'text' },
        { name: 'closeDate', label: 'Expected End Date', type: 'date' },
        { name: 'attachments', label: 'Attachment', type: 'image', multiple: true },
        { name: 'taskBody', label: 'Task Body', type: 'textarea' }
    ];

    // validation schema
    const customValidationSchema = Yup.object().shape({
        departmentId: Yup.number().required('This field is required'),
        raisedTo: Yup.number().required('This field is required'),
        taskTitle: Yup.string().required('This field is required'),
        closeDate: Yup.date().required('This field is required')
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
        setInitialData({});
        setIsModalOpen(true);
    };

    // close the modal
    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    // handle create or update department
    const handleCreateUpdateTask = async (values) => {
        values.clientId = user.clientId;
        try {
            let response = null;

            if (initialData.id) {
                response = await updateTask(initialData.id, values);
            } else {
                response = await createTask(values);
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
        fetchCategoryList();
        fetchUsers();
        fetchTaskList();
    }, []);

    return (
        <>
            <SnackbarComponent />
            <div {...(isModalOpen ? { inert: 'true' } : {})}>
                <DataTable
                    headers={headers}
                    tableTitle="Task List"
                    actions={actions}
                    data={data}
                    fontFamily={fontFamily}
                    addButton={addButton}
                />
            </div>
            <Dialog maxWidth="sm" fullWidth onClose={handleModalClose} open={isModalOpen} sx={{ '& .MuiDialog-paper': { p: 0 } }}>
                <DynamicForm
                    initialData={initialData}
                    onSubmit={handleCreateUpdateTask}
                    title="Task Form"
                    onClose={handleModalClose}
                    fields={fields}
                    fontFamily={fontFamily}
                    validationSchema={customValidationSchema}
                />
            </Dialog>
        </>
    );
};

export default Task;
