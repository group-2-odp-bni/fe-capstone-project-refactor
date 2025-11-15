import { useState, useEffect } from "react";
import MobileShell from "../layout/MobileShell";
import PhoneLayoutBackground from "../PhoneLayoutBackground";
import DynamicShell from "../layout/DynamicShell";

export default function View({ children, className = "" }) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            // Switch to mobile if viewport width < 800px
            setIsMobile(window.innerWidth < 800);
        };

        handleResize(); // run once on mount
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return isMobile ? (
        <PhoneLayoutBackground>
            <MobileShell className={className}>{children}</MobileShell>
        </PhoneLayoutBackground>
    ) : (
        <DynamicShell className={className}>{children}</DynamicShell>
    );
}
