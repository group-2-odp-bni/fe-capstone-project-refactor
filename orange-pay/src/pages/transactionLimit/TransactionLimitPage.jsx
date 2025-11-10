import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ContentBox from "../../components/common/ContentBox";
import WhiteHeader from "../../components/register/WhiteHeader";
import DynamicShell from "../../components/layout/DynamicShell";
import api from "../../lib/api";
import { useTransactionLimitContext } from "../../context/TransactionLimitContext"
import H2Medium from "../../components/text/H2Medium"
import { FullActionButton } from "../../components/button/FullActionButton";
import ToggleSwitch from "../../components/button/ToggleSwitch"
import NumberInputField from "../../components/input/NumberInputField";

export default function TransactionLimitPage() {

    // const amount = 100000;
    const navigate = useNavigate();
    const { limitData, setLimitData } = useTransactionLimitContext()


    const getUserLimit = async () => {

        const response = await api.get("/api/v1/wallets/limits")

        setLimitData({
            dailyMaxRp: response.data.data.dailyMaxRp,
            enforceDaily: response.data.data.enforceDaily,
            dailyRemainingRp: response.data.data.dailyRemainingRp,

            weeklyMaxRp: response.data.data.weeklyMaxRp,
            enforceWeekly: response.data.data.enforceWeekly,
            weeklyRemainingRp: response.data.data.weeklyRemainingRp,

            monthlyMaxRp: response.data.data.monthlyMaxRp,
            enforceMonthly: response.data.data.enforceMonthly,
            monthlyRemainingRp: response.data.data.monthlyRemainingRp,
        });


    }

    useEffect(() => {
        getUserLimit();
    }, []);


    return (
        <DynamicShell>
            <WhiteHeader title="Transaction Limit" />
            <ContentBox>
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <H2Medium>Daily Limit : </H2Medium>
                        <ToggleSwitch
                            disabled={true}
                            name="enforceDaily"
                            enabled={limitData.enforceDaily}
                            onToggle={(val) =>
                                setFormData((prev) => ({ ...prev, enforceDaily: val }))
                            } />

                    </div>
                    <NumberInputField
                        id="dailyMaxRp"
                        name="dailyMaxRp"
                        type="number"
                        value={limitData.dailyMaxRp}
                        readOnly={true}
                    />



                    <div className="flex items-center justify-between">
                        <H2Medium>Weekly Limit : </H2Medium>
                        <ToggleSwitch
                            disabled={true}
                            name="enforceWeekly"
                            enabled={limitData.enforceWeekly}
                            onToggle={(val) =>
                                setFormData((prev) => ({ ...prev, enforceWeekly: val }))
                            }
                        />

                    </div>
                    <NumberInputField
                        id="weeklyMaxRp"
                        name="weeklyMaxRp"
                        type="number"
                        value={limitData.weeklyMaxRp}
                        readOnly={true}
                    />


                    <div className="flex items-center justify-between">
                        <H2Medium>Monthly Limit : </H2Medium>
                        <ToggleSwitch
                            disabled={true}
                            name="enforceMonthly"
                            enabled={limitData.enforceMonthly}
                            onToggle={(val) =>
                                setFormData((prev) => ({ ...prev, enforceMonthly: val }))
                            } />

                    </div>
                    <NumberInputField
                        id="monthlyMaxRp"
                        name="monthlyMaxRp"
                        type="number"
                        value={limitData.monthlyMaxRp}
                        readOnly={true}
                    />


                    <FullActionButton
                        onClick={() => navigate("/app/edittransactionlimit")}
                    >Edit</FullActionButton>

                </div>



            </ContentBox>

        </DynamicShell>
    );
}