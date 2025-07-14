// icons
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import MenuIcon from '@mui/icons-material/Menu';
import * as MuiIcons from '@mui/icons-material';

import {
    Box,
    Collapse,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Popover,
    Toolbar,
    Typography
} from '@mui/material';
import { useState } from 'react';

const Sidebar = ({ drawerWidth, accessableMenuList, handleMenuItemClick, isDrawerOpen, handleDrawer, fontFamily }) => {
    const [openGroups, setOpenGroups] = useState({});
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [popoverItems, setPopoverItems] = useState([]);

    const handleGroupSelection = (group) => {
        setSelectedGroup(group);
        setOpenGroups((prevState) => ({
            ...prevState,
            [group]: !prevState[group]
        }));
    };

    const renderIcon = (iconName) => {
        const IconComponent = MuiIcons[iconName];
        return IconComponent ? <IconComponent /> : null;
    };

    const handlePopoverOpen = (event, items, group) => {
        if (!isDrawerOpen) {
            setSelectedGroup(group);
            setAnchorEl(event.currentTarget);
            setPopoverItems(items);
        }
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
        setPopoverItems([]);
    };

    const handleItemSelection = (menu) => {
        setSelectedItem(menu.label);
        handleMenuItemClick(menu.url, menu.label);
        handlePopoverClose();
    };

    return (
        <Drawer
            sx={{
                width: isDrawerOpen ? drawerWidth : 72,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    height: '85%',
                    width: isDrawerOpen ? drawerWidth : 72,
                    boxSizing: 'border-box',
                    overflowX: 'hidden',
                    transition: 'width 0.3s ease',
                    background: '#43aed8',
                    borderRadius: '10px',
                    marginLeft: '1%',
                    mt: 12
                }
            }}
            variant="permanent"
            anchor="left"
        >
            <Toolbar>
                <IconButton
                    sx={{
                        color: 'white',
                        pl: 0
                    }}
                    onClick={handleDrawer}
                >
                    <MenuIcon />
                </IconButton>
            </Toolbar>
            <List disablePadding>
                {accessableMenuList.map((menu) => (
                    <div key={menu.group}>
                        <Divider />
                        <ListItem
                            disablePadding
                            sx={{
                                backgroundColor: selectedGroup === menu.group ? '#bbeeff' : 'inherit',
                                '&:hover': {
                                    backgroundColor: '#aadcee'
                                },
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: isDrawerOpen ? 'start' : 'center'
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: '100%',
                                    paddingLeft: isDrawerOpen ? 2 : 0,
                                    justifyContent: 'center'
                                }}
                            >
                                <IconButton
                                    sx={{
                                        color: selectedGroup === menu.group ? 'primary.main' : 'white',
                                        '&:hover': {
                                            color: 'primary.main'
                                        }
                                    }}
                                    onClick={(event) => handlePopoverOpen(event, menu.items, menu.group)}
                                >
                                    {renderIcon(menu.icon)}
                                </IconButton>
                                {isDrawerOpen && (
                                    <ListItemButton
                                        onClick={() => handleGroupSelection(menu.group)}
                                        sx={{
                                            flexGrow: 1,
                                            '&:hover .MuiTypography-root': {
                                                color: 'primary.main'
                                            }
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Typography
                                                    sx={{
                                                        fontWeight: 600,
                                                        fontSize: '16px',
                                                        fontFamily: fontFamily,
                                                        textAlign: 'center',
                                                        color: selectedGroup === menu.group ? 'primary.main' : 'white'
                                                    }}
                                                >
                                                    {menu.group}
                                                </Typography>
                                            }
                                        />
                                    </ListItemButton>
                                )}
                                {isDrawerOpen && (
                                    <IconButton
                                        onClick={() => handleGroupSelection(menu.group)}
                                        sx={{
                                            color: selectedGroup === menu.group ? 'primary.main' : 'white',
                                            '&:hover': {
                                                color: 'primary.main'
                                            }
                                        }}
                                    >
                                        {openGroups[menu.group] ? <ExpandLess /> : <ExpandMore />}
                                    </IconButton>
                                )}
                            </Box>
                        </ListItem>

                        <Collapse in={openGroups[menu.group] && isDrawerOpen} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding sx={{ pl: 2 }}>
                                {menu.items.map((subMenu, index) => (
                                    <ListItem key={index} disablePadding>
                                        <ListItemButton
                                            onClick={() => {
                                                handleItemSelection(subMenu);
                                                setSelectedGroup(menu.group);
                                            }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Typography
                                                        sx={{
                                                            fontSize: selectedItem === subMenu.label ? '18px' : '14px',
                                                            color: selectedItem === subMenu.label ? 'white' : 'white',
                                                            fontWeight: selectedItem === subMenu.label ? 'bold' : '',
                                                            textAlign: 'center',
                                                            fontFamily: fontFamily
                                                        }}
                                                    >
                                                        {subMenu.label}
                                                    </Typography>
                                                }
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </Collapse>
                    </div>
                ))}
            </List>

            {/* Popover for menu items */}
            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right'
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center'
                }}
                sx={{
                    marginLeft: '3%'
                }}
            >
                <List sx={{ width: '150px' }}>
                    {popoverItems.map((menu) => (
                        <ListItem
                            key={menu.id}
                            button
                            onClick={() => {
                                handleItemSelection(menu);
                            }}
                            sx={{
                                '&:hover': { backgroundColor: '#bbeeff' }
                            }}
                        >
                            <ListItemText primary={menu.label} />
                        </ListItem>
                    ))}
                </List>
            </Popover>
        </Drawer>
    );
};

export default Sidebar;
