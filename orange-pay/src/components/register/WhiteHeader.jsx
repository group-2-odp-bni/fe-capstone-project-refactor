import BackButton from "../common/BackButton";

export default function WhiteHeader({ title = "Title" }) {
    return (
        <div className="h-20 w-full rounded-t-[28px] bg-white flex items-center mt-3">
            <div className="w-full pt-[env(safe-area-inset-top)] px-4">
                <div className="flex items-center justify-between">
                    <BackButton />
                    <h1 className="text-lg font-semibold text-gray-900 text-center flex-1">
                        {title}
                    </h1>
                    {/* Invisible spacer to keep title centered */}
                    <div className="w-8" />
                </div>
            </div>
        </div>
    );
}
