import { createContext, useContext, useState, useCallback } from "react";
import Toast from "../components/alert/Toast";

const ToastContext = createContext();

export function ToastProvider({ children }) {
    const [toast, setToast] = useState({
        show: false,
        type: "success",
        title: "",
        message: "",
    });

    const showToast = useCallback(({ type = "success", title, message }) => {
        setToast({ show: true, type, title, message });

        // Auto-hide after 3 seconds
        setTimeout(() => {
            setToast((t) => ({ ...t, show: false }));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Toast toast={toast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
