import { Box, CircularProgress } from '@mui/material';

const Loader = ({ fullScreen = true }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: fullScreen ? '100vh' : 240, width: '100%' }}>
        <CircularProgress aria-label="Loading" />
    </Box>
);

export default Loader;
