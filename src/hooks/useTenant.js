import { useEffect, useState } from 'react';
import { MenuItem, TextField } from '@mui/material';
import { clients as clientsApi } from 'api';
import { useAuth } from 'context/Auth';
import useAsync from './useAsync';

/**
 * Tenant data (departments, categories, tasks) lives in one database per client.
 * A client user always works in their own; an admin picks which client to look at.
 */
export default function useTenant() {
    const { user, isAdmin } = useAuth();
    const clientList = useAsync(() => clientsApi.list(), { enabled: isAdmin });
    const [picked, setPicked] = useState('');

    useEffect(() => {
        if (isAdmin && !picked && clientList.data.length) setPicked(clientList.data[0].id);
    }, [isAdmin, picked, clientList.data]);

    const clientId = isAdmin ? picked || null : user?.clientId || null;

    const picker = isAdmin ? (
        <TextField select label="Client" value={picked} onChange={(e) => setPicked(e.target.value)} sx={{ minWidth: 200, maxWidth: 260 }} disabled={!clientList.data.length}>
            {clientList.data.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                    {c.name}
                </MenuItem>
            ))}
        </TextField>
    ) : null;

    return { clientId, picker, isAdmin, noClients: isAdmin && !clientList.loading && clientList.data.length === 0 };
}
