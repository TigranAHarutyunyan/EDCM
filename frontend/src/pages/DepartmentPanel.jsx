import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/auth";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";

const DepartmentPanel = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const [employees, setEmployees] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [newEmployee, setNewEmployee] = useState({
        username: "",
        email: "",
        password: "",
        full_name: "",
        position: "",
        department_id: "",
    });

    const employeeOptions = useMemo(() => employees || [], [employees]);
    const canAccessDepartmentPanel = Boolean(
        user?.is_superuser || user?.role === "Admin" || user?.role === "Manager",
    );
    const isAdminView = Boolean(user?.is_superuser || user?.role === "Admin");

    const fetchAll = async () => {
        setLoading(true);
        setError("");
        try {
            const requests = [
                api.get("department/employees/"),
                api.get("department/documents/"),
            ];
            if (isAdminView) {
                requests.push(api.get("departments/"));
            }
            const [empRes, docRes, deptRes] = await Promise.all(requests);
            setEmployees(empRes.data.results || empRes.data);
            setDocuments(docRes.data.results || docRes.data);
            if (deptRes) {
                setDepartments(deptRes.data.results || deptRes.data);
            }
        } catch {
            setError(t('error.load_dept_data') || "Failed to load department panel data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const handleCreateEmployee = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await api.post("department/employees/", newEmployee);
            setNewEmployee({
                username: "",
                email: "",
                password: "",
                full_name: "",
                position: "",
                department_id: "",
            });
            await fetchAll();
        } catch {
            setError(t('error.create_employee') || "Failed to create employee.");
        }
    };

    const handleDeleteEmployee = async (id) => {
        setError("");
        try {
            await api.delete(`department/employees/${id}/`);
            await fetchAll();
        } catch {
            setError(t('error.delete_employee') || "Failed to delete employee.");
        }
    };

    const handleSetOwner = async (docId, userId, type = "current_owner") => {
        setError("");
        try {
            const payload = {};
            if (type === "current_owner") {
                payload.current_owner_id = userId || null;
            } else {
                payload.assigned_to_id = userId || null;
            }
            await api.patch(`department/documents/${docId}/owner/`, payload);
            await fetchAll();
        } catch {
            setError(t('error.update_assignment') || "Failed to update document assignment.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!canAccessDepartmentPanel) {
        return (
            <div className={`p-10 rounded-3xl shadow-2xl border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                <h1 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {t('department.panel_title')}
                </h1>
                <p className={`mt-4 text-lg font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {t('department.access_denied')}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20">
            <header className="flex flex-col space-y-2">
                <h1 className={`text-5xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {t('department.panel_title')}
                </h1>
                <p className={`text-lg font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {isAdminView ? t('department.manage_all_depts') : t('department.manage_dept')}
                </p>
            </header>

            {error && (
                <div className="bg-red-500 text-white p-5 rounded-2xl shadow-xl shadow-red-500/20 animate-in slide-in-from-top-4 duration-300">
                    <p className="text-sm font-black uppercase tracking-widest">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Team Section */}
                <section className={`lg:col-span-5 rounded-[2.5rem] shadow-2xl border p-10 transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                    <h2 className={`text-2xl font-black mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {t('department.employees')}
                    </h2>
                    
                    <form onSubmit={handleCreateEmployee} className="space-y-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <input
                                    className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-purple-500/20 ${
                                        isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-purple-600 focus:bg-white'
                                    }`}
                                    placeholder={t('profile.full_name')}
                                    required
                                    value={newEmployee.full_name}
                                    onChange={(e) => setNewEmployee((p) => ({ ...p, full_name: e.target.value }))}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        className={`rounded-2xl border px-5 py-4 text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-purple-500/20 ${
                                            isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-purple-600 focus:bg-white'
                                        }`}
                                        placeholder={`${t('common.username')} *`}
                                        required
                                        value={newEmployee.username}
                                        onChange={(e) => setNewEmployee((p) => ({ ...p, username: e.target.value }))}
                                    />
                                    <input
                                        className={`rounded-2xl border px-5 py-4 text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-purple-500/20 ${
                                            isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-purple-600 focus:bg-white'
                                        }`}
                                        placeholder={`${t('common.password')} *`}
                                        type="password"
                                        required
                                        value={newEmployee.password}
                                        onChange={(e) => setNewEmployee((p) => ({ ...p, password: e.target.value }))}
                                    />
                                </div>
                                <input
                                    className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-purple-500/20 ${
                                        isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-purple-600 focus:bg-white'
                                    }`}
                                    placeholder={t('common.email')}
                                    value={newEmployee.email}
                                    onChange={(e) => setNewEmployee((p) => ({ ...p, email: e.target.value }))}
                                />
                                <input
                                    className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-purple-500/20 ${
                                        isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-purple-600 focus:bg-white'
                                    }`}
                                    placeholder={t('profile.position')}
                                    value={newEmployee.position}
                                    onChange={(e) => setNewEmployee((p) => ({ ...p, position: e.target.value }))}
                                />
                                {isAdminView && (
                                    <select
                                        className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-purple-500/20 ${
                                            isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-purple-600 focus:bg-white'
                                        }`}
                                        required
                                        value={newEmployee.department_id}
                                        onChange={(e) => setNewEmployee((p) => ({ ...p, department_id: e.target.value }))}
                                    >
                                        <option value="">{t('department.select_department')}</option>
                                        {departments.map((department) => (
                                            <option key={department.id} value={department.id}>
                                                {department.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>
                        <button
                            className="w-full bg-purple-600 text-white px-8 py-5 rounded-2xl font-black hover:bg-purple-500 shadow-2xl shadow-purple-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            type="submit"
                        >
                            {t('department.add_employee')}
                        </button>
                        <p className={`text-xs font-bold italic tracking-wide ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                            {t('department.new_user_hint')}
                        </p>
                    </form>

                    <div className="mt-12 space-y-4">
                        {employeeOptions.map((u) => (
                            <div
                                key={u.id}
                                className={`p-6 rounded-3xl border flex items-center justify-between transition-all group ${
                                    isDarkMode ? 'bg-slate-900/50 border-slate-700 hover:bg-slate-900' : 'bg-gray-50 border-gray-100 hover:bg-white hover:shadow-xl'
                                }`}
                            >
                                <div className="flex items-center">
                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-purple-600/20 mr-4">
                                        {u.username[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {u.profile?.full_name || u.username}
                                        </div>
                                        <div className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                                            {[u.profile?.position || u.profile?.role, isAdminView ? u.profile?.department?.name : null].filter(Boolean).join(" • ")}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteEmployee(u.id)}
                                    className={`p-3 rounded-xl transition-all opacity-0 group-hover:opacity-100 ${
                                        isDarkMode ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'
                                    }`}
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                        {employeeOptions.length === 0 && (
                            <div className={`text-center py-10 rounded-3xl border-2 border-dashed ${isDarkMode ? 'border-slate-700 text-slate-500' : 'border-gray-100 text-gray-400'}`}>
                                {t('department.no_employees')}
                            </div>
                        )}
                    </div>
                </section>

                {/* Documents Section */}
                <section className={`lg:col-span-7 rounded-[2.5rem] shadow-2xl border p-10 transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                    <h2 className={`text-2xl font-black mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {t('department.dept_documents')}
                    </h2>
                    
                    <div className="space-y-6">
                        {documents.map((d) => (
                            <div key={d.id} className={`p-8 rounded-[2rem] border transition-all ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-100 hover:bg-white hover:shadow-xl'}`}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-xl font-black mb-1 truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {d.title}
                                        </div>
                                        <div className="flex items-center space-x-3 mt-2">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-white text-gray-400 shadow-sm'}`}>
                                                ID: #{d.id}
                                            </span>
                                            {isAdminView && d.department?.name && (
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-white text-gray-400 shadow-sm'}`}>
                                                    {d.department.name}
                                                </span>
                                            )}
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-blue-500 text-white shadow-lg shadow-blue-500/20`}>
                                                {d.status_details?.name}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="w-full md:w-64 space-y-4">
                                        <div className="space-y-1">
                                            <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                                                {t('department.current_owner')}
                                            </label>
                                            <select
                                                className={`w-full rounded-xl border px-3 py-3 text-sm font-bold outline-none transition-all ${
                                                    isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-purple-500' : 'bg-white border-gray-100 text-gray-900 focus:ring-4 focus:ring-purple-500/10'
                                                }`}
                                                value={d.current_owner?.id || ""}
                                                onChange={(e) => handleSetOwner(d.id, e.target.value, "current_owner")}
                                            >
                                                <option value="">{t('department.no_owner')}</option>
                                                {employeeOptions.map((u) => (
                                                    <option key={u.id} value={u.id}>
                                                        {u.profile?.full_name || u.username}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div className="space-y-1">
                                            <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                                                {t('department.assigned_to')}
                                            </label>
                                            <select
                                                className={`w-full rounded-xl border px-3 py-3 text-sm font-bold outline-none transition-all ${
                                                    isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-purple-500' : 'bg-white border-gray-100 text-gray-900 focus:ring-4 focus:ring-purple-500/10'
                                                }`}
                                                value={d.assigned_to?.id || ""}
                                                onChange={(e) => handleSetOwner(d.id, e.target.value, "assigned_to")}
                                            >
                                                <option value="">{t('department.unassigned')}</option>
                                                {employeeOptions.map((u) => (
                                                    <option key={u.id} value={u.id}>
                                                        {u.profile?.full_name || u.username}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <p className={`text-[9px] font-black uppercase tracking-tighter text-center italic ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>
                                            {t('department.change_hint')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {documents.length === 0 && (
                            <div className={`text-center py-20 rounded-[2rem] border-2 border-dashed ${isDarkMode ? 'border-slate-700 text-slate-500' : 'border-gray-100 text-gray-400'}`}>
                                {t('department.no_documents')}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default DepartmentPanel;
