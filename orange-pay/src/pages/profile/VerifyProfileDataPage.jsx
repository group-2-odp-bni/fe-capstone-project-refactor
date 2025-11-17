import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ContentBox from "../../components/common/ContentBox";
import WhiteHeader from "../../components/register/WhiteHeader";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import RegisterTextContainer from "../../components/register/RegisterTextContainer";
import OtpInputField from "../../components/input/OtpInputField";
import View from "../../components/view/View";
import api from "../../lib/api";
import ButtonLink from "../../components/button/ButtonLink";
import CountdownTimer from "../../components/dashboard/CountdownTimer";
import { useCountdown } from "../../hooks/useCountdown";

export default function VerifyProfileDataPage() {
    const location = useLocation();
    const verifyType = location.state?.type || "email";

    const isEmail = verifyType === "email";

    return (
        <View>
            <WhiteHeader title="" to="/app/editProfile" />
            <ContentBox>
                <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
                    {isEmail ? "Verifikasi Email" : "Verifikasi Nomor Telepon"}
                </h2>

                <RegisterTextContainer>
                    {isEmail
                        ? "Kode OTP telah dikirim ke email Anda. Masukkan kode di bawah untuk verifikasi email."
                        : "Kode OTP telah dikirim ke nomor telepon Anda. Masukkan kode di bawah untuk verifikasi nomor telepon."}
                </RegisterTextContainer>

                <VerifyProfileContent verifyType={verifyType} />
            </ContentBox>
        </View>
    );
}

function VerifyProfileContent({ verifyType }) {
    const navigate = useNavigate();

    const [otpCode, setOtpCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Countdown state
    const { secondsLeft, reset } = useCountdown(5);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const endpoint =
                verifyType === "email"
                    ? "/api/v1/users/profile/verify-email"
                    : "/api/v1/users/profile/verify-phone";

            await api.post(endpoint, { otpCode });

            navigate("/app/profile");
        } catch (err) {
            const message =
                err.response?.data?.error?.message ||
                "Kode OTP salah atau sudah kadaluarsa.";

            setError(message);
        } finally {
            setLoading(false);
        }
    };

    // --------------------------
    // CHANGE EMAIL / PHONE
    // --------------------------
    const handleChangeEmailOrPhone = async (e) => {
        e.preventDefault();

        try {
            const endpoint =
                verifyType === "email"
                    ? "/api/v1/users/profile/cancel-pending-email"
                    : "/api/v1/users/profile/cancel-pending-phone";

            await api.post(endpoint);
        } catch {
            // backend already sends proper response, ignore
        } finally {
            navigate("/app/editProfile");
        }
    };

    // --------------------------
    // RESEND OTP
    // --------------------------
    const handleResendOtp = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const endpoint =
                verifyType === "email"
                    ? "/api/v1/users/profile/resend-email-otp"
                    : "/api/v1/users/profile/resend-phone-otp";

            await api.post(endpoint);

            reset();

        } catch (err) {
            const message =
                err.response?.data?.error?.message || "Gagal mengirim ulang OTP.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5 mt-6">

            {/* OTP field */}
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

            {/* Countdown */}
            <CountdownTimer
                initialSeconds={secondsLeft}
                className="text-center"
            />

            {/* Error */}
            {error && <p className="text-red-500 text-xs">{error}</p>}

            {/* Show only when timer ends */}
            {secondsLeft === 0 && (
                <ButtonLink onClick={handleResendOtp}>
                    Kirim Ulang OTP
                </ButtonLink>
            )}

            {/* change email or phone */}
            <ButtonLink onClick={handleChangeEmailOrPhone}>
                Ganti {verifyType === "email" ? "Email" : "Phone"}
            </ButtonLink>

            <FullSubmitButton disabled={loading}>
                {loading ? "Memverifikasi..." : "Lanjut"}
            </FullSubmitButton>
        </form>
    );
}
