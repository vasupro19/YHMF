import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from 'context/Toast';

// runs a loader on mount and exposes reload(); errors become a toast instead of being swallowed
export default function useAsync(loader, { initial = [], deps = [], enabled = true } = {}) {
    const toast = useToast();
    const [data, setData] = useState(initial);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState(null);
    const loaderRef = useRef(loader);
    loaderRef.current = loader;

    const reload = useCallback(async () => {
        setLoading(true);
        try {
            setData(await loaderRef.current());
            setError(null);
        } catch (e) {
            setError(e);
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (enabled) reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, reload, ...deps]);

    return { data, loading, error, reload, setData };
}
