import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const isInternal = user && (user.role === 'Admin' || user.role === 'Department Chef' || user.role === 'Manager' || user.is_superuser);

    return (
        <nav className="bg-white shadow-lg border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link
                            to="/dashboard"
                            className="flex-shrink-0 flex items-center"
                        >
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                                EDCM
                            </span>
                        </Link>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link
                                to="/dashboard"
                                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/documents"
                                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                Documents
                            </Link>
                            {isInternal && (
                                <Link
                                    to="/department"
                                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                >
                                    Department
                                </Link>
                            )}
                            <Link
                                to="/profile"
                                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                Profile
                            </Link>
                            {(user?.is_staff ||
                                user?.username ===
                                    user?.portal_inbox_username) && (
                                <Link
                                    to="/portal-inbox"
                                    className="border-transparent text-purple-600 font-semibold inline-flex items-center px-1 pt-1 border-b-2 border-purple-500 text-sm"
                                >
                                    Portal Inbox
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <NotificationBell />
                        <div className="hidden md:flex items-center">
                            <span className="text-gray-700 mr-4 text-sm">
                                Hello,{" "}
                                <span className="font-semibold text-purple-600">
                                    {user?.username}
                                </span>
                            </span>
                            <button
                                onClick={handleLogout}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                    />
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
