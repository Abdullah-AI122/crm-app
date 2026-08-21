"use client";

import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { IoCopyOutline } from "react-icons/io5";
import { RiCheckLine, RiDeleteBin5Line } from "react-icons/ri";
import { CgRename } from "react-icons/cg";
import { HiOutlinePencil } from "react-icons/hi2";

interface CollectionMenuProps {
    x: number;
    y: number;
    collection: {
        _id: string;
        name: string;
        color?: string;
    };
    copyingId: string | null;
    copiedId: string | null;
    handleCopyCollectionId: (id: string) => void;
    openEditModal: (collection: any) => void;
    openDeleteModal: (id: string) => void;
}

export default function CollectionMenu({
    x,
    y,
    collection,
    copyingId,
    copiedId,
    handleCopyCollectionId,
    openEditModal,
    openDeleteModal,
}: CollectionMenuProps) {
    return (
        <div
            className="fixed z-50 min-w-[200px] overflow-hidden rounded-xl border border-slate-200 bg-card shadow-xl font-dmsans"
            style={{ top: y, left: x }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="border-b border-slate-100 px-4 py-2.5 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-500 truncate">
                    Collection:{" "}
                    <span className="font-semibold text-slate-800" style={{ color: collection.color }}>
                        {collection.name}
                    </span>
                </p>
                <div
                    className="w-3 h-3 rounded-full shrink-0 border border-slate-200"
                    style={{ backgroundColor: collection.color }}
                />
            </div>

            <div className="p-1.5">
                <button
                    type="button"
                    onClick={() => handleCopyCollectionId(collection._id)}
                    disabled={copyingId === collection._id}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {copyingId === collection._id ? (
                        <AiOutlineLoading3Quarters className="h-4 w-4 animate-spin" />
                    ) : copiedId === collection._id ? (
                        <RiCheckLine className="h-4 w-4 text-green-600" />
                    ) : (
                        <IoCopyOutline className="h-4 w-4 text-slate-500" />
                    )}

                    {copyingId === collection._id
                        ? "Copying..."
                        : copiedId === collection._id
                            ? "Copied ID"
                            : "Copy Collection ID"}
                </button>

                <button
                    type="button"
                    onClick={() => openEditModal(collection)}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                >
                    <HiOutlinePencil className="h-4 w-4 text-slate-500" />
                    Edit Name & Color
                </button>

                <button
                    type="button"
                    onClick={() => openDeleteModal(collection._id)}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-600 transition hover:bg-red-50"
                >
                    <RiDeleteBin5Line className="h-4 w-4 text-red-500" />
                    Delete Collection
                </button>
            </div>
        </div>
    );
}
