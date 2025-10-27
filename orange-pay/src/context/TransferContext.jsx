// src/context/TransferContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const TRANSFER_FLOW_KEY = "transferFlowState";
// NOTE: 'verify' intentionally NOT included here so it's not part of normal step order or back-navigation.
const STEP_ORDER = ["select", "amount", "confirm", "pin", "success"];

const TransferContext = createContext(null);

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn("TransferContext: parse error", err);
    return null;
  }
}

function loadFromSession() {
  try {
    const raw = sessionStorage.getItem(TRANSFER_FLOW_KEY);
    return safeParse(raw);
  } catch (err) {
    console.warn("TransferContext: loadFromSession error", err);
    return null;
  }
}

function saveToSession(state) {
  try {
    sessionStorage.setItem(TRANSFER_FLOW_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("TransferContext: saveToSession error", err);
  }
}

export const TransferProvider = ({ children }) => {
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  // suppression refs used to avoid immediate re-persist or route-sync loops
  const skipPersistRef = useRef(false);
  const skipRouteSyncRef = useRef(false);

  const defaultFlow = {
    step: "select",
    data: {
      fromWalletName: null,
      fromWalletPhone: null,
      phone: "",
      contactName: "",
      accountId: "",
      amount: "",
      note: "",
      // PIN is ephemeral and never persisted
      transactionId: null,
      verified: false, // it's fine to persist whether we've verified a number
    },
  };

  // 1) Try to rehydrate, but immediately drop it if it represents a finished flow (step === 'success' or 'verify')
  const savedRaw = useMemo(() => loadFromSession(), []);
  const initialFlow = (() => {
    if (!savedRaw) return defaultFlow;
    // if the saved snapshot is success or verify — treat as fresh
    if (savedRaw && (savedRaw.step === "success" || savedRaw.step === "verify")) {
      try {
        sessionStorage.removeItem(TRANSFER_FLOW_KEY);
        console.debug("TransferContext: cleared saved success/verify flow on init");
      } catch (e) {}
      return defaultFlow;
    }
    if (typeof savedRaw === "object" && savedRaw.step && savedRaw.data && typeof savedRaw.data === "object") {
      return { ...defaultFlow, ...savedRaw, data: { ...defaultFlow.data, ...savedRaw.data } };
    }
    return defaultFlow;
  })();

  const [flow, setFlow] = useState(initialFlow);

  // keep route-driven steps in sync for explicit subpaths (but allow suppression for one cycle)
  useEffect(() => {
    if (skipRouteSyncRef.current) {
      skipRouteSyncRef.current = false;
      return;
    }
    const p = location.pathname || "";
    // keep only mappings for intermediate steps we actually want controlled by routes.
    // Do NOT map "/success" -> "success" because success page must be independent from the context.
    // Also intentionally OMIT mapping for "/verify" so verify remains a runtime-only step.
    if (p.endsWith("/pin") && flow.step !== "pin") {
      setFlow((f) => ({ ...f, step: "pin" }));
    } else if (p.endsWith("/confirm") && flow.step !== "confirm") {
      setFlow((f) => ({ ...f, step: "confirm" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // persist to sessionStorage when flow changes, but NEVER persist PIN or VERIFY or SUCCESS
  useEffect(() => {
    if (skipPersistRef.current) {
      // consume the flag and skip one persist cycle
      skipPersistRef.current = false;
      return;
    }

    try {
      const clone = { step: flow.step, data: { ...flow.data } };
      if ("pin" in clone.data) delete clone.data.pin;
      // Do not persist success-step or verify-step snapshots:
      if (clone.step === "success" || clone.step === "verify") {
        try {
          sessionStorage.removeItem(TRANSFER_FLOW_KEY);
        } catch (e) {}
        return;
      }
      saveToSession(clone);
    } catch (err) {
      console.warn("TransferContext: persist error", err);
    }
  }, [flow]);

  // Clear session when the user leaves /app/transfer/* routes.
  useEffect(() => {
    const prev = prevPathRef.current || "";
    const current = location.pathname || "";
    const wasInTransfer = prev.startsWith("/app/transfer");
    const nowInTransfer = current.startsWith("/app/transfer");

    if (wasInTransfer && !nowInTransfer) {
      try {
        sessionStorage.removeItem(TRANSFER_FLOW_KEY);
      } catch (e) {}
      setFlow(defaultFlow);
    }

    prevPathRef.current = current;
  }, [location.pathname]);

  // When flow.step becomes success, clear persisted state and reset in-memory flow,
  // but suppress route-sync and persist for a single cycle to avoid re-saving.
  useEffect(() => {
    if (flow.step === "success") {
      try {
        sessionStorage.removeItem(TRANSFER_FLOW_KEY);
      } catch (e) {}
      skipRouteSyncRef.current = true;
      skipPersistRef.current = true;
      setFlow(defaultFlow);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.step]);

  // navigation helpers
  // Accept 'verify' as a runtime step even though it's not part of STEP_ORDER and won't be persisted.
  const setStep = (stepName) => {
    if (stepName !== "verify" && !STEP_ORDER.includes(stepName)) {
      console.warn("TransferContext.setStep: unknown step", stepName);
      return;
    }
    setFlow((f) => ({ ...f, step: stepName }));
  };

  const nextStep = () =>
    setFlow((prev) => {
      const idx = STEP_ORDER.indexOf(prev.step);
      // if current step is a runtime-only step (like 'verify'), advance to the logical next => 'details'
      if (prev.step === "verify") {
        return { ...prev, step: "details" };
      }
      const next = idx === -1 ? STEP_ORDER[0] : STEP_ORDER[Math.min(STEP_ORDER.length - 1, idx + 1)];
      return { ...prev, step: next };
    });

  const prevStep = () =>
    setFlow((prev) => {
      const idx = STEP_ORDER.indexOf(prev.step);
      let prevName = idx <= 0 ? STEP_ORDER[0] : STEP_ORDER[idx - 1];
      // 'verify' is not in STEP_ORDER, so we won't return to it via prevStep
      return { ...prev, step: prevName };
    });

  // merge-data setter (do NOT persist pin)
  const setData = (patch) => {
    const patched = { ...patch };
    if ("pin" in patched) delete patched.pin;
    setFlow((prev) => ({ ...prev, data: { ...prev.data, ...patched } }));
  };

  // allow full reset (clears storage + in-memory) and suppress immediate re-persist/route-sync once
  const reset = () => {
    try {
      sessionStorage.removeItem(TRANSFER_FLOW_KEY);
    } catch (err) {}
    skipPersistRef.current = true;
    skipRouteSyncRef.current = true;
    setFlow(defaultFlow);
  };

  // Helper: trigger a one-time verify step if there's no phone/account present.
  // This does not get persisted and will not be considered part of normal navigation history.
  const requireVerifyIfMissingNumber = () => {
    const hasNumber =
      !!(flow.data && (flow.data.fromWalletPhone || flow.data.phone || flow.data.accountId));
    if (!hasNumber) {
      // set runtime-only verify step
      setFlow((prev) => ({ ...prev, step: "verify" }));
      return true;
    }
    return false;
  };

  const contextValue = {
    flow,
    step: flow.step,
    data: flow.data,
    setFlow,
    setStep,
    nextStep,
    prevStep,
    setData,
    reset,
    requireVerifyIfMissingNumber,
  };

  return <TransferContext.Provider value={contextValue}>{children}</TransferContext.Provider>;
};

export const useTransfer = () => {
  const ctx = useContext(TransferContext);
  if (!ctx) throw new Error("useTransfer must be used within TransferProvider");
  return ctx;
};
