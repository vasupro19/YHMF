import { Box } from '@mui/material';

// the YHM mark: a "Y" (also a key and a hotel sign), with a gold dot
const Logo = ({ size = 38 }) => (
    <Box component="svg" viewBox="0 0 40 40" width={size} height={size} aria-hidden sx={{ flexShrink: 0, display: 'block' }}>
        <defs>
            <linearGradient id="yhm-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#4a6fc0" />
                <stop offset="1" stopColor="#14264a" />
            </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill="url(#yhm-g)" />
        <path d="M11.5 10.5 20 21l8.5-10.5M20 21v8" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="20" cy="33" r="2.4" fill="#e5b45a" />
    </Box>
);

export default Logo;
