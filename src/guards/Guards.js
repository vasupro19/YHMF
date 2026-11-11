import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from 'context/Auth';
import Loader from 'components/Loader';
import EmptyState from 'components/EmptyState';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

export const AuthGuard = ({ children }) => {
    const { initialising, isAuthenticated } = useAuth();
    const location = useLocation();
    if (initialising) return <Loader />;
    if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    return children;
};

export const GuestGuard = ({ children }) => {
    const { initialising, isAuthenticated } = useAuth();
    const location = useLocation();
    if (initialising) return <Loader />;
    if (isAuthenticated) return <Navigate to={location.state?.from || '/dashboard'} replace />;
    return children;
};

// a screen is only reachable when its url is in the user's assigned menu
export const MenuGuard = ({ url, children }) => {
    const { accessibleUrls } = useAuth();
    if (!accessibleUrls.includes(url)) {
        return (
            <EmptyState
                icon={<LockOutlinedIcon fontSize="large" />}
                title="You don't have access to this page"
                text="Ask your administrator to enable it for your account."
            />
        );
    }
    return children;
};
