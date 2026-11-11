import axios from 'axios';
import { API_BASE } from 'utils/constants';
import http from './http';

const data = (p) => p.then((r) => r.data.data);
const message = (p) => p.then((r) => r.data.message);

// list / create / update for a plain REST resource; failures throw an Error with the server message
const resource = (path) => ({
    list: (params) => data(http.get(path, { params })),
    create: (body) => message(http.post(path, body)),
    update: (id, body) => message(http.put(`${path}/${id}`, body))
});

export const departments = resource('/department');
export const categories = resource('/category');
export const tasks = resource('/task');
export const users = resource('/user');
export const clients = resource('/client');
export const roles = resource('/role');

export const auth = {
    login: (body) => data(http.post('/auth/login', body)),
    me: () => data(http.get('/auth/user')),
    logout: () => http.get('/auth/logout'),
    forgotPassword: (email) => http.post('/auth/forgot-password', { email }).then((r) => r.data.message),
    resetPassword: (token, password) => http.post('/auth/reset-password', { token, password }).then((r) => r.data.message),
    changePassword: (currentPassword, newPassword) => http.post('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data.message)
};

export const menus = {
    mine: () => data(http.get('/menu/menuByConfig')),
    all: () => data(http.get('/menu')),
    forClient: (clientId) => data(http.get('/menu/clientMenuList', { params: { clientId } })),
    configOf: (email) => data(http.get('/user/menuConfig', { params: { email } })),
    saveConfig: (email, menuIds) => message(http.post('/user/updateMenuConfig', { email, menuIds }))
};

// the guest's private bill page; no login, so it uses a plain request
export const publicBill = (token) => axios.get(`${API_BASE}public/bill/${encodeURIComponent(token)}`).then((r) => r.data.data).catch((e) => { throw new Error(e.response?.data?.message || 'Could not load this bill.'); });

export const files = {
    // multipart upload -> relative path like "File/file/123-456.png"
    upload: (file) => {
        const form = new FormData();
        form.append('file', file);
        return data(http.post('/fileOperation', form));
    }
};

// Hotel API, bound to one client's workspace: hotelApi(clientId).bookings.list() etc.
export const hotelApi = (clientId) => {
    const get = (path, params) => data(http.get(`/hotel${path}`, { params: { ...params, clientId } }));
    const send = (method, path, body) => http[method](`/hotel${path}`, { ...body, clientId }).then((r) => r.data);
    const remove = (path) => http.delete(`/hotel${path}`, { params: { clientId } }).then((r) => r.data);
    return {
        settings: { get: () => get('/settings'), save: (b) => send('put', '/settings', b).then((r) => r.message) },
        roomTypes: { list: () => get('/room-types'), save: (id, b) => (id ? send('put', `/room-types/${id}`, b) : send('post', '/room-types', b)).then((r) => r.message) },
        rates: { list: (params) => get('/rates', params), set: (b) => send('put', '/rates', b).then((r) => r.message) },
        rooms: {
            list: () => get('/rooms'),
            save: (id, b) => (id ? send('put', `/rooms/${id}`, b) : send('post', '/rooms', b)).then((r) => r.message),
            housekeeping: (id, status) => send('put', `/rooms/${id}/housekeeping`, { status }).then((r) => r.message)
        },
        availability: (params) => get('/availability', params),
        calendar: (params) => get('/calendar', params),
        customers: { list: (q) => get('/customers', { q }), save: (id, b) => (id ? send('put', `/customers/${id}`, b) : send('post', '/customers', b)).then((r) => r.data || r.message) },
        bookings: {
            list: (params) => get('/bookings', params),
            get: (id) => get(`/bookings/${id}`),
            create: (b) => send('post', '/bookings', b).then((r) => r.data),
            update: (id, b) => send('put', `/bookings/${id}`, b).then((r) => r.data),
            status: (id, action) => send('post', `/bookings/${id}/status`, { action }).then((r) => r.data),
            addCharge: (id, b) => send('post', `/bookings/${id}/charges`, b).then((r) => r.data),
            removeCharge: (id, chargeId) => remove(`/bookings/${id}/charges/${chargeId}`).then((r) => r.data),
            addPayment: (id, b) => send('post', `/bookings/${id}/payments`, b).then((r) => r.data),
            removePayment: (id, paymentId) => remove(`/bookings/${id}/payments/${paymentId}`).then((r) => r.data),
            invoice: (id) => get(`/bookings/${id}/invoice`),
            share: (id, regenerate = false) => send('post', `/bookings/${id}/share`, { regenerate }).then((r) => r.data),
            email: (id, kind, text) => send('post', `/bookings/${id}/email`, { kind, text }).then((r) => r.message)
        },
        staff: { list: () => get('/staff'), save: (id, b) => (id ? send('put', `/staff/${id}`, b) : send('post', '/staff', b)).then((r) => r.message) },
        payroll: { list: (month) => get('/payroll', { month }), pay: (b) => send('post', '/payroll', b).then((r) => r.message), remove: (id) => remove(`/payroll/${id}`).then((r) => r.message) },
        activity: (params) => get('/activity', params),
        onboarding: (body) => send('post', '/onboarding', body).then((r) => r.data),
        import: (kind, rows, opts = {}) => send('post', `/import/${kind}`, { rows, ...opts }).then((r) => r.data),
        dashboard: () => get('/dashboard'),
        report: (params) => get('/reports', params)
    };
};
