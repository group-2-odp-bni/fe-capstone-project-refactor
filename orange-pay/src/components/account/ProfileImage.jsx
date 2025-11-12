export default function ProfileImage() {
    return (
        <div className="flex flex-col items-center mt-2 mb-2">
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden">
                <img
                    src="https://randomuser.me/api/portraits/women/44.jpg"
                    alt="Profile"
                    className="w-full h-full object-cover"
                />
            </div>
        </div>
    );
}