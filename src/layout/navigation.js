import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import BookOnlineOutlinedIcon from '@mui/icons-material/BookOnlineOutlined';
import ContactsOutlinedIcon from '@mui/icons-material/ContactsOutlined';
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined';
import SellOutlinedIcon from '@mui/icons-material/SellOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import HistoryIcon from '@mui/icons-material/History';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';

// the backend stores the menu (label/url/group); the look of each entry lives here
export const ICONS = {
    '/dashboard': DashboardOutlinedIcon,
    '/hotel/calendar': CalendarMonthOutlinedIcon,
    '/hotel/bookings': BookOnlineOutlinedIcon,
    '/hotel/customers': ContactsOutlinedIcon,
    '/hotel/rooms': MeetingRoomOutlinedIcon,
    '/hotel/room-types': SellOutlinedIcon,
    '/hotel/staff': BadgeOutlinedIcon,
    '/hotel/payroll': PaymentsOutlinedIcon,
    '/hotel/reports': AssessmentOutlinedIcon,
    '/hotel/settings': SettingsOutlinedIcon,
    '/hotel/activity': HistoryIcon,
    '/hotel/import': UploadFileOutlinedIcon,
    '/master/role': AdminPanelSettingsOutlinedIcon,
    '/master/user': PeopleAltOutlinedIcon,
    '/master/client': HotelOutlinedIcon
};

export const iconFor = (url) => ICONS[url] || CircleOutlinedIcon;

export const GROUP_LABELS = { frontdesk: 'Front desk', property: 'Property', people: 'People', reports: 'Insights', master: 'Setup' };
export const GROUP_ORDER = ['frontdesk', 'property', 'people', 'reports', 'master'];

export const TITLES = {
    '/dashboard': 'Dashboard',
    '/hotel/calendar': 'Calendar',
    '/hotel/bookings': 'Bookings',
    '/hotel/customers': 'Guests',
    '/hotel/rooms': 'Rooms',
    '/hotel/room-types': 'Room types & rates',
    '/hotel/staff': 'Staff',
    '/hotel/payroll': 'Payroll',
    '/hotel/reports': 'Reports',
    '/hotel/settings': 'Hotel settings',
    '/hotel/activity': 'Activity log',
    '/hotel/import': 'Import data',
    '/master/role': 'Roles',
    '/master/user': 'Users',
    '/master/client': 'Clients'
};
