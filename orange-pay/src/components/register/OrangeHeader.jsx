import BackButton from "../common/BackButton";


export default function OrangeHeader({ children }){
    return(
        <div className="bg-[#FF9A25] h-28 w-full rounded-t-[28px]">
            <div className="pt-[env(safe-area-inset-top)] px-4">
                <div className="pt-4">
                    <BackButton />
                </div>
            </div>
        </div>
    );
}