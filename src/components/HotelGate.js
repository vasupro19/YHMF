import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import useHotel from 'hooks/useHotel';
import EmptyState from './EmptyState';

// hotel screens belong to a hotel (client) account; platform admins don't have one
const HotelGate = ({ children }) => {
    const { clientId } = useHotel();
    if (!clientId) return <EmptyState icon={<HotelOutlinedIcon />} title="Hotel account needed" text="This screen shows one hotel's rooms and bookings. Sign in with that hotel's login to open it." />;
    return children;
};

export default HotelGate;
