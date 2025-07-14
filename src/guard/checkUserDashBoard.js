import { lazy, useEffect, useState } from 'react';
import Loadable from '../componets/Loadable';
import useAuth from '../customHook/useAuth';

// Lazy-load the dashboard component
const DashBoard = Loadable(lazy(() => import('../view/defaultDashboard')));

// Function to return the correct dashboard component based on role
const checkUserRole = (user) => {
    switch (user?.role?.name) {
        case 'ADMIN':
            return <DashBoard />;
        case 'CLIENT':
            return <div>Client Dashboard</div>;
        case 'USER':
            return <div>User Dashboard</div>;
        default:
            return <div>No Access</div>;
    }
};

const CheckUserDashBoard = () => {
    const { isAuthenticated, user } = useAuth();
    const [dashboardComponent, setDashboardComponent] = useState(null);

    useEffect(() => {
        if (isAuthenticated && user) {
            setDashboardComponent(checkUserRole(user));
        }
    }, [isAuthenticated, user]);

    if (!isAuthenticated) return <div>Loading...</div>;

    return dashboardComponent;
};

export default CheckUserDashBoard;
