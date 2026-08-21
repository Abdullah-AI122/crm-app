"use client";
import { useEffect, useRef, useState } from "react";
import { HiOutlineXMark } from "react-icons/hi2";
import { HiOutlineChevronDown } from "react-icons/hi";
import { RiCheckLine } from "react-icons/ri";
import { COLUMN_TYPE_OPTIONS } from "@/data/data";

interface StatusOption {
    label: string;
    color: string;
}

interface AddColumnModalProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    columnName: string;
    setColumnName: (value: string) => void;
    columnType: string;
    setColumnType: (value: string) => void;
    creatingColumn: boolean;
    createColumn: () => void;
    defaultStatusOptions: StatusOption[];
}

function ColumnTypeSelect({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const selected =
        COLUMN_TYPE_OPTIONS.find((o) => o.value === value) ||
        COLUMN_TYPE_OPTIONS[0];
    const SelectedIcon = selected.icon;

    return (
        <div className="relative font-dmsans" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`w-full flex items-center justify-between gap-2 border rounded-xl px-4 py-2.5 text-sm text-slate-800 transition cursor-pointer ${
                    open
                        ? "border-[#FB923C]"
                        : "border-slate-300 hover:border-slate-400"
                }`}
            >
                <span className="flex items-center gap-2">
                    <SelectedIcon className="w-4 h-4 text-slate-400" />
                    {selected.label}
                </span>
                <HiOutlineChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                        open ? "rotate-180" : ""
                    }`}
                />
            </button>

            {open && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1.5 border border-slate-200 rounded-xl shadow-lg py-1.5 max-h-64 overflow-y-auto bg-card">
                    {COLUMN_TYPE_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = opt.value === value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setOpen(false);
                                }}
                                className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left transition cursor-pointer ${
                                    isSelected
                                        ? "bg-[#FB923C]/10 text-[#FB923C] font-medium"
                                        : "text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                <Icon
                                    className={`w-4 h-4 ${
                                        isSelected
                                            ? "text-[#FB923C]"
                                            : "text-slate-400"
                                    }`}
                                />
                                {opt.label}
                                {isSelected && (
                                    <RiCheckLine className="w-4 h-4 ml-auto text-[#FB923C]" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function AddColumnModal({
    open,
    setOpen,
    columnName,
    setColumnName,
    columnType,
    setColumnType,
    creatingColumn,
    createColumn,
    defaultStatusOptions,
}: AddColumnModalProps) {
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
                            Add Column
                        </h2>

                        <p className="mt-1 font-dmsans text-xs text-slate-500">
                            Add a new column to this module
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
                        Column name
                    </label>

                    <input
                        ref={inputRef}
                        value={columnName}
                        onChange={(e) =>
                            setColumnName(e.target.value)
                        }
                        onKeyDown={(e) => {
                            if (
                                e.key === "Enter" &&
                                !creatingColumn
                            ) {
                                createColumn();
                            }

                            if (e.key === "Escape") {
                                setOpen(false);
                            }
                        }}
                        placeholder="e.g. Status, Priority, Owner"
                        className="w-full rounded-xl border border-slate-300 bg-card px-4 py-2.5 font-dmsans text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#FB923C] focus:ring-2 focus:ring-[#FB923C]/10"
                    />
                </div>

                <div className="mb-4">
                    <label className="mb-1.5 block font-dmsans text-xs font-medium text-slate-700">
                        Column type
                    </label>

                    <ColumnTypeSelect
                        value={columnType}
                        onChange={setColumnType}
                    />
                </div>

                {columnType === "status" && (
                    <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                        <p className="mb-3 font-dmsans text-xs text-slate-500">
                            Starts with these statuses. You can add
                            your own later from any record.
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                            {defaultStatusOptions.map((opt) => (
                                <span
                                    key={opt.label}
                                    className="rounded-lg px-2.5 py-1 font-dmsans text-xs font-medium text-white"
                                    style={{
                                        backgroundColor: opt.color,
                                    }}
                                >
                                    {opt.label}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={createColumn}
                        disabled={creatingColumn}
                        className="flex-1 cursor-pointer rounded-xl bg-[#FB923C] py-2.5 font-dmsans text-sm font-medium text-white transition hover:bg-[#F97316] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {creatingColumn
                            ? "Creating..."
                            : "Add Column"}
                    </button>

                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        disabled={creatingColumn}
                        className="flex-1 cursor-pointer rounded-xl border border-slate-300 bg-card py-2.5 font-dmsans text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}