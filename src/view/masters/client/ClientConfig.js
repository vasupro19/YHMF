import { Button, Checkbox, DialogTitle, Divider, Grid, Typography } from '@mui/material';
import MainCard from 'componets/MainCard';
import React, { useEffect, useState } from 'react';
import useSnackbarAlert from 'customHook/alert';

// api
import { getUserMenuConfig } from 'api/user/useApi';

const ClientConfig = ({ userDetail, menuList, handleCancel, updateClientConfig, fontFamily }) => {
    const { openTostar, SnackbarComponent } = useSnackbarAlert();

    const [checkedMenus, setCheckedMenus] = useState({});
    const [alreadyUserConfig, setAlreadyUserConfig] = useState([]);
    const [userConfig, setUserConfig] = useState(false);

    const fetchClientMenuConfig = async () => {
        try {
            const response = await getUserMenuConfig({ email: userDetail?.email });
            if (typeof response === 'string') {
                openTostar(response, 'error');
            } else {
                setAlreadyUserConfig(response);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const groupMenusByGroup = (menus) => {
        const grouped = {};
        menus.forEach((menu) => {
            if (!grouped[menu.group]) grouped[menu.group] = [];
            grouped[menu.group].push(menu);
        });
        return grouped;
    };

    const handleMenuCheckboxChange = (menuId, isChecked) => {
        setCheckedMenus((prev) => ({
            ...prev,
            [menuId]: isChecked
        }));
    };

    const handleSubmitOrUpdate = () => {
        const config = Object.entries(checkedMenus)
            .filter(([_, checked]) => checked)
            .map(([menuId]) => menuId);

        updateClientConfig({ menuIds: config, email: userDetail.email });
    };

    useEffect(() => {
        if (alreadyUserConfig && Array.isArray(alreadyUserConfig)) {
            const menuIdMap = {};
            alreadyUserConfig.forEach((item) => {
                if (item.menuId) {
                    menuIdMap[item.menuId] = true;
                }
            });
            setCheckedMenus(menuIdMap);
            setUserConfig(Object.keys(menuIdMap).length > 0);
        }
    }, [alreadyUserConfig]);

    React.useEffect(() => {
        fetchClientMenuConfig();
    }, []);

    const groupedMenus = groupMenusByGroup(menuList || []);

    return (
        <>
            <SnackbarComponent />
            <MainCard sx={{ overflow: 'visible' }}>
                <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bolder', fontFamily }} variant="h4" color="secondary">
                    Client Configuration
                </DialogTitle>

                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead>
                        <tr>
                            <th style={{ fontFamily, textAlign: 'left', padding: 10 }}>Menu</th>
                            <th style={{ fontFamily, textAlign: 'center' }}>Select</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(groupedMenus).map(([group, menus]) => (
                            <React.Fragment key={group}>
                                <tr>
                                    <td colSpan="2">
                                        <Typography
                                            variant="h5"
                                            sx={{
                                                mb: 1,
                                                textAlign: 'center',
                                                fontFamily,
                                                backgroundColor: '#f0f0f0',
                                                p: 1,
                                                borderRadius: 1
                                            }}
                                        >
                                            {group.toUpperCase()}
                                        </Typography>
                                    </td>
                                </tr>
                                {menus.map((menu) => (
                                    <React.Fragment key={menu.id}>
                                        <tr>
                                            <td>
                                                <Typography sx={{ fontFamily }}>{menu.label}</Typography>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <Checkbox
                                                    color="secondary"
                                                    checked={checkedMenus[menu.id] || false}
                                                    onChange={(e) => handleMenuCheckboxChange(menu.id, e.target.checked)}
                                                />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan="2" style={{ padding: 0 }}>
                                                <Divider sx={{ my: 1 }} />
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>

                <Grid item xs={12} display="flex" justifyContent="center" marginTop="1%">
                    <Grid item xs={3} marginRight="10px">
                        <Button
                            variant="contained"
                            color={userConfig ? 'secondary' : 'primary'}
                            onClick={handleSubmitOrUpdate}
                            sx={{ fontFamily }}
                        >
                            {userConfig ? 'Update' : 'Submit'}
                        </Button>
                    </Grid>
                    <Grid item xs={3}>
                        <Button variant="contained" color="primary" onClick={handleCancel} sx={{ fontFamily }}>
                            Cancel
                        </Button>
                    </Grid>
                </Grid>
            </MainCard>
        </>
    );
};

export default ClientConfig;
