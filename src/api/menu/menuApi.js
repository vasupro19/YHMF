import axios from 'intercepter/axios';

export async function getUserMenu(query = {}) {
    try {
        const response = await axios.get('/menu/menuByConfig', {
            params: {
                ...query
            }
        });
        return response.data.data;
    } catch (error) {
        return error.message;
    }
}

export async function getMenu(query = {}) {
    try {
        const response = await axios.get('/menu', {
            params: {
                ...query
            }
        });
        return response.data.data;
    } catch (error) {
        return error.message;
    }
}

export async function getClientMenuList(query = {}) {
    try {
        const response = await axios.get('/menu/clientMenuList', {
            params: {
                ...query
            }
        });
        return response.data.data;
    } catch (error) {
        return error.message;
    }
}
