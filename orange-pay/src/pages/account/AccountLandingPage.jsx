import { useNavigate } from "react-router-dom";
import ButtonLink from "../../components/button/ButtonLink";
import MobileShell from "../../components/layout/MobileShell";
import PhoneLayoutBackground from "../../components/PhoneLayoutBackground";
import OrangeHeader from "../../components/register/OrangeHeader";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";

export default function AccountLandingPage() {
    const navigate = useNavigate();

    return (
        <PhoneLayoutBackground>
            <MobileShell>
                <OrangeHeader />
                <WhiteCardContainer>
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                            Akun Saya
                        </h2>

                        <div className="space-y-6">

                            <div className="border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200">
                                <ButtonLink
                                    onClick={() => navigate("/app/profile")}
                                    className="text-[#1C6C79]"
                                >
                                    Lihat Profil
                                </ButtonLink>
                            </div>


                            <div className="border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200">
                                <ButtonLink
                                    onClick={() => navigate("/app/transactionLimit")}
                                    className="text-[#1C6C79] hover:no-underline"
                                >
                                    Kelola Batas
                                </ButtonLink>
                            </div>
                        </div>
                    </div>
                </WhiteCardContainer>
            </MobileShell>
        </PhoneLayoutBackground>
    );
}
