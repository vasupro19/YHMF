import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { useState } from 'react';

// constant
import { fontFamily } from 'constant/constant';

const useSnackbarAlert = () => {
    const [open, setOpen] = useState(false);
    const [severity, setSeverity] = useState('success'); // Default severity
    const [message, setMessage] = useState('');
    const [anchorOrigin, setAnchorOrigin] = useState({ vertical: 'bottom', horizontal: 'right' });

    const openTostar = (msg, severity = 'success', position = { vertical: 'bottom', horizontal: 'right' }) => {
        setMessage(msg);
        setSeverity(severity);
        setAnchorOrigin(position);
        setOpen(true);
    };

    const closeTostar = () => {
        setOpen(false);
    };

    const SnackbarComponent = () => (
        <Snackbar open={open} autoHideDuration={2000} anchorOrigin={anchorOrigin} onClose={closeTostar}>
            <Alert onClose={closeTostar} severity={severity} variant="filled" sx={{ width: '100%', fontFamily: fontFamily }}>
                {message}
            </Alert>
        </Snackbar>
    );

    return { openTostar, closeTostar, SnackbarComponent };
};

export default useSnackbarAlert;
