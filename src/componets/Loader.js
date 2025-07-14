import React from 'react';
import styled from '@mui/system/styled'; // Correct import for styled from @mui/system
import { CircularProgress, Grid } from '@mui/material';

// styles
const LoaderWrapper = styled('div')({
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 1301,
    width: '100%',
    height: '100%', // Add this line to make the loader cover the whole screen vertically
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Optional: Add a semi-transparent background
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
});

// ==============================|| LOADER ||============================== //

const Loader = () => (
    <LoaderWrapper>
        <Grid container spacing={2} justifyContent="center">
            <Grid item>
                <CircularProgress color="secondary" aria-label="progress with secondary color" />
            </Grid>
        </Grid>
    </LoaderWrapper>
);

export default Loader;
