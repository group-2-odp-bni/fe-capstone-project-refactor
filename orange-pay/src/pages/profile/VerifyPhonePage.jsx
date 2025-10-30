import { useState } from "react";
import PhoneLayoutBackground from "../../components/PhoneLayoutBackground";
import MobileShell from "../../components/layout/MobileShell";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";
import OrangeHeader from "../../components/register/OrangeHeader";
import InputField from "../../components/register/RegisterGeneralInput";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import RegisterTextContainer from "../../components/register/RegisterTextContainer";
import OtpInputField from "../../components/input/OtpInputField";

import { useNavigate } from "react-router-dom";
import axios from "axios";
import ButtonLink from "../../components/button/ButtonLink";


export default function VerifyPhonePage() {
    return (
        <PhoneLayoutBackground>
            <MobileShell>
                <OrangeHeader />
                <WhiteCardContainer>
                    <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
                        Verify Profile
                    </h2>
                    <RegisterTextContainer>
                        Kode OTP telah dikirim ke WhatsApp Anda. Masukkan kode di bawah untuk verifikasi data profile.
                    </RegisterTextContainer>

                    <VerifyProfileContent />
                </WhiteCardContainer>
            </MobileShell>
        </PhoneLayoutBackground>
    );
}

function VerifyProfileContent() {
    const navigate = useNavigate();

    const [otpCode, setOtpCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            console.log("--- sending OTP verification ---");
            console.log(`otp : ${otpCode}`);

            const response = await axios.post(
                "/api/v1/users/profile/verify-phone",
                { otpCode },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                }
            );


            if (!response.ok) {
                throw new Error("Failed to send request");
            }

            const data = await response.json();

            // move to next step
            navigate("/app/profile");

        } catch (err) {
            console.error(err);
            setError(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit} className="space-y-5 mt-6">
                <OtpInputField className="mt-10 mb-10"
                    id="otpCode"
                    name="otpCode"
                    label="OTP :"
                    type="numeric"
                    placeholder="Masukkan OTP"
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                />

                {error && <p className="text-red-500 text-xs">{error}</p>}

                <FullSubmitButton disabled={loading}>
                    {loading ? "Memverifikasi..." : "Lanjut"}
                </FullSubmitButton>
            </form>

        </div>
    );
}
