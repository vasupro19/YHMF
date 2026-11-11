import { Box, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Tooltip, Typography } from '@mui/material';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import { NavLink } from 'react-router-dom';
import Logo from 'components/Logo';
import { T } from 'components/Theme';
import { useAuth } from 'context/Auth';
import { GROUP_LABELS, GROUP_ORDER, iconFor } from './navigation';

const NavItem = ({ to, label, collapsed, onNavigate }) => {
    const Icon = iconFor(to);
    const button = (
        <ListItemButton
            component={NavLink}
            to={to}
            onClick={onNavigate}
            sx={{
                position: 'relative',
                borderRadius: '6px',
                mb: '2px',
                minHeight: 34,
                px: collapsed ? 0 : 1.25,
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: T.ink2,
                '&:hover': { bgcolor: 'rgba(28,26,25,0.045)', color: T.ink },
                '&.active': {
                    bgcolor: T.brandTint,
                    color: T.brand,
                    '& .MuiListItemText-primary': { fontWeight: 600 },
                    '&::before': collapsed ? undefined : { content: '""', position: 'absolute', left: -10, top: 8, bottom: 8, width: 3, borderRadius: '0 3px 3px 0', bgcolor: T.brand }
                }
            }}
        >
            <ListItemIcon sx={{ minWidth: collapsed ? 0 : 30, color: 'inherit', justifyContent: 'center' }}>
                <Icon sx={{ fontSize: 18 }} />
            </ListItemIcon>
            {!collapsed && <ListItemText primary={label} primaryTypographyProps={{ fontSize: 13, fontWeight: 500, noWrap: true }} />}
        </ListItemButton>
    );
    return collapsed ? (
        <Tooltip title={label} placement="right">
            {button}
        </Tooltip>
    ) : (
        button
    );
};

const Sidebar = ({ collapsed, onToggleCollapse, onNavigate, showCollapse = true }) => {
    const { menu, user, isAdmin } = useAuth();

    const groups = menu.reduce((acc, item) => {
        (acc[item.group] = acc[item.group] || []).push(item);
        return acc;
    }, {});
    const orderedGroups = [...GROUP_ORDER.filter((g) => groups[g]), ...Object.keys(groups).filter((g) => !GROUP_ORDER.includes(g))];

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: T.panel, borderRight: `1px solid ${T.line}` }}>
            <Box sx={{ height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', px: collapsed ? 0 : 2, justifyContent: collapsed ? 'center' : 'flex-start', borderBottom: `1px solid ${T.line}` }}>
                <Logo size={30} showText={!collapsed} />
            </Box>

            {!collapsed && (
                <Box sx={{ mx: 1.5, mt: 1.5, px: 1.25, py: 1, borderRadius: '6px', bgcolor: T.subtle, border: `1px solid ${T.line}` }}>
                    <Typography sx={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.ink3 }}>{isAdmin ? 'Platform' : 'Property'}</Typography>
                    <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{isAdmin ? 'YHM administration' : user?.name}</Typography>
                </Box>
            )}

            <Box component="nav" aria-label="Main" sx={{ flex: 1, overflowY: 'auto', px: collapsed ? 1 : 1.5, pt: 1.5, pb: 2 }}>
                <List disablePadding>
                    <NavItem to="/dashboard" label={isAdmin ? 'Overview' : 'Today'} collapsed={collapsed} onNavigate={onNavigate} />
                </List>
                {orderedGroups.map((g) => (
                    <Box key={g} sx={{ mt: collapsed ? 1 : 2 }}>
                        {collapsed ? (
                            <Box sx={{ height: '1px', bgcolor: T.line, mx: 1, mb: 1 }} />
                        ) : (
                            <Typography sx={{ px: 1.25, mb: 0.5, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.ink3 }}>{GROUP_LABELS[g] || g}</Typography>
                        )}
                        <List disablePadding>
                            {groups[g].map((item) => (
                                <NavItem key={item.id} to={item.url} label={item.label} collapsed={collapsed} onNavigate={onNavigate} />
                            ))}
                        </List>
                    </Box>
                ))}
            </Box>

            {showCollapse && (
                <Box sx={{ borderTop: `1px solid ${T.line}`, p: 1, display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end' }}>
                    <Tooltip title={collapsed ? 'Expand menu' : 'Collapse menu'} placement="right">
                        <IconButton size="small" onClick={onToggleCollapse} aria-label={collapsed ? 'Expand menu' : 'Collapse menu'} sx={{ color: T.ink3 }}>
                            {collapsed ? <KeyboardDoubleArrowRightIcon fontSize="small" /> : <KeyboardDoubleArrowLeftIcon fontSize="small" />}
                        </IconButton>
                    </Tooltip>
                </Box>
            )}
        </Box>
    );
};

export default Sidebar;
