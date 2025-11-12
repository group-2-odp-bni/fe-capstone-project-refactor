import MobileShell from "../layout/MobileShell";
import PhoneLayoutBackground from "../PhoneLayoutBackground";


export default function MobileView({children}){
    return(
        <PhoneLayoutBackground>
            <MobileShell>
                {children}
            </MobileShell>
        </PhoneLayoutBackground>

    );
}