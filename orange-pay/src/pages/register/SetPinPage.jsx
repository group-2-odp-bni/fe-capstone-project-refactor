import React from "react";
import { useNavigate } from "react-router-dom";

import BrandLogo from "../../components/common/BrandLogo";
import CenteredNumberInputPad from "../../components/register/CenteredNumberInputPad";
import PinDots from "../../components/register/PinDots";
import usePinSetupLogic from "../../hooks/usePinSetupLogic";
import PhoneLayoutBackground from "../../components/PhoneLayoutBackground";
import MobileShell from "../../components/layout/MobileShell";
import PageHeader from "../../components/page_header/PageHeader";
import NumberPad from "../../components/register/Keypad";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";

export default function SetPinPage() {

  return (
    <PhoneLayoutBackground>
      <MobileShell>
        <PageHeader className="mt-5">Input Pin</PageHeader>
        <form className="pb-10">
          <CenteredNumberInputPad />
          <FullSubmitButton>Simpan</FullSubmitButton>

        </form>




      </MobileShell>
    </PhoneLayoutBackground>
  );
}
