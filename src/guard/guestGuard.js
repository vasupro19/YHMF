/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../customHook/useAuth';
import useSnackbarAlert from 'customHook/alert';

const GuestGuard = ({ children }) => {
    const { openTostar, SnackbarComponent } = useSnackbarAlert();
    // const { menu } = useSelector((state) => state.menu);
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const token = window.localStorage.getItem('accessToken');
        if (!token) {
            if (!user || !isAuthenticated) {
                navigate('/');
                openTostar('User role not found', 'error');
            }
        }
    }, [isAuthenticated, user]);

    return (
        <>
            <SnackbarComponent />
            {children};
        </>
    );
};

export default GuestGuard;
