import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "../context/auth";
import { useTranslation } from "react-i18next";

const DocumentDetailModal = ({
    isOpen,
    onClose,
    document: initialDocument,
    onUpdate,
}) => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [document, setDocument] = useState(initialDocument);
    const [activeTab, setActiveTab] = useState("details"); // 'details', 'attachments', 'history', 'comments'
    const [commentText, setCommentText] = useState("");
    const [attachmentFiles, setAttachmentFiles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [routeDepartmentId, setRouteDepartmentId] = useState("");
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [users, setUsers] = useState([]);
    const [isExternalComment, setIsExternalComment] = useState(false);
    const [documentTypes, setDocumentTypes] = useState([]);
    const [confidentialityLevels, setConfidentialityLevels] = useState([]);

    const documentId = initialDocument?.id;

    const fetchDocumentDetails = useCallback(async () => {
        if (!documentId) return;
        try {
            const response = await api.get(`documents/${documentId}/`);
            setDocument(response.data);
        } catch (err) {
            console.error("Error fetching document details", err);
        }
    }, [documentId]);

    useEffect(() => {
        if (documentId && isOpen) {
            fetchDocumentDetails();
        }
    }, [documentId, isOpen, fetchDocumentDetails]);

    useEffect(() => {
        if (document) {
            setEditData({
                title: document.title,
                description: document.description,
                status: document.status_details?.id || document.status,
                assigned_to_id: document.assigned_to?.id || "",
                department_id: document.department?.id || "",
                document_type:
                    document.document_type_details?.code ||
                    document.document_type,
                confidentiality_level:
                    document.confidentiality_level_details?.code ||
                    document.confidentiality_level,
            });
            setRouteDepartmentId(document.department?.id || "");
        }
    }, [document]);

    const canRoute = Boolean(
        user &&
        (user.role === "Admin" ||
            user.role === "Department Chef" ||
            user.role === "Manager" ||
            user.is_superuser ||
            (user.portal_inbox_username &&
                user.username === user.portal_inbox_username)),
    );

    const canEditStatus = Boolean(
        user &&
        (user.role === "Admin" ||
            user.role === "Department Chef" ||
            user.role === "Manager" ||
            user.is_superuser ||
            document?.creator?.id === user.id ||
            document?.assigned_to?.id === user.id),
    );

    const translateStatus = (status) => {
        const code = status?.code?.toLowerCase();
        if (code && t(`status.${code}`, { defaultValue: "" })) {
            return t(`status.${code}`);
        }
        const normalizedName = status?.name?.toLowerCase().replace(/\s+/g, "_");
        if (normalizedName && t(`status.${normalizedName}`, { defaultValue: "" })) {
            return t(`status.${normalizedName}`);
        }
        return status?.name || t("common.notAvailable");
    };

    const translateDepartment = (name) => {
        if (!name) return "";
        const key = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
        return t(`departments.${key}`, { defaultValue: name });
    };

    const translateDocumentType = (type) => {
        const code = type?.code?.toLowerCase();
        if (code && t(`documentTypes.${code}`, { defaultValue: "" })) {
            return t(`documentTypes.${code}`);
        }
        return type?.name || t("common.notAvailable");
    };

    const translateConfidentiality = (level) => {
        const code = level?.code?.toLowerCase();
        if (code && t(`confidentialityLevels.${code}`, { defaultValue: "" })) {
            return t(`confidentialityLevels.${code}`);
        }
        return level?.name || t("common.notAvailable");
    };

    const translateHistoryAction = (action) => {
        if (!action) return "";
        const key = action.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
        return t(`audit.actions.${key}`, { defaultValue: action });
    };

    const translateHistoryDetails = (details) => {
        if (!details) return "";
        const routedMatch = details.match(/^Routed to (.+)$/i);
        if (routedMatch) {
            return t("audit.details.routedTo", {
                department: translateDepartment(routedMatch[1]),
            });
        }
        const updatedByMatch = details.match(/^Updated by (.+)$/i);
        if (updatedByMatch) {
            return t("audit.details.updatedBy", { user: updatedByMatch[1] });
        }
        const takenByMatch = details.match(/^Document taken by (.+)$/i);
        if (takenByMatch) {
            return t("audit.details.takenBy", { user: takenByMatch[1] });
        }
        const statusMatch = details.match(/^Status changed to (.+) by (.+)$/i);
        if (statusMatch) {
            return t("audit.details.statusChanged", {
                status: t(`status.${statusMatch[1].toLowerCase().replace(/\s+/g, "_")}`, {
                    defaultValue: statusMatch[1],
                }),
                user: statusMatch[2],
            });
        }
        const assignmentMatch = details.match(/^Document assigned to (.+) by (.+)$/i);
        if (assignmentMatch) {
            return t("audit.details.assignedTo", {
                assignee: assignmentMatch[1],
                user: assignmentMatch[2],
            });
        }
        return details;
    };

    const escapeHtml = (value) =>
        String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

    const formatDateTime = (value) => {
        if (!value) return "-";
        try {
            return new Date(value).toLocaleString();
        } catch {
            return value;
        }
    };

    const handleDownloadPdf = () => {
        const printWindow = window.open("", "_blank", "noopener,noreferrer");
        if (!printWindow) {
            setError(t("documentDetail.pdfPopupBlocked"));
            return;
        }

        const attachmentsHtml =
            document.attachments?.length > 0
                ? `<ul>${document.attachments
                      .map(
                          (att) =>
                              `<li>${escapeHtml(att.original_name || t("documentDetail.attachment"))}</li>`,
                      )
                      .join("")}</ul>`
                : `<p>${escapeHtml(t("documentDetail.noAttachments"))}</p>`;

        const historyHtml =
            document.history?.length > 0
                ? `<ul>${document.history
                      .map(
                          (log) => `
                            <li>
                                <strong>${escapeHtml(translateHistoryAction(log.action))}</strong><br />
                                ${escapeHtml(translateHistoryDetails(log.details))}<br />
                                <span class="meta">${escapeHtml(formatDateTime(log.timestamp))}</span>
                            </li>`,
                      )
                      .join("")}</ul>`
                : `<p>${escapeHtml(t("documentDetail.noHistory"))}</p>`;

        const commentsHtml =
            document.comments?.length > 0
                ? `<ul>${document.comments
                      .map(
                          (comment) => `
                            <li>
                                <strong>${escapeHtml(
                                    comment.user?.profile?.full_name ||
                                        comment.user?.username ||
                                        "-",
                                )}</strong>
                                ${comment.is_external ? ` (${escapeHtml(t("documentDetail.portalMessage"))})` : ""}
                                <br />
                                ${escapeHtml(comment.text)}<br />
                                <span class="meta">${escapeHtml(formatDateTime(comment.created_at))}</span>
                            </li>`,
                      )
                      .join("")}</ul>`
                : `<p>-</p>`;

        const portalSubmissionHtml = document.portal_submission
            ? `
                <section>
                    <h2>${escapeHtml(t("documentDetail.portalSubmission"))}</h2>
                    <table>
                        <tr><th>${escapeHtml(t("portal.name"))}</th><td>${escapeHtml(document.portal_submission.client_name || "-")}</td></tr>
                        <tr><th>${escapeHtml(t("common.email"))}</th><td>${escapeHtml(document.portal_submission.client_email || "-")}</td></tr>
                        <tr><th>${escapeHtml(t("portal.phone"))}</th><td>${escapeHtml(document.portal_submission.client_phone || "-")}</td></tr>
                        <tr><th>${escapeHtml(t("portal.company"))}</th><td>${escapeHtml(document.portal_submission.company || "-")}</td></tr>
                    </table>
                </section>
            `
            : "";

        const html = `
            <!doctype html>
            <html lang="en">
                <head>
                    <meta charset="utf-8" />
                    <title>${escapeHtml(document.title)} - PDF</title>
                    <style>
                        @page { size: A4; margin: 18mm; }
                        body { font-family: Arial, Helvetica, sans-serif; color: #111827; line-height: 1.45; }
                        h1 { font-size: 24px; margin: 0 0 6px; }
                        h2 { font-size: 14px; margin: 24px 0 8px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.06em; }
                        p, li, td, th { font-size: 12px; }
                        .sub { color: #6b7280; margin-bottom: 18px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { text-align: left; vertical-align: top; padding: 8px 10px; border-bottom: 1px solid #e5e7eb; }
                        th { width: 32%; color: #6b7280; font-weight: 700; }
                        ul { margin: 0; padding-left: 18px; }
                        li { margin-bottom: 10px; }
                        .meta { color: #6b7280; font-size: 11px; }
                        .badge { display: inline-block; padding: 3px 8px; border-radius: 999px; background: #f3e8ff; color: #7e22ce; font-weight: 700; font-size: 11px; }
                    </style>
                </head>
                <body>
                    <h1>${escapeHtml(document.title)}</h1>
                    <div class="sub">
                        ID: #${escapeHtml(document.id)} |
                        ${escapeHtml(translateStatus(document.status_details))}
                    </div>

                    <section>
                        <h2>${escapeHtml(t("documentDetail.tabs.details"))}</h2>
                        <table>
                            <tr><th>ID</th><td>#${escapeHtml(document.id)}</td></tr>
                            <tr><th>${escapeHtml(t("table.status"))}</th><td><span class="badge">${escapeHtml(translateStatus(document.status_details))}</span></td></tr>
                            <tr><th>${escapeHtml(t("documentDetail.creator"))}</th><td>${escapeHtml(document.creator?.profile?.full_name || document.creator?.username || "-")}</td></tr>
                            <tr><th>${escapeHtml(t("table.assignedTo"))}</th><td>${escapeHtml(document.assigned_to?.profile?.full_name || document.assigned_to?.username || t("common.unassigned"))}</td></tr>
                            <tr><th>${escapeHtml(t("table.department"))}</th><td>${escapeHtml(document.department?.name ? translateDepartment(document.department.name) : "-")}</td></tr>
                            <tr><th>${escapeHtml(t("documentModal.fields.type"))}</th><td>${escapeHtml(document.document_type_details ? translateDocumentType(document.document_type_details) : "-")}</td></tr>
                            <tr><th>${escapeHtml(t("documentModal.fields.confidentiality"))}</th><td>${escapeHtml(document.confidentiality_level_details ? translateConfidentiality(document.confidentiality_level_details) : "-")}</td></tr>
                            <tr><th>${escapeHtml(t("documentModal.fields.description"))}</th><td>${escapeHtml(document.description || t("documentDetail.noDescription"))}</td></tr>
                        </table>
                    </section>

                    ${portalSubmissionHtml}

                    <section>
                        <h2>${escapeHtml(t("documentDetail.tabs.attachments"))}</h2>
                        ${attachmentsHtml}
                    </section>

                    <section>
                        <h2>${escapeHtml(t("documentDetail.tabs.history"))}</h2>
                        ${historyHtml}
                    </section>

                    <section>
                        <h2>${escapeHtml(t("documentDetail.tabs.comments"))}</h2>
                        ${commentsHtml}
                    </section>
                </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 300);
    };

    useEffect(() => {
        if (!isOpen) return;

        const loadDeps = async () => {
            try {
                const resp = await api.get("departments/");
                const list = resp.data?.results || resp.data || [];
                setDepartments(Array.isArray(list) ? list : []);
            } catch {}
        };

        const loadStatuses = async () => {
            try {
                const resp = await api.get("document-statuses/");
                const list = resp.data?.results || resp.data || [];
                setStatuses(Array.isArray(list) ? list : []);
            } catch {}
        };

        const loadUsers = async () => {
            try {
                const resp = await api.get("users/");
                const list = resp.data?.results || resp.data || [];
                setUsers(Array.isArray(list) ? list : []);
            } catch {}
        };

        const loadDocumentTypes = async () => {
            try {
                const resp = await api.get("document-types/");
                const list = resp.data?.results || resp.data || [];
                setDocumentTypes(Array.isArray(list) ? list : []);
            } catch {}
        };

        const loadConfidentialityLevels = async () => {
            try {
                const resp = await api.get("confidentiality-levels/");
                const list = resp.data?.results || resp.data || [];
                setConfidentialityLevels(Array.isArray(list) ? list : []);
            } catch {}
        };

        loadDeps();
        loadStatuses();
        loadUsers();
        loadDocumentTypes();
        loadConfidentialityLevels();
    }, [isOpen]);

    const handleTake = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await api.post(`documents/${document.id}/take/`);
            setDocument(response.data);
            onUpdate();
        } catch (err) {
            setError(err?.response?.data?.error || "Error taking document");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const response = await api.patch(
                `documents/${document.id}/`,
                editData,
            );
            setDocument(response.data);
            setIsEditing(false);
            onUpdate();
        } catch {
            setError("Error updating document");
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setLoading(true);
        try {
            await api.post(`documents/${document.id}/comment/`, {
                text: commentText,
                is_external: isExternalComment,
            });
            setCommentText("");
            setIsExternalComment(false);
            fetchDocumentDetails();
        } catch {
            setError("Error adding comment");
        } finally {
            setLoading(false);
        }
    };

    const handleUploadAttachments = async (e) => {
        e.preventDefault();
        if (!attachmentFiles.length) return;

        setLoading(true);
        setError("");
        try {
            for (const file of attachmentFiles) {
                const fd = new FormData();
                fd.append("file", file);
                await api.post(`documents/${document.id}/attachments/`, fd);
            }
            setAttachmentFiles([]);
            fetchDocumentDetails();
        } catch (err) {
            setError(
                err?.response?.data?.detail || "Error uploading attachments",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAttachment = async (attachmentId) => {
        setLoading(true);
        setError("");
        try {
            await api.delete(
                `documents/${document.id}/attachments/${attachmentId}/`,
            );
            fetchDocumentDetails();
        } catch (err) {
            setError(
                err?.response?.data?.detail || "Error deleting attachment",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleRouteToDepartment = async (e) => {
        e.preventDefault();
        if (!routeDepartmentId) return;

        setLoading(true);
        setError("");
        try {
            const resp = await api.patch(`documents/${document.id}/route/`, {
                department_id: Number(routeDepartmentId),
            });
            setDocument(resp.data);
            onUpdate();
        } catch (err) {
            const detail = err?.response?.data?.detail;
            const deptError = err?.response?.data?.department_id;
            setError(
                detail ||
                    (Array.isArray(deptError)
                        ? deptError.join(" ")
                        : deptError) ||
                    t("notifications.routeError"),
            );
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !document) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
                className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm"
                onClick={onClose}
            ></div>
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:w-full sm:max-w-2xl border border-gray-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 w-full"></div>

                    <div className="flex justify-between items-center px-8 py-6 border-b">
                        <div className="flex-1 mr-4">
                            {isEditing ? (
                                <input
                                    className="text-2xl font-bold text-gray-900 w-full border-b focus:outline-none focus:border-purple-500"
                                    value={editData.title}
                                    onChange={(e) =>
                                        setEditData({
                                            ...editData,
                                            title: e.target.value,
                                        })
                                    }
                                />
                            ) : (
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {document.title}
                                </h2>
                            )}
                            {isEditing ? (
                                canEditStatus ? (
                                    <div className="mt-2 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    {t("table.status")}
                                                </label>
                                                <select
                                                    className="block w-full text-sm border-b focus:outline-none focus:border-purple-500 bg-transparent py-1"
                                                    value={editData.status}
                                                    onChange={(e) =>
                                                        setEditData({
                                                            ...editData,
                                                            status: e.target
                                                                .value,
                                                        })
                                                    }
                                                >
                                                    <option value="">
                                                        {t(
                                                            "documentDetail.selectStatus",
                                                        )}
                                                    </option>
                                                    {statuses.map((s) => (
                                                        <option
                                                            key={s.id}
                                                            value={s.id}
                                                        >
                                                            {translateStatus(s)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    {t("table.assignedTo")}
                                                </label>
                                                <select
                                                    className="block w-full text-sm border-b focus:outline-none focus:border-purple-500 bg-transparent py-1"
                                                    value={
                                                        editData.assigned_to_id
                                                    }
                                                    onChange={(e) =>
                                                        setEditData({
                                                            ...editData,
                                                            assigned_to_id:
                                                                e.target.value,
                                                        })
                                                    }
                                                >
                                                    <option value="">
                                                        {t("common.unassigned")}
                                                    </option>
                                                    {users.map((u) => (
                                                        <option
                                                            key={u.id}
                                                            value={u.id}
                                                        >
                                                            {u.profile
                                                                ?.full_name ||
                                                                u.username}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    {t("table.department")}
                                                </label>
                                                <select
                                                    className="block w-full text-sm border-b focus:outline-none focus:border-purple-500 bg-transparent py-1"
                                                    value={
                                                        editData.department_id
                                                    }
                                                    onChange={(e) =>
                                                        setEditData({
                                                            ...editData,
                                                            department_id:
                                                                e.target.value,
                                                        })
                                                    }
                                                >
                                                    {departments.map((d) => (
                                                        <option
                                                            key={d.id}
                                                            value={d.id}
                                                        >
                                                            {translateDepartment(d.name)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    {t("documentModal.fields.type")}
                                                </label>
                                                <select
                                                    className="block w-full text-sm border-b focus:outline-none focus:border-purple-500 bg-transparent py-1"
                                                    value={
                                                        editData.document_type
                                                    }
                                                    onChange={(e) =>
                                                        setEditData({
                                                            ...editData,
                                                            document_type:
                                                                e.target.value,
                                                        })
                                                    }
                                                >
                                                    {documentTypes.map((t) => (
                                                        <option
                                                            key={t.id}
                                                            value={t.code}
                                                        >
                                                            {translateDocumentType(t)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    {t("documentModal.fields.confidentiality")}
                                                </label>
                                                <select
                                                    className="block w-full text-sm border-b focus:outline-none focus:border-purple-500 bg-transparent py-1"
                                                    value={
                                                        editData.confidentiality_level
                                                    }
                                                    onChange={(e) =>
                                                        setEditData({
                                                            ...editData,
                                                            confidentiality_level:
                                                                e.target.value,
                                                        })
                                                    }
                                                >
                                                    {confidentialityLevels.map(
                                                        (c) => (
                                                            <option
                                                                key={c.id}
                                                                value={c.code}
                                                            >
                                                                {translateConfidentiality(c)}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        ID: #{document.id} •{" "}
                                        {translateStatus(document.status_details)} ({t("documentDetail.statusChangesNotAllowed")})
                                    </p>
                                )
                            ) : (
                                <p className="text-sm text-gray-500">
                                    ID: #{document.id} •{" "}
                                    {translateStatus(document.status_details)}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleDownloadPdf}
                                className="text-blue-600 hover:text-blue-800 text-sm font-bold"
                            >
                                {t("documentDetail.downloadPdf")}
                            </button>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-purple-600 hover:text-purple-800 text-sm font-bold"
                                >
                                    {t("common.edit")}
                                </button>
                            )}
                            {isEditing && (
                                <>
                                    <button
                                        onClick={handleUpdate}
                                        disabled={loading}
                                        className="text-green-600 hover:text-green-800 text-sm font-bold"
                                    >
                                        {t("common.save")}
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="text-gray-500 hover:text-gray-700 text-sm font-bold"
                                    >
                                        {t("common.cancel")}
                                    </button>
                                </>
                            )}
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600"
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
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="px-8 py-4 bg-gray-50 border-b flex space-x-4">
                        {["details", "attachments", "history", "comments"].map(
                            (tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition ${activeTab === tab ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    {t(`documentDetail.tabs.${tab}`)}
                                </button>
                            ),
                        )}
                    </div>

                    <div className="px-8 py-6 min-h-[300px] max-h-[500px] overflow-y-auto">
                        {error && (
                            <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}

                        {activeTab === "details" && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                        {t("documentModal.fields.description")}
                                    </h3>
                                    {isEditing ? (
                                        <textarea
                                            className="mt-2 w-full border rounded-lg p-3 text-sm focus:ring-purple-500 focus:border-purple-500"
                                            rows="4"
                                            value={editData.description}
                                            onChange={(e) =>
                                                setEditData({
                                                    ...editData,
                                                    description: e.target.value,
                                                })
                                            }
                                        />
                                    ) : (
                                        <p className="mt-2 text-gray-700 whitespace-pre-wrap">
                                            {document.description ||
                                                t("documentDetail.noDescription")}
                                        </p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                            {t("documentDetail.creator")}
                                        </h3>
                                        <p className="mt-1 text-gray-900">
                                            {document.creator?.profile
                                                ?.full_name ||
                                                document.creator?.username}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                            {t("table.assignedTo")}
                                        </h3>
                                        <div className="flex items-center mt-1">
                                            <p className="text-gray-900">
                                                {document.assigned_to?.profile
                                                    ?.full_name ||
                                                    document.assigned_to
                                                        ?.username ||
                                                    t("common.unassigned")}
                                            </p>
                                            {!document.assigned_to && (
                                                <button
                                                    onClick={handleTake}
                                                    disabled={loading}
                                                    className="ml-3 text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 disabled:opacity-50"
                                                >
                                                    {t(
                                                        "documentDetail.takeDocument",
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {document.portal_submission && (
                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                            {t(
                                                "documentDetail.portalSubmission",
                                            )}
                                        </h3>
                                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                                            <div>
                                                <span className="font-semibold">
                                                    {t("portal.name")}:
                                                </span>{" "}
                                                {document.portal_submission
                                                    .client_name || "-"}
                                            </div>
                                            <div>
                                                <span className="font-semibold">
                                                    {t("common.email")}:
                                                </span>{" "}
                                                {document.portal_submission
                                                    .client_email || "-"}
                                            </div>
                                            <div>
                                                <span className="font-semibold">
                                                    {t("portal.phone")}:
                                                </span>{" "}
                                                {document.portal_submission
                                                    .client_phone || "-"}
                                            </div>
                                            <div>
                                                <span className="font-semibold">
                                                    {t("portal.company")}:
                                                </span>{" "}
                                                {document.portal_submission
                                                    .company || "-"}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {canRoute && (
                                    <form
                                        onSubmit={handleRouteToDepartment}
                                        className="rounded-lg border border-purple-200 bg-purple-50 p-4"
                                    >
                                        <h3 className="text-sm font-semibold text-purple-800 uppercase tracking-wider">
                                            {t(
                                                "documentDetail.routeToDepartment",
                                            )}
                                        </h3>
                                        <div className="mt-3 flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                                            <div className="w-full">
                                                <label className="block text-xs font-semibold text-purple-900">
                                                    {t("table.department")}
                                                </label>
                                                <select
                                                    value={routeDepartmentId}
                                                    onChange={(e) =>
                                                        setRouteDepartmentId(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="mt-1 block w-full rounded-lg border border-purple-200 bg-white p-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                                                    disabled={loading}
                                                >
                                                    <option value="">
                                                        {t(
                                                            "documentDetail.selectDepartment",
                                                        )}
                                                    </option>
                                                    {departments.map((d) => (
                                                        <option
                                                            key={d.id}
                                                            value={d.id}
                                                        >
                                                            {translateDepartment(d.name)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={
                                                    loading ||
                                                    !routeDepartmentId
                                                }
                                                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 disabled:opacity-50"
                                            >
                                                {t("documentDetail.route")}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}

                        {activeTab === "history" && (
                            <div className="space-y-4">
                                {document.history?.length > 0 ? (
                                    document.history.map((log) => (
                                        <div
                                            key={log.id}
                                            className="flex space-x-3 border-l-2 border-purple-200 pl-4 py-1"
                                        >
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {translateHistoryAction(log.action)}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(
                                                            log.timestamp,
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    {translateHistoryDetails(log.details)}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {t("documentDetail.by")} {log.user?.username}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        {t("documentDetail.noHistory")}
                                    </p>
                                )}
                            </div>
                        )}

                        {activeTab === "attachments" && (
                            <div className="space-y-6">
                                <form
                                    onSubmit={handleUploadAttachments}
                                    className="space-y-3"
                                >
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                        onChange={(e) =>
                                            setAttachmentFiles(
                                                Array.from(
                                                    e.target.files || [],
                                                ),
                                            )
                                        }
                                        className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-purple-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-purple-700 hover:file:bg-purple-100"
                                        disabled={loading}
                                    />
                                    <button
                                        type="submit"
                                        disabled={
                                            loading || !attachmentFiles.length
                                        }
                                        className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        {t("documentDetail.upload")}
                                    </button>
                                </form>

                                <div className="space-y-3">
                                    {document.attachments?.length > 0 ? (
                                        document.attachments.map((att) => (
                                            <div
                                                key={att.id}
                                                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
                                            >
                                                <div className="min-w-0">
                                                    <a
                                                        href={att.file}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-sm font-semibold text-purple-700 hover:text-purple-900 truncate block"
                                                        title={
                                                            att.original_name ||
                                                            att.file
                                                        }
                                                    >
                                                        {att.original_name ||
                                                            t(
                                                                "documentDetail.attachment",
                                                            )}
                                                    </a>
                                                    <p className="text-xs text-gray-500">
                                                        {att.uploaded_by
                                                            ?.username
                                                            ? `${t("documentDetail.by")} ${att.uploaded_by.username} • `
                                                            : ""}
                                                        {att.size
                                                            ? `${Math.round(att.size / 1024)} KB • `
                                                            : ""}
                                                        {att.content_type || ""}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeleteAttachment(
                                                            att.id,
                                                        )
                                                    }
                                                    disabled={loading}
                                                    className="ml-3 text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50"
                                                >
                                                    {t("common.delete")}
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">
                                            {t("documentDetail.noAttachments")}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "comments" && (
                            <div className="space-y-6">
                                <form
                                    onSubmit={handleAddComment}
                                    className="space-y-4"
                                >
                                    <textarea
                                        value={commentText}
                                        onChange={(e) =>
                                            setCommentText(e.target.value)
                                        }
                                        placeholder={t(
                                            "documentDetail.addComment",
                                        )}
                                        className="w-full border rounded-lg p-3 text-sm focus:ring-purple-500 focus:border-purple-500"
                                        rows="3"
                                    ></textarea>
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isExternalComment}
                                                onChange={(e) =>
                                                    setIsExternalComment(
                                                        e.target.checked,
                                                    )
                                                }
                                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                            />
                                            <span className="text-sm font-semibold text-gray-700">
                                                {t(
                                                    "documentDetail.publishToPortal",
                                                )}
                                            </span>
                                        </label>
                                        <button
                                            type="submit"
                                            disabled={
                                                loading || !commentText.trim()
                                            }
                                            className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 disabled:opacity-50 shadow-md transition-all"
                                        >
                                            {t("documentDetail.postComment")}
                                        </button>
                                    </div>
                                </form>
                                <div className="space-y-4">
                                    {document.comments?.map((comment) => (
                                        <div
                                            key={comment.id}
                                            className={`p-4 rounded-xl border ${comment.is_external ? "bg-blue-50 border-blue-100" : "bg-gray-50 border-gray-100"}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="text-sm font-bold text-gray-900 block">
                                                        {comment.user?.profile
                                                            ?.full_name ||
                                                            comment.user
                                                                ?.username}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(
                                                            comment.created_at,
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>
                                                {comment.is_external && (
                                                    <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                        Portal Message
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-700 leading-relaxed">
                                                {comment.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentDetailModal;
