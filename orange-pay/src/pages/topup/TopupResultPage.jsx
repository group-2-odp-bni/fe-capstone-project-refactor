import React from "react";
import { useTopupContext } from "../../context/TopupContext";
import SuccessIcon from "../../components/common/SuccessIcon";
import { useNavigate } from "react-router-dom";
import ConfirmButton from "../../components/top-up/ConfirmButton";

export default function TopupResultPage({
}) {
  const navigate = useNavigate();
  const { topupData } = useTopupContext();
  const formattedAmount = `Rp${Number(topupData.amount || 0).toLocaleString("id-ID")}`;

  const date = new Date(topupData.createdAt);
  const dateText = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeText = date.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="w-full bg-white flex justify-center px-4 py-6">
      <div className="w-full max-w-sm bg-white rounded-[22px] shadow-[0_8px_28px_rgba(0,0,0,0.06)] border border-gray-100 p-6">
        {/* Brand row (ikon + tulisan RANGE-PAY) */}
        <div className="flex items-center justify-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-500 overflow-hidden">
            <img src="/orange.jpg" alt="brand" className="w-full h-full object-cover" />
          </span>
          <span className="text-gray-900 font-extrabold uppercase tracking-[0.35em]">
            RANGE-PAY
          </span>
        </div>


        <SuccessIcon
          message="Topup Success!"
        />


        {/* Title */}
        <p className="mt-3 text-center text-sm font-extrabold text-gray-700">
          Detail Transaction
        </p>

        {/* Amount */}
        <div className="mt-2 text-center text-[32px] leading-[38px] font-extrabold tracking-tight text-gray-900">
          {formattedAmount}
        </div>

        {/* Recipient box */}
        <div className="mt-4 rounded-[14px] border border-gray-200 p-3">
          <div className="text-[13px] font-extrabold text-gray-900">{topupData.walletName}</div>
          <div className="text-[13px] text-gray-900">{topupData.walletId}</div>
        </div>

        {/* Details rows */}
        <div className="mt-4 space-y-4">
          <Row>
            <RowLabel>Ref ID</RowLabel>
            <RowValue>{topupData.transactionRef}</RowValue>
          </Row>

          <Row>
            <RowLabel>Date</RowLabel>
            <RowValue>{topupData.createdAt}</RowValue>
          </Row>

          <Row>
            <RowLabel>Time</RowLabel>
            <RowValue>{timeText}</RowValue>
          </Row>

          <Row>
            <RowLabel>Type of Transactions</RowLabel>
            <RowValue>Top Up</RowValue>
          </Row>
        </div>

        {/* Optional bottom button */}
        <ConfirmButton
          onClick={() => navigate("/app/dashboard")}
          label="Done"
          loading={false}
          className="mt-5 mb-5"
        />




      </div>
    </div>
  );
}

/* ---------- Sub-components ---------- */
function Row({ children }) {
  return <div className="flex items-center justify-between">{children}</div>;
}

function RowLabel({ children }) {
  return <div className="text-[13px] font-semibold text-gray-400">{children}</div>;
}

function RowValue({ children, className = "" }) {
  return (
    <div className={`text-[13px] font-semibold text-gray-900 ${className}`}>{children}</div>
  );
}
