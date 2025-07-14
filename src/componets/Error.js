// Material-UI
import { Card, CardContent, Grid, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const ErrorWrapper = styled('div')({
    maxWidth: 400,
    margin: '0 auto',
    textAlign: 'center',
    padding: '20px'
});

const ErrorCard = styled(Card)({
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'none'
});

const ErrorText = styled(Typography)({
    fontSize: '1.5rem',
    fontWeight: 600,
    marginBottom: '15px'
});

const ErrorDescription = styled(Typography)({
    fontSize: '1rem',
    color: '#666',
    marginBottom: '20px'
});

// ==============================|| SIMPLE ERROR PAGE ||============================== //

const Error = () => {
    return (
        <ErrorCard>
            <CardContent>
                <Grid container justifyContent="center">
                    <Grid item xs={12}>
                        <ErrorWrapper>
                            <ErrorText variant="h2">Oops! Page not found.</ErrorText>
                            <ErrorDescription variant="body2">
                                The page you are looking for might have been removed or is temporarily unavailable.
                            </ErrorDescription>
                        </ErrorWrapper>
                    </Grid>
                </Grid>
            </CardContent>
        </ErrorCard>
    );
};

export default Error;
