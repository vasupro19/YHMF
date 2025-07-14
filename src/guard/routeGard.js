import Loadable from 'componets/Loadable';
import { lazy, useEffect, useState } from 'react';
import useAuth from '../customHook/useAuth';

const MaintenanceError = Loadable(lazy(() => import('../componets/Error')));

function RouteGard(props) {
    const { Component, url } = props;
    const { accessableUrls } = useAuth();

    const [show, setShow] = useState(true);

    const checkAccess = () => {
        if (accessableUrls.includes(url)) {
            setShow(true);
        } else {
            setShow(false);
        }
    };

    useEffect(() => {
        checkAccess();
    }, [url, accessableUrls]);

    return show ? <Component /> : <MaintenanceError />;
}

export default RouteGard;
