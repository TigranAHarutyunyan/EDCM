import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';

// Helper: compute the real Django admin URL.
// In Docker dev, frontend runs on :3000 and Django on :8000.
const getAdminUrl = () => {
    const backendBase = import.meta.env.VITE_BACKEND_URL;

    // Prefer explicit backend URL when provided (e.g. https://edcm.onrender.com)
    if (backendBase) {
        const base = backendBase.endsWith('/') ? backendBase.slice(0, -1) : backendBase;
        return `${base}/admin/`;
    }

    if (typeof window !== 'undefined') {
        const { protocol, hostname, port } = window.location;

        // Local dev: React on 3000, Django on 8000
        if (port === '3000') {
            return `${protocol}//${hostname}:8000/admin/`;
        }

        // Same host/port for both in production
        const portPart = port ? `:${port}` : '';
        return `${protocol}//${hostname}${portPart}/admin/`;
    }

    // Safe default
    return '/admin/';
};

// Helper: compute the real Django admin URL.
// In Docker dev, frontend runs on :3000 and Django on :8000.
const getAdminUrl = () => {
    const backendBase = import.meta.env.VITE_BACKEND_URL;

    // Prefer explicit backend URL when provided (e.g. https://edcm.onrender.com)
    if (backendBase) {
        const base = backendBase.endsWith('/') ? backendBase.slice(0, -1) : backendBase;
        return `${base}/admin/`;
    }

    if (typeof window !== 'undefined') {
        const { protocol, hostname, port } = window.location;

        // Local dev: React on 3000, Django on 8000
        if (port === '3000') {
            return `${protocol}//${hostname}:8000/admin/`;
        }

        // Same host/port for both in production
        const portPart = port ? `:${port}` : '';
        return `${protocol}//${hostname}${portPart}/admin/`;
    }

    // Safe default
    return '/admin/';
};

// Helper: compute the real Django admin URL.
// In Docker dev, frontend runs on :3000 and Django on :8000.
const getAdminUrl = () => {
    const backendBase = import.meta.env.VITE_BACKEND_URL;

    // Prefer explicit backend URL when provided (e.g. https://edcm.onrender.com)
    if (backendBase) {
        const base = backendBase.endsWith('/') ? backendBase.slice(0, -1) : backendBase;
        return `${base}/admin/`;
    }

    if (typeof window !== 'undefined') {
        const { protocol, hostname, port } = window.location;

        // Local dev: React on 3000, Django on 8000
        if (port === '3000') {
            return `${protocol}//${hostname}:8000/admin/`;
        }

        // Same host/port for both in production
        const portPart = port ? `:${port}` : '';
        return `${protocol}//${hostname}${portPart}/admin/`;
    }

    // Safe default
    return '/admin/';
};

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white shadow-lg border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/dashboard" className="flex-shrink-0 flex items-center">
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                                EDCM
                            </span>
                        </Link>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link to="/dashboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                Dashboard
                            </Link>
                            <Link to="/documents" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                Documents
                            </Link>
                            <Link to="/profile" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                Profile
                            </Link>
                            {user?.role?.toLowerCase() === 'admin' && (
                                <a
                                    href={getAdminUrl()}
                                    onClick={() => {
                                        // #region agent log
                                        fetch('http://127.0.0.1:7242/ingest/3cc1c88b-7bfd-4075-bfb1-f381609b8839', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                runId: 'pre-fix-1',
                                                hypothesisId: 'H1',
                                                location: 'frontend/src/components/Navbar.jsx:admin-link',
                                                message: 'Admin Panel link clicked',
                                                data: {
                                                    role: user?.role ?? null,
                                                    pathname: typeof window !== 'undefined' ? window.location.pathname : null,
                                                    target: getAdminUrl(),
                                                },
                                                timestamp: Date.now(),
                                            }),
                                        }).catch(() => {});
                                        // #endregion
                                    }}
                                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                >
                                    Admin Panel
                                </a>
                            )}
                            {user?.role?.toLowerCase() === 'manager' && (
                                <a
                                    href={getAdminUrl()}
                                    onClick={() => {
                                        // #region agent log
                                        fetch('http://127.0.0.1:7242/ingest/3cc1c88b-7bfd-4075-bfb1-f381609b8839', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                runId: 'pre-fix-1',
                                                hypothesisId: 'H1',
                                                location: 'frontend/src/components/Navbar.jsx:department-link',
                                                message: 'Department Panel link clicked',
                                                data: {
                                                    role: user?.role ?? null,
                                                    pathname: typeof window !== 'undefined' ? window.location.pathname : null,
                                                    target: getAdminUrl(),
                                                },
                                                timestamp: Date.now(),
                                            }),
                                        }).catch(() => {});
                                        // #endregion
                                    }}
                                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                >
                                    Department Panel
                                </a>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center">

                        <div className="hidden md:ml-4 md:flex md:items-center">
                            <span className="text-gray-700 mr-4 text-sm">Hello, <span className="font-semibold text-purple-600">{user?.username}</span></span>
                            <button
                                onClick={handleLogout}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
