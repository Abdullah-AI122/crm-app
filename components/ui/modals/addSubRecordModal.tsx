"use client";

import { useEffect, useRef } from "react";
import { HiOutlineXMark } from "react-icons/hi2";

interface AddSubRecordModalProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    /** The record the sub-record is being added under — named so the target is never in doubt. */
    parentName: string;
    subRecordName: string;
    setSubRecordName: (value: string) => void;
    creating: boolean;
    createSubRecord: () => void;
}

export default function AddSubRecordModal({
    open,
    setOpen,
    parentName,
    subRecordName,
    setSubRecordName,
    creating,
    createSubRecord,
}: AddSubRecordModalProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5 backdrop-blur-[2px]">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-card p-6 shadow-2xl">
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h2 className="font-dmsans text-lg font-semibold text-slate-900">
                            Add Sub-record
                        </h2>

                        <p className="mt-1 font-dmsans text-xs text-slate-500">
                            Under{" "}
                            <span className="font-semibold text-slate-700">
                                {parentName}
                            </span>
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Close"
                    >
                        <HiOutlineXMark size={18} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="mb-5">
                    <label className="mb-1.5 block font-dmsans text-xs font-medium text-slate-700">
                        Sub-record name
                    </label>

                    <input
                        ref={inputRef}
                        value={subRecordName}
                        onChange={(e) => setSubRecordName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !creating) createSubRecord();
                            if (e.key === "Escape") setOpen(false);
                        }}
                        placeholder="e.g. Confirm stock, Send invoice"
                        className="w-full rounded-xl border border-slate-300 bg-card px-4 py-2.5 font-dmsans text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#FB923C] focus:ring-2 focus:ring-[#FB923C]/10"
                    />
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={createSubRecord}
                        disabled={creating || !subRecordName.trim()}
                        className="flex-1 cursor-pointer rounded-xl bg-[#FB923C] py-2.5 font-dmsans text-sm font-medium text-white transition hover:bg-[#F97316] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {creating ? "Creating..." : "Add Sub-record"}
                    </button>

                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        disabled={creating}
                        className="flex-1 cursor-pointer rounded-xl border border-slate-300 bg-card py-2.5 font-dmsans text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
