import { lazy, Suspense } from 'react';
import { Navigate, useRoutes } from 'react-router-dom';
import AppShell from 'layout/AppShell';
import Loader from 'components/Loader';
import { AuthGuard, GuestGuard, MenuGuard } from 'guards/Guards';
import HotelGate from 'components/HotelGate';

const Login = lazy(() => import('pages/Login'));
const NotFound = lazy(() => import('pages/NotFound'));
const Dashboard = lazy(() => import('pages/Dashboard'));
const Roles = lazy(() => import('pages/Roles'));
const Users = lazy(() => import('pages/Users'));
const Clients = lazy(() => import('pages/Clients'));
const Calendar = lazy(() => import('pages/hotel/Calendar'));
const Bookings = lazy(() => import('pages/hotel/Bookings'));
const BookingDetail = lazy(() => import('pages/hotel/BookingDetail'));
const Invoice = lazy(() => import('pages/hotel/Invoice'));
const Customers = lazy(() => import('pages/hotel/Customers'));
const Rooms = lazy(() => import('pages/hotel/Rooms'));
const RoomTypes = lazy(() => import('pages/hotel/RoomTypes'));
const Staff = lazy(() => import('pages/hotel/Staff'));
const Payroll = lazy(() => import('pages/hotel/Payroll'));
const Reports = lazy(() => import('pages/hotel/Reports'));
const HotelSettings = lazy(() => import('pages/hotel/Settings'));
const Activity = lazy(() => import('pages/hotel/Activity'));
const ImportData = lazy(() => import('pages/hotel/Import'));
const Setup = lazy(() => import('pages/Setup'));
const GuestBill = lazy(() => import('pages/GuestBill'));
const ForgotPassword = lazy(() => import('pages/ForgotPassword'));
const ResetPassword = lazy(() => import('pages/ResetPassword'));

const guarded = (url, element) => <MenuGuard url={url}>{element}</MenuGuard>;
const hotel = (url, element) => <MenuGuard url={url}><HotelGate>{element}</HotelGate></MenuGuard>;

export default function AppRoutes() {
    const element = useRoutes([
        {
            path: '/login',
            element: (
                <GuestGuard>
                    <Login />
                </GuestGuard>
            )
        },
        { path: '/b/:token', element: <GuestBill /> },
        { path: '/forgot-password', element: <ForgotPassword /> },
        { path: '/reset-password', element: <ResetPassword /> },
        {
            path: '/',
            element: (
                <AuthGuard>
                    <AppShell />
                </AuthGuard>
            ),
            children: [
                { index: true, element: <Navigate to="/dashboard" replace /> },
                { path: 'dashboard', element: <Dashboard /> },
                { path: 'master/role', element: guarded('/master/role', <Roles />) },
                { path: 'master/user', element: guarded('/master/user', <Users />) },
                { path: 'master/client', element: guarded('/master/client', <Clients />) },
                { path: 'hotel/calendar', element: hotel('/hotel/calendar', <Calendar />) },
                { path: 'hotel/bookings', element: hotel('/hotel/bookings', <Bookings />) },
                { path: 'hotel/bookings/:id', element: hotel('/hotel/bookings', <BookingDetail />) },
                { path: 'hotel/customers', element: hotel('/hotel/customers', <Customers />) },
                { path: 'hotel/rooms', element: hotel('/hotel/rooms', <Rooms />) },
                { path: 'hotel/room-types', element: hotel('/hotel/room-types', <RoomTypes />) },
                { path: 'hotel/staff', element: hotel('/hotel/staff', <Staff />) },
                { path: 'hotel/payroll', element: hotel('/hotel/payroll', <Payroll />) },
                { path: 'hotel/reports', element: hotel('/hotel/reports', <Reports />) },
                { path: 'hotel/settings', element: hotel('/hotel/settings', <HotelSettings />) },
                { path: 'hotel/activity', element: hotel('/hotel/activity', <Activity />) },
                { path: 'hotel/import', element: hotel('/hotel/import', <ImportData />) },
                { path: '*', element: <NotFound /> }
            ]
        },
        {
            path: '/setup',
            element: (
                <AuthGuard>
                    <MenuGuard url="/hotel/settings">
                        <HotelGate>
                            <Setup />
                        </HotelGate>
                    </MenuGuard>
                </AuthGuard>
            )
        },
        {
            path: '/print/booking/:id',
            element: (
                <AuthGuard>
                    <MenuGuard url="/hotel/bookings">
                        <HotelGate>
                            <Invoice />
                        </HotelGate>
                    </MenuGuard>
                </AuthGuard>
            )
        },
        { path: '*', element: <NotFound /> }
    ]);

    return <Suspense fallback={<Loader />}>{element}</Suspense>;
}
