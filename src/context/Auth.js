import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { auth, menus as menuApi } from 'api';
import { getStoredToken, refreshAccessToken, setAuthToken } from 'api/http';

const AuthContext = createContext(null);

const isFresh = (token) => {
    try {
        return jwtDecode(token).exp > Date.now() / 1000;
    } catch (e) {
        return false;
    }
};

export const AuthProvider = ({ children }) => {
    const [initialising, setInitialising] = useState(true);
    const [user, setUser] = useState(null);
    const [menu, setMenu] = useState([]);

    const loadSession = useCallback(async () => {
        const [{ user: me }, myMenu] = await Promise.all([auth.me(), menuApi.mine()]);
        setUser(me);
        setMenu(myMenu || []);
    }, []);

    const clearSession = useCallback(() => {
        setAuthToken(null);
        setUser(null);
        setMenu([]);
    }, []);

    // restore a session on page load; an expired token is renewed from the refresh cookie
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                let token = getStoredToken();
                if (!token || !isFresh(token)) token = await refreshAccessToken();
                setAuthToken(token);
                await loadSession();
            } catch (e) {
                if (!cancelled) clearSession();
            } finally {
                if (!cancelled) setInitialising(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [loadSession, clearSession]);

    // the http layer raises this when a refresh fails mid-session
    useEffect(() => {
        window.addEventListener('auth:expired', clearSession);
        return () => window.removeEventListener('auth:expired', clearSession);
    }, [clearSession]);

    const login = useCallback(
        async (credentials) => {
            const result = await auth.login(credentials);
            setAuthToken(result.accessToken);
            await loadSession();
        },
        [loadSession]
    );

    const logout = useCallback(async () => {
        try {
            await auth.logout();
        } catch (e) {
            /* token may already be invalid; log out locally anyway */
        }
        clearSession();
    }, [clearSession]);

    const value = useMemo(
        () => ({
            initialising,
            isAuthenticated: Boolean(user),
            user,
            menu,
            roleName: user?.role?.name,
            isAdmin: user?.role?.name === 'ADMIN',
            accessibleUrls: menu.map((m) => m.url),
            login,
            logout
        }),
        [initialising, user, menu, login, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
