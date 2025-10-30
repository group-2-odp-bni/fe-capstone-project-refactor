export default function UserInfoCard({ name, email, phone, phoneVerified, emailVerified}){
    return(
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-md font-sans">
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
        Akun Saya
      </h2>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Nama :
          </label>
          <input
            type="text"
            value={name}
            readOnly
            className="w-full bg-gray-50 text-gray-800 border border-gray-200 rounded-lg p-3 focus:outline-none cursor-default"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Email :
          </label>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full bg-gray-50 text-gray-800 border border-gray-200 rounded-lg p-3 focus:outline-none cursor-default"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Phone Number :
          </label>
          <input
            type="tel"
            value={phone}
            readOnly
            className="w-full bg-gray-50 text-gray-800 border border-gray-200 rounded-lg p-3 focus:outline-none cursor-default"
          />
        </div>
      </div>
    </div>
    )
}