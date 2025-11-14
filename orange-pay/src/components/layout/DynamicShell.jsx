export default function DynamicShell({ children, className = "" }) {
    return (
        <div className={`min-h-dvh pl-5 pr-5 ${className}`}>
            {children}
        </div>
    );
}
