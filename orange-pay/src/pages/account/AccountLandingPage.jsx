import { useNavigate } from "react-router-dom";
import MobileShell from "../../components/layout/MobileShell";
import PhoneLayoutBackground from "../../components/PhoneLayoutBackground";
import OrangeHeader from "../../components/register/OrangeHeader";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";
import WhiteHeader from "../../components/register/WhiteHeader";
import ContentBox from "../../components/common/ContentBox";
import { FullActionButton } from "../../components/button/FullActionButton";
import { clearTokens } from "../../services/auth/authService";
import AccountButtonLink from "../../components/button/AccountButtonLink";
import MobileView from "../../components/view/MobileView";
import DynamicShell from "../../components/layout/dynamicShell";


export default function AccountLandingPage() {
    const navigate = useNavigate();
    const handleLogout = () => {
        clearTokens();
        navigate("/login", { replace: true });
    };

    return (
        <MobileView>
            <WhiteHeader title="Account" />
            <ContentBox className="border border-gray-300">
                <div className="">



                    <div className="space-y-6">
                        <h2 className="m-1 font-medium">Akun Saya</h2>


                        <AccountButtonLink
                            onClick={() => navigate("/app/profile")}
                        >
                            Lihat Profil
                        </AccountButtonLink>



                        <h2 className="m-1">Kelola Batas</h2>
                        <AccountButtonLink
                            onClick={() => navigate("/app/transactionLimit")}
                        >
                            Kelola Batas
                        </AccountButtonLink>

                        <div className="mt-auto mb-6 flex justify-center">
                            <FullActionButton onClick={handleLogout}>Keluar</FullActionButton>
                        </div>

                    </div>
                </div>


            </ContentBox>
        </MobileView>

    );
}
