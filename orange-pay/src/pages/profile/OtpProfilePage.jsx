import { useState } from "react";
import PhoneLayoutBackground from "../../components/PhoneLayoutBackground";
import MobileShell from "../../components/layout/MobileShell";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";
import OrangeHeader from "../../components/register/OrangeHeader";
import InputField from "../../components/register/RegisterGeneralInput";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import RegisterTextContainer from "../../components/register/RegisterTextContainer";

import { useNavigate } from "react-router-dom";


export default function OtpProfilePage() {
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

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            console.log("--- sending OTP verification ---");
            console.log(`otp : ${otp}`);

            const response = await fetch("/api/v1/users/profile/verify-phone", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    otp: otp,
                }),
            });

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
                <InputField
                    id="otp"
                    name="otp"
                    label="OTP :"
                    type="numeric"
                    placeholder="Masukkan OTP"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                />

                {error && <p className="text-red-500 text-xs">{error}</p>}

                <FullSubmitButton disabled={loading}>
                    {loading ? "Memverifikasi..." : "Lanjut"}
                </FullSubmitButton>
            </form>
        </div>
    );
}
