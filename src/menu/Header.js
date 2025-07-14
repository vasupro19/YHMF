import { AppBar, Box, Container, Grid, IconButton, Menu, MenuItem, Toolbar, Typography } from '@mui/material';
import { useState } from 'react';

// custom hook
import useAuth from 'customHook/useAuth';

// icon
import { IconSettings } from '@tabler/icons-react';

// constant
const ITEM_HEIGHT = 30;
const drawerWidth = 200;

const Header = () => {
    const { logOut } = useAuth();

    const [menuAnchorEl, setMenuAnchorEl] = useState(null);

    const handleSetting = (event) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handleLogOut = async () => {
        await logOut();
    };

    return (
        <Container maxWidth={false}>
            <div>
                <AppBar
                    position="fixed"
                    component="header"
                    sx={{
                        width: '100% ',
                        ml: `${drawerWidth}px`,
                        background: '#43aed8',
                        color: 'white',
                        boxShadow: 'none',
                        transition: 'width 0.3s ease',
                        zIndex: (theme) => theme.zIndex.drawer + 1
                    }}
                >
                    <Toolbar>
                        <Grid container>
                            {/* <img
                                src="/assets/logo.jpeg"
                                alt="Logo"
                                style={{
                                    width: 250,
                                    height: 60,
                                    borderRadius: '5px'
                                }}
                            /> */}
                            <Typography sx={{ fontWeight: 'bolder', marginLeft: 1, color: 'white', cursor: 'pointer', marginTop: '0.8%' }}>
                                W O R K C H E C K
                            </Typography>
                        </Grid>
                        <Box sx={{ flexGrow: 2 }} />
                        <IconButton
                            aria-label="more"
                            id="long-button"
                            aria-controls={menuAnchorEl ? 'long-menu' : undefined}
                            aria-expanded={menuAnchorEl ? 'true' : undefined}
                            aria-haspopup="true"
                            onClick={handleSetting}
                            sx={{ cursor: 'pointer', color: 'white' }}
                        >
                            <IconSettings />
                        </IconButton>
                        <Menu
                            id="settings-menu"
                            anchorEl={menuAnchorEl}
                            open={Boolean(menuAnchorEl)}
                            onClose={handleMenuClose}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right'
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right'
                            }}
                            PaperProps={{
                                style: {
                                    maxHeight: ITEM_HEIGHT * 4.5,
                                    width: '20ch'
                                }
                            }}
                        >
                            <MenuItem onClick={handleLogOut}>Log Out</MenuItem>
                        </Menu>
                    </Toolbar>
                </AppBar>
            </div>
        </Container>
    );
};

export default Header;
