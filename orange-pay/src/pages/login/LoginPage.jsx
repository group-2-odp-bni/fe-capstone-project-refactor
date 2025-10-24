// import { Outlet } from "react-router-dom";
import MobileShell from "../../components/layout/MobileShell";
import PhoneLayoutBackground from "../../components/PhoneLayoutBackground";
import OrangePayLogo from "../../components/register/OrangePayLogo";
import OrangeHeader from "../../components/register/OrangeHeader";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";
import LoginTextContainer from "../../components/login/LoginTextContainer";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import PhoneNumberInput from "../../components/login/PhoneNumberInput";


export default function LoginPage() {
  return (
    <PhoneLayoutBackground>
      <MobileShell bg="bg-white">
        <div>
          <OrangeHeader />
          <WhiteCardContainer>
            <OrangePayLogo />

            <h2 className="mt-6 text-2xl font-bold text-center">Welcome Back</h2>
            <LoginTextContainer>
              Please sign in to continue
            </LoginTextContainer>

            <PhoneNumberInput
            // phone={phone}
            // onChange={handlePhoneChange}
            // inputRef={inputRef}
            // err={err}
            />

            <LoginTextContainer>
              Dengan masuk atau mendaftar, Anda menyetujui
              <span className="underline font-bold mx-1 text-gray-700">Syarat dan Kebijakan Privasi</span>
              Anda.
            </LoginTextContainer>


            <FullSubmitButton>Send OTP via WhatsApp</FullSubmitButton>

          </WhiteCardContainer>



        </div>
      </MobileShell>
    </PhoneLayoutBackground>
  );
}
