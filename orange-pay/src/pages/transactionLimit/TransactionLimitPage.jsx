import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import SliderInputField from "../../components/input/SliderInputField";
import MobileShell from "../../components/layout/MobileShell";
import PhoneLayoutBackground from "../../components/PhoneLayoutBackground";
import OrangeHeader from "../../components/register/OrangeHeader";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";

export default function TransactionLimitPage() {

    // const amount = 100000;
    const max = 100000;
    

    return (
        <PhoneLayoutBackground>
            <MobileShell>
                <OrangeHeader />
                <WhiteCardContainer>

                    <SliderInputField
                        label="Select Amount"
                        name="amount"
                        value={10}
                        min={0}
                        max={max}
                        step={5}
                        onChange={(e) => setAmount(e.target.value)}
                    />



                </WhiteCardContainer>
            </MobileShell>
        </PhoneLayoutBackground>
    );
}