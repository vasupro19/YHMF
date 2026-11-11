// Small CSV reader: handles quotes, commas inside quotes, line breaks inside quotes, a BOM, and , ; or tab separators.
export const parseCsv = (text) => {
    const src = String(text || '').replace(/^﻿/, '');
    const firstLine = src.split(/\r?\n/, 1)[0] || '';
    const delimiter = [',', ';', '\t'].map((d) => [d, firstLine.split(d).length]).sort((a, b) => b[1] - a[1])[0][0];

    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < src.length; i++) {
        const ch = src[i];
        if (quoted) {
            if (ch === '"' && src[i + 1] === '"') {
                cell += '"';
                i++;
            } else if (ch === '"') quoted = false;
            else cell += ch;
        } else if (ch === '"') quoted = true;
        else if (ch === delimiter) {
            row.push(cell);
            cell = '';
        } else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && src[i + 1] === '\n') i++;
            row.push(cell);
            rows.push(row);
            row = [];
            cell = '';
        } else cell += ch;
    }
    if (cell !== '' || row.length) {
        row.push(cell);
        rows.push(row);
    }

    const [head = [], ...body] = rows.filter((r) => r.some((c) => String(c).trim() !== ''));
    const headers = head.map((h) => String(h).trim());
    return { headers, rows: body.map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()]))) };
};

export const downloadText = (filename, text) => {
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
};
