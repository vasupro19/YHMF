export const APP_NAME = 'YHM';
export const APP_TAGLINE = 'Your Hotel Manager';

export const API_BASE = process.env.REACT_APP_BACKEND_SERVER || 'http://localhost:1410/v1/';
// uploaded files are served by the backend next to /v1
export const FILE_BASE = API_BASE.replace(/\/v1\/?$/, '');

export const ROLES = { ADMIN: 'ADMIN', CLIENT: 'CLIENT' };

export const TASK_STATUSES = [
    { id: 'OPEN', name: 'Open', color: 'info' },
    { id: 'IN_PROGRESS', name: 'In progress', color: 'warning' },
    { id: 'CLOSED', name: 'Closed', color: 'success' }
];

export const GST_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const PAN_REGEX = /^[A-Z]{5}\d{4}[A-Z]$/;

export const BOOKING_STATUSES = {
    PENDING: { label: 'On hold', color: 'warning' },
    CONFIRMED: { label: 'Confirmed', color: 'info' },
    CHECKED_IN: { label: 'In house', color: 'success' },
    CHECKED_OUT: { label: 'Checked out', color: 'default' },
    CANCELLED: { label: 'Cancelled', color: 'error' },
    NO_SHOW: { label: 'No show', color: 'error' }
};

export const BOOKING_SOURCES = [
    { id: 'DIRECT', name: 'Direct' },
    { id: 'PHONE', name: 'Phone' },
    { id: 'WALK_IN', name: 'Walk-in' },
    { id: 'WEBSITE', name: 'Website' },
    { id: 'OTA', name: 'Online travel agent' },
    { id: 'AGENT', name: 'Travel agent' },
    { id: 'CORPORATE', name: 'Corporate' }
];

export const CHARGE_CATEGORIES = [
    { id: 'RESTAURANT', name: 'Restaurant', gst: 5 },
    { id: 'FOOD', name: 'Room service / food', gst: 5 },
    { id: 'MINIBAR', name: 'Minibar', gst: 18 },
    { id: 'LAUNDRY', name: 'Laundry', gst: 18 },
    { id: 'SPA', name: 'Spa', gst: 18 },
    { id: 'TRANSPORT', name: 'Transport', gst: 5 },
    { id: 'OTHER', name: 'Other', gst: 18 }
];

export const PAY_METHODS = [
    { id: 'CASH', name: 'Cash' },
    { id: 'UPI', name: 'UPI' },
    { id: 'CARD', name: 'Card' },
    { id: 'BANK', name: 'Bank transfer' },
    { id: 'OTHER', name: 'Other' }
];

export const HK_STATUSES = [
    { id: 'CLEAN', name: 'Clean', color: 'success' },
    { id: 'DIRTY', name: 'Dirty', color: 'warning' },
    { id: 'INSPECTED', name: 'Inspected', color: 'info' }
];

// default screens for each standard hotel role (the server applies the same lists when a user is created)
export const ROLE_PRESETS = [
    { id: 'RECEPTIONIST', name: 'Receptionist', urls: ['/hotel/calendar', '/hotel/bookings', '/hotel/customers', '/hotel/rooms'] },
    { id: 'HOUSEKEEPING', name: 'Housekeeping', urls: ['/hotel/rooms'] },
    { id: 'MANAGER', name: 'Manager', urls: ['/hotel/calendar', '/hotel/bookings', '/hotel/customers', '/hotel/rooms', '/hotel/room-types', '/hotel/staff', '/hotel/reports'] },
    { id: 'ACCOUNTANT', name: 'Accountant', urls: ['/hotel/bookings', '/hotel/customers', '/hotel/staff', '/hotel/payroll', '/hotel/reports'] }
];
