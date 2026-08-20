"use client";

import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { IoCopyOutline } from "react-icons/io5";
import { RiCheckLine, RiDeleteBin5Line } from "react-icons/ri";
import { CgRename } from "react-icons/cg";

interface ColumnMenuProps {
    x: number;
    y: number;
    columnId: string;
    columnName: string;
    copyingId: string | null;
    copiedId: string | null;
    handleCopyColumnId: (columnId: string) => void;
    openRenameModal: (column: { _id: string; name: string }) => void;
    deleteColumn: (columnId: string) => void;
}

export default function ColumnMenu({
    x,
    y,
    columnId,
    columnName,
    copyingId,
    copiedId,
    handleCopyColumnId,
    openRenameModal,
    deleteColumn,
}: ColumnMenuProps) {
    return (
        <div
            className="fixed z-50 min-w-[200px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
            style={{ top: y, left: x }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="border-b border-slate-200 px-4 py-2.5">
                <p className="font-dmsans text-xs text-slate-500">
                    Column:{" "}
                    <span className="font-semibold text-slate-800">
                        {columnName}
                    </span>
                </p>
            </div>

            <div className="p-1.5">
                <button
                    type="button"
                    onClick={() => handleCopyColumnId(columnId)}
                    disabled={copyingId === columnId}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left font-dmsans text-sm text-slate-700 transition hover:bg-orange-50 hover:text-[#FB923C] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {copyingId === columnId ? (
                        <AiOutlineLoading3Quarters className="h-4 w-4 animate-spin" />
                    ) : copiedId === columnId ? (
                        <RiCheckLine className="h-4 w-4 text-green-600" />
                    ) : (
                        <IoCopyOutline className="h-4 w-4" />
                    )}

                    {copyingId === columnId
                        ? "Copying..."
                        : copiedId === columnId
                            ? "Copied"
                            : "Copy Column ID"}
                </button>

                <button
                    type="button"
                    onClick={() =>
                        openRenameModal({
                            _id: columnId,
                            name: columnName,
                        })
                    }
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left font-dmsans text-sm text-slate-700 transition hover:bg-orange-50 hover:text-[#FB923C]"
                >
                    <CgRename className="h-4 w-4" />
                    Rename column
                </button>

                <button
                    type="button"
                    onClick={() => deleteColumn(columnId)}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left font-dmsans text-sm text-red-600 transition hover:bg-red-50"
                >
                    <RiDeleteBin5Line className="h-4 w-4" />
                    Delete column
                </button>
            </div>
        </div>
    );
}