import { useRef, useState, useEffect } from "react";
import { Camera } from "lucide-react";
import { useToast } from "../../context/ToastContext";

export default function ProfileImage({ onImageSelected, unhoverable = false, src }) {
  const fileInputRef = useRef(null);
  const { showToast } = useToast();
  const [preview, setPreview] = useState(src);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    setPreview(src);
  }, [src]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast({
        type: "error",
        title: "Format file tidak didukung",
        message: "Silakan pilih file gambar (.jpg, .png, .jpeg).",
      });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    onImageSelected?.(file);
  };

  const handleClick = () => {
    if (!unhoverable) fileInputRef.current?.click();
  };

  return (
    <div className="flex justify-center mt-2 mb-2">
      <div
        className={`relative inline-flex w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden 
            ${unhoverable ? "cursor-default" : "cursor-pointer"}`}
        onClick={handleClick}
        onMouseEnter={() => !unhoverable && setHover(true)}
        onMouseLeave={() => !unhoverable && setHover(false)}
      >
        {/* 🔥 Show Skeleton if no image */}
        {!preview && (
          <div className="w-full h-full bg-slate-200 animate-pulse" />
        )}

        {/* Image (hidden when skeleton active) */}
        {preview && (
          <img
            src={preview}
            alt=""
            className="w-full h-full object-cover transition-transform duration-200"
          />
        )}

        {/* Hover overlay */}
        {!unhoverable && hover && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white transition-opacity duration-200">
            <Camera className="w-6 h-6 mb-1" />
            <span className="text-xs font-semibold">Ganti Foto</span>
          </div>
        )}

        {/* File input */}
        {!unhoverable && (
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
        )}
      </div>
    </div>
  );
}
