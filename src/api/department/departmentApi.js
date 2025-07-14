import axios from 'intercepter/axios';

export async function getDepartment(query = {}) {
    try {
        const response = await axios.get('/department', {
            params: {
                ...query
            }
        });
        return response.data.data;
    } catch (error) {
        return error.message;
    }
}

export async function createDepartment(data) {
    try {
        const response = await axios.post('/department', data);
        return response;
    } catch (error) {
        return error.message;
    }
}

export async function updateDepartment(idOfDepartment, data) {
    try {
        const response = await axios.put(`/department/${idOfDepartment}`, data);
        return response;
    } catch (error) {
        return error.message;
    }
}
