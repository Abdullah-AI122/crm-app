"use client";

import { useEffect, useRef, useState } from "react";
import { HiOutlineXMark, HiOutlineCheck } from "react-icons/hi2";

interface EditCollectionModalProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    collection: {
        _id: string;
        name: string;
        color?: string;
    } | null;
    collectionColorPalette: string[];
    updating: boolean;
    updateCollection: (id: string, name: string, color: string) => void;
}

export default function EditCollectionModal({
    open,
    setOpen,
    collection,
    collectionColorPalette,
    updating,
    updateCollection,
}: EditCollectionModalProps) {
    const [name, setName] = useState("");
    const [color, setColor] = useState(collectionColorPalette[0]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (collection) {
            setName(collection.name || "");
            setColor(collection.color || collectionColorPalette[0]);
        }
    }, [collection, collectionColorPalette]);

    useEffect(() => {
        if (open) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [open]);

    if (!open || !collection) return null;

    const handleSave = () => {
        const trimmed = name.trim();
        if (!trimmed) return;
        updateCollection(collection._id, trimmed, color);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-card px-6 py-6 shadow-2xl">
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h2 className="font-dmsans text-lg font-semibold text-slate-900">
                            Edit Collection
                        </h2>
                        <p className="mt-1 font-dmsans text-xs text-slate-500">
                            Change collection name and accent color
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        disabled={updating}
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                        aria-label="Close"
                    >
                        <HiOutlineXMark size={18} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="mb-5">
                    <label className="mb-1.5 block font-dmsans text-xs font-medium text-slate-700">
                        Collection Name
                    </label>

                    <input
                        ref={inputRef}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !updating) {
                                handleSave();
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
                        Collection Accent Color
                    </label>

                    <div className="flex flex-wrap gap-2.5">
                        {collectionColorPalette.map((paletteColor) => {
                            const selected = color === paletteColor;

                            return (
                                <button
                                    key={paletteColor}
                                    type="button"
                                    onClick={() => setColor(paletteColor)}
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition hover:scale-105"
                                    style={{ backgroundColor: paletteColor }}
                                    aria-label={`Choose color ${paletteColor}`}
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
                        onClick={handleSave}
                        disabled={updating || !name.trim()}
                        className="flex-1 cursor-pointer rounded-xl bg-[#FB923C] py-2.5 font-dmsans text-sm font-medium text-white transition hover:bg-[#F97316] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {updating ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        disabled={updating}
                        className="flex-1 cursor-pointer rounded-xl border border-slate-300 bg-card py-2.5 font-dmsans text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
