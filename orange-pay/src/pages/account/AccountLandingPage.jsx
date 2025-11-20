import { useNavigate } from "react-router-dom";
import ContentBox from "../../components/common/ContentBox";
import { FullActionButton } from "../../components/button/FullActionButton";
import { clearTokens } from "../../services/auth/authService";
import AccountButtonLink from "../../components/button/AccountButtonLink";
import View from "../../components/view/View";
import H2Medium from "../../components/text/H2Medium";
import WhiteHeader from "../../components/register/WhiteHeader";


export default function AccountLandingPage() {
    const navigate = useNavigate();
    const handleLogout = () => {
        clearTokens();
        navigate("/login", { replace: true });
    };

    return (
        <View>
            <WhiteHeader title="Akun" to="/app/dashboard" />
            <ContentBox className="border border-gray-300">
                <div className="">



                    <div className="space-y-6">
                        <H2Medium>Akun Saya</H2Medium>
                        <AccountButtonLink
                            onClick={() => navigate("/app/profile")}
                        >
                            Lihat Profil
                        </AccountButtonLink>
                        <AccountButtonLink
                            onClick={() => navigate("/app/resetPin")}
                        >
                            Reset Pin
                        </AccountButtonLink>



                        <H2Medium>Kelola Batas</H2Medium>
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
        </View>

    );
}
