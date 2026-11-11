import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ColorModeProvider } from 'context/ColorMode';
import { ToastProvider } from 'context/Toast';
import { AuthProvider } from 'context/Auth';
import AppRoutes from 'routes';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ColorModeProvider>
            <ToastProvider>
                <BrowserRouter>
                    <AuthProvider>
                        <AppRoutes />
                    </AuthProvider>
                </BrowserRouter>
            </ToastProvider>
        </ColorModeProvider>
    </React.StrictMode>
);
