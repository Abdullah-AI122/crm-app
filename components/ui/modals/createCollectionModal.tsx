"use client";

import { useEffect, useRef } from "react";
import { HiOutlineXMark, HiOutlineCheck } from "react-icons/hi2";

interface CreateCollectionModalProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    groupName: string;
    setGroupName: (value: string) => void;
    selectedGroupColor: string;
    setSelectedGroupColor: (value: string) => void;
    collectionColorPalette: string[];
    creating: boolean;
    createGroup: () => void;
}

export default function CreateCollectionModal({
    open,
    setOpen,
    groupName,
    setGroupName,
    selectedGroupColor,
    setSelectedGroupColor,
    collectionColorPalette,
    creating,
    createGroup,
}: CreateCollectionModalProps) {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-card px-6 py-6 shadow-2xl">
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h2 className="font-dmsans text-lg font-semibold text-slate-900">
                            Create Collection
                        </h2>

                        <p className="mt-1 font-dmsans text-xs text-slate-500">
                            Create a new collection for your Module
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
                        Collection name
                    </label>

                    <input
                        ref={inputRef}
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !creating) {
                                createGroup();
                            }

                            if (e.key === "Escape") {
                                setOpen(false);
                            }
                        }}
                        placeholder="e.g. In Progress"
                        className="w-full rounded-xl border border-slate-300 bg-card px-4 py-2.5 font-dmsans text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#FB923C] focus:ring-2 focus:ring-[#FB923C]/10"
                    />
                </div>

                <div className="mb-7">
                    <label className="mb-2.5 block font-dmsans text-xs font-medium text-slate-700">
                        Collection color
                    </label>

                    <div className="flex flex-wrap gap-2.5">
                        {collectionColorPalette.map((color) => {
                            const selected =
                                selectedGroupColor === color;

                            return (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() =>
                                        setSelectedGroupColor(color)
                                    }
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition hover:scale-105"
                                    style={{
                                        backgroundColor: color,
                                    }}
                                    aria-label={`Choose color ${color}`}
                                >
                                    {selected && (
                                        <HiOutlineCheck
                                            size={16}
                                            strokeWidth={3}
                                            className="text-white drop-shadow"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={createGroup}
                        disabled={creating}
                        className="flex-1 cursor-pointer rounded-xl bg-[#FB923C] py-2.5 font-dmsans text-sm font-medium text-white transition hover:bg-[#F97316] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {creating
                            ? "Creating..."
                            : "Create Collection"}
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