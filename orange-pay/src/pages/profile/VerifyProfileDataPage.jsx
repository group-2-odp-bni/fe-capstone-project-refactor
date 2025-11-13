import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PhoneLayoutBackground from "../../components/PhoneLayoutBackground";
import MobileShell from "../../components/layout/MobileShell";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";
import OrangeHeader from "../../components/register/OrangeHeader";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import RegisterTextContainer from "../../components/register/RegisterTextContainer";
import OtpInputField from "../../components/input/OtpInputField";
import View from "../../components/view/View";
import api from "../../lib/api";

export default function VerifyProfileDataPage() {
    const location = useLocation();
    const navigate = useNavigate();

    // Expect `type` to be passed like: navigate("/verify", { state: { type: "email" } })
    const verifyType = location.state?.type || "email"; // fallback to email
    const isEmail = verifyType === "email";

    return (
        <View>
            <OrangeHeader />
            <WhiteCardContainer>
                <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
                    {isEmail ? "Verifikasi Email" : "Verifikasi Nomor Telepon"}
                </h2>

                <RegisterTextContainer>
                    {isEmail
                        ? "Kode OTP telah dikirim ke email Anda. Masukkan kode di bawah untuk verifikasi email."
                        : "Kode OTP telah dikirim ke nomor telepon Anda. Masukkan kode di bawah untuk verifikasi nomor telepon."}
                </RegisterTextContainer>

                <VerifyProfileContent verifyType={verifyType} />
            </WhiteCardContainer>
        </View>
    );
}

function VerifyProfileContent({ verifyType }) {
    const navigate = useNavigate();
    const [otpCode, setOtpCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const endpoint =
                verifyType === "email"
                    ? "/api/v1/users/profile/verify-email"
                    : "/api/v1/users/profile/verify-phone";

            console.log(`--- verifying ${verifyType} with OTP ${otpCode} ---`);

            await api.post(endpoint, { otpCode });

            //  Move back to profile after successful verification
            navigate("/app/profile");
        } catch (err) {
            if (err.response) {
                const errorMessage =
                    err.response.data?.error?.message || "Kode OTP salah atau sudah kadaluarsa.";
                setError(errorMessage);
            } else {
                setError("Tidak dapat terhubung ke server. Coba lagi nanti.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
            <OtpInputField
                className="mt-10 mb-10"
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
    );
}
