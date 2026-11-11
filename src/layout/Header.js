import { useState } from 'react';
import { alpha } from '@mui/material/styles';
import { AppBar, Avatar, Box, Button, Divider, IconButton, ListItemIcon, Menu, MenuItem, Toolbar, Tooltip, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import ChangePasswordDialog from 'components/ChangePasswordDialog';
import AddIcon from '@mui/icons-material/Add';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from 'context/Auth';
import { useColorMode } from 'context/ColorMode';
import { initials } from 'utils/format';

const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

const Header = ({ onOpenMenu }) => {
    const { user, logout, accessibleUrls } = useAuth();
    const { mode, toggle } = useColorMode();
    const { pathname } = useLocation();
    const [anchor, setAnchor] = useState(null);
    const [pwOpen, setPwOpen] = useState(false);
    const hideNew = ['/hotel/calendar', '/hotel/bookings'].includes(pathname) || pathname.startsWith('/hotel/bookings/');

    return (
        <AppBar position="sticky" color="inherit" elevation={0} sx={(t) => ({ bgcolor: alpha(t.palette.background.default, 0.82), backdropFilter: 'blur(10px)', borderBottom: 1, borderColor: 'divider' })}>
            <Toolbar sx={{ gap: 1, minHeight: { xs: 60, sm: 68 } }}>
                <IconButton edge="start" onClick={onOpenMenu} aria-label="Open menu" sx={{ display: { md: 'none' } }}><MenuIcon /></IconButton>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="h6" component="div" noWrap>{user?.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>{today}</Typography>
                </Box>
                {accessibleUrls.includes('/hotel/bookings') && !hideNew && (
                    <Button component={Link} to="/hotel/calendar" variant="contained" startIcon={<AddIcon />} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>New booking</Button>
                )}
                <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                    <IconButton onClick={toggle} aria-label="Toggle colour mode">{mode === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}</IconButton>
                </Tooltip>
                <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label="Account menu" aria-haspopup="true" sx={{ p: 0.5 }}>
                    <Avatar sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 700, bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>{initials(user?.name)}</Avatar>
                </IconButton>
                <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
                    <Box sx={{ px: 2, py: 1, maxWidth: 260 }}>
                        <Typography variant="subtitle2" noWrap>{user?.name}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap component="div">{user?.email}</Typography>
                    </Box>
                    <Divider />
                    <MenuItem onClick={() => { setAnchor(null); setPwOpen(true); }}>
                        <ListItemIcon><LockResetOutlinedIcon fontSize="small" /></ListItemIcon>
                        Change password
                    </MenuItem>
                    <MenuItem onClick={() => { setAnchor(null); logout(); }}>
                        <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                        Log out
                    </MenuItem>
                </Menu>
            </Toolbar>
            <ChangePasswordDialog open={pwOpen} onClose={() => setPwOpen(false)} />
        </AppBar>
    );
};

export default Header;
