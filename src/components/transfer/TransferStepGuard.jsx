// src/components/transfer/TransferStepGuard.jsx
import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTransfer } from "../../context/TransferContext";

/**
 * TransferStepGuard
 *
 * Props:
 *  - require: { step?: string, requireData?: string[], allowBack?: boolean }
 *    - step: minimal step name expected (e.g. "pin")
 *    - requireData: array of data keys that must be present (e.g. ["phone","amount"])
 *    - allowBack: if true, don't block browser back navigation to earlier steps
 *  - redirectTo: path to redirect when checks fail (default: "/app/transfer")
 */
export default function TransferStepGuard({
  require: requirement = {},
  redirectTo = "/app/transfer",
  children,
}) {
  const { step, data } = useTransfer();
  const navigate = useNavigate();

  // destructure requirement into stable pieces
  const reqStep = requirement?.step || null;
  const reqKeys = Array.isArray(requirement?.requireData) ? requirement.requireData : [];
  const allowBack = Boolean(requirement?.allowBack);

  // compute a stable string to use as dep when require keys change
  const reqKeysSignature = useMemo(() => reqKeys.join("|"), [reqKeys.join("|")]); // harmless guard

  // check required data keys
  const missingKeys = useMemo(() => {
    if (!reqKeys || reqKeys.length === 0) return [];
    return reqKeys.filter((k) => {
      const v = data?.[k];
      return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
    });
  }, [data, reqKeysSignature]); // only re-evaluates when data or reqKeysSignature change

  useEffect(() => {
    // nothing to check
    if (!reqStep && (!reqKeys || reqKeys.length === 0)) return;

    // If any required data missing -> redirect
    if (missingKeys.length > 0) {
      navigate(redirectTo, { replace: true });
      return;
    }

    // If a step requirement provided -> check ordering
    if (reqStep) {
      const ordering = ["select", "verify", "details", "amount", "confirm", "pin", "success"];
      const currentIndex = ordering.indexOf(step);
      const requiredIndex = ordering.indexOf(reqStep);

      // if unknown required step, allow by default
      if (requiredIndex === -1) return;

      // if current step is before the required step -> redirect
      if (currentIndex === -1 || currentIndex < requiredIndex) {
        // If allowBack is true, don't block navigation for earlier steps (useful when verify is forward-only)
        if (!allowBack) {
          navigate(redirectTo, { replace: true });
        }
        return;
      }
    }
    // all good -> allow rendering children
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, missingKeys.join(","), reqStep, allowBack, redirectTo, navigate]);

  return <>{children}</>;
}
