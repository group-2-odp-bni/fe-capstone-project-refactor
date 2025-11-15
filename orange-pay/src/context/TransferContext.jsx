// src/context/TransferContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const TRANSFER_FLOW_KEY = "transferFlowState";
// 'verify' intentionally NOT included here so it's not part of normal step order or back-navigation.
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

/**
 * mapStepToPath
 * - central mapping from logical step -> canonical route we want shown to user
 * - keep in sync with your Route definitions
 */
const mapStepToPath = (stepName) => {
  switch (stepName) {
    case "pin":
      return "/app/transfer/pin";
    case "confirm":
      return "/app/transfer";
    case "success":
      return "/app/transfer/success";
    case "amount":
      return "/app/transfer";
    case "select":
    default:
      return "/app/transfer";
  }
};

export const TransferProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
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
      verified: false,
    },
  };

  // Rehydrate from session if present (but ignore if success/verify)
  const savedRaw = useMemo(() => loadFromSession(), []);
  const initialFlow = (() => {
    if (!savedRaw) return defaultFlow;
    if (savedRaw && (savedRaw.step === "success" || savedRaw.step === "verify")) {
      try {
        sessionStorage.removeItem(TRANSFER_FLOW_KEY);
      } catch (e) {}
      return defaultFlow;
    }
    if (typeof savedRaw === "object" && savedRaw.step && savedRaw.data && typeof savedRaw.data === "object") {
      return { ...defaultFlow, ...savedRaw, data: { ...defaultFlow.data, ...savedRaw.data } };
    }
    return defaultFlow;
  })();

  const [flow, setFlow] = useState(initialFlow);

  // ---------------- NEW: remember last non-verify snapshot in memory ----------------
  // This allows restoring a meaningful previous state when user wants to go back from "verify".
  const lastNonVerifyRef = useRef(null);
  // seed ref with initialFlow if it's non-verify
  if (!lastNonVerifyRef.current && initialFlow && initialFlow.step !== "verify") {
    lastNonVerifyRef.current = { ...initialFlow, data: { ...(initialFlow.data || {}) } };
  }
  // -------------------------------------------------------------------------------

  /**
   * Apply incoming navigation state exactly once (used by QuickTransfer or other callers).
   * We clear the navigation state afterwards (replaceState) so it won't reapply on refresh/back.
   */
  useEffect(() => {
    const navState = location.state;
    if (!navState || typeof navState !== "object") return;

    const normalizeStep = (s) => (s === "enter-amount" ? "amount" : s);
    const incomingStep = normalizeStep(navState.step);
    const incomingData = navState.data;

    const valid = incomingStep && (incomingStep === "verify" || STEP_ORDER.includes(incomingStep));
    if (!valid && !incomingData) return;

    // avoid route-sync/persist fighting this programmatic application
    skipPersistRef.current = true;
    skipRouteSyncRef.current = true;

    setFlow((prev) => ({
      ...prev,
      step: valid ? incomingStep : prev.step,
      data: incomingData ? { ...prev.data, ...incomingData } : prev.data,
    }));

    // Clear navigation state so reloading/back won't reapply it
    try {
      window.history.replaceState({}, document.title, location.pathname);
    } catch (_) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  /**
   * Keep route-driven steps in sync for explicit subpaths (only confirm/pin are mapped)
   * We allow one-cycle suppression via skipRouteSyncRef.
   */
  useEffect(() => {
    if (skipRouteSyncRef.current) {
      skipRouteSyncRef.current = false;
      return;
    }
    const p = location.pathname || "";
    if (p.endsWith("/pin") && flow.step !== "pin") {
      setFlow((f) => ({ ...f, step: "pin" }));
    } else if (p.endsWith("/confirm") && flow.step !== "confirm") {
      setFlow((f) => ({ ...f, step: "confirm" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  /**
   * Persist to sessionStorage when flow changes.
   * Do NOT persist 'pin', 'verify', or 'success' snapshots.
   */
  useEffect(() => {
    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }
    try {
      const clone = { step: flow.step, data: { ...flow.data } };
      if ("pin" in clone.data) delete clone.data.pin;
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

  /**
   * Keep lastNonVerifyRef up to date whenever flow changes to a non-verify step.
   * This ensures we can restore a meaningful snapshot when leaving verify.
   */
  useEffect(() => {
    if (flow && flow.step !== "verify") {
      // shallow-clone to avoid accidental mutation references
      lastNonVerifyRef.current = { ...flow, data: { ...(flow.data || {}) } };
    }
  }, [flow.step, flow.data]);

  /**
   * Clear session when leaving transfer routes.
   */
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

  /**
   * When flow reaches success, clear persisted state and reset in memory.
   * Suppress a single cycle of route-sync & persist to avoid re-saving/resync.
   */
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

  // ---------------- navigation helpers ----------------

  // Accept 'verify' as runtime-only step (not persisted)
  const setStep = (stepName) => {
    if (stepName !== "verify" && !STEP_ORDER.includes(stepName)) {
      console.warn("TransferContext.setStep: unknown step", stepName);
      return;
    }
    setFlow((f) => ({ ...f, step: stepName }));
    // also update URL to match the visible step (avoid history growth by replace)
    if (stepName !== "verify") {
      skipRouteSyncRef.current = true;
      skipPersistRef.current = true;
      try {
        navigate(mapStepToPath(stepName), { replace: true });
      } catch {}
    }
  };

  const nextStep = () =>
    setFlow((prev) => {
      const idx = STEP_ORDER.indexOf(prev.step);
      if (prev.step === "verify") {
        // verify → amount
        // when jumping programmatically, we also update URL
        skipRouteSyncRef.current = true;
        skipPersistRef.current = true;
        try {
          navigate(mapStepToPath("amount"), { replace: true });
        } catch {}
        return { ...prev, step: "amount" };
      }
      const next = idx === -1 ? STEP_ORDER[0] : STEP_ORDER[Math.min(STEP_ORDER.length - 1, idx + 1)];
      // update URL to match next step (but don't create new history entry)
      skipRouteSyncRef.current = true;
      skipPersistRef.current = true;
      try {
        navigate(mapStepToPath(next), { replace: true });
      } catch {}
      return { ...prev, step: next };
    });

  const prevStep = () =>
    setFlow((prev) => {
      const idx = STEP_ORDER.indexOf(prev.step);
      const prevName = idx <= 0 ? STEP_ORDER[0] : STEP_ORDER[idx - 1];
      skipRouteSyncRef.current = true;
      skipPersistRef.current = true;
      try {
        navigate(mapStepToPath(prevName), { replace: true });
      } catch {}
      return { ...prev, step: prevName };
    });

  /**
   * goBack()
   * - Always prefer stepping the context back one logical step and update the URL.
   * - Avoid relying on browser history because QuickTransfer often navigates directly into /app/transfer with state
   *   (so browser history won't contain a prior transfer page).
   *
   * Special-case: if we're on the runtime-only 'verify' step, restore the lastNonVerify snapshot (in-memory)
   * so the user returns to the real prior state.
   */
  const goBack = () => {
    const curStep = (flow && flow.step) || "select";

    // If we're in verify, restore the last non-verify snapshot if available
    if (curStep === "verify") {
      const last = lastNonVerifyRef.current;
      if (last) {
        skipRouteSyncRef.current = true;
        skipPersistRef.current = true;
        // restore the full snapshot (in-memory only)
        setFlow(last);
        try {
          navigate(mapStepToPath(last.step), { replace: true });
        } catch (err) {
          console.warn("TransferContext.goBack navigate error:", err);
        }
        return;
      }
      // If no last snapshot, fall through to default behavior (go to select)
    }

    const curIdx = STEP_ORDER.indexOf(curStep);
    const prevName = curIdx <= 0 ? STEP_ORDER[0] : STEP_ORDER[curIdx - 1];

    // Suppress route-sync & persist while we update both in-memory & route
    skipRouteSyncRef.current = true;
    skipPersistRef.current = true;

    // Update in-memory immediately, then replace URL to the canonical path
    setFlow((prev) => ({ ...prev, step: prevName }));
    try {
      navigate(mapStepToPath(prevName), { replace: true });
    } catch (err) {
      // swallow navigation errors but context is still stepped back
      console.warn("TransferContext.goBack navigate error:", err);
    }
  };

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
    const hasNumber = !!(flow.data && (flow.data.fromWalletPhone || flow.data.phone || flow.data.accountId));
    if (!hasNumber) {
      setFlow((prev) => ({ ...prev, step: "verify" }));
      return true;
    }
    return false;
  };

  /**
   * headerBack()
   * - A safe back handler intended for the app header back button.
   * - If the current location is inside the transfer flow, ensure we clear transfer state
   *   and navigate to dashboard (deterministic).
   * - Otherwise behave like a normal history back.
   */
  const headerBack = () => {
    try {
      const path = (location && location.pathname) || "";
      if (path && path.startsWith("/app/transfer")) {
        // clear transfer flow then go to dashboard (push so user has history)
        try {
          sessionStorage.removeItem(TRANSFER_FLOW_KEY);
        } catch (_) {}
        // ensure in-memory reset too
        skipPersistRef.current = true;
        skipRouteSyncRef.current = true;
        setFlow(defaultFlow);
        navigate("/app/dashboard");
        return;
      }
      // Default behavior: go back in history
      navigate(-1);
    } catch (err) {
      // Fallback: navigate to dashboard if something goes wrong
      try { navigate("/app/dashboard"); } catch (_) {}
    }
  };

  const contextValue = {
    flow,
    step: flow.step,
    data: flow.data,
    setFlow,
    setStep,
    nextStep,
    prevStep,
    goBack,
    setData,
    reset,
    requireVerifyIfMissingNumber,
    headerBack,
  };

  return <TransferContext.Provider value={contextValue}>{children}</TransferContext.Provider>;
};

export const useTransfer = () => {
  const ctx = useContext(TransferContext);
  if (!ctx) throw new Error("useTransfer must be used within TransferProvider");
  return ctx;
};
