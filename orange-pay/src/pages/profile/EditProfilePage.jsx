import PhoneLayoutBackground from "../../components/PhoneLayoutBackground";
import MobileShell from "../../components/layout/MobileShell";
import OrangeHeader from "../../components/register/OrangeHeader";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";
import InputField from "../../components/account/AccountGeneralInput";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import ProfileImage from "../../components/account/ProfileImage";

export default function EditProfilePage() {
    return (
        <PhoneLayoutBackground>
            <MobileShell>
                <OrangeHeader />
                <WhiteCardContainer>
                    <ProfileImage />
                    <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
                        Akun Saya
                    </h2>

                    <form>
                        <InputField
                            id="name"
                            name="name"
                            label="name :"
                        />

                        <InputField
                            id="email"
                            email="email"
                            label="email :"
                        />

                        <InputField
                            id="phone"
                            name="phone"
                            label="phone :"
                        />

                        <FullSubmitButton>Simpan Data</FullSubmitButton>

                    </form>
                </WhiteCardContainer>
            </MobileShell>
        </PhoneLayoutBackground>
    )

}