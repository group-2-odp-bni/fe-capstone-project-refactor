// src/components/transfer/TransferStepGuard.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTransfer } from "../../context/TransferContext";

/**
 * TransferStepGuard
 * Props:
 *  - require: { step?: string, requireData?: string[] }
 *    - step: minimal step name expected (e.g. "confirm" or "pin")
 *    - requireData: array of data keys that must be present (e.g. ["phone","amount"])
 *  - redirectTo: path to redirect when checks fail (default: "/app/transfer")
 *
 * Usage:
 * <TransferStepGuard require={{ step: 'pin', requireData: ['phone','amount','stepUpToken'] }}>
 *    <PinPage />
 * </TransferStepGuard>
 */
export default function TransferStepGuard({ require: requirement = {}, redirectTo = "/app/transfer", children }) {
  const { step, data } = useTransfer();
  const navigate = useNavigate();

  useEffect(() => {
    // If nothing to check, allow
    if (!requirement) return;

    // 1) check required data keys
    if (Array.isArray(requirement.requireData) && requirement.requireData.length > 0) {
      const missing = requirement.requireData.filter((k) => {
        const v = data?.[k];
        // treat empty string / null / undefined as missing
        return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
      });
      if (missing.length > 0) {
        // redirect to base transfer page (or custom redirectTo)
        navigate(redirectTo, { replace: true });
        return;
      }
    }

    // 2) check step ordering (optional)
    if (requirement.step && typeof requirement.step === "string") {
      // if the current step is earlier than required step, redirect
      const ordering = ["select", "details", "amount", "confirm", "pin", "success"];
      const currentIndex = ordering.indexOf(step);
      const requiredIndex = ordering.indexOf(requirement.step);
      if (requiredIndex === -1) {
        // unknown requirement -> allow
        return;
      }
      if (currentIndex === -1 || currentIndex < requiredIndex) {
        // we are before the required step; redirect
        navigate(redirectTo, { replace: true });
        return;
      }
    }
    // all good -> do nothing
  }, [requirement, data, step, navigate, redirectTo]);

  return <>{children}</>;
}
