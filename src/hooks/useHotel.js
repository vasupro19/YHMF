import { useMemo } from 'react';
import { hotelApi } from 'api';
import { useAuth } from 'context/Auth';

// the hotel screens always work inside the signed-in client's own workspace
export default function useHotel() {
    const { user } = useAuth();
    const clientId = user?.clientId || null;
    const api = useMemo(() => (clientId ? hotelApi(clientId) : null), [clientId]);
    return { api, clientId };
}
