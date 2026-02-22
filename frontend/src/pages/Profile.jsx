import { useState, useEffect } from "react";
import api from "../services/api";

const Profile = () => {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        position: "",
        bio: "",
    });
    const [profilePicture, setProfilePicture] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get("profile/");
            setProfileData(response.data);
            setFormData({
                full_name: response.data.user.profile?.full_name || "",
                position: response.data.user.profile?.position || "",
                bio: response.data.user.profile?.bio || "",
            });
        } catch {
            setError("Error fetching profile");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            data.append("full_name", formData.full_name);
            data.append("position", formData.position);
            data.append("bio", formData.bio);
            if (profilePicture) {
                data.append("profile_picture", profilePicture);
            }

            await api.patch("profile/", data, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setEditing(false);
            fetchProfile();
        } catch {
            setError("Error updating profile");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;

    const user = profileData.user;
    const profile = user.profile;

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                <div className="h-32 bg-gradient-to-r from-purple-600 to-pink-600"></div>
                <div className="px-8 pb-8">
                    <div className="relative -mt-16 mb-6">
                        <img 
                            src={profile?.profile_picture || "https://ui-avatars.com/api/?name=" + (profile?.full_name || user.username) + "&background=random"} 
                            alt="Profile" 
                            className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-lg bg-white"
                        />
                        {!editing && (
                            <button 
                                onClick={() => setEditing(true)}
                                className="absolute bottom-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-white text-purple-600 p-2 rounded-full shadow-md hover:bg-gray-50 transition"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {editing ? (
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700">Full Name</label>
                                    <input 
                                        type="text" 
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                                        value={formData.full_name}
                                        onChange={e => setFormData({...formData, full_name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700">Position</label>
                                    <input 
                                        type="text" 
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                                        value={formData.position}
                                        onChange={e => setFormData({...formData, position: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Bio</label>
                                <textarea 
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                                    rows="3"
                                    value={formData.bio}
                                    onChange={e => setFormData({...formData, bio: e.target.value})}
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Profile Picture</label>
                                <input 
                                    type="file" 
                                    onChange={e => setProfilePicture(e.target.files[0])}
                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                                />
                            </div>
                            <div className="flex space-x-2 pt-4">
                                <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 shadow-md transition">Save Changes</button>
                                <button type="button" onClick={() => setEditing(false)} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-200 transition">Cancel</button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-900">{profile?.full_name || user.username}</h1>
                                <p className="text-lg text-purple-600 font-medium">{profile?.position || "Member"} • {profile?.department?.name || "No Department"}</p>
                                <p className="mt-2 text-gray-500">{user.email}</p>
                            </div>
                            
                            {profile?.bio && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">About</h3>
                                    <p className="mt-1 text-gray-700">{profile.bio}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                        <svg className="h-6 w-6 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Created Documents
                                    </h3>
                                    <div className="space-y-2">
                                        {profileData.created_documents.length > 0 ? (
                                            profileData.created_documents.map(doc => (
                                                <div key={doc.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
                                                    <span className="font-medium text-gray-700">{doc.title}</span>
                                                    <span className="text-xs bg-white px-2 py-1 rounded-full shadow-sm text-gray-500">{doc.status_details?.name}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">No documents created yet.</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                        <svg className="h-6 w-6 mr-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Taken Documents
                                    </h3>
                                    <div className="space-y-2">
                                        {profileData.assigned_documents.length > 0 ? (
                                            profileData.assigned_documents.map(doc => (
                                                <div key={doc.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
                                                    <span className="font-medium text-gray-700">{doc.title}</span>
                                                    <span className="text-xs bg-white px-2 py-1 rounded-full shadow-sm text-gray-500">{doc.status_details?.name}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">No documents taken yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
