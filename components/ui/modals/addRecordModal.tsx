"use client";

import { useEffect, useRef } from "react";
import { HiOutlineXMark } from "react-icons/hi2";

interface AddRecordModalProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    recordName: string;
    setRecordName: (value: string) => void;
    creatingRecord: boolean;
    createRecord: () => void;
}

export default function AddRecordModal({
    open,
    setOpen,
    recordName,
    setRecordName,
    creatingRecord,
    createRecord,
}: AddRecordModalProps) {
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
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h2 className="font-dmsans text-lg font-semibold text-slate-900">
                            Add Record
                        </h2>

                        <p className="mt-1 font-dmsans text-xs text-slate-500">
                            Add a new record to this module
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Close"
                    >
                        <HiOutlineXMark
                            size={18}
                            strokeWidth={2.5}
                        />
                    </button>
                </div>

                <div className="mb-5">
                    <label className="mb-1.5 block font-dmsans text-xs font-medium text-slate-700">
                        Record name
                    </label>

                    <input
                        ref={inputRef}
                        value={recordName}
                        onChange={(e) => setRecordName(e.target.value)}
                        onKeyDown={(e) => {
                            if (
                                e.key === "Enter" &&
                                !creatingRecord
                            ) {
                                createRecord();
                            }

                            if (e.key === "Escape") {
                                setOpen(false);
                            }
                        }}
                        placeholder="e.g. Customer, Project, Task"
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-dmsans text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#FB923C] focus:ring-2 focus:ring-[#FB923C]/10"
                    />
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={createRecord}
                        disabled={creatingRecord}
                        className="flex-1 cursor-pointer rounded-xl bg-[#FB923C] py-2.5 font-dmsans text-sm font-medium text-white transition hover:bg-[#F97316] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {creatingRecord
                            ? "Creating..."
                            : "Add Record"}
                    </button>

                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        disabled={creatingRecord}
                        className="flex-1 cursor-pointer rounded-xl border border-slate-300 bg-white py-2.5 font-dmsans text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}