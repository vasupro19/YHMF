import { Box, Button } from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { Link } from 'react-router-dom';
import EmptyState from 'components/EmptyState';

const NotFound = () => (
    <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <EmptyState
            icon={<SearchOffIcon />}
            title="Page not found"
            text="The page you're looking for doesn't exist or has moved."
            action={
                <Button component={Link} to="/dashboard" variant="outlined" color="inherit">
                    Go to home
                </Button>
            }
        />
    </Box>
);

export default NotFound;
