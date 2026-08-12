"use client";

import { useEffect, useRef } from "react";
import {
    HiOutlineXMark,
    HiOutlineClipboard,
    HiOutlineCheck,
} from "react-icons/hi2";

interface RenameModal {
    id: string;
    name?: string;
}

interface RenameColumnModalProps {
    renameModal: RenameModal | null;
    setRenameModal: (value: any) => void;
    renameValue: string;
    setRenameValue: (value: string) => void;
    renamingColumn: boolean;
    renameColumn: () => void;
    copied: boolean;
    setCopied: (value: boolean) => void;
}

export default function RenameColumnModal({
    renameModal,
    setRenameModal,
    renameValue,
    setRenameValue,
    renamingColumn,
    renameColumn,
    copied,
    setCopied,
}: RenameColumnModalProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (renameModal) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [renameModal]);

    if (!renameModal) return null;

    const copyId = async () => {
        await navigator.clipboard.writeText(renameModal.id);
        setCopied(true);

        setTimeout(() => {
            setCopied(false);
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5 backdrop-blur-[2px]">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h2 className="font-dmsans text-lg font-semibold text-slate-900">
                            Rename Column
                        </h2>

                        <p className="mt-1 font-dmsans text-xs text-slate-500">
                            Change the name of this column
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setRenameModal(null)}
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Close"
                    >
                        <HiOutlineXMark
                            size={18}
                            strokeWidth={2.5}
                        />
                    </button>
                </div>

                <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-2">
                        <span className="shrink-0 font-dmsans text-xs font-medium text-slate-400">
                            ID
                        </span>

                        <span className="flex-1 truncate font-mono text-xs text-slate-600">
                            {renameModal.id}
                        </span>

                        <button
                            type="button"
                            onClick={copyId}
                            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-dmsans text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                            {copied ? (
                                <>
                                    <HiOutlineCheck
                                        size={14}
                                        className="text-green-500"
                                    />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <HiOutlineClipboard size={14} />
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="mb-1.5 block font-dmsans text-xs font-medium text-slate-700">
                        Column name
                    </label>

                    <input
                        ref={inputRef}
                        value={renameValue}
                        onChange={(e) =>
                            setRenameValue(e.target.value)
                        }
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !renamingColumn) {
                                renameColumn();
                            }

                            if (e.key === "Escape") {
                                setRenameModal(null);
                            }
                        }}
                        placeholder="Enter column name"
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-dmsans text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#FB923C] focus:ring-2 focus:ring-[#FB923C]/10"
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={renameColumn}
                        disabled={renamingColumn}
                        className="flex-1 cursor-pointer rounded-xl bg-[#FB923C] py-2.5 font-dmsans text-sm font-medium text-white transition hover:bg-[#F97316] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {renamingColumn ? "Saving..." : "Save"}
                    </button>

                    <button
                        type="button"
                        onClick={() => setRenameModal(null)}
                        className="flex-1 cursor-pointer rounded-xl border border-slate-300 bg-white py-2.5 font-dmsans text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}