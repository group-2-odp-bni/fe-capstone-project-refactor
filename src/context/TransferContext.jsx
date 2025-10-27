// src/context/TransferContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const TRANSFER_FLOW_KEY = "transferFlowState";
const STEP_ORDER = ["select", "verify", "details", "amount", "confirm", "pin", "success"];


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
  // --- ALL hooks must be inside the component body ---
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
    },
  };

  // 1) Try to rehydrate, but immediately drop it if it represents a finished flow (step === 'success')
  const savedRaw = useMemo(() => loadFromSession(), []);
  const initialFlow = (() => {
    if (!savedRaw) return defaultFlow;
    if (savedRaw && savedRaw.step === "success") {
      try {
        sessionStorage.removeItem(TRANSFER_FLOW_KEY);
        console.debug("TransferContext: cleared saved success flow on init");
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
    if (p.endsWith("/pin") && flow.step !== "pin") {
      setFlow((f) => ({ ...f, step: "pin" }));
    } else if (p.endsWith("/confirm") && flow.step !== "confirm") {
      setFlow((f) => ({ ...f, step: "confirm" }));
    }
    // add other route -> step mappings only if they are necessary for your UX.
    // intentionally OMIT mapping for "/success".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
  

  // persist to sessionStorage when flow changes, but NEVER persist PIN
  useEffect(() => {
    if (skipPersistRef.current) {
      // consume the flag and skip one persist cycle
      skipPersistRef.current = false;
      return;
    }

    try {
      const clone = { step: flow.step, data: { ...flow.data } };
      if ("pin" in clone.data) delete clone.data.pin;
      // Do not persist success-step snapshots: if flow.step === "success" skip saving
      if (clone.step === "success") {
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
  const setStep = (stepName) => {
    if (!STEP_ORDER.includes(stepName)) {
      console.warn("TransferContext.setStep: unknown step", stepName);
      return;
    }
    setFlow((f) => ({ ...f, step: stepName }));
  };

  const nextStep = () =>
    setFlow((prev) => {
      const idx = STEP_ORDER.indexOf(prev.step);
      const next = idx === -1 ? STEP_ORDER[0] : STEP_ORDER[Math.min(STEP_ORDER.length - 1, idx + 1)];
      return { ...prev, step: next };
    });

  const prevStep = () =>
    setFlow((prev) => {
      const idx = STEP_ORDER.indexOf(prev.step);
      const prevName = idx <= 0 ? STEP_ORDER[0] : STEP_ORDER[idx - 1];
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
  };

  return <TransferContext.Provider value={contextValue}>{children}</TransferContext.Provider>;
};

export const useTransfer = () => {
  const ctx = useContext(TransferContext);
  if (!ctx) throw new Error("useTransfer must be used within TransferProvider");
  return ctx;
};
