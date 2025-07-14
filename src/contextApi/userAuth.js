import { jwtDecode } from 'jwt-decode';
import React, { createContext, useState } from 'react';
import axios from '../intercepter/axios';
import useSnackbarAlert from 'customHook/alert';
import { useLocation, useNavigate } from 'react-router-dom';

// api
import { getUserMenu } from 'api/menu/menuApi';

const AuthContext = createContext(null);

const verifyToken = (serviceToken) => {
    if (!serviceToken) {
        return false;
    }
    const decoded = jwtDecode(serviceToken);
    /**
     * Property 'exp' does not exist on type '<T = unknown>(token, options?: JwtDecodeOptions | undefined) => T'.
     */
    return decoded.exp > Date.now() / 1000;
};

const setSession = (serviceToken) => {
    if (serviceToken) {
        localStorage.setItem('accessToken', serviceToken);
        axios.defaults.headers.common.Authorization = `Bearer ${serviceToken}`;
    } else {
        localStorage.removeItem('accessToken');
        delete axios.defaults.headers.common.Authorization;
    }
};

export const AuthProvider = ({ children }) => {
    const { openTostar, SnackbarComponent } = useSnackbarAlert();
    const location = useLocation();
    const navigate = useNavigate();

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [menu, setMenu] = React.useState([]);
    const [accessableUrls, setAccessableUrls] = useState([]);

    // fetch user menu which is assigned
    const fetchMenu = async () => {
        try {
            const response = await getUserMenu();
            if (typeof response === 'string') {
                openTostar(response, 'error');
            } else {
                setMenu(response);
            }
        } catch (error) {
            openTostar(error?.message || error, 'error');
        }
    };

    // set the use accessable urls
    const checkAccessableUrls = () => {
        try {
            const urlsList = [];

            menu.forEach((row) => {
                urlsList.push(row.url);
            });

            setAccessableUrls(urlsList);
        } catch (error) {
            openTostar(error?.message || error, 'error');
        }
    };

    React.useEffect(() => {
        const init = async () => {
            try {
                const accessToken = window.localStorage.getItem('accessToken');
                if (accessToken && verifyToken(accessToken)) {
                    setSession(accessToken);
                    const response = await axios.get('/auth/user');
                    const { user } = response.data.data;
                    setUser(user);
                    setIsAuthenticated(true);

                    if (location.pathname !== '/') {
                        navigate(location.pathname);
                    } else {
                        navigate('/dashboard');
                    }
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                    setAccessableUrls([]);
                }
            } catch (err) {
                openTostar(err?.message || err, 'error');
                setUser(null);
                setIsAuthenticated(false);
            }
        };
        init();
    }, []);

    React.useEffect(() => {
        if (isAuthenticated) {
            fetchMenu();
        }
    }, [isAuthenticated]);

    React.useEffect(() => {
        checkAccessableUrls();
    }, [menu]);

    const login = async (data) => {
        try {
            const response = await axios.post('/auth/login', data);
            setUser(response.data.data.user);
            setIsAuthenticated(true);
            setSession(response.data.data.accessToken);
            navigate('/dashboard');
        } catch (error) {
            openTostar(error?.message || error, 'error');
        }
    };

    const logOut = async () => {
        try {
            await axios.get('/auth/logout');
        } catch (error) {
            openTostar(error?.message || error, 'error');
        } finally {
            setUser(null);
            setIsAuthenticated(false);
            window.localStorage.removeItem('accessToken');
        }
    };

    return (
        <>
            <SnackbarComponent />
            <AuthContext.Provider
                value={{
                    isAuthenticated,
                    user,
                    menu,
                    accessableUrls,
                    setIsAuthenticated,
                    setUser,
                    login,
                    logOut
                }}
            >
                {children}
            </AuthContext.Provider>
        </>
    );
};

export default AuthContext;
