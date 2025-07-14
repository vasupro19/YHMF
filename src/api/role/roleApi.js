import axios from 'intercepter/axios';

export async function getRole(query = {}) {
    try {
        const response = await axios.get('/role', {
            params: {
                ...query
            }
        });
        return response.data.data;
    } catch (error) {
        return error.message;
    }
}

export async function createRole(data) {
    try {
        const response = await axios.post('/role', data);
        return response;
    } catch (error) {
        return error.message;
    }
}

export async function updateRole(idOfRole, data) {
    try {
        const response = await axios.put(`/role/${idOfRole}`, data);
        return response;
    } catch (error) {
        return error.message;
    }
}

export async function getRoleForCreateCliet(query = {}) {
    try {
        const response = await axios.get('/role/create/client', {
            params: {
                ...query
            }
        });
        return response.data.data;
    } catch (error) {
        return error.message;
    }
}
