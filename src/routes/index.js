import { useRoutes } from 'react-router-dom';
import MainRoutes from './MainRoutes';
import LogInRoutes from './LoingRoutes';

export default function ThemeRoutes() {
    return useRoutes([LogInRoutes, MainRoutes]);
}
