import React, { useState } from "react";
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
import { useRegistrationContext } from "../../context/RegistrationContext";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";

export default function SetPinPage() {

  return (
    <PhoneLayoutBackground>
      <MobileShell>
        <PageHeader className="mt-5 mb-5">Input Pin</PageHeader>
        <WhiteCardContainer>
          <SetPinContent />
        </WhiteCardContainer>

      </MobileShell>
    </PhoneLayoutBackground>
  );
}


function SetPinContent() {

  // init data and object
  const navigate = useNavigate();
  const { userData } = useRegistrationContext();
  console.log(userData.stateToken);


  // init state
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  // set handler when user click submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    //hit api 1
    try {
      console.log("--- sent request ---");
      console.log(`pin : ${pin}`);

      const response = await fetch('/api/v1/auth/pin', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userData.stateToken}`,
        },
        body: JSON.stringify({
          pin: pin,
        }),
      });

      // throw error if failed
      if (!response.ok) {
        throw new Error("Failed to send request");
      }

      //catch data
      const data = await response.json();
      console.log("pin successfully set :", data);

      //set new navagation
      navigate("/");



    } catch {

      console.error(err);
      setError(err.message || "Something went wrong.");


    } finally {

      setLoading(false);

    }
  }


  return (
    <form onSubmit={handleSubmit} className="pb-10">
      <CenteredNumberInputPad
        value={pin}
        onChange={setPin}
      />
      <FullSubmitButton disabled={loading}>
        {loading ? "Menyimpan..." : "Simpan"}
      </FullSubmitButton>
    </form>
  )

}
