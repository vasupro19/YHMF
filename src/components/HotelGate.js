import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import useHotel from 'hooks/useHotel';
import EmptyState from './EmptyState';

// hotel screens belong to a hotel (client) account; platform admins don't have one
const HotelGate = ({ children }) => {
    const { clientId } = useHotel();
    if (!clientId) return <EmptyState icon={<HotelOutlinedIcon fontSize="large" />} title="Sign in as a hotel" text="These screens show a hotel's own rooms and bookings, so they need a hotel account." />;
    return children;
};

export default HotelGate;
