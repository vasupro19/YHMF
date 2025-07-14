import { createTheme } from '@mui/material/styles';

// Define the theme options
const Theme = createTheme({
    palette: {
        primary: {
            main: '#43aed8'
        },
        secondary: {
            main: '#43aed8'
        },
        background: {
            default: 'white'
        },
        customBackground: {
            default: '#43aed8'
        },
        hoverBackground: {
            main: '#d4f1f4'
        }
    },
    typography: {
        fontFamily: 'Roboto, Arial, sans-serif',
        button: {
            textTransform: 'none' // Disable uppercase transformation for buttons
        }
    }
});

export default Theme;
