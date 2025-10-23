import React from "react";

export default function WhiteCardContainer({ children }){

    return(
        <div className="relative -mt-4 z-10 bg-white rounded-t-3xl px-6 pt-4 pb-10">
            {children}
        </div>
    );
}