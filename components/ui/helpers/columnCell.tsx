import { DEFAULT_STATUS_OPTIONS, STATUS_SWATCHES } from "@/data/data";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HiOutlinePencil } from "react-icons/hi";
import { RiCheckLine, RiDeleteBin5Line } from "react-icons/ri";

export default function Cell({ record, column, recordValue, onSave, onAddStatusOption, onUpdateStatusOptions, width }: any) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(recordValue?.value ?? "");
    const inputRef = useRef<HTMLInputElement>(null);

    const [statusOpen, setStatusOpen] = useState(false);
    const [addingStatus, setAddingStatus] = useState(false);
    const [newStatusLabel, setNewStatusLabel] = useState("");
    const [newStatusColor, setNewStatusColor] = useState(STATUS_SWATCHES[0]);
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [editLabel, setEditLabel] = useState("");
    const [editColor, setEditColor] = useState(STATUS_SWATCHES[0]);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
    const btnRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const [selectedCollectionName, setSelectedCollectionName] = useState()

    useEffect(() => {
        setValue(recordValue?.value ?? "");
    }, [recordValue?.value]);

    useEffect(() => {
        if (editing && inputRef.current) inputRef.current.focus();
    }, [editing]);

    useEffect(() => {
        if (!statusOpen) return;
        const handler = (e: MouseEvent) => {
            const t = e.target as Node;
            if (btnRef.current?.contains(t)) return;
            if (panelRef.current?.contains(t)) return;
            setStatusOpen(false);
            setAddingStatus(false);
            setEditingIdx(null);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [statusOpen]);

    const commit = useCallback(() => {
        setEditing(false);
        const trimmed = typeof value === "string" ? value : String(value);
        if (trimmed !== (recordValue?.value ?? "")) {
            onSave(record, column, trimmed, recordValue);
        }
    }, [value, recordValue, record, column, onSave]);

    const selectStatus = (label: string) => {
        setValue(label);
        setStatusOpen(false);
        onSave(record, column, label, recordValue);
    };

    const handleCreateStatus = () => {
        if (!newStatusLabel.trim()) return;
        const opt = { label: newStatusLabel.trim(), color: newStatusColor };
        onAddStatusOption(column, opt);
        selectStatus(opt.label);
        setNewStatusLabel("");
        setAddingStatus(false);
    };

    const handleStartEdit = (idx: number, opt: { label: string; color: string }, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingIdx(idx);
        setEditLabel(opt.label);
        setEditColor(opt.color);
    };

    const handleSaveEdit = (idx: number) => {
        if (!editLabel.trim()) return;
        const existing = column.statusOptions?.length ? column.statusOptions : DEFAULT_STATUS_OPTIONS;
        const updated = existing.map((o: any, i: number) => (i === idx ? { label: editLabel.trim(), color: editColor } : o));
        onUpdateStatusOptions(column, updated);
        if (value === existing[idx]?.label) {
            setValue(editLabel.trim());
            onSave(record, column, editLabel.trim(), recordValue);
        }
        setEditingIdx(null);
    };

    const handleDeleteOption = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const existing = column.statusOptions?.length ? column.statusOptions : DEFAULT_STATUS_OPTIONS;
        const targetLabel = existing[idx]?.label;
        const updated = existing.filter((_: any, i: number) => i !== idx);
        onUpdateStatusOptions(column, updated);
        if (value === targetLabel) {
            setValue("");
            onSave(record, column, "", recordValue);
        }
    };

    if (column.type === "status") {
        const options: { label: string; color: string }[] =
            column.statusOptions?.length ? column.statusOptions : DEFAULT_STATUS_OPTIONS;
        const currentOpt = options.find((o) => o.label === value);

        const openStatusPopover = () => {
            if (btnRef.current) {
                const rect = btnRef.current.getBoundingClientRect();
                setMenuPos({ top: rect.bottom + 6, left: rect.left });
            }
            setStatusOpen((v) => !v);
        };

        return (
            <div
                className="shrink-0 h-10 border-r border-slate-300 flex items-center justify-center p-1.5"
                style={{ width }}
            >
                <button
                    ref={btnRef}
                    type="button"
                    onClick={openStatusPopover}
                    className="w-full h-full rounded text-xs font-medium text-white flex items-center justify-center px-2 transition cursor-pointer font-dmsans"
                    style={{
                        backgroundColor: currentOpt ? currentOpt.color : "#C4C4C4",
                        color: currentOpt ? "#FFF" : "#4A5568",
                    }}
                >
                    <span className="truncate">{currentOpt ? currentOpt.label : ""}</span>
                </button>

                {statusOpen && menuPos && createPortal(
                    <div
                        ref={panelRef}
                        className="fixed z-50 bg-card border border-slate-200 rounded-lg shadow-2xl p-2 w-56 font-dmsans"
                        style={{ top: menuPos.top, left: menuPos.left }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-2 px-1">
                            Select Status
                        </p>

                        <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                            {options.map((opt, idx) => {
                                const isEditingThis = editingIdx === idx;
                                if (isEditingThis) {
                                    return (
                                        <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-200 space-y-2">
                                            <input
                                                value={editLabel}
                                                onChange={(e) => setEditLabel(e.target.value)}
                                                placeholder="Label"
                                                className="w-full text-xs border border-slate-300 rounded px-2 py-1 outline-none text-slate-800"
                                            />
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {STATUS_SWATCHES.map((swatch) => (
                                                    <button
                                                        key={swatch}
                                                        type="button"
                                                        onClick={() => setEditColor(swatch)}
                                                        className="w-4 h-4 rounded-full transition"
                                                        style={{
                                                            backgroundColor: swatch,
                                                            outline: editColor === swatch ? "2px solid #3B82F6" : "none",
                                                            outlineOffset: "1px",
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveEdit(idx)}
                                                    className="flex-1 bg-[#415A77] text-white text-[10px] py-1 rounded hover:bg-[#324760] font-medium"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingIdx(null)}
                                                    className="flex-1 border border-slate-200 text-[10px] py-1 rounded hover:bg-slate-100 text-slate-600 font-medium"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }

                                const isSelected = opt.label === value;
                                return (
                                    <div
                                        key={opt.label + idx}
                                        onClick={() => selectStatus(opt.label)}
                                        className={`group/opt flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition text-xs text-white ${isSelected ? "ring-2 ring-[#415A77]" : ""}`}
                                        style={{ backgroundColor: opt.color }}
                                    >
                                        <span className="font-medium truncate flex-1">{opt.label}</span>
                                        {isSelected && <RiCheckLine className="w-3.5 h-3.5 shrink-0 ml-1 text-white" />}

                                        <div className="hidden group-hover/opt:flex items-center gap-1 ml-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={(e) => handleStartEdit(idx, opt, e)}
                                                className="p-0.5 rounded hover:bg-black/20 text-white/90"
                                                title="Edit option"
                                            >
                                                <HiOutlinePencil className="w-3 h-3" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => handleDeleteOption(idx, e)}
                                                className="p-0.5 rounded hover:bg-black/20 text-white/90"
                                                title="Delete option"
                                            >
                                                <RiDeleteBin5Line className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {!addingStatus ? (
                            <button
                                type="button"
                                onClick={() => setAddingStatus(true)}
                                className="w-full mt-2 border border-dashed border-slate-300 hover:border-[#415A77] rounded text-slate-600 hover:text-[#415A77] text-xs py-1.5 font-medium transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                                + Add Status Option
                            </button>
                        ) : (
                            <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded space-y-2">
                                <input
                                    value={newStatusLabel}
                                    onChange={(e) => setNewStatusLabel(e.target.value)}
                                    placeholder="New status name"
                                    className="w-full text-xs border border-slate-300 rounded px-2 py-1 text-slate-800 outline-none"
                                    autoFocus
                                />
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {STATUS_SWATCHES.map((swatch) => (
                                        <button
                                            key={swatch}
                                            type="button"
                                            onClick={() => setNewStatusColor(swatch)}
                                            className="w-4 h-4 rounded-full transition"
                                            style={{
                                                backgroundColor: swatch,
                                                outline: newStatusColor === swatch ? "2px solid #3B82F6" : "none",
                                                outlineOffset: "1px",
                                            }}
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={handleCreateStatus}
                                        className="flex-1 bg-[#415A77] text-white text-[10px] py-1 rounded hover:bg-[#324760] font-medium"
                                    >
                                        Add
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAddingStatus(false)}
                                        className="flex-1 border border-slate-200 text-[10px] py-1 rounded hover:bg-slate-100 text-slate-600 font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>,
                    document.body
                )}
            </div>
        );
    }

    if (editing) {
        return (
            <div
                className="shrink-0 h-10 border-r border-slate-300 flex items-center bg-card/5"
                style={{ width }}
            >
                <input
                    ref={inputRef}
                    type={
                        column.type === "number"
                            ? "number"
                            : column.type === "date"
                                ? "date"
                                : column.type === "email"
                                    ? "email"
                                    : "text"
                    }
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={commit}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") commit();
                        if (e.key === "Escape") {
                            setValue(recordValue?.value ?? "");
                            setEditing(false);
                        }
                    }}
                    className="w-full h-full px-3 text-sm text-white/90 bg-transparent border-none outline-none ring-0 focus:outline-none"
                />
            </div>
        );
    }

    return (
        <div
            onClick={() => setEditing(true)}
            className="shrink-0 h-10 border-r border-slate-300 flex items-center text-center px-3 cursor-text text-sm text-white/90 truncate transition-colors select-none"
            style={{ width }}
        >
            {recordValue?.value ? (
                <span className="truncate w-full">{recordValue.value}</span>
            ) : (
                <span className="text-slate-300 truncate w-full"></span>
            )}
        </div>
    );
};
