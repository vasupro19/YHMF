import axios from 'intercepter/axios';

export async function getClient(query = {}) {
    try {
        const response = await axios.get('/client', {
            params: {
                ...query
            }
        });
        return response.data.data;
    } catch (error) {
        return error.message;
    }
}

export async function createClient(data) {
    try {
        const response = await axios.post('/client', data);
        return response;
    } catch (error) {
        return error.message;
    }
}

export async function updateClient(idOfClient, data) {
    try {
        const response = await axios.put(`/client/${idOfClient}`, data);
        return response;
    } catch (error) {
        return error.message;
    }
}
