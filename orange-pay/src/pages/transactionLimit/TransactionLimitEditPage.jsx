import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ContentBox from "../../components/common/ContentBox";
import WhiteHeader from "../../components/register/WhiteHeader";
import MobileView from "../../components/view/MobileView";
import api from "../../lib/api";
import { useTransactionLimitContext } from "../../context/TransactionLimitContext";
import H2Medium from "../../components/text/H2Medium";
import { FullActionButton } from "../../components/button/FullActionButton";
import ToggleSwitch from "../../components/button/ToggleSwitch";
import NumberInputField from "../../components/input/NumberInputField";

export default function TransactionLimitEditPage() {
    const navigate = useNavigate();
    const { limitData } = useTransactionLimitContext();

    // Initialize formData from limitData
    const [formData, setFormData] = useState({
        dailyMaxRp: limitData.dailyMaxRp || 0,
        enforceDaily: limitData.enforceDaily || false,

        weeklyMaxRp: limitData.weeklyMaxRp || 0,
        enforceWeekly: limitData.enforceWeekly || false,

        monthlyMaxRp: limitData.monthlyMaxRp || 0,
        enforceMonthly: limitData.enforceMonthly || false,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post("/api/v1/wallets/limits", formData);
            navigate(-1);
        } catch (error) {
            console.error("Error updating limits:", error);
        }
    };

    return (
        <MobileView>
            <WhiteHeader title="Edit Transaction Limit" />
            <ContentBox>
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* DAILY LIMIT */}

                        <div className="flex items-center justify-between">
                            <H2Medium>Daily Limit : </H2Medium>
                            <ToggleSwitch
                                name="enforceDaily"
                                enabled={formData.enforceDaily}
                                onToggle={(val) =>
                                    setFormData((prev) => ({ ...prev, enforceDaily: val }))
                                }
                            />
                        </div>
                        <NumberInputField
                            id="dailyMaxRp"
                            name="dailyMaxRp"
                            type="number"
                            value={formData.dailyMaxRp}
                            onChange={handleChange}
                        />


                    {/* WEEKLY LIMIT */}

                        <div className="flex items-center justify-between">
                            <H2Medium>Weekly Limit : </H2Medium>
                            <ToggleSwitch
                                name="enforceWeekly"
                                enabled={formData.enforceWeekly}
                                onToggle={(val) =>
                                    setFormData((prev) => ({ ...prev, enforceWeekly: val }))
                                }
                            />
                        </div>
                        <NumberInputField
                            id="weeklyMaxRp"
                            name="weeklyMaxRp"
                            type="number"
                            value={formData.weeklyMaxRp}
                            onChange={handleChange}
                        />


                    {/* MONTHLY LIMIT */}

                        <div className="flex items-center justify-between">
                            <H2Medium>Monthly Limit : </H2Medium>
                            <ToggleSwitch
                                name="enforceMonthly"
                                enabled={formData.enforceMonthly}
                                onToggle={(val) =>
                                    setFormData((prev) => ({ ...prev, enforceMonthly: val }))
                                }
                            />
                        </div>
                        <NumberInputField
                            id="monthlyMaxRp"
                            name="monthlyMaxRp"
                            type="number"
                            value={formData.monthlyMaxRp}
                            onChange={handleChange}
                        />


                    <FullActionButton onClick={handleSubmit}>Save Changes</FullActionButton>
                </form>
            </ContentBox>
        </MobileView>
    );
}
