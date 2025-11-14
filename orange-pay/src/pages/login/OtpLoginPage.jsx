import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import WhiteCardContainer from "../../components/register/WhiteCardContainer";
import OrangeHeader from "../../components/register/OrangeHeader";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import OrangePayLogo from "../../components/register/OrangePayLogo";
import RegisterTextContainer from "../../components/register/RegisterTextContainer";
import { useLoginContext } from "../../context/LoginContext";
import OtpInputField from "../../components/input/OtpInputField";
import ButtonLink from "../../components/button/ButtonLink";
import CountdownTimer from "../../components/dashboard/CountdownTimer";
import View from "../../components/view/View";
import { useCountdown } from "../../hooks/useCountDown";

export default function OtpLoginPage() {
    return (
        <View>
            <OrangeHeader />
            <WhiteCardContainer>
                <OrangePayLogo />
                <RegisterTextContainer>
                    Kode OTP telah dikirim ke WhatsApp Anda. Masukkan kode di bawah untuk
                    melanjutkan.
                </RegisterTextContainer>
                <SetOtpContent />
            </WhiteCardContainer>
        </View>
    );
}

function SetOtpContent() {
    const navigate = useNavigate();
    const { loginData, setLoginData } = useLoginContext();

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { secondsLeft, reset } = useCountdown(30);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await axios.post("/api/v1/auth/verify", {
                phoneNumber: loginData.phoneNumber,
                otp,
            });

            setLoginData({ stateToken: response.data.data.stateToken });
            navigate("/login/pin");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError("");
        setLoading(true);

        //get recaptcha token
        const recaptchaToken = localStorage.getItem("_grecaptcha")

        try {
            const response = await axios.post("/api/v1/auth/resend-otp", {
                phoneNumber: loginData.phoneNumber,
                captchaToken: recaptchaToken,
        
            });

            setLoginData({ stateToken: response.data.data.stateToken });
            setOtp("");
            reset();
        } catch (err) {

            // get error code
            errorCode = err.response?.data?.error.code 

            // error handle - expired
            if(errorCode ==="AUTH-2002"){
                setError("OTP telah expired")
                setOtp("")
                reset("")
            }

            // else
            setError(
                err.response?.data?.error.message ||
                err.message ||
                "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit} className="space-y-5 mt-6">

                {/* OTP field */}
                <OtpInputField
                    id="otp"
                    name="otp"
                    label="OTP :"
                    type="numeric"
                    placeholder="Masukkan OTP"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                />

                <CountdownTimer initialSeconds={secondsLeft} />

                {error && <p className="text-red-500 text-xs">{error}</p>}

                <FullSubmitButton disabled={loading}>
                    {loading ? "Memverifikasi..." : "Lanjut"}
                </FullSubmitButton>
            </form>

            {/* Resend OTP */}
            <div className="text-center mt-4 pb-6">
                {secondsLeft === 0 && (
                    <ButtonLink onClick={handleResendOtp}>
                        Kirim Ulang OTP
                    </ButtonLink>
                )}
            </div>
        </div>
    );
}
