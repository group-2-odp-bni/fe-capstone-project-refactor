export function FullSubmitButton({ children }){
    return (
        <button type="submit" className="focus:outline-none inline-flex items-center justify-center 
                 text-white bg-[#305856] hover:bg-[#2b3f42] focus:ring-4 
                 font-medium rounded-lg text-sm px-5 py-2.5 w-64 mx-auto block">
        {children}
        </button>
    )
}