import { useState, useEffect } from "react";
import api from "../services/api";

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadNotifications = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await api.get("notifications/");
            setNotifications(response.data.results || response.data);
        } catch (err) {
            setError("Unable to load notifications right now.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const markRead = async (id) => {
        try {
            await api.patch(`notifications/${id}/read/`);
            loadNotifications();
        } catch (err) {
            setError("Unable to update notification status.");
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="mt-1 text-sm text-gray-500">
                Keep track of document routing and status changes for your
                account.
            </p>

            {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="mt-10 flex justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                </div>
            ) : notifications.length === 0 ? (
                <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                    No notifications.
                </div>
            ) : (
                <div className="mt-6 space-y-3">
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            className={`p-4 rounded-lg border ${n.is_read ? "bg-white border-gray-200" : "bg-purple-50 border-purple-200"}`}
                        >
                            <div className="flex justify-between items-start gap-3">
                                <div>
                                    <p className="text-sm font-medium">
                                        {n.notification_type?.name ||
                                            "Notification"}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {n.document?.title || "General"}
                                    </p>
                                </div>
                                <span
                                    className={`text-xs px-2 py-1 rounded-full ${n.is_read ? "bg-gray-100 text-gray-400" : "bg-purple-600 text-white"}`}
                                >
                                    {n.is_read ? "Read" : "New"}
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-gray-700">
                                {n.payload || "No detail provided."}
                            </p>
                            <div className="mt-3">
                                {!n.is_read && (
                                    <button
                                        onClick={() => markRead(n.id)}
                                        className="text-xs font-semibold text-purple-700 hover:text-purple-900"
                                    >
                                        Mark as read
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notifications;
