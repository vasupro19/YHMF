import axios from 'intercepter/axios';

export async function getCategory(query = {}) {
    try {
        const response = await axios.get('/category', {
            params: {
                ...query
            }
        });
        return response.data.data;
    } catch (error) {
        return error.message;
    }
}

export async function createCategory(data) {
    try {
        const response = await axios.post('/category', data);
        return response;
    } catch (error) {
        return error.message;
    }
}

export async function updateCategory(idOfCategory, data) {
    try {
        const response = await axios.put(`/category/${idOfCategory}`, data);
        return response;
    } catch (error) {
        return error.message;
    }
}
