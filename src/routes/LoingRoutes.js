import { lazy } from 'react';

// project imports
import Loadable from '../componets/Loadable';
import GuestGuard from '../guard/guestGuard';

const LogIn = Loadable(lazy(() => import('../view/login')));

const LogInRoutes = {
    path: '/',
    element: (
        <GuestGuard>
            <LogIn />
        </GuestGuard>
    ),
    children: [
        {
            path: '/',
            element: <LogIn />
        }
    ]
};

export default LogInRoutes;
