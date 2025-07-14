import axios from 'intercepter/axios';

export async function getTask(query = {}) {
    try {
        const response = await axios.get('/task', {
            params: {
                ...query
            }
        });
        return response.data.data;
    } catch (error) {
        return error.message;
    }
}

export async function createTask(data) {
    try {
        const response = await axios.post('/task', data);
        return response;
    } catch (error) {
        return error.message;
    }
}

export async function updateTask(idOfTask, data) {
    try {
        const response = await axios.put(`/task/${idOfTask}`, data);
        return response;
    } catch (error) {
        return error.message;
    }
}
