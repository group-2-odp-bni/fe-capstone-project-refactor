import React, { useEffect, useRef, useState } from "react";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline"; // or any icon

export default function HeaderMenu({ currentName = "", onRename, onDelete }) {
  const [open, setOpen] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [name, setName] = useState(currentName || "");
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    setName(currentName || "");
  }, [currentName]);

  // click outside -> close popover
  useEffect(() => {
    const onDoc = (e) => {
      if (
        open &&
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const handleRenameConfirm = () => {
    if (typeof onRename === "function") onRename(name);
    setShowRename(false);
    setOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (typeof onDelete === "function") onDelete();
    setShowDeleteConfirm(false);
    setOpen(false);
  };

  return (
    <>
      {/* menu button - used as "right" prop */}
      <div className="relative">
        <button
          ref={buttonRef}
          aria-haspopup="true"
          aria-expanded={open}
          className="p-1 rounded-full hover:bg-gray-100 active:scale-95 transition"
          onClick={() => setOpen((s) => !s)}
        >
          <EllipsisHorizontalIcon className="w-6 h-6 text-gray-700" />
        </button>

        {/* popout menu */}
        {open && (
          <div
            ref={menuRef}
            role="menu"
            aria-label="Wallet menu"
            className="absolute right-0 mt-2 w-40 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50"
          >
            <div className="py-1">
              <button
                onClick={() => {
                  setShowRename(true);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                role="menuitem"
              >
                Rename
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(true);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                role="menuitem"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {showRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black opacity-30"
            onClick={() => setShowRename(false)}
            aria-hidden
          />
          <div className="relative bg-white rounded-lg w-11/12 max-w-sm p-5 shadow-lg">
            <h3 className="font-semibold text-center mb-3">Wallet Name</h3>
            <input
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-2"
              placeholder="Enter wallet name"
              aria-label="Wallet name"
            />
            <div className="text-xs text-gray-500 text-right mb-4">
              {name.length}/40
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowRename(false)}
                className="px-4 py-2 rounded bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={handleRenameConfirm}
                className="px-4 py-2 rounded bg-orange-500 text-white"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black opacity-30"
            onClick={() => setShowDeleteConfirm(false)}
            aria-hidden
          />
          <div className="relative bg-white rounded-lg w-11/12 max-w-xs p-5 shadow-lg text-center">
            <h3 className="font-semibold mb-2">Konfirmasi</h3>
            <p className="text-sm text-gray-700 mb-4">
              Apakah Anda yakin untuk menghapus wallet ini?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded bg-gray-100"
              >
                Tidak
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded bg-red-600 text-white"
              >
                Ya
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
