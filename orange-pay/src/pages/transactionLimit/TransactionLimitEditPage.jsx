import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ContentBox from "../../components/common/ContentBox";
import WhiteHeader from "../../components/Header";
import View from "../../components/view/View";
import api from "../../lib/api";
import { useTransactionLimitContext } from "../../context/TransactionLimitContext";
import H2Medium from "../../components/text/H2Medium";
import ToggleSwitch from "../../components/button/ToggleSwitch";
import NumberInputField from "../../components/input/NumberInputField";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import { useToast } from "../../context/ToastContext";

export default function TransactionLimitEditPage() {
  const navigate = useNavigate();
  const { limitData } = useTransactionLimitContext();
  const { showToast } = useToast();

  // Initialize formData from limitData
  const [formData, setFormData] = useState({
    dailyMaxRp: limitData.dailyMaxRp || 0,
    enforceDaily: limitData.enforceDaily || false,

    weeklyMaxRp: limitData.weeklyMaxRp || 0,
    enforceWeekly: limitData.enforceWeekly || false,

    monthlyMaxRp: limitData.monthlyMaxRp || 0,
    enforceMonthly: limitData.enforceMonthly || false,

    timezone: "Asia/Jakarta",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dayLimit = Number(formData.dailyMaxRp);
    const weekLimit = Number(formData.weeklyMaxRp);
    const monthLimit = Number(formData.monthlyMaxRp);

    if (dayLimit > weekLimit) {
      showToast({
        type: "error",
        title: "Invalid Limit",
        message: "Daily limit tidak boleh lebih besar dari Weekly limit.",
      });
      return;
    }

    if (weekLimit > monthLimit) {
      showToast({
        type: "error",
        title: "Invalid Limit",
        message: "Weekly limit tidak boleh lebih besar dari Monthly limit.",
      });
      return;
    }

    if (dayLimit > monthLimit) {
      showToast({
        type: "error",
        title: "Invalid Limit",
        message: "Daily limit tidak boleh lebih besar dari Monthly limit.",
      });
      return;
    }

    try {
      await api.put("/api/v1/wallets/limits", formData);
      navigate(-1);
    } catch (error) {
      showToast({
        type: "error",
        title: "Update Failed",
        message: "Something went wrong while saving your limits.",
      });
    }
  };


  return (
    <View>
      <WhiteHeader title="Ubah Limit Transaksi"/>
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

          <FullSubmitButton>Save Changes</FullSubmitButton>
        </form>
      </ContentBox>
    </View>
  );
}
