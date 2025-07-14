import { Box, Container, Grid, Typography } from '@mui/material';

const Footer = () => {
    return (
        <Box
            component="footer"
            sx={{
                background: '#43aed8',
                color: 'white',
                py: 3,
                mt: 1,
                width: '82vw',
                float: 'right',
                borderRadius: '5px'
            }}
        >
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    {/* Column 1 */}
                    {/* <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                            About Us
                        </Typography>
                        <Typography variant="body2">
                            We are committed to providing the best services and building meaningful experiences.
                        </Typography>
                    </Grid> */}

                    {/* Column 2 */}
                    {/* <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Quick Links
                        </Typography>
                        <Box>
                            <Link href="/about" color="inherit" underline="hover" display="block">
                                About Us
                            </Link>
                            <Link href="/services" color="inherit" underline="hover" display="block">
                                Services
                            </Link>
                            <Link href="/contact" color="inherit" underline="hover" display="block">
                                Contact
                            </Link>
                        </Box>
                    </Grid> */}

                    {/* Column 3 */}
                    {/* <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Contact Us
                        </Typography>
                        <Typography variant="body2">Shimla, H.P</Typography>
                        <Typography variant="body2">Phone: (91) 86278-14292</Typography>
                        <Typography variant="body2">Email: 1310ranjan1997.com</Typography>
                    </Grid> */}

                    {/* Column 4 */}
                    {/* <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Follow Us
                        </Typography>
                        <Box>
                            <Link href="#" color="inherit" underline="hover" display="block">
                                Facebook
                            </Link>
                            <Link href="#" color="inherit" underline="hover" display="block">
                                Twitter
                            </Link>
                            <Link href="#" color="inherit" underline="hover" display="block">
                                Instagram
                            </Link>
                        </Box>
                    </Grid> */}
                </Grid>

                {/* Footer Bottom */}
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Typography variant="body2" fontSize="12px" color="white">
                        © {new Date().getFullYear()} Ranjan Chauhan. All rights reserved.
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
};

export default Footer;
