// src/components/HeaderMenu.jsx
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";

export default function HeaderMenu({ currentName = "", onRename, onDelete }) {
  const [open, setOpen] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [name, setName] = useState(currentName || "");
  const [loading, setLoading] = useState(false);

  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const renameRef = useRef(null);
  const deleteRef = useRef(null);

  const [menuPos, setMenuPos] = useState({ top: 0, right: 8 });
  const MENU_MAX_WIDTH = 220;
  const RENAME_MAX = 10;

  useEffect(() => setName(currentName || ""), [currentName]);

  const computePosition = () => {
    const b = btnRef.current?.getBoundingClientRect();
    if (!b) return;
    const top = Math.round(b.bottom + 8);
    const right = Math.round(window.innerWidth - b.right) + 8;
    setMenuPos({ top, right });
  };

  useEffect(() => {
    if (!open) return;
    computePosition();
    const onResize = () => computePosition();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open]);

  // Outside click: IGNORE clicks inside button, menu, rename modal, or delete modal.
  useEffect(() => {
    if (!open && !showRename && !showDelete) return;

    const onDoc = (e) => {
      const target = e.target;
      // if clicked the header ellipsis button, ignore
      if (btnRef.current && btnRef.current.contains(target)) return;
      // if clicked inside the menu popout, ignore
      if (menuRef.current && menuRef.current.contains(target)) return;
      // if clicked inside the rename modal, ignore
      if (renameRef.current && renameRef.current.contains(target)) return;
      // if clicked inside the delete modal, ignore
      if (deleteRef.current && deleteRef.current.contains(target)) return;

      // otherwise, close: this ensures clicking the menu buttons works because
      // their mousedown/click occur inside menuRef and will be ignored here.
      if (showRename) {
        // keep rename open if modal is shown (but this branch won't run if clicked inside rename)
        setShowRename(false);
      } else if (showDelete) {
        setShowDelete(false);
      } else {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, showRename, showDelete]);

  // Escape key handling
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (showRename) setShowRename(false);
        else if (showDelete) setShowDelete(false);
        else setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showRename, showDelete]);

  const handleRenameConfirm = async () => {
    if (!name.trim()) return;
    if (typeof onRename !== "function") {
      setShowRename(false);
      return;
    }
    try {
      setLoading(true);
      await onRename(name.trim());
      setShowRename(false);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (typeof onDelete !== "function") {
      setShowDelete(false);
      return;
    }
    try {
      setLoading(true);
      await onDelete();
      setShowDelete(false);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // Portal nodes
  const menuNode = open ? (
    <div
      ref={menuRef}
      className="fixed z-[9999] pointer-events-auto"
      style={{
        top: menuPos.top,
        right: menuPos.right,
        maxWidth: MENU_MAX_WIDTH,
      }}
    >
      <div
        role="menu"
        className="bg-white rounded-lg shadow-lg ring-1 ring-gray-100  overflow-hidden"
        style={{ minWidth: 140 }}
      >
        <button
          type="button"
          onClick={() => {
            // open rename modal; don't close menu immediately to avoid event race
            setShowRename(true);
          }}
          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
        >
          Rename
        </button>
        <button
          type="button"
          onClick={() => {
            setShowDelete(true);
          }}
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
        >
          Delete
        </button>
      </div>
    </div>
  ) : null;

  const renameNode = showRename ? (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/30" onClick={() => !loading && setShowRename(false)} />
      <div ref={renameRef} className="relative bg-white rounded-lg w-[92%] max-w-sm p-5 shadow-lg">
        <h3 className="text-sm font-semibold mb-3 text-center">Wallet Name</h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={RENAME_MAX}
          className="w-full border border-gray-200 rounded px-3 py-2 mb-2 text-sm"
          disabled={loading}
        />
        <div className="text-xs text-gray-500 text-right mb-4">{name.length}/{RENAME_MAX}</div>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => !loading && setShowRename(false)}
            className="px-4 py-2 rounded bg-gray-100"
            disabled={loading}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleRenameConfirm}
            className="px-4 py-2 rounded bg-orange-500 text-white flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" fill="none" />
              </svg>
            ) : null}
            Konfirmasi
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const deleteNode = showDelete ? (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/30" onClick={() => !loading && setShowDelete(false)} />
      <div ref={deleteRef} className="relative bg-white rounded-lg w-[92%] max-w-xs p-5 shadow-lg text-center">
        <h3 className="text-sm font-semibold mb-2">Konfirmasi</h3>
        <p className="text-sm text-gray-700 mb-4">Apakah Anda yakin untuk menghapus wallet ini?</p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={() => !loading && setShowDelete(false)}
            className="px-4 py-2 rounded bg-gray-100"
            disabled={loading}
          >
            Tidak
          </button>
          <button
            type="button"
            onClick={handleDeleteConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" fill="none" />
              </svg>
            ) : null}
            Ya
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // render: header button is inline, other UI portaled to body
  return (
    <>
      <div className="w-10 flex items-center justify-end">
        <button
          ref={btnRef}
          type="button"
          aria-haspopup="true"
          aria-expanded={open}
          onClick={() => {
            computePosition();
            setOpen((s) => !s);
          }}
          className="p-1 rounded-full hover:bg-gray-100 active:scale-95 transition"
        >
          <EllipsisVerticalIcon className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {menuNode && createPortal(menuNode, document.body)}
      {renameNode && createPortal(renameNode, document.body)}
      {deleteNode && createPortal(deleteNode, document.body)}
    </>
  );
}
