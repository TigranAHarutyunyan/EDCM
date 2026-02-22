import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/auth";

const DepartmentPanel = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newEmployee, setNewEmployee] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    position: "",
  });

  const employeeOptions = useMemo(() => employees || [], [employees]);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [empRes, docRes] = await Promise.all([
        api.get("department/employees/"),
        api.get("department/documents/"),
      ]);
      setEmployees(empRes.data.results || empRes.data);
      setDocuments(docRes.data.results || docRes.data);
    } catch {
      setError("Failed to load department panel data.");
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
      setNewEmployee({ username: "", email: "", password: "", full_name: "", position: "" });
      await fetchAll();
    } catch {
      setError("Failed to create employee.");
    }
  };

  const handleDeleteEmployee = async (id) => {
    setError("");
    try {
      await api.delete(`department/employees/${id}/`);
      await fetchAll();
    } catch {
      setError("Failed to delete employee.");
    }
  };

  const handleSetOwner = async (docId, ownerId) => {
    setError("");
    try {
      await api.patch(`department/documents/${docId}/owner/`, { current_owner_id: ownerId || null });
      await fetchAll();
    } catch {
      setError("Failed to change document owner.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (user?.role !== "Manager") {
    return (
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <h1 className="text-xl font-semibold text-gray-900">Department Panel</h1>
        <p className="mt-2 text-sm text-gray-600">You do not have access to this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Department Panel</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage department employees and documents.
        </p>
      </header>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-lg shadow border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Employees</h2>
          <form onSubmit={handleCreateEmployee} className="mt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                className="border rounded-md px-3 py-2 text-sm"
                placeholder="Username *"
                required
                value={newEmployee.username}
                onChange={(e) => setNewEmployee((p) => ({ ...p, username: e.target.value }))}
              />
              <input
                className="border rounded-md px-3 py-2 text-sm"
                placeholder="Password *"
                type="password"
                required
                value={newEmployee.password}
                onChange={(e) => setNewEmployee((p) => ({ ...p, password: e.target.value }))}
              />
              <input
                className="border rounded-md px-3 py-2 text-sm"
                placeholder="Email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee((p) => ({ ...p, email: e.target.value }))}
              />
              <input
                className="border rounded-md px-3 py-2 text-sm"
                placeholder="Full name"
                value={newEmployee.full_name}
                onChange={(e) => setNewEmployee((p) => ({ ...p, full_name: e.target.value }))}
              />
              <input
                className="border rounded-md px-3 py-2 text-sm sm:col-span-2"
                placeholder="Position"
                value={newEmployee.position}
                onChange={(e) => setNewEmployee((p) => ({ ...p, position: e.target.value }))}
              />
            </div>
            <button
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition text-sm"
              type="submit"
            >
              Add Employee
            </button>
            <p className="text-xs text-gray-500">
              New users are created as role Employee in your department.
            </p>
          </form>

          <div className="mt-6 divide-y">
            {employeeOptions.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{u.username}</div>
                  <div className="text-xs text-gray-500">{u.profile?.role || ""}</div>
                </div>
                <button
                  onClick={() => handleDeleteEmployee(u.id)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            ))}
            {employeeOptions.length === 0 && (
              <div className="py-3 text-sm text-gray-500">No employees found.</div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-lg shadow border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Department Documents</h2>
          <div className="mt-4 space-y-3">
            {documents.map((d) => (
              <div key={d.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{d.title}</div>
                    <div className="text-xs text-gray-500">ID: {d.id}</div>
                    <div className="text-xs text-gray-500">
                      Owner: {d.current_owner?.username || "N/A"}
                    </div>
                  </div>
                  <div className="min-w-48">
                    <select
                      className="border rounded-md px-2 py-2 text-sm w-full"
                      value={d.current_owner?.id || ""}
                      onChange={(e) => handleSetOwner(d.id, e.target.value)}
                    >
                      <option value="">No owner</option>
                      {employeeOptions.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.username}
                        </option>
                      ))}
                    </select>
                    <div className="text-[11px] text-gray-500 mt-1">
                      Change current owner
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {documents.length === 0 && (
              <div className="text-sm text-gray-500">No documents found.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DepartmentPanel;
