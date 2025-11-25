// src/pages/EditProfilePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "../../components/account/AccountGeneralInput";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import ProfileImage from "../../components/account/ProfileImage";
import { useProfileContext } from "../../context/ProfileContext";
import View from "../../components/view/View";
import Header from "../../components/Header";
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
    window.history.replaceState(null, "", location.pathname + location.search);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const getUserProfile = async () => {
      try {
        const response = await api.get("/api/v1/user/me");
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
        // optional: keep skeleton / silent failure
        console.error("Failed to load profile", error);
      }
    };

    getUserProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const changedFields = Object.keys(profileData).reduce((acc, key) => {
        const current = profileData[key]?.toString().trim() || "";
        const original = originalProfile[key]?.toString().trim() || "";
        if (current !== original) acc[key] = profileData[key];
        return acc;
      }, {});

      if (Object.keys(changedFields).length === 0 && !imageFile) {
        setError("Tidak ada perubahan untuk disimpan.");
        setLoading(false);
        return;
      }

      // Remove non-editable flags
      delete changedFields.phoneVerified;
      delete changedFields.emailVerified;

      // Update profile fields if any changed
      if (Object.keys(changedFields).length > 0) {
        await api.put("/api/v1/users/profile", changedFields);
      }

      // Upload new image if provided
      if (imageFile) {
        await handleSaveProfilePicture();
      }

      // Conditional navigation logic
      const emailChanged = changedFields.hasOwnProperty("email");
      const phoneChanged = changedFields.hasOwnProperty("phoneNumber");

      if (emailChanged) {
        navigate("/app/verify", {
          state: { type: "email", email: changedFields.email },
          replace: true,
        });
      } else if (phoneChanged) {
        navigate("/app/verify", { state: { type: "phone" }, replace: true });
      } else {
        navigate("/app/profile", { replace: true });
      }
    } catch (err) {
      setError("Gagal menyimpan perubahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // ---- New: improved upload handler with specific error handling ----
  const handleSaveProfilePicture = async () => {
    try {
      setError("");
      setUploading(true);

      const formData = new FormData();
      formData.append("file", imageFile);

      // Let your `api` instance handle Authorization header and retry/refresh logic.
      const response = await api.post("/api/v1/users/profile/upload-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Expecting server to return updated profile or url
      const newUrl = response?.data?.data?.profileImageUrl ?? response?.data?.data?.url ?? null;
      if (newUrl) {
        // update profile context and originalProfile so future compares are accurate
        setProfileData((prev) => ({ ...prev, profileImageUrl: newUrl }));
        setOriginalProfile((prev) => ({ ...prev, profileImageUrl: newUrl }));
        setError("");
      } else {
        // success but no url returned — still treat as success
        setError("");
      }
    } catch (err) {
      // Inspect error shape you provided and surface useful message
      const serverError = err?.response?.data?.error;
      if (serverError?.code === "USER-4003") {
        // Use server-provided message (e.g. "Invalid file type. Allowed types: JPEG, PNG, WebP")
        setError(serverError.message || "Format file tidak didukung.");
      } else if (serverError?.message) {
        // Generic server-provided message for other cases
        setError(serverError.message);
      } else {
        // Fallback
        setError("Gagal mengunggah foto profil.");
      }

      // Optionally log for debugging
      console.error("Upload profile image failed:", err);
    } finally {
      setUploading(false);
      // clear local imageFile so UI reflects the final state if needed
      // keep it if you want to allow retry with same file
      // setImageFile(null);
    }
  };

  return (
    <View>
      <Header title="Edit Akun" />
      <ContentBox>
        <ProfileImage src={profileData.profileImageUrl} onImageSelected={setImageFile} />

        <form onSubmit={handleSave}>
          <InputField id="name" name="name" label="Nama:" value={profileData.name} onChange={handleChange} />

          <InputField id="email" name="email" label="Email:" value={profileData.email} onChange={handleChange} />

          <InputField
            id="phone"
            name="phoneNumber"
            label="Nomor Telepon:"
            value={profileData.phoneNumber}
            onChange={handleChange}
          />

          {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}

          <div className="mt-4">
            <FullSubmitButton>{loading || uploading ? "Menyimpan..." : "Simpan Data"}</FullSubmitButton>
          </div>
        </form>
      </ContentBox>
    </View>
  );
}
