import { FILE_BASE } from './constants';

// "2026-10-30" -> "30 Oct 2026"
export const formatDate = (value) => {
    if (!value) return '-';
    const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
    if (!y) return String(value);
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const todayISO = () => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

export const isOverdue = (task) => task.status !== 'CLOSED' && task.closeDate && String(task.closeDate).slice(0, 10) < todayISO();

export const initials = (name = '') =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('') || '?';

export const fileUrl = (link = '') => `${FILE_BASE}/${String(link).replace(/\\/g, '/').replace(/^\//, '')}`;

export const fileName = (link = '') => String(link).replace(/\\/g, '/').split('/').pop();

// ---------- money and dates for the hotel screens ----------
export const inr = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(n) || 0);
export const num = (n) => Number(n || 0).toLocaleString('en-IN');

export const addDays = (ymd, n) => {
    const d = new Date(`${ymd}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
};
export const daysBetween = (from, to) => Math.round((new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) / 86400000);
export const dateRange = (from, to) => Array.from({ length: Math.max(0, daysBetween(from, to)) }, (_, i) => addDays(from, i));
export const weekdayShort = (ymd) => new Date(`${ymd}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' });
export const dayOfMonth = (ymd) => Number(ymd.slice(8, 10));
export const monthShort = (ymd) => new Date(`${ymd}T00:00:00Z`).toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' });
// UPI deep link: opens the payment app on a phone, or becomes a QR code
export const upiLink = ({ upiId, name, amount, note }) =>
    `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name || '')}&am=${Number(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(note || '')}`;

export const thisMonth = () => todayISO().slice(0, 7);
