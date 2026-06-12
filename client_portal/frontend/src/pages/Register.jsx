import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import api from "../api";

const Register = () => {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        email: "",
        full_name: "",
    });
    const [verificationCode, setVerificationCode] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const { register: authRegister, setUser } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleGoogleRegister = async () => {
        try {
            const response = await api.get("/auth/google/login");
            window.location.href = response.data.url;
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                    "Could not connect to Google Login. Please try traditional registration instead.",
            );
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await authRegister(formData);
            setIsSuccess(true);
            setIsVerifying(true);
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                    "Registration failed. Username or email might be taken.",
            );
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const response = await api.post("/verify-code", {
                email: formData.email,
                code: verificationCode,
            });

            const { access_token } = response.data;
            if (access_token) {
                localStorage.setItem("token", access_token);
                // Fetch user profile to fully log in
                const userResp = await api.get("/me");
                setUser(userResp.data);
                setIsVerifying(false);
                navigate("/"); // Redirect to portal dashboard
            } else {
                setIsVerifying(false);
                setIsSuccess(true);
            }
        } catch (err) {
            setError(err.response?.data?.detail || "Invalid verification code");
        }
    };

    return (
        <div
            className={`min-h-screen flex flex-col justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8 transition-colors duration-300 ${isDarkMode ? "bg-slate-900" : "bg-gray-50"}`}
        >
            <div className="absolute top-4 right-4">
                <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-xl border transition-all ${isDarkMode ? "bg-slate-800 border-slate-700 text-yellow-500" : "bg-white border-gray-200 text-gray-500"}`}
                >
                    {isDarkMode ? (
                        <Sun className="h-5 w-5" />
                    ) : (
                        <Moon className="h-5 w-5" />
                    )}
                </button>
            </div>
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <UserPlus
                        className={`h-12 w-12 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
                    />
                </div>
                <h2
                    className={`mt-6 text-center text-2xl font-extrabold sm:text-3xl ${isDarkMode ? "text-white" : "text-gray-900"}`}
                >
                    {isVerifying
                        ? "Verify Your Account"
                        : "Client Registration"}
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div
                    className={`px-4 py-8 shadow border transition-colors sm:rounded-lg sm:px-10 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}
                >
                    {isSuccess && !isVerifying ? (
                        <div className="text-center py-4">
                            <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-6 font-medium">
                                Account Verified Successfully!
                            </div>
                            <p
                                className={`mb-6 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                            >
                                You can now log in to the portal and manage your
                                documents.
                            </p>
                            <Link
                                to="/login"
                                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition w-full"
                            >
                                Go to Log In
                            </Link>
                        </div>
                    ) : isVerifying ? (
                        <div className="space-y-6">
                            <div className="text-center">
                                <p
                                    className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                                >
                                    We've sent a 6-digit verification code to{" "}
                                    <strong>{formData.email}</strong>.
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <form
                                className="space-y-4"
                                onSubmit={handleVerifyCode}
                            >
                                <div>
                                    <input
                                        type="text"
                                        maxLength="6"
                                        placeholder="Enter 6-digit code"
                                        className={`text-center tracking-[1em] text-2xl font-bold mt-1 block w-full border rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                            isDarkMode
                                                ? "bg-slate-900 border-slate-700 text-white"
                                                : "bg-white border-gray-300 text-gray-900"
                                        }`}
                                        value={verificationCode}
                                        onChange={(e) =>
                                            setVerificationCode(
                                                e.target.value.replace(
                                                    /[^0-9]/g,
                                                    "",
                                                ),
                                            )
                                        }
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                                >
                                    Verify Code
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsVerifying(false);
                                        setIsSuccess(false);
                                    }}
                                    className={`w-full text-sm font-medium ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    Back to registration
                                </button>
                            </form>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <form className="space-y-4" onSubmit={handleSubmit}>
                                <div>
                                    <label
                                        className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                                    >
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className={`mt-1 block w-full border rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                            isDarkMode
                                                ? "bg-slate-900 border-slate-700 text-white"
                                                : "bg-white border-gray-300 text-gray-900"
                                        }`}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                full_name: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div>
                                    <label
                                        className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                                    >
                                        Email address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        className={`mt-1 block w-full border rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                            isDarkMode
                                                ? "bg-slate-900 border-slate-700 text-white"
                                                : "bg-white border-gray-300 text-gray-900"
                                        }`}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                email: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div>
                                    <label
                                        className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                                    >
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className={`mt-1 block w-full border rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                            isDarkMode
                                                ? "bg-slate-900 border-slate-700 text-white"
                                                : "bg-white border-gray-300 text-gray-900"
                                        }`}
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
                                        className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                                    >
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        className={`mt-1 block w-full border rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                            isDarkMode
                                                ? "bg-slate-900 border-slate-700 text-white"
                                                : "bg-white border-gray-300 text-gray-900"
                                        }`}
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
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                                >
                                    Create Account
                                </button>
                            </form>

                            <div className="mt-6">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div
                                            className={`w-full border-t ${isDarkMode ? "border-slate-700" : "border-gray-300"}`}
                                        />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span
                                            className={`px-2 transition-colors ${isDarkMode ? "bg-slate-800 text-gray-400" : "bg-white text-gray-500"}`}
                                        >
                                            Or register with
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <button
                                        onClick={handleGoogleRegister}
                                        className={`w-full inline-flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium transition-colors ${
                                            isDarkMode
                                                ? "bg-slate-900 border-slate-700 text-gray-300 hover:bg-slate-700"
                                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                        }`}
                                    >
                                        <svg
                                            className="h-5 w-5 mr-3"
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
                                        <span>Sign up with Google</span>
                                    </button>
                                </div>
                            </div>

                            <div className="mt-6 text-center">
                                <Link
                                    to="/login"
                                    className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                                >
                                    Already have an account? Sign In
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Register;
