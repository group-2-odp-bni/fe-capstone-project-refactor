import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import InputField from "../../components/account/AccountGeneralInput";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import ProfileImage from "../../components/account/ProfileImage";
import { useProfileContext } from "../../context/ProfileContext";
import MobileView from "../../components/view/MobileView";
import WhiteHeader from "../../components/register/WhiteHeader";
import ContentBox from "../../components/common/ContentBox";

export default function EditProfilePage() {
    const navigate = useNavigate();
    const { profileData, setProfileData } = useProfileContext();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [originalProfile, setOriginalProfile] = useState({});

    useEffect(() => {
        const getUserProfile = async () => {
            try {
                console.log("--- get user name ----");
                const response = await axios.get("/api/v1/user/me", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                });

                const user = response.data.data;
                console.log("Fetched user:", user);

                const normalizedUser = {
                    name: user.name || "",
                    email: user.email || "",
                    phoneNumber: user.phoneNumber || "",
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

        try {
            const changedFields = Object.keys(profileData).reduce((acc, key) => {
                const current = profileData[key]?.toString().trim() || "";
                const original = originalProfile[key]?.toString().trim() || "";

                if (current !== original) {
                    acc[key] = profileData[key];
                }
                return acc;
            }, {});

            if (Object.keys(changedFields).length === 0) {
                setError("Tidak ada perubahan untuk disimpan.");
                setLoading(false);
                return;
            }

            console.log("Changed fields to send:", changedFields);

            const response = await axios.put(
                "/api/v1/users/profile",
                changedFields,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                }
            );

            console.log("Profile updated:", response.data);

            navigate("/app/profile");

        } catch (err) {
            console.error("Failed to update profile:", err);
            setError("Gagal menyimpan data. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <MobileView>
            <WhiteHeader title="Edit Akun" />
            <ContentBox>
                <ProfileImage />

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
                            {loading ? "Menyimpan..." : "Simpan Data"}
                        </FullSubmitButton>
                    </div>
                </form>
            </ContentBox>
        </MobileView>
    );
}
