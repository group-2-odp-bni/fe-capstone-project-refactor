import { React, useState } from "react";
import { useNavigate } from "react-router-dom";
import View from "../../components/view/View";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import api from "../../lib/api";
import CenteredNumberInputPad from "../../components/register/CenteredNumberInputPad";
import { useLoginContext } from "../../context/LoginContext";
import axios from "axios";



export default function ResetPinPage() {

    return (
        <View>
            <SetNewPinContent />
        </View>

    );
}

function SetNewPinContent() {
    const navigate = useNavigate();
    const { loginData } = useLoginContext();

    const [pin, setPin] = useState("");
    const [firstPin, setFirstPin] = useState(null);
    const [step, setStep] = useState("create"); // "create" | "confirm"
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);

    const submitPin = async () => {
        setAttempt((x) => x + 1);

        if (pin.length !== 6) {
            showToast({
                type: "error",
                title: "Error",
                message: "PIN harus 6 digit",
            })
            return;
        }

        // Step 1 — Create
        if (step === "create") {
            setFirstPin(pin);
            setPin("");
            setStep("confirm");
            return;
        }

        // Step 2 — Confirm
        if (pin !== firstPin) {
            showToast({
                type: "error",
                title: "Error",
                message: "PIN tidak cocok, silakan coba lagi.",
            })
            setPin("");
            setFirstPin(null);
            setStep("create");
            return;
        }

        // Step 3 — Send to backend
        if (!loginData?.stateToken) {
            showToast({
                type: "error",
                title: "Error",
                message: "Sesi registrasi tidak valid.Silakan ulangi.",
            })
            return;
        }

        setLoading(true);
        try {
            const pinRes = await axios.post(
                `${API_BASE}/api/v1/pin/reset/confirm`,
                {
                    newPin: pin,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${loginData.stateToken}`,
                    },

                }
            );

            if (pinRes.status === 200) {
                navigate("/login");
                return
            }

        } catch (err) {
            const messege = err?.response?.data?.message || err?.message || "Terjadi kesalahan. Silakan coba lagi.";
            showToast({
                type: "error",
                title: "Error",
                message: messege,
            })
            setPin("");
            setFirstPin(null);
            setStep("create");
        } finally {
            setLoading(false);
        }
    };

    const onFormSubmit = (e) => {
        e.preventDefault();
        submitPin();
    };

    const goBack = () => {
        if (window.history.length > 1) navigate(-1);
        else navigate("/register", { replace: true });
    };

    return (
        <form onSubmit={onFormSubmit} className="pb-10">
            <CenteredNumberInputPad
                value={pin}
                onChange={setPin}
                onConfirm={submitPin}
                loading={loading}
                title={step === "create" ? "Buat PIN Anda" : "Konfirmasi PIN Anda"}
                attemptKey={attempt}
                onBack={goBack}
            />
        </form>
    );
}