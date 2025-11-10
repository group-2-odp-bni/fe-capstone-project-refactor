import { useState, useMemo } from "react";
import ConfirmButton from "../../components/top-up/ConfirmButton";
import TopUpIcon from "../../components/top-up/TopUpIcon";
import { useTopupContext } from "../../context/TopupContext";
import VirtualAccountBox from "../../components/top-up/VirtualAccountBox";
import CountdownTimer from "../../components/dashboard/CountdownTimer";
import { useNavigate } from "react-router-dom";
import View from "../../components/view/View";
import WhiteHeader from "../../components/register/WhiteHeader";
import api from "../../lib/api";

export default function TopUpConfirmationPage() {
    const [copied, setCopied] = useState(false);
    const { topupData } = useTopupContext();
    const navigate = useNavigate();


    // format number coming from context
    const formatAmount = (amount) => {
        return `Rp ${Number(amount || 0).toLocaleString("id-ID")}`

    }

    // get topup status
    const handleGetTopupStatus = async () => {
        const response = await api.get(
            "",
            {

            }
        )

        return response.data.data;
    }

    return (
        <View>
            <WhiteHeader title="Topup Confirmation" />
            <div className="flex items-center justify-center px-4">
                {/* Card */}
                <div className="w-full max-w-sm rounded-[28px] border border-gray-200 shadow-sm min-h-[500px]">
                    <div className="p-6 md:p-8">
                        {/* Top icon */}
                        <TopUpIcon />

                        {/* Amount */}
                        <div className="mt-4 text-center">
                            <div className="text-[28px] leading-[34px] font-extrabold text-gray-900">
                                {formatAmount(topupData.amount)}
                            </div>

                            {/* Description */}
                            <div className="space-y-1 mt-8">
                                <p className="text-xs text-gray-800">Orange-Pay Top Up</p>
                                <p className="text-xs text-gray-800">Via BNI Virtual Account</p>


                            </div>
                        </div>

                        {/* VA box */}
                        <VirtualAccountBox vaNumber={topupData.vaNumber} />


                        {/* Expiry */}
                        <CountdownTimer initialSeconds={60} className="mt-5 mb-5" />

                        {/* Done button */}
                        <ConfirmButton
                            onClick={() => navigate("/app/topup/result")}
                            label="Done"
                            loading={false}
                        />
                    </div>
                </div>

            </div>

        </View>

    );
}
