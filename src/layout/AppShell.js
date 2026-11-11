import { useState } from 'react';
import { Box, Drawer } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const WIDE = 268;
const NARROW = 76;

const AppShell = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(() => {
        try {
            return localStorage.getItem('sidebarCollapsed') === '1';
        } catch (e) {
            return false;
        }
    });

    const toggleCollapse = () =>
        setCollapsed((c) => {
            try {
                localStorage.setItem('sidebarCollapsed', c ? '0' : '1');
            } catch (e) {
                /* ignore */
            }
            return !c;
        });

    const width = collapsed ? NARROW : WIDE;

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Drawer
                variant="permanent"
                open
                sx={{
                    display: { xs: 'none', md: 'block' },
                    width,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': { width, boxSizing: 'border-box', border: 0, transition: 'width .2s', overflowX: 'hidden' }
                }}
            >
                <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />
            </Drawer>
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                ModalProps={{ keepMounted: true }}
                sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: WIDE } }}
            >
                <Sidebar collapsed={false} showCollapse={false} onNavigate={() => setMobileOpen(false)} />
            </Drawer>

            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <Header onOpenMenu={() => setMobileOpen(true)} />
                <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 3 }, maxWidth: 1440, width: '100%', mx: 'auto' }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default AppShell;
