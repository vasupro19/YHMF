import { useState } from 'react';

// open/close state for an add-or-edit dialog; `editing` is the row being edited (null = adding)
export default function useDialogState() {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    return {
        open,
        editing,
        openAdd: () => {
            setEditing(null);
            setOpen(true);
        },
        openEdit: (row) => {
            setEditing(row);
            setOpen(true);
        },
        close: () => setOpen(false)
    };
}
