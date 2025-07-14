import { Event, Notifications, People, School } from '@mui/icons-material';
import { Box, Card, CardContent, Grid, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { fontFamily } from 'constant/constant';

export default function SchoolDashboard() {
    return (
        <Grid sx={{ border: '1px solid #e5e5e5', maxHeight: 700, padding: '10px', marginTop: '1%', borderRadius: '5px' }}>
            <Grid container spacing={3}>
                {/* Stats Cards */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <People fontSize="large" />
                            <Typography variant="h6" fontFamily={fontFamily}>
                                Students
                            </Typography>
                            <Typography variant="h4" fontFamily={fontFamily}>
                                1,250
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <School fontSize="large" />
                            <Typography variant="h6" fontFamily={fontFamily}>
                                Teachers
                            </Typography>
                            <Typography variant="h4" fontFamily={fontFamily}>
                                85
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <School fontSize="large" />
                            <Typography variant="h6" fontFamily={fontFamily}>
                                Staff
                            </Typography>
                            <Typography variant="h4" fontFamily={fontFamily}>
                                20
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Event fontSize="large" />
                            <Typography variant="h6" fontFamily={fontFamily}>
                                Events
                            </Typography>
                            <Typography variant="h4" fontFamily={fontFamily}>
                                3
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Notifications List */}
            <Box mt={3}>
                <Typography variant="h6" gutterBottom fontFamily={fontFamily}>
                    Notifications
                </Typography>
                <List>
                    <ListItem>
                        <ListItemIcon>
                            <Notifications />
                        </ListItemIcon>
                        <ListItemText primary="Parent-teacher meeting on Feb 10" />
                    </ListItem>
                    <ListItem>
                        <ListItemIcon>
                            <Notifications />
                        </ListItemIcon>
                        <ListItemText primary="Science fair registrations open" />
                    </ListItem>
                    <ListItem>
                        <ListItemIcon>
                            <Notifications />
                        </ListItemIcon>
                        <ListItemText primary="School holiday on March 5" />
                    </ListItem>
                </List>
            </Box>
        </Grid>
    );
}
