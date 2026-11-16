/* global BigInt */
import { inflate } from 'pako';

// Reads the QR code printed on an Aadhaar card (or e-Aadhaar) into guest details.
//  - Secure QR (cards from 2019): a long number holding gzip data, fields separated by byte 255.
//    Only the last 4 digits of the Aadhaar number are in it, which is all a hotel may keep.
//  - Old QR (before 2019): plain XML <PrintLetterBarcodeData uid=… name=… />.
// Returns { name, dob, gender, careOf, address, pincode, state, idLast4, kind } or throws.

const toBytes = (decimal) => {
    let hex = BigInt(decimal).toString(16);
    if (hex.length % 2) hex = `0${hex}`;
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i += 1) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
};

// 'DD-MM-YYYY' or 'DD/MM/YYYY' -> 'YYYY-MM-DD'
const isoDate = (v) => {
    const m = String(v || '').match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return /^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : '';
};

const genderOf = (g) => ({ M: 'M', MALE: 'M', F: 'F', FEMALE: 'F', T: 'O', O: 'O', TRANSGENDER: 'O' })[String(g || '').trim().toUpperCase()] || '';

const joinAddress = (parts) =>
    parts
        .map((p) => String(p || '').trim())
        .filter(Boolean)
        .filter((p, i, all) => all.indexOf(p) === i)
        .join(', ');

const readSecure = (text) => {
    const raw = inflate(toBytes(text));
    const fields = [];
    let start = 0;
    // the text fields come first; the photo and signature after them are binary and not needed
    for (let i = 0; i < raw.length && fields.length < 20; i += 1) {
        if (raw[i] === 255) {
            fields.push(new TextDecoder('iso-8859-1').decode(raw.slice(start, i)));
            start = i + 1;
        }
    }
    const v = /^V\d$/.test(fields[0]) ? 1 : 0; // newer cards start with a version marker
    const f = (n) => fields[n + v] || '';
    // 0 indicator, 1 reference (starts with the last 4 Aadhaar digits), 2 name, 3 date of birth, 4 gender, 5 care of,
    // 6 district, 7 landmark, 8 house, 9 location, 10 pin code, 11 post office, 12 state, 13 street, 14 sub-district, 15 village/town
    const [careOf, district, landmark, house, location, pincode, postOffice, state, street, subDistrict, vtc] = [f(5), f(6), f(7), f(8), f(9), f(10), f(11), f(12), f(13), f(14), f(15)];
    if (!f(2) || !/^\d{4}/.test(f(1))) throw new Error('This QR code is not an Aadhaar QR code.');
    return {
        kind: 'secure',
        idLast4: f(1).slice(0, 4),
        name: f(2).trim(),
        dob: isoDate(f(3)),
        gender: genderOf(f(4)),
        careOf: careOf.trim(),
        address: joinAddress([house, street, landmark, location, vtc, postOffice, subDistrict, district, state, pincode]),
        pincode: pincode.trim(),
        state: state.trim()
    };
};

const readXml = (text) => {
    const doc = new DOMParser().parseFromString(text.slice(text.indexOf('<')), 'text/xml');
    const el = doc.getElementsByTagName('PrintLetterBarcodeData')[0];
    if (!el) throw new Error('This QR code is not an Aadhaar QR code.');
    const a = (k) => el.getAttribute(k) || '';
    const uid = a('uid').replace(/\D/g, '');
    return {
        kind: 'xml',
        idLast4: uid.slice(-4),
        name: a('name').trim(),
        dob: isoDate(a('dob')) || (a('yob') ? `${a('yob')}-01-01` : ''),
        dobYearOnly: !a('dob') && Boolean(a('yob')),
        gender: genderOf(a('gender')),
        careOf: a('co').trim(),
        address: joinAddress([a('house'), a('street'), a('lm'), a('loc'), a('vtc'), a('po'), a('subdist'), a('dist'), a('state'), a('pc')]),
        pincode: a('pc'),
        state: a('state')
    };
};

export const readAadhaarQr = (text) => {
    const t = String(text || '').trim();
    if (/^\d{100,}$/.test(t)) return readSecure(t);
    if (t.includes('PrintLetterBarcodeData')) return readXml(t);
    throw new Error('This QR code is not an Aadhaar QR code.');
};
