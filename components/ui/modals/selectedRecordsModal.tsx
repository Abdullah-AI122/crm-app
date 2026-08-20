"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { RiDeleteBin7Fill } from "react-icons/ri";

interface SelectedRecordsModalProps {
    open: boolean;
    selectedCount: number;
    onDelete: () => void;
    onCancel: () => void;
    deleting?: boolean;
}

export default function SelectedRecordsModal({
    open,
    selectedCount,
    onDelete,
    onCancel,
    deleting = false,
}: SelectedRecordsModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!open || !mounted || selectedCount === 0) return null;

    return createPortal(
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white border border-slate-200 text-slate-800 px-4 py-2.5 rounded-md shadow-xl flex items-center gap-3.5 font-dmsans">
            <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#415A77] text-white text-[11px] font-bold">
                    {selectedCount}
                </span>
                <span className="text-xs font-semibold text-slate-700">
                    {selectedCount === 1 ? "record" : "records"} selected
                </span>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-md transition cursor-pointer disabled:opacity-50 shadow-sm"
            >
                <RiDeleteBin7Fill size={14} />
                {deleting ? "Deleting…" : "Delete Selected"}
            </button>

            <button
                type="button"
                onClick={onCancel}
                className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition cursor-pointer"
            >
                Cancel
            </button>
        </div>,
        document.body
    );
}
