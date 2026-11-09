import { Navigate, Outlet } from 'react-router-dom';
import Navbar from '../../componat/navbar/navbar';

export default function MainLayout() {
    if (!localStorage.getItem('route-posts-token')) {
        return <Navigate to="/auth/login" replace />;
    }
    return (
        <div className="min-h-screen bg-second">
            <Navbar />
            <main className="mx-auto w-full max-w-7xl px-3 py-4 md:px-4">
                <Outlet />
            </main>
        </div>
    );
}