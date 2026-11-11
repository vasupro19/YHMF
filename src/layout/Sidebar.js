import { Avatar, Box, Divider, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Tooltip, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { NavLink } from 'react-router-dom';
import Logo from 'components/Logo';
import { useAuth } from 'context/Auth';
import { APP_NAME, APP_TAGLINE } from 'utils/constants';
import { initials } from 'utils/format';
import { GROUP_LABELS, GROUP_ORDER, iconFor } from './navigation';

const INK = '#0d1a31';
const MUTED = 'rgba(226,232,245,0.62)';
const GOLD = '#e5b45a';

const NavItem = ({ to, label, collapsed, onNavigate }) => {
    const Icon = iconFor(to);
    const button = (
        <ListItemButton
            component={NavLink}
            to={to}
            onClick={onNavigate}
            sx={{
                position: 'relative',
                borderRadius: '10px',
                mb: 0.4,
                px: collapsed ? 0 : 1.5,
                py: 1,
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: MUTED,
                transition: 'background-color .15s, color .15s',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: '#fff' },
                '&.active': { bgcolor: 'rgba(255,255,255,0.1)', color: '#fff', '& .MuiListItemIcon-root': { color: GOLD }, '&::before': { content: '""', position: 'absolute', left: -12, top: 9, bottom: 9, width: 4, borderRadius: '0 4px 4px 0', bgcolor: GOLD } }
            }}
        >
            <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: 'inherit', justifyContent: 'center' }}>
                <Icon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            {!collapsed && <ListItemText primary={label} primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />}
        </ListItemButton>
    );
    return collapsed ? <Tooltip title={label} placement="right">{button}</Tooltip> : button;
};

const Sidebar = ({ collapsed, onToggleCollapse, onNavigate, showCollapse = true }) => {
    const { menu, user } = useAuth();

    const groups = menu.reduce((acc, item) => {
        (acc[item.group] = acc[item.group] || []).push(item);
        return acc;
    }, {});
    const orderedGroups = [...GROUP_ORDER.filter((g) => groups[g]), ...Object.keys(groups).filter((g) => !GROUP_ORDER.includes(g))];

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: `linear-gradient(180deg, ${INK} 0%, #0a1426 100%)`, color: '#fff' }}>
            <Box sx={{ px: collapsed ? 0 : 2.5, height: 72, display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: collapsed ? 'center' : 'flex-start' }}>
                <Logo size={38} />
                {!collapsed && (
                    <Box sx={{ lineHeight: 1.1 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: 20, letterSpacing: '0.02em' }}>{APP_NAME}</Typography>
                        <Typography sx={{ fontSize: 11, color: MUTED, letterSpacing: '0.04em' }}>{APP_TAGLINE}</Typography>
                    </Box>
                )}
            </Box>

            <Box component="nav" aria-label="Main" sx={{ flex: 1, overflowY: 'auto', px: collapsed ? 1 : 1.5, pt: 1, pb: 2, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.15)' } }}>
                <List disablePadding>
                    <NavItem to="/dashboard" label="Dashboard" collapsed={collapsed} onNavigate={onNavigate} />
                </List>
                {orderedGroups.map((g) => (
                    <Box key={g} sx={{ mt: 2.25 }}>
                        {!collapsed ? (
                            <Typography variant="overline" sx={{ px: 1.5, color: 'rgba(226,232,245,0.38)', fontSize: 10.5, display: 'block', mb: 0.5 }}>
                                {GROUP_LABELS[g] || g}
                            </Typography>
                        ) : (
                            <Divider sx={{ mb: 1, borderColor: 'rgba(255,255,255,0.08)' }} />
                        )}
                        <List disablePadding>
                            {groups[g].map((item) => (
                                <NavItem key={item.id} to={item.url} label={item.label} collapsed={collapsed} onNavigate={onNavigate} />
                            ))}
                        </List>
                    </Box>
                ))}
            </Box>

            <Box sx={{ p: 1.5, m: 1.25, borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 1.25, justifyContent: collapsed ? 'center' : 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                    <Avatar sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 700, bgcolor: GOLD, color: '#2a1d05' }}>{initials(user?.name)}</Avatar>
                    {!collapsed && (
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: '#fff' }}>{user?.name}</Typography>
                            <Typography variant="caption" noWrap component="div" sx={{ color: MUTED, textTransform: 'capitalize' }}>{user?.role?.name?.replace(/_/g, ' ').toLowerCase()}</Typography>
                        </Box>
                    )}
                </Box>
                {showCollapse && !collapsed && (
                    <IconButton size="small" onClick={onToggleCollapse} aria-label="Collapse sidebar" sx={{ color: MUTED }}><ChevronLeftIcon /></IconButton>
                )}
            </Box>
            {showCollapse && collapsed && (
                <IconButton size="small" onClick={onToggleCollapse} aria-label="Expand sidebar" sx={{ color: MUTED, mx: 'auto', mb: 1.5 }}><ChevronRightIcon /></IconButton>
            )}
        </Box>
    );
};

export default Sidebar;
