import MobileShell from "../../components/layout/MobileShell";
import PhoneLayoutBackground from "../../components/PhoneLayoutBackground";
import OrangePayLogo from "../../components/register/OrangePayLogo";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";

export default function AccountLandingPage(){
    return(
        <PhoneLayoutBackground>
            <MobileShell>
                <OrangePayLogo></OrangePayLogo>
                <WhiteCardContainer></WhiteCardContainer>
            </MobileShell>
        </PhoneLayoutBackground>
    )
}