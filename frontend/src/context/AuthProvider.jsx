import { useEffect, useState } from "react";
import api from "../services/api";
import { AuthContext } from "./auth";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getStoredUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  };

  useEffect(() => {
    // Ensure we have a CSRF cookie so cookie-auth requests can include X-CSRFToken.
    api.get("csrf/").catch(() => {});

    const loadMe = async () => {
      try {
        const meRes = await api.get("auth/me/");
        localStorage.setItem("user", JSON.stringify(meRes.data));
        setUser(meRes.data);
      } catch {
        const storedUser = getStoredUser();
        if (storedUser) setUser(storedUser);
      } finally {
        setLoading(false);
      }
    };

    loadMe();
  }, []);

  const login = async (username, password) => {
    const response = await api.post("auth/login/", { username, password });
    const { token: _TOKEN, ...userData } = response.data;
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (username, email, password, fullName, role) => {
    await api.post("auth/register/", {
      username,
      email,
      password,
      full_name: fullName,
      role,
    });
    return login(username, password);
  };

  const logout = async () => {
    try {
      await api.post("auth/logout/");
    } catch {
      // Still clear local state even if network fails.
    }

    if (typeof document !== "undefined") {
      document.cookie = "csrftoken=; Max-Age=0; path=/";
    }
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {loading ? (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-600">
          Loading...
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};
