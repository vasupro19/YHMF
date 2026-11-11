import { useState } from 'react';
import { AppBar, Avatar, Box, Breadcrumbs, Button, Divider, IconButton, InputAdornment, InputBase, ListItemIcon, Menu, MenuItem, Toolbar, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ChangePasswordDialog from 'components/ChangePasswordDialog';
import { T } from 'components/Theme';
import { useAuth } from 'context/Auth';
import { initials } from 'utils/format';
import { GROUP_LABELS, TITLES } from './navigation';

const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

// "Front desk / Bookings / BK-1042" from the current address and the user's menu
const useCrumbs = () => {
    const { pathname } = useLocation();
    const { menu } = useAuth();
    if (pathname === '/dashboard') return [];
    const base = Object.keys(TITLES).filter((u) => pathname === u || pathname.startsWith(`${u}/`)).sort((a, b) => b.length - a.length)[0];
    if (!base) return [];
    const group = menu.find((m) => m.url === base)?.group;
    const crumbs = [];
    if (group && GROUP_LABELS[group]) crumbs.push({ label: GROUP_LABELS[group] });
    crumbs.push({ label: TITLES[base], to: pathname !== base ? base : undefined });
    if (pathname !== base) crumbs.push({ label: 'Details' });
    return crumbs;
};

const Header = ({ onOpenMenu }) => {
    const { user, logout, accessibleUrls, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [anchor, setAnchor] = useState(null);
    const [pwOpen, setPwOpen] = useState(false);
    const [q, setQ] = useState('');
    const crumbs = useCrumbs();
    const canBook = accessibleUrls.includes('/hotel/bookings');
    const roleName = isAdmin ? 'Administrator' : (user?.role?.name || '').replace(/_/g, ' ').toLowerCase();

    const search = (e) => {
        e.preventDefault();
        const term = q.trim();
        if (!term) return;
        navigate(`/hotel/bookings?q=${encodeURIComponent(term)}`);
        setQ('');
    };

    return (
        <AppBar position="sticky" color="inherit" elevation={0} sx={{ bgcolor: T.panel, borderBottom: `1px solid ${T.line}` }}>
            <Toolbar disableGutters sx={{ gap: 1.5, minHeight: '56px !important', px: { xs: 1.5, sm: 2.5 } }}>
                <IconButton onClick={onOpenMenu} aria-label="Open menu" sx={{ display: { md: 'none' } }}>
                    <MenuIcon />
                </IconButton>

                <Box sx={{ minWidth: 0, flexShrink: 1, display: { xs: 'none', sm: 'block' } }}>
                    {crumbs.length ? (
                        <Breadcrumbs separator="/" sx={{ fontSize: 13, '& .MuiBreadcrumbs-separator': { color: T.line2, mx: 0.75 } }}>
                            {crumbs.map((c, i) =>
                                c.to ? (
                                    <Typography key={i} component={Link} to={c.to} sx={{ fontSize: 13, color: T.ink2, textDecoration: 'none', '&:hover': { color: T.ink, textDecoration: 'underline' } }}>{c.label}</Typography>
                                ) : (
                                    <Typography key={i} sx={{ fontSize: 13, color: i === crumbs.length - 1 ? T.ink : T.ink3, fontWeight: i === crumbs.length - 1 ? 600 : 400 }}>{c.label}</Typography>
                                )
                            )}
                        </Breadcrumbs>
                    ) : (
                        <Typography sx={{ fontSize: 13, color: T.ink3 }}>{today}</Typography>
                    )}
                </Box>

                <Box sx={{ flex: 1 }} />

                {canBook && (
                    <Box component="form" onSubmit={search} role="search" sx={{ display: { xs: 'none', md: 'block' } }}>
                        <InputBase
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search guest, phone, booking no., room"
                            inputProps={{ 'aria-label': 'Search bookings' }}
                            startAdornment={<InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: T.ink3 }} /></InputAdornment>}
                            sx={{ width: { md: 300, lg: 360 }, height: 34, px: 1.25, fontSize: 13, bgcolor: T.subtle, border: `1px solid ${T.line}`, borderRadius: '6px', '&.Mui-focused': { bgcolor: '#fff', borderColor: T.brand, boxShadow: '0 0 0 3px rgba(122,31,43,.12)' } }}
                        />
                    </Box>
                )}

                {canBook && (
                    <Button component={Link} to="/hotel/calendar?new=1" variant="contained" startIcon={<AddIcon />} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                        New booking
                    </Button>
                )}

                <Divider orientation="vertical" flexItem sx={{ my: 1.5, display: { xs: 'none', sm: 'block' } }} />

                <Box component="button" type="button" onClick={(e) => setAnchor(e.currentTarget)} aria-label="Account menu" aria-haspopup="true"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, border: 0, bgcolor: 'transparent', cursor: 'pointer', p: 0.5, pr: 0.75, borderRadius: '6px', font: 'inherit', color: 'inherit', '&:hover': { bgcolor: 'rgba(28,26,25,0.045)' } }}>
                    <Avatar sx={{ width: 30, height: 30, fontSize: 12, bgcolor: T.brandTint, color: T.brand, border: `1px solid ${T.brandLine}` }}>{initials(user?.name)}</Avatar>
                    <Box sx={{ textAlign: 'left', display: { xs: 'none', lg: 'block' }, maxWidth: 160 }}>
                        <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{user?.name}</Typography>
                        <Typography noWrap sx={{ fontSize: 11.5, color: T.ink3, textTransform: 'capitalize', lineHeight: 1.2 }}>{roleName}</Typography>
                    </Box>
                    <KeyboardArrowDownIcon sx={{ fontSize: 18, color: T.ink3, display: { xs: 'none', lg: 'block' } }} />
                </Box>
                <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} slotProps={{ paper: { sx: { minWidth: 220, mt: 0.5 } } }}>
                    <Box sx={{ px: 2, py: 1.25 }}>
                        <Typography noWrap sx={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</Typography>
                        <Typography noWrap sx={{ fontSize: 12, color: T.ink3 }}>{user?.email}</Typography>
                    </Box>
                    <Divider />
                    <MenuItem onClick={() => { setAnchor(null); setPwOpen(true); }}>
                        <ListItemIcon><LockResetOutlinedIcon fontSize="small" /></ListItemIcon>
                        Change password
                    </MenuItem>
                    <MenuItem onClick={() => { setAnchor(null); logout(); }}>
                        <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                        Sign out
                    </MenuItem>
                </Menu>
            </Toolbar>
            <ChangePasswordDialog open={pwOpen} onClose={() => setPwOpen(false)} />
        </AppBar>
    );
};

export default Header;
