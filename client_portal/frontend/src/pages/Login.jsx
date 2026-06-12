import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import api from "../api";
import LanguageSelector from "../components/LanguageSelector";

const Login = () => {
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const { login } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(formData.username, formData.password);
            navigate("/");
        } catch (err) {
            const msg =
                err.response?.data?.detail || "Invalid username or password";
            setError(msg);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        try {
            const response = await api.get("/auth/google/login");
            if (response.data && response.data.url) {
                window.location.assign(response.data.url);
            } else {
                throw new Error("Incomplete login response");
            }
        } catch (err) {
            console.error("Google button error:", err);
            setError(
                err.response?.data?.detail ||
                    "Connection to Google Login failed. Please refresh your page or try again.",
            );
        }
    };

    return (
        <div
            className={`min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-all duration-500 ${isDarkMode ? "bg-slate-900" : "bg-gray-50"}`}
        >
            <div className="absolute top-8 right-8 flex items-center space-x-4">
                <LanguageSelector />
                <button
                    onClick={toggleTheme}
                    className={`p-3 rounded-2xl border backdrop-blur-md transition-all hover:scale-110 ${isDarkMode ? "bg-slate-800 border-slate-700 text-yellow-500" : "bg-white border-gray-200 text-gray-500 shadow-lg"}`}
                >
                    {isDarkMode ? (
                        <Sun className="h-6 w-6" />
                    ) : (
                        <Moon className="h-6 w-6" />
                    )}
                </button>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <div
                        className={`p-4 rounded-3xl ${isDarkMode ? "bg-blue-500/10" : "bg-blue-100"}`}
                    >
                        <LogIn
                            className={`h-12 w-12 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
                        />
                    </div>
                </div>
                <h2
                    className={`text-center text-4xl font-black ${isDarkMode ? "text-white" : "text-gray-900"}`}
                >
                    Client Portal
                </h2>
                <p
                    className={`mt-2 text-center text-sm font-bold ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}
                >
                    Sign in to manage your submissions
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md px-4">
                <div
                    className={`py-10 px-8 shadow-2xl rounded-3xl border backdrop-blur-xl transition-all duration-300 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}
                >
                    {error && (
                        <div className="mb-6 bg-red-500/10 border-l-4 border-red-500 text-red-500 px-4 py-3 rounded-xl text-sm font-bold">
                            {error}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label
                                htmlFor="username"
                                className={`block text-[10px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? "text-slate-500" : "text-gray-500"}`}
                            >
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                className={`block w-full px-5 py-4 rounded-2xl border font-bold outline-none transition-all focus:ring-4 ${
                                    isDarkMode
                                        ? "bg-slate-900 border-slate-700 text-white placeholder-slate-600 focus:ring-blue-500/20 focus:border-blue-500"
                                        : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-blue-100 focus:border-blue-500"
                                }`}
                                placeholder="Your username"
                                value={formData.username}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        username: e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                title="Password"
                                className={`block text-[10px] font-black uppercase tracking-widest mb-1 ${isDarkMode ? "text-slate-500" : "text-gray-500"}`}
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className={`block w-full px-5 py-4 rounded-2xl border font-bold outline-none transition-all focus:ring-4 ${
                                    isDarkMode
                                        ? "bg-slate-900 border-slate-700 text-white placeholder-slate-600 focus:ring-blue-500/20 focus:border-blue-500"
                                        : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-blue-100 focus:border-blue-500"
                                }`}
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        password: e.target.value,
                                    })
                                }
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full flex justify-center py-4 px-4 rounded-2xl shadow-xl text-sm font-black text-white bg-blue-600 hover:bg-blue-500 transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-widest"
                        >
                            Sign in
                        </button>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div
                                    className={`w-full border-t ${isDarkMode ? "border-slate-700" : "border-gray-200"}`}
                                />
                            </div>
                            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                                <span
                                    className={`px-4 transition-colors ${isDarkMode ? "bg-slate-800 text-slate-500" : "bg-white text-gray-400"}`}
                                >
                                    Secure Social Auth
                                </span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={handleGoogleLogin}
                                className={`w-full flex items-center justify-center py-4 px-4 rounded-2xl border font-black transition-all hover:scale-[1.02] active:scale-95 ${
                                    isDarkMode
                                        ? "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-700"
                                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
                                }`}
                            >
                                <svg
                                    className="h-6 w-6 mr-3"
                                    viewBox="0 0 533.5 544.3"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-label="Google logo"
                                >
                                    <path
                                        fill="#4285F4"
                                        d="M533.5 278.4c0-17.4-1.6-34.1-4.6-50.4H272.1v95.5h146.9c-6.4 34.4-25.6 63.5-54.5 83v68h88.2c51.4-47.5 80.8-117 80.8-195.9z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M272.1 544.3c73.7 0 135.7-24.4 181-66.5l-88.2-68c-24.5 16.4-56 26-92.7 26-71 0-131.3-47.8-152.8-112.1H29.9v70.5C75 483.8 168.2 544.3 272.1 544.3z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M119.3 323.7c-10.9-32.7-10.9-67.7 0-100.4v-70.5H29.9c-40.1 79.8-40.1 174.9 0 254.7l89.4-83.8z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M272.1 107.4c39.9 0 75.7 13.7 104 40.7l78-78C405.1 24 345.8 0 272.1 0 168.2 0 75 60.5 29.9 152.8l89.4 70.5C140.8 155.2 201.1 107.4 272.1 107.4z"
                                    />
                                </svg>
                                <span>Continue with Google</span>
                            </button>
                        </div>
                    </div>

                    <div className="mt-10 text-center">
                        <Link
                            to="/register"
                            className={`font-bold text-sm underline underline-offset-4 decoration-2 transition-colors ${isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"}`}
                        >
                            New here? Create an account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
