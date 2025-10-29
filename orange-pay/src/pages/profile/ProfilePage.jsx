// src/pages/ProfilePage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { ProfileProvider } from "../../context/ProfileContext";
import PhoneLayoutBackground from "../../components/PhoneLayoutBackground";
import MobileShell from "../../components/layout/MobileShell";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";
import UserInfoCard from "../../components/account/userInfoCard";
import OrangeHeader from "../../components/register/OrangeHeader";
import ProfileImage from "../../components/account/ProfileImage";
import { clearTokens } from "../../services/auth/authService";

export default function ProfilePage() {
    const navigate = useNavigate();

    const handleLogout = () => {
        clearTokens(); // remove access & refresh token
        navigate("/login", { replace: true }); // redirect to login
    };

    return (
        <ProfileProvider>
            <PhoneLayoutBackground>
                <MobileShell>
                    <OrangeHeader />

                    <WhiteCardContainer>
                        <ProfileImage />

                        <UserInfoCard
                            name="Jane Doe"
                            email="jane.doe@example.com"
                            phone="+628123456789"
                        />

                        <div className="mt-6 space-y-3">
                            <FullSubmitButton>Edit Data</FullSubmitButton>

                            {/* Logout button */}
                            <FullSubmitButton onClick={handleLogout}>
                                Keluar
                            </FullSubmitButton>
                        </div>
                    </WhiteCardContainer>
                </MobileShell>
            </PhoneLayoutBackground>
        </ProfileProvider>
    );
}
