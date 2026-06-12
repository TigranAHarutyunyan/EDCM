import { useState } from "react";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";

const DocumentModal = ({
    isOpen,
    onClose,
    onSuccess,
    departments,
    documentTypes,
    users,
}) => {
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        department: "",
        document_type: "",
        confidentiality_level: "PUBLIC",
        assigned_to_id: "",
    });
    const [attachmentFiles, setAttachmentFiles] = useState([]);
    const [createdDocument, setCreatedDocument] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const translateDocumentType = (type) => {
        const code = type?.code?.toLowerCase();
        if (code && t(`documentTypes.${code}`, { defaultValue: "" })) {
            return t(`documentTypes.${code}`);
        }
        return type?.name || "";
    };

    const translateConfidentiality = (code) => {
        if (!code) return "";
        return t(`confidentialityLevels.${code.toLowerCase()}`, {
            defaultValue: code,
        });
    };

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            department: "",
            document_type: "",
            confidentiality_level: "PUBLIC",
            assigned_to_id: "",
        });
        setAttachmentFiles([]);
        setCreatedDocument(null);
        setError("");
    };

    const handleModalClose = () => {
        if (loading) return;
        resetForm();
        onClose();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFilesChange = (e) => {
        const files = Array.from(e.target.files || []);
        setAttachmentFiles(files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            let doc = createdDocument;

            if (!doc) {
                const payload = {
                    title: formData.title,
                    description: formData.description,
                    document_type: formData.document_type || null,
                    confidentiality_level:
                        formData.confidentiality_level || "PUBLIC",
                    assigned_to_id: formData.assigned_to_id || null,
                };

                const response = await api.post("documents/", payload);
                doc = response.data;
                setCreatedDocument(doc);
                onSuccess(doc);
            }

            if (attachmentFiles.length > 0) {
                for (const file of attachmentFiles) {
                    const fd = new FormData();
                    fd.append("file", file);
                    await api.post(`documents/${doc.id}/attachments/`, fd);
                }
            }

            resetForm();
            onClose();
        } catch (err) {
            let message =
                err.response?.data?.detail ||
                err.response?.data?.message ||
                null;
            if (
                !message &&
                err.response?.data &&
                typeof err.response.data === "object"
            ) {
                const firstKey = Object.keys(err.response.data)[0];
                const firstVal = err.response.data[firstKey];
                if (Array.isArray(firstVal)) message = firstVal[0];
                else if (typeof firstVal === "string") message = firstVal;
            }
            setError(message || t("documentModal.errors.create"));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-[60] overflow-y-auto ${isDarkMode ? "dark" : ""}`}
        >
            {/* Backdrop with blur */}
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
                onClick={handleModalClose}
            ></div>

            {/* Modal Container */}
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                <div
                    className={`relative transform overflow-hidden rounded-[2.5rem] shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border animate-in zoom-in-95 duration-300 ${
                        isDarkMode
                            ? "bg-slate-800 border-slate-700"
                            : "bg-white border-gray-100"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Decorative Header Bar */}
                    <div className="h-3 bg-gradient-to-r from-purple-600 to-indigo-600 w-full"></div>

                    {/* Header */}
                    <div
                        className={`flex justify-between items-center px-10 py-8 border-b ${isDarkMode ? "border-slate-700" : "border-gray-50"}`}
                    >
                        <div>
                            <h2
                                className={`text-3xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}
                            >
                                {t("documentModal.title")}
                            </h2>
                            <p
                                className={`mt-2 text-sm font-bold ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}
                            >
                                {t("documentModal.subtitle")}
                            </p>
                        </div>
                        <button
                            onClick={handleModalClose}
                            disabled={loading}
                            className={`rounded-2xl p-3 transition-all ${isDarkMode ? "bg-slate-900 text-slate-400 hover:text-white" : "bg-gray-100 text-gray-500 hover:text-gray-900"}`}
                        >
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mx-10 mt-6 bg-red-500 text-white p-5 rounded-3xl shadow-xl shadow-red-500/20 animate-in slide-in-from-top-4 duration-300">
                            <p className="text-sm font-black uppercase tracking-widest">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Form */}
                    <form
                        onSubmit={handleSubmit}
                        className="px-10 py-8 space-y-8"
                    >
                        {createdDocument?.id && (
                            <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-bold text-green-800 animate-pulse">
                                {t("documentModal.created", {
                                    id: createdDocument.id,
                                })}
                            </div>
                        )}

                        {/* Title Section */}
                        <div className="space-y-2">
                            <label
                                className={`block text-xs font-black uppercase tracking-widest ml-1 ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}
                            >
                                {t("documentModal.fields.name")}{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder={t(
                                    "documentModal.placeholders.name",
                                )}
                                className={`block w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-purple-500/10 ${
                                    isDarkMode
                                        ? "bg-slate-900 border-slate-700 text-white focus:border-purple-500"
                                        : "bg-gray-50 border-gray-100 text-gray-900 focus:border-purple-600 focus:bg-white"
                                }`}
                                disabled={loading}
                            />
                        </div>

                        {/* Description Section */}
                        <div className="space-y-2">
                            <label
                                className={`block text-xs font-black uppercase tracking-widest ml-1 ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}
                            >
                                {t("documentModal.fields.description")}
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder={t(
                                    "documentModal.placeholders.description",
                                )}
                                rows="4"
                                className={`block w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-purple-500/10 resize-none ${
                                    isDarkMode
                                        ? "bg-slate-900 border-slate-700 text-white focus:border-purple-500"
                                        : "bg-gray-50 border-gray-100 text-gray-900 focus:border-purple-600 focus:bg-white"
                                }`}
                                disabled={loading}
                            />
                        </div>

                        {/* Grid for Dropdowns */}
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                            {/* Document Type */}
                            <div className="space-y-2">
                                <label
                                    className={`block text-xs font-black uppercase tracking-widest ml-1 ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}
                                >
                                    {t("documentModal.fields.type")}
                                </label>
                                <select
                                    name="document_type"
                                    value={formData.document_type}
                                    onChange={handleChange}
                                    className={`block w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-purple-500/10 appearance-none ${
                                        isDarkMode
                                            ? "bg-slate-900 border-slate-700 text-white focus:border-purple-500"
                                            : "bg-gray-50 border-gray-100 text-gray-900 focus:border-purple-600 focus:bg-white"
                                    }`}
                                    disabled={loading}
                                >
                                    <option value="">
                                        {t("documentModal.options.selectType")}
                                    </option>
                                    {documentTypes?.map((type) => (
                                        <option key={type.id} value={type.code}>
                                            {translateDocumentType(type)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Assign To */}
                            <div className="space-y-2">
                                <label
                                    className={`block text-xs font-black uppercase tracking-widest ml-1 ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}
                                >
                                    {t("documentModal.fields.assignTo")}
                                </label>
                                <select
                                    name="assigned_to_id"
                                    value={formData.assigned_to_id}
                                    onChange={handleChange}
                                    className={`block w-full rounded-2xl border px-5 py-4 text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-purple-500/10 appearance-none ${
                                        isDarkMode
                                            ? "bg-slate-900 border-slate-700 text-white focus:border-purple-500"
                                            : "bg-gray-50 border-gray-100 text-gray-900 focus:border-purple-600 focus:bg-white"
                                    }`}
                                    disabled={loading}
                                >
                                    <option value="">
                                        {t(
                                            "documentModal.options.selfUnassigned",
                                        )}
                                    </option>
                                    {users?.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.profile?.full_name ||
                                                user.username}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Confidentiality Level */}
                            <div className="space-y-2 sm:col-span-2">
                                <label
                                    className={`block text-xs font-black uppercase tracking-widest ml-1 ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}
                                >
                                    {t("documentModal.fields.confidentiality")}{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {[
                                        "PUBLIC",
                                        "INTERNAL",
                                        "CONFIDENTIAL",
                                        "SECRET",
                                    ].map((level) => (
                                        <div
                                            key={level}
                                            onClick={() =>
                                                !loading &&
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    confidentiality_level:
                                                        level,
                                                }))
                                            }
                                            className={`
                                                cursor-pointer rounded-2xl border py-4 text-center text-[10px] font-black uppercase tracking-widest transition-all
                                                ${
                                                    formData.confidentiality_level ===
                                                    level
                                                        ? "bg-purple-600 border-purple-600 text-white shadow-xl shadow-purple-600/20"
                                                        : isDarkMode
                                                          ? "bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500"
                                                          : "bg-white border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-gray-50"
                                                }
                                                ${loading ? "opacity-50 cursor-not-allowed" : ""}
                                            `}
                                        >
                                            {translateConfidentiality(level)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Attachments */}
                        <div className="space-y-2">
                            <label
                                className={`block text-xs font-black uppercase tracking-widest ml-1 ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}
                            >
                                {t("documentModal.fields.attachments")}
                            </label>
                            <div
                                className={`relative rounded-3xl border-2 border-dashed p-10 transition-all text-center ${
                                    isDarkMode
                                        ? "border-slate-700 bg-slate-900/50"
                                        : "border-gray-100 bg-gray-50"
                                }`}
                            >
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFilesChange}
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    disabled={loading}
                                />
                                <div className="space-y-2">
                                    <p
                                        className={`text-sm font-black ${isDarkMode ? "text-slate-300" : "text-gray-900"}`}
                                    >
                                        {attachmentFiles.length > 0
                                            ? t(
                                                  "documentModal.attachments.selected",
                                                  {
                                                      count: attachmentFiles.length,
                                                  },
                                              )
                                            : t(
                                                  "documentModal.attachments.drop",
                                              )}
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-500">
                                        {t("documentModal.attachments.formats")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="mt-12 flex items-center justify-end gap-5 border-t border-slate-100 dark:border-slate-700 pt-10">
                            <button
                                type="button"
                                onClick={handleModalClose}
                                disabled={loading}
                                className={`px-10 py-5 rounded-2xl text-sm font-black transition-all ${
                                    isDarkMode
                                        ? "bg-slate-900 text-white hover:bg-slate-800"
                                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                                }`}
                            >
                                {t("common.cancel")}
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-12 py-5 rounded-3xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-black shadow-2xl shadow-purple-600/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {loading
                                    ? t("documentModal.buttons.creating")
                                    : createdDocument
                                      ? t(
                                            "documentModal.buttons.uploadAttachments",
                                        )
                                      : t("documentModal.buttons.create")}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DocumentModal;
