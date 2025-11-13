import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import InputField from "../../components/account/AccountGeneralInput";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import ProfileImage from "../../components/account/ProfileImage";
import { useProfileContext } from "../../context/ProfileContext";
import View from "../../components/view/View";
import WhiteHeader from "../../components/register/WhiteHeader";
import ContentBox from "../../components/common/ContentBox";
import api from "../../lib/api";

export default function EditProfilePage() {
    const navigate = useNavigate();
    const { profileData, setProfileData } = useProfileContext();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [originalProfile, setOriginalProfile] = useState({});
    const [imageFile, setImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const getUserProfile = async () => {
            try {
                const response = await axios.get("/api/v1/user/me", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                });

                const user = response.data.data;
                const normalizedUser = {
                    name: user.name || "",
                    email: user.email || "",
                    phoneNumber: user.phoneNumber || "",
                    profileImageUrl: user.profileImageUrl || "",
                };

                setProfileData(normalizedUser);
                setOriginalProfile(normalizedUser);
            } catch (error) {
                console.error("Failed to fetch user profile:", error);
            }
        };

        getUserProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData({ [name]: value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const changedFields = Object.keys(profileData).reduce((acc, key) => {
            const current = profileData[key]?.toString().trim() || "";
            const original = originalProfile[key]?.toString().trim() || "";

            if (current !== original) {
                acc[key] = profileData[key];
            }
            return acc;
        }, {});

        if (Object.keys(changedFields).length === 0 && !imageFile) {
            setError("Tidak ada perubahan untuk disimpan.");
            setLoading(false);
            return;
        }

        delete changedFields.phoneVerified;
        delete changedFields.emailVerified;

        if (Object.keys(changedFields).length > 0) {
            await api.put(
                "/api/v1/users/profile",
                changedFields,
            )
        };

        if (imageFile) {
            await handleSaveProfilePicture();
        }

        navigate("/app/profile");
    }


    const handleSaveProfilePicture = async () => {
        try {
            setUploading(true);
            const formData = new FormData();
            formData.append("file", imageFile);

            const response = await api.post("/api/v1/users/profile/upload-image", formData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            console.log("Image uploaded:", response.data);
        } catch (err) {
            console.error("Failed to upload profile image:", err);
            setError("Gagal mengunggah foto profil.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <View>
            <WhiteHeader title="Edit Akun" />
            <ContentBox>
                <ProfileImage src={profileData.profileImageUrl} onImageSelected={setImageFile} />

                <form onSubmit={handleSave}>
                    <InputField
                        id="name"
                        name="name"
                        label="Nama:"
                        value={profileData.name}
                        onChange={handleChange}
                    />

                    <InputField
                        id="email"
                        name="email"
                        label="Email:"
                        value={profileData.email}
                        onChange={handleChange}
                    />

                    <InputField
                        id="phone"
                        name="phoneNumber"
                        label="Nomor Telepon:"
                        value={profileData.phoneNumber}
                        onChange={handleChange}
                    />

                    {error && (
                        <p className="text-red-500 text-sm text-center mt-2">{error}</p>
                    )}

                    <div className="mt-4">
                        <FullSubmitButton>
                            {loading || uploading ? "Menyimpan..." : "Simpan Data"}
                        </FullSubmitButton>
                    </div>
                </form>
            </ContentBox>
        </View>
    );

}
