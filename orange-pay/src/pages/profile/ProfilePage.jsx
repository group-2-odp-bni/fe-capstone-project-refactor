import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UserInfoCard from "../../components/account/UserInfoCard";
import ProfileImage from "../../components/account/ProfileImage";
import { FullActionButton } from "../../components/button/FullActionButton";
import { useProfileContext } from "../../context/ProfileContext";
import View from "../../components/view/View";
import Header from "../../components/Header";
import ContentBox from "../../components/common/ContentBox";
import api from "../../lib/api";

export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profileData, setProfileData } = useProfileContext();

  useEffect(() => {
    const getUserProfile = async () => {
      try {
        const response = await api.get("/api/v1/user/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        const user = response.data.data;

        setProfileData({
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          phoneVerified: user.phoneVerified,
          emailVerified: user.emailVerified,
          profileImageUrl: user.profileImageUrl,
        });
      } catch (error) {
        // ignore / handle
      }
    };

    getUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View>
      <Header title="Akun Saya" 
      onBack={() => navigate("/app/account")}
      />
      <ContentBox>
        <ProfileImage src={profileData.profileImageUrl} unhoverable={true} />

        <UserInfoCard
          name={profileData.name}
          email={profileData.email}
          phone={profileData.phoneNumber}
          phoneVerified={profileData.phoneVerified}
          emailVerified={profileData.emailVerified}
          emailVerifyLink="/app/verifyEmail"
          phoneVerifyLink="/app/verifyPhone"
        />

        <div className="mt-6">
          <FullActionButton
            onClick={() =>
              navigate("/app/editProfile", {
                state: { from: location },
              })
            }
          >
            Ubah Data
          </FullActionButton>
          <FullActionButton onClick={() => navigate("/app/dashboard")}>
            Kembali Dashboard
          </FullActionButton>
        </div>
      </ContentBox>
    </View>
  );
}
