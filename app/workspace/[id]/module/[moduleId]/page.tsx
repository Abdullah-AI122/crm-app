"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { RiCheckLine, RiDeleteBin5Line } from "react-icons/ri";
import { RxDragHandleDots2 } from "react-icons/rx";
import { RiDeleteBin7Fill } from "react-icons/ri";
import { CgMenuGridO, CgRename } from "react-icons/cg";
import { IoAddOutline, IoCopyOutline } from "react-icons/io5";
import { HiOutlinePencil } from "react-icons/hi2";
import { DEFAULT_STATUS_OPTIONS, STATUS_SWATCHES, COLUMN_TYPE_OPTIONS, COLLECTION_COLOR_PALETTE, COUNTRY_DIALING_CODES } from "@/data/data";
import { Button } from "@heroui/react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaChevronDown } from "react-icons/fa";
import { VscFileSubmodule } from "react-icons/vsc";
import { HiOutlinePaperClip, HiOutlineEye, HiOutlineDocumentText, HiOutlineArrowDownTray, HiStar, HiOutlineStar, HiOutlineXMark } from "react-icons/hi2";
import FileUploadModal from "@/components/ui/modals/fileUploadModal";
import ProfileDropdown from "@/components/Profile";
import { logout } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import CreateCollectionModal from "@/components/ui/modals/createCollectionModal";
import RenameColumnModal from "@/components/ui/modals/renameColumnModal";
import AddColumnModal from "@/components/ui/modals/addColumnModal";
import SelectedRecordsModal from "@/components/ui/modals/selectedRecordsModal";

interface Collection {
    _id: string;
    name: string;
    color: string;
    position: number;
}

function ResizeHandle({ onResize }: { onResize: (delta: number) => void }) {
    const startX = useRef(0);
    const dragging = useRef(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragging.current = true;
        startX.current = e.clientX;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";

        const onMouseMove = (ev: MouseEvent) => {
            if (!dragging.current) return;
            const delta = ev.clientX - startX.current;
            startX.current = ev.clientX;
            onResize(delta);
        };
        const onMouseUp = () => {
            dragging.current = false;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    return (
        <div
            onMouseDown={handleMouseDown}
            onClick={(e) => e.stopPropagation()}
            onDragStart={(e) => e.preventDefault()}
            draggable={false}
            className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-[#415A77]/40 active:bg-[#415A77]/60 z-20"
            style={{ transform: "translateX(50%)" }}
            title="Drag to resize"
        />
    );
}

// Helper: blend hex with white for subtle row backgrounds
function tint(hex: string, opacity: number) {
    let clean = hex.replace("#", "");
    if (clean.length === 3) clean = clean.split("").map((c) => c + c).join("");
    const num = parseInt(clean, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function getCollectionColor(collection: Collection, index: number) {
    if (collection.color) return collection.color;
    return COLLECTION_COLOR_PALETTE[index % COLLECTION_COLOR_PALETTE.length];
}

const getRecordCollectionId = (record: any) => {
    if (!record) return "";
    const val = record.collectionName || record.collection || record.group;
    if (typeof val === "object" && val !== null) return val._id || String(val);
    return String(val || "");
};

// ── 95% Screen File Preview Modal ───────────────────────────────────────────
interface FilePreviewModalProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    file: { name: string; url: string; size?: string; type?: string } | null;
    onChangeFile: () => void;
    onRemoveFile: () => void;
}

function FilePreviewModal({ open, setOpen, file, onChangeFile, onRemoveFile }: FilePreviewModalProps) {
    if (!open || !file) return null;

    const isImage = file.url?.startsWith("data:image/") || file.type?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
    const isPdf = file.url?.startsWith("data:application/pdf") || file.type === "application/pdf" || file.name.endsWith(".pdf");

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        setOpen(false);
    };

    return createPortal(
        <div
            onClick={handleClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-[95vw] h-[95vh] bg-white rounded-2xl flex flex-col shadow-2xl overflow-hidden font-dmsans border border-slate-200"
            >
                {/* Header */}
                <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
                    <div className="flex items-center gap-3 min-w-0">
                        {isImage ? (
                            <img src={file.url} alt={file.name} className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0" />
                        ) : (
                            <div className="w-10 h-10 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center shrink-0">
                                <HiOutlineDocumentText size={22} />
                            </div>
                        )}
                        <div className="min-w-0">
                            <h3 className="font-semibold text-base truncate text-white">{file.name}</h3>
                            {file.size && <p className="text-xs text-slate-400">{file.size}</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={(e) => { e.stopPropagation(); setOpen(false); onChangeFile(); }}
                            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition font-medium flex items-center gap-1.5 cursor-pointer border border-slate-700"
                        >
                            <HiOutlinePencil size={14} /> Change File
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemoveFile(); setOpen(false); }}
                            className="px-3.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded-lg transition font-medium flex items-center gap-1.5 cursor-pointer border border-red-500/30"
                        >
                            <RiDeleteBin5Line size={14} /> Remove
                        </button>
                        {file.url && (
                            <a
                                href={file.url}
                                download={file.name}
                                onClick={(e) => e.stopPropagation()}
                                className="px-4 py-1.5 bg-[#FB923C] hover:bg-[#F97316] text-white text-xs rounded-lg transition font-medium flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                                <HiOutlineArrowDownTray size={14} /> Download
                            </a>
                        )}
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-2"
                        >
                            <HiOutlineXMark size={22} />
                        </button>
                    </div>
                </div>

                {/* Main preview content */}
                <div className="flex-1 bg-slate-950 flex items-center justify-center p-6 overflow-auto relative">
                    {isImage ? (
                        <img
                            src={file.url}
                            alt={file.name}
                            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-slate-800"
                        />
                    ) : isPdf ? (
                        <iframe
                            src={file.url}
                            className="w-full h-full rounded-xl border border-slate-800 bg-white"
                            title={file.name}
                        />
                    ) : (
                        <div className="text-center p-12 bg-slate-900 rounded-2xl border border-slate-800 max-w-lg">
                            <HiOutlineDocumentText size={64} className="mx-auto text-slate-400 mb-4" />
                            <h4 className="text-lg font-semibold text-white mb-1">{file.name}</h4>
                            <p className="text-xs text-slate-400 mb-6">{file.size || "File attached"}</p>
                            <a
                                href={file.url}
                                download={file.name}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FB923C] hover:bg-[#F97316] text-white rounded-xl text-sm font-medium transition cursor-pointer"
                            >
                                <HiOutlineArrowDownTray size={18} /> Download Document
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

// ── Record Name Cell (frozen first column) ─────────────────────────────────
const RecordNameCell = ({ record, color, width, selected, onSave }: any) => {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(record.name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setValue(record.name);
    }, [record.name]);

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editing]);

    const commit = () => {
        setEditing(false);
        const trimmed = value.trim();
        if (trimmed && trimmed !== record.name) {
            onSave(record, trimmed);
        } else {
            setValue(record.name);
        }
    };

    return (
        <div
            className={`shrink-0 px-3 py-2.5 border-r border-slate-300 text-sm font-google-sans flex items-center gap-2 sticky left-10 z-20 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.12)] ${selected ? "bg-slate-100" : "bg-white"}`}
            style={{ width, borderLeft: `3px solid ${color}` }}
        >
            <span className="text-xs cursor-grab active:cursor-grabbing shrink-0 text-slate-500"><CgMenuGridO /></span>
            {editing ? (
                <input
                    ref={inputRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={commit}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") commit();
                        if (e.key === "Escape") { setValue(record.name); setEditing(false); }
                    }}
                    className="w-full bg-transparent border-none outline-none ring-0 text-sm text-slate-800"
                />
            ) : (
                <span onClick={() => setEditing(true)} className="truncate cursor-text w-full text-slate-800 font-medium">
                    {record.name}
                </span>
            )}
        </div>
    );
};

// ── Country Dialing Codes & Flag helper ────────────────────────────────────
function parsePhoneWithFlag(phone: string): { flag: string | null; formattedNumber: string } {
    if (!phone) return { flag: null, formattedNumber: "" };
    const raw = String(phone).trim();
    if (!raw) return { flag: null, formattedNumber: "" };

    const upper = raw.toUpperCase();

    // Sort by longest matching dialing code or iso alias first
    const sorted = COUNTRY_DIALING_CODES.slice().sort((a, b) => {
        const lenA = Math.max(a.code.length, (a.iso || "").length);
        const lenB = Math.max(b.code.length, (b.iso || "").length);
        return lenB - lenA;
    });

    for (const item of sorted) {
        // Match dialing code e.g. "+92"
        if (upper.startsWith(item.code)) {
            const rest = raw.slice(item.code.length).trim();
            return {
                flag: item.flag,
                formattedNumber: rest || raw,
            };
        }

        // Match ISO code alias e.g. "PK" or "US" or "IN"
        if (item.iso) {
            const isoPrefixMatch = new RegExp(`^${item.iso}[\\s\\-:]*(.*)$`, "i").exec(raw);
            if (isoPrefixMatch) {
                const rest = isoPrefixMatch[1]?.trim() || "";
                return {
                    flag: item.flag,
                    formattedNumber: rest || raw,
                };
            }
        }
    }

    return { flag: null, formattedNumber: raw };
}

function TimelinePickerPopover({ open, setOpen, startDate, endDate, onSave }: any) {
    const [start, setStart] = useState(startDate);
    const [end, setEnd] = useState(endDate);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setStart(startDate);
        setEnd(endDate);
    }, [startDate, endDate]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [setOpen]);

    if (!open) return null;

    const handleApply = () => {
        onSave(start, end);
        setOpen(false);
    };

    const handleClear = () => {
        setStart("");
        setEnd("");
        onSave("", "");
        setOpen(false);
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
            <div ref={ref} className="bg-white border border-slate-200 rounded-xl shadow-2xl p-4 w-72 font-dmsans space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Set Timeline Range</span>
                    <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer">✕</button>
                </div>
                <div className="space-y-2.5">
                    <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={start}
                            onChange={(e) => setStart(e.target.value)}
                            className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:border-[#415A77] text-slate-800"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">End Date</label>
                        <input
                            type="date"
                            value={end}
                            onChange={(e) => setEnd(e.target.value)}
                            className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:border-[#415A77] text-slate-800"
                        />
                    </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                        onClick={handleApply}
                        className="flex-1 bg-[#334155] hover:bg-[#1E293B] text-white text-xs py-1.5 rounded font-medium transition cursor-pointer"
                    >
                        Apply Range
                    </button>
                    <button
                        onClick={handleClear}
                        className="flex-1 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs py-1.5 rounded font-medium transition cursor-pointer"
                    >
                        Clear
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ── Cell component ─────────────────────────────────────────────────────────
const Cell = ({ record, column, recordValue, onSave, onAddStatusOption, onUpdateStatusOptions, width }: any) => {
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

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [selectedPreviewFile, setSelectedPreviewFile] = useState<any>(null);
    const [showTimelinePicker, setShowTimelinePicker] = useState(false);

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
                className="shrink-0 h-10 border-r border-slate-300 flex items-center justify-center p-0 select-none"
                style={{ width, backgroundColor: currentOpt ? currentOpt.color : "#C4C4C4" }}
            >
                <button
                    ref={btnRef}
                    type="button"
                    onClick={openStatusPopover}
                    className="w-full h-full text-xs font-bold text-white flex items-center justify-center px-2 transition cursor-pointer font-dmsans rounded-none border-none outline-none focus:outline-none"
                    style={{
                        color: currentOpt ? "#FFF" : "#4A5568",
                    }}
                >
                    <span className="truncate">{currentOpt ? currentOpt.label : ""}</span>
                </button>

                {statusOpen && menuPos && createPortal(
                    <div
                        ref={panelRef}
                        className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-2xl p-2 w-56 font-dmsans"
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

    // File column type
    if (column.type === "file") {
        let fileList: any[] = [];
        if (value) {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    fileList = parsed;
                } else if (parsed && typeof parsed === "object") {
                    fileList = [parsed];
                }
            } catch {
                fileList = [{ name: value, url: value }];
            }
        }

        const handleSaveUploadedFiles = (uploadedFiles: any[]) => {
            const valStr = uploadedFiles.length > 0 ? JSON.stringify(uploadedFiles) : "";
            setValue(valStr);
            onSave(record, column, valStr, recordValue);
        };

        const handleSelectPreviewFile = (e: React.MouseEvent, file: any) => {
            e.preventDefault();
            e.stopPropagation();
            setSelectedPreviewFile(file);
            setShowPreviewModal(true);
        };

        return (
            <div
                className="shrink-0 h-10 border-r border-slate-300 flex items-center justify-center px-1.5 font-dmsans relative"
                style={{ width }}
            >
                {fileList.length > 0 ? (
                    <div className="flex items-center gap-1.5 overflow-x-auto max-w-full [&::-webkit-scrollbar]:hidden py-0.5 px-0.5">
                        {fileList.map((fileObj, idx) => {
                            const isImg = fileObj?.url && (
                                fileObj.url.startsWith("data:image/") ||
                                fileObj.type?.startsWith("image/") ||
                                /\.(jpg|jpeg|png|gif|webp|svg|jfif|bmp|ico)($|\?)/i.test(fileObj.url) ||
                                /\.(jpg|jpeg|png|gif|webp|svg|jfif|bmp|ico)($|\?)/i.test(fileObj.name || "")
                            );

                            return isImg ? (
                                <img
                                    key={idx}
                                    src={fileObj.url}
                                    alt={fileObj.name || `Image ${idx + 1}`}
                                    onClick={(e) => handleSelectPreviewFile(e, fileObj)}
                                    className="h-6 w-6 object-cover rounded-md shadow-sm hover:opacity-85 hover:border-[#415A77] hover:ring-2 hover:ring-[#415A77]/30 transition-all cursor-pointer shrink-0 border border-slate-300"
                                    title={`Click image to preview ${fileObj.name || ""}`}
                                />
                            ) : (
                                <div
                                    key={idx}
                                    onClick={(e) => handleSelectPreviewFile(e, fileObj)}
                                    className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-800 font-medium hover:bg-slate-200 transition cursor-pointer shrink-0 max-w-[90px]"
                                    title={`Click file to preview ${fileObj.name}`}
                                >
                                    <HiOutlineDocumentText size={12} className="text-slate-500 shrink-0" />
                                    <span className="truncate max-w-[60px] text-[10px]">{fileObj.name}</span>
                                </div>
                            );
                        })}

                        {/* Explicit + button to manage/add files */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowUploadModal(true);
                            }}
                            className="w-4.5 h-4.5 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[11px] transition cursor-pointer shrink-0 ml-0.5 border border-slate-200"
                            title="Add / manage files"
                        >
                            +
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowUploadModal(true);
                        }}
                        className="w-full h-full text-slate-500 hover:text-slate-800 text-xs font-medium transition flex items-center justify-center gap-0.5 cursor-pointer bg-transparent border-none outline-none"
                    >
                        <span className="text-sm font-semibold">+</span> File
                    </button>
                )}

                {showUploadModal && (
                    <FileUploadModal
                        open={showUploadModal}
                        setOpen={setShowUploadModal}
                        currentFiles={fileList}
                        onSaveFiles={handleSaveUploadedFiles}
                    />
                )}

                {showPreviewModal && (
                    <FilePreviewModal
                        open={showPreviewModal}
                        setOpen={setShowPreviewModal}
                        file={selectedPreviewFile || fileList[0]}
                        onChangeFile={() => setShowUploadModal(true)}
                        onRemoveFile={() => {
                            const target = selectedPreviewFile || fileList[0];
                            const updated = fileList.filter((f) => f !== target);
                            handleSaveUploadedFiles(updated);
                        }}
                    />
                )}
            </div>
        );
    }

    // Rating column type
    if (column.type === "rating") {
        const ratingVal = parseInt(value, 10) || 0;
        return (
            <div className="shrink-0 h-10 border-r border-slate-300 flex items-center justify-center px-2 gap-0.5" style={{ width }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => {
                            const nVal = star === ratingVal ? "0" : String(star);
                            setValue(nVal);
                            onSave(record, column, nVal, recordValue);
                        }}
                        className="text-amber-400 hover:scale-110 transition cursor-pointer p-0.5"
                    >
                        {star <= ratingVal ? <HiStar size={16} /> : <HiOutlineStar size={16} className="text-slate-300" />}
                    </button>
                ))}
            </div>
        );
    }

    // Checkbox column type
    if (column.type === "checkbox") {
        const isChecked = value === "true" || value === true;
        return (
            <div className="shrink-0 h-10 border-r border-slate-300 flex items-center justify-center px-2" style={{ width }}>
                <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                        const nVal = e.target.checked ? "true" : "false";
                        setValue(nVal);
                        onSave(record, column, nVal, recordValue);
                    }}
                    className="w-4 h-4 accent-[#415A77] cursor-pointer"
                />
            </div>
        );
    }

    // ── Timeline Column Type (Start Date - End Date timeline bar) ─────────────
    if (column.type === "timeline") {
        let startDate = "";
        let endDate = "";

        if (value) {
            try {
                const parsed = JSON.parse(value);
                startDate = parsed.startDate || "";
                endDate = parsed.endDate || "";
            } catch {
                startDate = value;
                endDate = value;
            }
        }

        const handleSaveTimeline = (sDate: string, eDate: string) => {
            const jsonStr = (sDate || eDate) ? JSON.stringify({ startDate: sDate, endDate: eDate }) : "";
            setValue(jsonStr);
            onSave(record, column, jsonStr, recordValue);
        };

        const formatShortDate = (dStr: string) => {
            if (!dStr) return "";
            const d = new Date(dStr);
            if (isNaN(d.getTime())) return dStr;
            return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        };

        let progressPercent = 0;
        let dateText = "+ Timeline";

        if (startDate && endDate) {
            const startMs = new Date(startDate).getTime();
            const endMs = new Date(endDate).getTime();
            const todayMs = new Date().getTime();

            if (startMs === endMs) {
                progressPercent = 100;
                dateText = formatShortDate(startDate);
            } else if (endMs > startMs) {
                if (todayMs <= startMs) {
                    progressPercent = 0;
                } else if (todayMs >= endMs) {
                    progressPercent = 100;
                } else {
                    progressPercent = Math.round(((todayMs - startMs) / (endMs - startMs)) * 100);
                }
                dateText = `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;
            } else {
                dateText = `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;
                progressPercent = 50;
            }
        } else if (startDate || endDate) {
            dateText = formatShortDate(startDate || endDate);
            progressPercent = 100;
        }

        const TOTAL_TICKS = 16;
        const filledTicksCount = Math.round((progressPercent / 100) * TOTAL_TICKS);

        return (
            <div className="shrink-0 h-10 border-r border-slate-300 flex items-center justify-center px-2 font-dmsans relative" style={{ width }}>
                {startDate || endDate ? (
                    <button
                        type="button"
                        onClick={() => setShowTimelinePicker(true)}
                        className="w-full h-7 rounded-lg bg-slate-100 hover:bg-slate-200/80 transition flex items-center justify-between px-2 cursor-pointer border border-slate-300 shadow-2xs gap-0.5"
                        title={`${startDate} to ${endDate} (${progressPercent}% elapsed)`}
                    >
                        {Array.from({ length: TOTAL_TICKS }).map((_, idx) => (
                            <span
                                key={idx}
                                className={`flex-1 h-3.5 rounded-full transition-all duration-300 ${idx < filledTicksCount
                                    ? "bg-[#334155] shadow-2xs"
                                    : "bg-slate-300/80"
                                    }`}
                            />
                        ))}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => setShowTimelinePicker(true)}
                        className="w-full h-full text-slate-500 hover:text-slate-800 text-xs font-medium transition flex items-center justify-center gap-0.5 cursor-pointer bg-transparent border-none outline-none"
                    >
                        <span className="text-sm font-semibold">+</span> Timeline
                    </button>
                )}

                {showTimelinePicker && (
                    <TimelinePickerPopover
                        open={showTimelinePicker}
                        setOpen={setShowTimelinePicker}
                        startDate={startDate}
                        endDate={endDate}
                        onSave={handleSaveTimeline}
                    />
                )}
            </div>
        );
    }

    const { flag, formattedNumber } = parsePhoneWithFlag(value);

    if (editing) {
        return (
            <div
                className="shrink-0 h-10 border-r border-slate-300 flex items-center justify-center bg-slate-50 px-3 gap-1.5"
                style={{ width }}
            >
                {flag && <span className="text-base shrink-0 leading-none select-none" title="Detected country">{flag}</span>}
                <input
                    ref={inputRef}
                    type={
                        column.type === "number"
                            ? "text"
                            : column.type === "date"
                                ? "date"
                                : column.type === "email"
                                    ? "email"
                                    : "text"
                    }
                    value={value}
                    onChange={(e) => {
                        let val = e.target.value;
                        if (column.type === "phone") {
                            val = val.replace(/[^0-9a-zA-Z+\-\s()]/g, "");
                        } else if (column.type === "number") {
                            val = val.replace(/[^0-9.-]/g, "");
                        }
                        setValue(val);
                    }}
                    onBlur={commit}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") commit();
                        if (e.key === "Escape") {
                            setValue(recordValue?.value ?? "");
                            setEditing(false);
                        }
                    }}
                    placeholder={column.type === "phone" ? "PK 300 1234567 or +92 300..." : ""}
                    className="w-full h-full text-sm text-slate-800 bg-transparent border-none outline-none ring-0 focus:outline-none font-dmsans text-center"
                />
            </div>
        );
    }

    return (
        <div
            onClick={() => setEditing(true)}
            className="shrink-0 h-10 border-r border-slate-300 flex items-center justify-center px-3 cursor-text text-sm text-slate-800 truncate transition-colors select-none font-dmsans gap-1.5 text-center"
            style={{ width }}
        >
            {flag && <span className="text-base shrink-0 leading-none select-none" title="Detected country">{flag}</span>}
            {recordValue?.value ? (
                <span className="truncate w-full text-center font-dmsans">{flag ? formattedNumber : recordValue.value}</span>
            ) : (
                <span className="text-slate-300 truncate w-full text-center font-dmsans"></span>
            )}
        </div>
    );
};

// ── Column context menu ────────────────────────────────────────────────────
interface ColMenuState {
    columnId: string;
    columnName: string;
    x: number;
    y: number;
}

export default function ModulePage() {
    const params = useParams();
    const router = useRouter();
    const moduleId = params.moduleId as string;

    // Collection state
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [collectionName, setCollectionName] = useState("");
    const [selectedCollectionColor, setSelectedCollectionColor] = useState(COLLECTION_COLOR_PALETTE[0]);
    const [creating, setCreating] = useState(false);
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const [deletingCollectionId, setDeletingCollectionId] = useState<string | null>(null);

    // Column state
    const [columns, setColumns] = useState<any[]>([]);
    const [showColumnModal, setShowColumnModal] = useState(false);
    const [columnName, setColumnName] = useState("");
    const [columnType, setColumnType] = useState("text");
    const [creatingColumn, setCreatingColumn] = useState(false);

    // Column widths (resizable)
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({ recordName: 280 });
    const MIN_COL_WIDTH = 90;
    const getColWidth = (id: string, fallback = 160) => columnWidths[id] ?? fallback;
    const resizeColumn = (id: string, delta: number, fallback = 160) => {
        setColumnWidths((prev) => {
            const current = prev[id] ?? fallback;
            return { ...prev, [id]: Math.max(MIN_COL_WIDTH, current + delta) };
        });
    };

    // Column rename/context menu
    const [colMenu, setColMenu] = useState<ColMenuState | null>(null);
    const [renameModal, setRenameModal] = useState<{ id: string; name: string } | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [copied, setCopied] = useState(false);
    const [renamingColumn, setRenamingColumn] = useState(false);
    const [deletingColumnId, setDeletingColumnId] = useState<string | null>(null);

    // Record state
    const [records, setRecords] = useState<any[]>([]);
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [recordName, setRecordName] = useState("");
    const [selectedCollection, setSelectedCollection] = useState("");
    const [creatingRecord, setCreatingRecord] = useState(false);
    const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());
    const [deletingRecords, setDeletingRecords] = useState(false);

    const [copyingId, setCopyingId] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    // RecordValue state
    const [recordValues, setRecordValues] = useState<any[]>([]);
    const [deleteCollectionModal, setDeleteCollectionModal] = useState<string | null>(null);

    // Drag refs
    const dragCollectionId = useRef<string | null>(null);
    const dragColumnId = useRef<string | null>(null);
    const dragRecord = useRef<{ id: string; collection: string } | null>(null);
    const [dragOverCollectionId, setDragOverCollectionId] = useState<string | null>(null);

    // ── Close context menu on click outside ──────────────────────────────
    useEffect(() => {
        const handler = () => setColMenu(null);
        window.addEventListener("click", handler);
        return () => window.removeEventListener("click", handler);
    }, []);

    // ── Fetch Collections ─────────────────────────────────────────────────
    const getCollections = async () => {
        try {
            const res = await apiRequest(`/api/collections/${moduleId}`, { method: "GET" });
            const data = await res.json();
            if (res.ok) setCollections(data.collections || []);
        } catch (e) { console.log(e); } finally { setLoading(false); }
    };

    const handleCopyColumnId = async (columnId: string): Promise<void> => {
        try {
            setCopyingId(columnId as any);
            await navigator.clipboard.writeText(columnId);
            setCopyingId(null);
            setCopiedId(columnId as any);

            setTimeout(() => {
                setCopiedId(null);
            }, 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
            setCopyingId(null);
        }
    };

    // ── Create Collection ─────────────────────────────────────────────────
    const openCollectionModal = () => {
        setSelectedCollectionColor(COLLECTION_COLOR_PALETTE[collections.length % COLLECTION_COLOR_PALETTE.length]);
        setShowCollectionModal(true);
    };

    const createCollection = async () => {
        if (!collectionName.trim()) return;
        try {
            setCreating(true);
            const res = await apiRequest(`/api/collections/${moduleId}`, {
                method: "POST",
                body: JSON.stringify({ name: collectionName, color: selectedCollectionColor }),
            });
            if (res.ok) { setCollectionName(""); setShowCollectionModal(false); getCollections(); }
        } catch (e) { console.log(e); } finally { setCreating(false); }
    };

    // ── Delete Collection ─────────────────────────────────────────────────
    const deleteCollection = async (collectionId: string) => {
        try {
            setDeletingCollectionId(collectionId);

            const res = await apiRequest(`/api/collections/${collectionId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setCollections((prev) => prev.filter((g) => g._id !== collectionId));

                const collectionRecordIds = records
                    .filter((i) => getRecordCollectionId(i) === collectionId)
                    .map((i) => i._id);

                setRecords((prev) => prev.filter((i) => getRecordCollectionId(i) !== collectionId));
                setRecordValues((prev) =>
                    prev.filter((v) => !collectionRecordIds.includes(v.record || v.item))
                );
            }
        } catch (e) {
            console.log(e);
        } finally {
            setDeletingCollectionId(null);
            setDeleteCollectionModal(null);
        }
    };

    // ── Fetch Columns ─────────────────────────────────────────────────────
    const getColumns = async () => {
        try {
            const res = await apiRequest(`/api/columns/${moduleId}`, { method: "GET" });
            const data = await res.json();
            if (res.ok) setColumns(data.columns || []);
        } catch (e) { console.log(e); }
    };

    // ── Create Column ─────────────────────────────────────────────────────
    const createColumn = async () => {
        if (!columnName.trim()) return;
        try {
            setCreatingColumn(true);
            const res = await apiRequest(`/api/columns/${moduleId}`, {
                method: "POST",
                body: JSON.stringify({ name: columnName, type: columnType }),
            });
            if (res.ok) { setColumnName(""); setColumnType("text"); setShowColumnModal(false); getColumns(); }
        } catch (e) { console.log(e); } finally { setCreatingColumn(false); }
    };

    // ── Status options: add / edit / delete ────────────────────────────────
    const updateColumnStatusOptions = async (column: any, updated: { label: string; color: string }[]) => {
        setColumns((prev) => prev.map((c) => (c._id === column._id ? { ...c, statusOptions: updated } : c)));
        try {
            await apiRequest(`/api/columns/${column._id}`, { method: "PUT", body: JSON.stringify({ statusOptions: updated }) });
        } catch (e) { console.log(e); }
    };

    const addStatusOption = (column: any, option: { label: string; color: string }) => {
        const existing = column.statusOptions?.length ? column.statusOptions : DEFAULT_STATUS_OPTIONS;
        if (existing.some((o: any) => o.label === option.label)) return;
        updateColumnStatusOptions(column, [...existing, option]);
    };

    // ── Rename Column ─────────────────────────────────────────────────────
    const openRenameModal = (col: any) => {
        setColMenu(null);
        setRenameModal({ id: col._id, name: col.name });
        setRenameValue(col.name);
        setCopied(false);
    };

    const renameColumn = async () => {
        if (!renameModal || !renameValue.trim()) return;
        try {
            setRenamingColumn(true);
            const res = await apiRequest(`/api/columns/${renameModal.id}`, {
                method: "PUT",
                body: JSON.stringify({ name: renameValue }),
            });
            if (res.ok) {
                setColumns((prev) => prev.map((c) => c._id === renameModal.id ? { ...c, name: renameValue } : c));
                setRenameModal(null);
            }
        } catch (e) { console.log(e); } finally { setRenamingColumn(false); }
    };

    // ── Delete Column ─────────────────────────────────────────────────────
    const deleteColumn = async (columnId: string) => {
        setColMenu(null);
        if (!confirm("Delete this column?")) return;
        try {
            setDeletingColumnId(columnId);
            const res = await apiRequest(`/api/columns/${columnId}`, { method: "DELETE" });
            if (res.ok) {
                setColumns((prev) => prev.filter((c) => c._id !== columnId));
                setRecordValues((prev) => prev.filter((v) => (v.column?._id || v.column) !== columnId));
            }
        } catch (e) { console.log(e); } finally { setDeletingColumnId(null); }
    };

    // ── Fetch Records ──────────────────────────────────────────────────────
    const getRecords = async (collectionId: string) => {
        try {
            const res = await apiRequest(`/api/records/${collectionId}`, { method: "GET" });
            const data = await res.json();
            if (res.ok) {
                const recordsList = data.records || data.items || [];
                setRecords((prev) => [
                    ...prev.filter((i) => getRecordCollectionId(i) !== collectionId),
                    ...recordsList,
                ]);
                for (const record of recordsList) getRecordValues(record._id);
            }
        } catch (e) { console.log(e); }
    };

    const getRecordValues = async (recordId: string) => {
        try {
            const res = await apiRequest(`/api/record-values/${recordId}`, { method: "GET" });
            const data = await res.json();
            if (res.ok) {
                setRecordValues((prev) => [
                    ...prev.filter((v) => (v.record || v.item) !== recordId),
                    ...data.values,
                ]);
            }
        } catch (e) { console.log(e); }
    };

    const saveRecordValue = async (record: any, column: any, value: any, existingRecordValue: any) => {
        try {
            const tempId = existingRecordValue?._id || Math.random().toString();
            setRecordValues((prev) => {
                const filtered = prev.filter((v) => !((v.record || v.item) === record._id && (v.column?._id || v.column) === column._id));
                return [...filtered, { _id: tempId, record: record._id, item: record._id, column: column._id, value }];
            });
            if (existingRecordValue) {
                await apiRequest(`/api/record-values/${existingRecordValue._id}`, { method: "PUT", body: JSON.stringify({ value }) });
            } else {
                const res = await apiRequest(`/api/record-values`, {
                    method: "POST",
                    body: JSON.stringify({
                        workspace: record.workspace,
                        module: record.module || moduleId,
                        collectionName: record.group || record.collectionName,
                        record: record._id,
                        column: column._id,
                        value,
                    }),
                });
                if (res.ok) {
                    const data = await res.json();
                    const returnedVal = data.recordValue || data.itemValue;
                    setRecordValues((prev) => {
                        const filtered = prev.filter((v) => !((v.record || v.item) === record._id && (v.column?._id || v.column) === column._id));
                        return [...filtered, returnedVal];
                    });
                }
            }
        } catch (e) { console.log(e); }
    };

    // ── Rename Record (inline edit, auto-save) ──────────────────────────────
    const renameRecord = async (record: any, name: string) => {
        setRecords((prev) => prev.map((i) => (i._id === record._id ? { ...i, name } : i)));
        try {
            await apiRequest(`/api/records/${record._id}`, { method: "PUT", body: JSON.stringify({ name }) });
        } catch (e) { console.log(e); }
    };

    // ── Create Record ──────────────────────────────────────────────────────
    const createRecord = async () => {
        if (!recordName.trim()) return;
        try {
            setCreatingRecord(true);
            const res = await apiRequest(`/api/records/${selectedCollection}`, {
                method: "POST",
                body: JSON.stringify({ name: recordName }),
            });
            if (res.ok) {
                setShowRecordModal(false);
                setRecordName("");
                getRecords(selectedCollection);
            }
        } catch (e) { console.log(e); } finally { setCreatingRecord(false); }
    };

    // ── Delete Records ─────────────────────────────────────────────────────
    const toggleRecordSelected = (recordId: string) => {
        setSelectedRecordIds((prev) => {
            const n = new Set(prev);
            n.has(recordId) ? n.delete(recordId) : n.add(recordId);
            return n;
        });
    };

    const toggleSelectAllInCollection = (collectionId: string) => {
        const ids = records.filter((i) => getRecordCollectionId(i) === collectionId).map((i) => i._id);
        const allSelected = ids.every((id) => selectedRecordIds.has(id));
        setSelectedRecordIds((prev) => {
            const n = new Set(prev);
            ids.forEach((id) => (allSelected ? n.delete(id) : n.add(id)));
            return n;
        });
    };

    const deleteSelectedRecords = async () => {
        if (selectedRecordIds.size === 0) return;
        try {
            setDeletingRecords(true);
            const ids = Array.from(selectedRecordIds);
            await Promise.all(ids.map((id) => apiRequest(`/api/records/${id}`, { method: "DELETE" }).catch(console.log)));
            setRecords((prev) => prev.filter((i) => !selectedRecordIds.has(i._id)));
            setRecordValues((prev) => prev.filter((v) => !selectedRecordIds.has(v.record || v.item)));
            setSelectedRecordIds(new Set());
        } catch (e) { console.log(e); } finally { setDeletingRecords(false); }
    };

    // ── Collapse / expand ─────────────────────────────────────────────────
    const toggleCollapsed = (collectionId: string) =>
        setCollapsed((prev) => ({ ...prev, [collectionId]: !prev[collectionId] }));

    // ── Drag & drop: collections ──────────────────────────────────────────
    const persistCollectionOrder = async (ordered: Collection[]) => {
        await Promise.all(ordered.map((g, idx) =>
            apiRequest(`/api/collections/${g._id}`, { method: "PUT", body: JSON.stringify({ position: idx }) }).catch(console.log)
        ));
    };

    const handleCollectionDrop = (targetCollectionId: string) => {
        const sourceId = dragCollectionId.current;
        dragCollectionId.current = null;
        if (!sourceId || sourceId === targetCollectionId) return;
        setCollections((prev) => {
            const next = [...prev];
            const from = next.findIndex((g) => g._id === sourceId);
            const to = next.findIndex((g) => g._id === targetCollectionId);
            if (from === -1 || to === -1) return prev;
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            persistCollectionOrder(next);
            return next;
        });
    };

    // ── Drag & drop: columns ──────────────────────────────────────────────
    const persistColumnOrder = async (ordered: any[]) => {
        await Promise.all(ordered.map((c, idx) =>
            apiRequest(`/api/columns/${c._id}`, { method: "PUT", body: JSON.stringify({ position: idx }) }).catch(console.log)
        ));
    };

    const handleColumnDrop = (targetColumnId: string) => {
        const sourceId = dragColumnId.current;
        dragColumnId.current = null;
        if (!sourceId || sourceId === targetColumnId) return;
        setColumns((prev) => {
            const next = [...prev];
            const from = next.findIndex((c) => c._id === sourceId);
            const to = next.findIndex((c) => c._id === targetColumnId);
            if (from === -1 || to === -1) return prev;
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            persistColumnOrder(next);
            return next;
        });
    };

    // ── Drag & drop: records ──────────────────────────────────────────────
    const persistRecordMove = async (recordId: string, collectionId: string, position: number) => {
        await apiRequest(`/api/records/${recordId}`, { method: "PUT", body: JSON.stringify({ collectionName: collectionId, position }) }).catch(console.log);
    };

    const handleRecordDropOnRecord = (targetRecord: any) => {
        const source = dragRecord.current;
        dragRecord.current = null;
        setDragOverCollectionId(null);
        if (!source || source.id === targetRecord._id) return;
        const targetCollectionId = getRecordCollectionId(targetRecord);
        setRecords((prev) => {
            const next = [...prev];
            const from = next.findIndex((i) => i._id === source.id);
            if (from === -1) return prev;
            const [moved] = next.splice(from, 1);
            moved.collectionName = targetCollectionId;
            moved.collection = targetCollectionId;
            const to = next.findIndex((i) => i._id === targetRecord._id);
            next.splice(to === -1 ? next.length : to, 0, moved);
            const collectionRecords = next.filter((i) => getRecordCollectionId(i) === targetCollectionId);
            persistRecordMove(moved._id, targetCollectionId, collectionRecords.findIndex((i) => i._id === moved._id));
            return next;
        });
    };

    const handleRecordDropOnCollection = (targetCollectionId: string) => {
        const source = dragRecord.current;
        dragRecord.current = null;
        setDragOverCollectionId(null);
        if (!source || source.collection === targetCollectionId) return;
        setRecords((prev) => {
            const next = prev.map((i) => (i._id === source.id ? { ...i, collectionName: targetCollectionId, collection: targetCollectionId } : i));
            const collectionRecords = next.filter((i) => getRecordCollectionId(i) === targetCollectionId);
            persistRecordMove(source.id, targetCollectionId, collectionRecords.length - 1);
            return next;
        });
    };

    // ── Effects ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (moduleId) { getCollections(); getColumns(); }
    }, [moduleId]);

    useEffect(() => {
        if (collections.length > 0) {
            collections.forEach((g) => getRecords(g._id));
        }
    }, [collections.length]);

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    return (
        <>
            <section className="flex h-screen overflow-hidden">
                <Sidebar />
                <div className="h-screen w-full bg-[#D9D9D9] py-2 flex flex-col overflow-hidden">
                    <div className="bg-white ml-4 rounded-l-xl flex-1 flex flex-col overflow-hidden">
                        {/* Page header */}
                        <div className="pl-4 pr-2 flex gap-2 items-center justify-between border-b border-slate-100 shrink-0 bg-white rounded-tl-xl py-2.5">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold font-google-sans text-slate-800">Collections</h2>
                            </div>
                            <ProfileDropdown onLogout={handleLogout} />
                        </div>

                        {/* Module content */}
                        <div className="pl-8 pt-2 flex-1 flex flex-col overflow-hidden">
                            {/* Main collections scroll section with single global scrollbar */}
                            <div className="flex-1 overflow-x-auto overflow-y-auto w-full [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-100 pr-2">
                                {loading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="h-32 rounded bg-white/5 shimmer" />
                                        ))}
                                    </div>
                                ) : collections.length === 0 ? (
                                    <div className="border border-dashed border-slate-500 rounded p-16 text-center flex items-center justify-center flex-col">
                                        <div className="text-4xl mb-4 inline-block "><VscFileSubmodule /></div>
                                        <h2 className="text-lg font-semibold mb-1 font-google-sans text-black ">Empty Module</h2>
                                        <p className="mb-5 text-sm font-google-sans text-black">Create your first Collection to start organizing work</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 min-w-max">
                                        {collections.map((collection, collectionIndex) => {
                                            const color = getCollectionColor(collection, collectionIndex);
                                            const collectionRecords = records.filter(
                                                (record) => getRecordCollectionId(record) === collection._id
                                            );
                                            const isCollapsed = !!collapsed[collection._id];
                                            const allSelected =
                                                collectionRecords.length > 0 &&
                                                collectionRecords.every((i) => selectedRecordIds.has(i._id));
                                            const selectedInCollection = collectionRecords.filter((i) =>
                                                selectedRecordIds.has(i._id)
                                            ).length;

                                            return (
                                                <div
                                                    key={collection._id}
                                                    draggable
                                                    onDragStart={() => (dragCollectionId.current = collection._id)}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={() => handleCollectionDrop(collection._id)}
                                                    className="min-w-max my-4 flex flex-col"
                                                >
                                                    {/* ── Collection header (Sticky Left for Global Scroll) ───────────────────────── */}
                                                    <div className="sticky left-0 z-30 inline-flex items-center gap-1.5 mb-2 select-none px-2.5 py-1 bg-white rounded-md border border-slate-200 w-fit shadow-sm">
                                                        {/* Drag handle */}
                                                        <span className="cursor-grab active:cursor-grabbing text-slate-400 text-sm" title="Drag collection">
                                                            <RxDragHandleDots2 />
                                                        </span>

                                                        {/* Collapse toggle */}
                                                        <button
                                                            onClick={() => toggleCollapsed(collection._id)}
                                                            className="w-5 h-5 flex items-center justify-center hover:bg-slate-100 cursor-pointer rounded transition flex-shrink-0"
                                                        >
                                                            <FaChevronDown
                                                                className="text-xs transition-transform duration-200"
                                                                style={{
                                                                    transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                                                                    color
                                                                }}
                                                            />
                                                        </button>

                                                        <span className="text-sm font-bold font-google-sans uppercase tracking-wide" style={{ color }}>
                                                            {collection.name}
                                                        </span>
                                                    </div>

                                                    {/* ── Collection table ─────────────────────────── */}
                                                    {!isCollapsed && (
                                                        <div
                                                            className="min-w-max border border-slate-300 rounded-lg "
                                                            onDragOver={(e) => {
                                                                e.preventDefault();
                                                                setDragOverCollectionId(collection._id);
                                                            }}
                                                            onDrop={() => handleRecordDropOnCollection(collection._id)}
                                                            style={{
                                                                outline: dragOverCollectionId === collection._id ? `2px solid ${color}33` : "none",
                                                            }}
                                                        >
                                                            {/* Header row */}
                                                            <div className="flex items-stretch border-b border-slate-300 bg-white  rounded-t-lg">
                                                                {/* Checkbox */}
                                                                <div className="w-10 shrink-0 flex items-center justify-center p-2 cursor-pointer sticky left-0 z-30 border-r border-slate-300 bg-white rounded-tl-lg">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={allSelected}
                                                                        onChange={() => toggleSelectAllInCollection(collection._id)}
                                                                        className="w-3.5 h-3.5 accent-[#415A77] cursor-pointer"
                                                                    />
                                                                </div>

                                                                {/* Record label — sticky, resizable */}
                                                                <div
                                                                    className="relative shrink-0 px-3 py-2.5 border-r border-slate-300 text-xs font-semibold text-slate-500  tracking-wider flex items-center sticky left-10 z-30 font-google-sans bg-white shadow-[3px_0_6px_-2px_rgba(0,0,0,0.15)]"
                                                                    style={{ width: getColWidth("recordName", 280), borderLeft: `3px solid ${color}` }}
                                                                >
                                                                    Record
                                                                    <ResizeHandle onResize={(d) => resizeColumn("recordName", d, 280)} />
                                                                </div>

                                                                {/* Column headers */}
                                                                {columns.map((column) => (
                                                                    <div
                                                                        key={column._id}
                                                                        draggable
                                                                        onDragStart={() => (dragColumnId.current = column._id)}
                                                                        onDragOver={(e) => e.preventDefault()}
                                                                        onDrop={() => handleColumnDrop(column._id)}
                                                                        onContextMenu={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            setColMenu({ columnId: column._id, columnName: column.name, x: e.clientX, y: e.clientY });
                                                                        }}
                                                                        className="relative shrink-0 px-3 py-2.5 border-r border-slate-300 tracking-wider font-google-sans flex items-center justify-center cursor-grab active:cursor-grabbing bg-white transition select-none text-[13px]"
                                                                        style={{ width: getColWidth(column._id) }}
                                                                        title="Right-click to rename / delete"
                                                                    >
                                                                        {deletingColumnId === column._id ? (
                                                                            <span className="text-red-300">…</span>
                                                                        ) : (
                                                                            <span className="truncate">{column.name}</span>
                                                                        )}
                                                                        <ResizeHandle onResize={(d) => resizeColumn(column._id, d)} />
                                                                    </div>
                                                                ))}

                                                                {/* Add column button at end */}
                                                                <div className="w-[120px] shrink-0 px-3 py-2.5 flex items-center justify-center">
                                                                    <button
                                                                        onClick={() => setShowColumnModal(true)}
                                                                        className="text-xs text-zinc-500 font-google-sans font-bold transition whitespace-nowrap cursor-pointer"
                                                                    >
                                                                        + Column
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Record rows */}
                                                            {collectionRecords.map((record) => (
                                                                <div
                                                                    key={record._id}
                                                                    draggable
                                                                    onDragStart={() =>
                                                                    (dragRecord.current = {
                                                                        id: record._id,
                                                                        collection: record.group || record.collection,
                                                                    })
                                                                    }
                                                                    onDragOver={(e) => e.preventDefault()}
                                                                    onDrop={(e) => {
                                                                        e.stopPropagation();
                                                                        handleRecordDropOnRecord(record);
                                                                    }}
                                                                    className={`flex items-center min-w-max border-b border-slate-300 group transition-colors ${selectedRecordIds.has(record._id) ? "bg-slate-100/60" : "hover:bg-zinc-600/5"}`}
                                                                >
                                                                    {/* Checkbox */}
                                                                    <div className={`w-10 shrink-0 flex items-center justify-center p-2 sticky left-0 z-20 border-r border-slate-300 ${selectedRecordIds.has(record._id) ? "bg-slate-100" : "bg-white"}`}>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedRecordIds.has(record._id)}
                                                                            onChange={() => toggleRecordSelected(record._id)}
                                                                            className="w-3.5 h-3.5 accent-[#415A77] cursor-pointer font-dmsans"
                                                                        />
                                                                    </div>

                                                                    {/* Record name — sticky, click-to-edit, auto-saves on blur */}
                                                                    <RecordNameCell
                                                                        record={record}
                                                                        color={color}
                                                                        width={getColWidth("recordName", 280)}
                                                                        selected={selectedRecordIds.has(record._id)}
                                                                        onSave={renameRecord}
                                                                    />

                                                                    {/* Cells */}
                                                                    {columns.map((column) => {
                                                                        const rv = recordValues.find(
                                                                            (v) => (v.record || v.item) === record._id && (v.column?._id || v.column) === column._id
                                                                        );
                                                                        return (
                                                                            <Cell
                                                                                key={column._id}
                                                                                record={record}
                                                                                column={column}
                                                                                recordValue={rv}
                                                                                width={getColWidth(column._id)}
                                                                                onSave={saveRecordValue}
                                                                                onAddStatusOption={addStatusOption}
                                                                                onUpdateStatusOptions={updateColumnStatusOptions}
                                                                            />
                                                                        );
                                                                    })}

                                                                    {/* Trailing spacer */}
                                                                    <div className="w-[120px] shrink-0" />
                                                                </div>
                                                            ))}

                                                            {/* Add record row */}
                                                            <div className="flex items-center min-w-max py-1 px-3 border-t border-slate-200">
                                                                <div className="w-10 shrink-0 sticky left-0 z-10 bg-white" />
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedCollection(collection._id);
                                                                        setShowRecordModal(true);
                                                                    }}
                                                                    className="text-sm flex items-center gap-2 transition py-2 px-3 cursor-pointer sticky left-10 z-10 bg-white rounded-md hover:bg-slate-100"
                                                                >
                                                                    <IoAddOutline size={18} className="text-zinc-500" />
                                                                    <span className="font-google-sans text-zinc-600 font-medium">Add Record</span>
                                                                </button>
                                                            </div>


                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {/* New Collection button (sticky left pill at bottom of collections) */}
                                        <div className="pt-2 pb-6 sticky left-0 z-30 w-fit">
                                            <button
                                                onClick={openCollectionModal}
                                                className="bg-white text-slate-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition cursor-pointer font-dmsans flex items-center gap-2 border border-slate-300 shadow-sm"
                                            >
                                                <IoAddOutline size={18} className="text-slate-600" />
                                                <span className="font-semibold text-slate-700">New Collection</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Column context menu */}
                    {colMenu && (
                        <div
                            className="fixed border border-slate-300 rounded bg-white shadow-xl z-50 min-w-[180px]"
                            style={{ top: colMenu.y, left: colMenu.x }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="px-4 py-2 text-xs font-google-sans text-zinc-600 border-b border-slate-300 cursor-pointer">
                                Column: <span className="font-bold">{colMenu.columnName}</span>
                            </div>
                            <button
                                onClick={() => handleCopyColumnId(colMenu.columnId)}
                                disabled={copyingId === colMenu.columnId}
                                className="w-full text-left px-4 py-2 text-sm font-google-sans text-zinc-600 hover:bg-zinc-200 transition flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {copyingId === colMenu.columnId ? (
                                    <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
                                ) : copiedId === colMenu.columnId ? (
                                    <RiCheckLine className="w-4 h-4 text-green-600" />
                                ) : (
                                    <IoCopyOutline className="w-4 h-4" />
                                )}

                                {copyingId === colMenu.columnId
                                    ? "Copying..."
                                    : copiedId === colMenu.columnId
                                        ? "Copied"
                                        : "Copy Column ID"}
                            </button>
                            <button
                                className="w-full text-left px-4 py-2 text-sm font-google-sans text-zinc-600 hover:bg-zinc-200 transition flex items-center gap-2 cursor-pointer"
                                onClick={() => openRenameModal({ _id: colMenu.columnId, name: colMenu.columnName })}
                            >
                                <CgRename className="w-4 h-4" /> Rename column
                            </button>
                            <button
                                className="w-full text-left px-4 py-2 text-sm font-google-sans text-zinc-600 hover:bg-zinc-200 transition flex items-center gap-2 cursor-pointer"
                                onClick={() => deleteColumn(colMenu.columnId)}
                            >
                                <RiDeleteBin5Line className="w-4 h-4" /> Delete column
                            </button>
                        </div>
                    )}

                    {/* Rename Column Modal */}
                    {renameModal && (
                        <RenameColumnModal
                            renameModal={renameModal}
                            setRenameModal={setRenameModal}
                            renameValue={renameValue}
                            setRenameValue={setRenameValue}
                            renamingColumn={renamingColumn}
                            renameColumn={renameColumn}
                            copied={copied}
                            setCopied={setCopied}
                        />
                    )}

                    {/* Create Collection Modal */}
                    {showCollectionModal && (
                        <CreateCollectionModal
                            open={showCollectionModal}
                            setOpen={setShowCollectionModal}
                            groupName={collectionName}
                            setGroupName={setCollectionName}
                            selectedGroupColor={selectedCollectionColor}
                            setSelectedGroupColor={setSelectedCollectionColor}
                            collectionColorPalette={COLLECTION_COLOR_PALETTE}
                            creating={creating}
                            createGroup={createCollection}
                        />
                    )}

                    {/* Create Column Modal */}
                    {showColumnModal && (
                        <AddColumnModal
                            open={showColumnModal}
                            setOpen={setShowColumnModal}
                            columnName={columnName}
                            setColumnName={setColumnName}
                            columnType={columnType}
                            setColumnType={setColumnType}
                            creatingColumn={creatingColumn}
                            createColumn={createColumn}
                            defaultStatusOptions={DEFAULT_STATUS_OPTIONS}
                        />
                    )}

                    {/* Create Record Modal */}
                    {showRecordModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-5">
                            <div className="bg-[#0D1B2A] rounded-xl p-6 w-full max-w-md shadow-2xl">
                                <h2 className="text-lg font-bold text-white mb-4 font-dmsans">Add Record</h2>

                                <label className="text-xs font-medium text-white mb-1.5 block font-dmsans">
                                    Record name
                                </label>
                                <input
                                    value={recordName}
                                    onChange={(e) => setRecordName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && createRecord()}
                                    placeholder="Record Name"
                                    autoFocus
                                    className="w-full text-white border font-dmsans border-slate-700 rounded-xl px-4 py-2.5 mb-4 text-sm outline-none focus:border-[#415A77] transition"
                                />

                                <div className="flex gap-3">
                                    <button
                                        onClick={createRecord}
                                        disabled={creatingRecord}
                                        className="flex-1 bg-white text-black py-2.5 rounded text-sm font-medium hover:bg-gray-100 transition cursor-pointer disabled:opacity-60 font-dmsans"
                                    >
                                        {creatingRecord ? "Creating…" : "Add Record"}
                                    </button>
                                    <button
                                        onClick={() => setShowRecordModal(false)}
                                        className="flex-1 bg-slate-700 border border-slate-700 py-2.5 rounded text-sm text-white hover:bg-slate-700 transition cursor-pointer font-dmsans"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Delete Collection Modal */}
                    {deleteCollectionModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                            <div className="w-full max-w-md rounded-xl bg-[#1E293B] shadow-2xl">
                                <div className="p-6">
                                    <h2 className="font-dmsans font-semibold text-white">
                                        Delete Collection
                                    </h2>

                                    <p className="mt-3 text-sm font-dmsans text-slate-500">
                                        Are you sure you want to delete this Collection?
                                    </p>

                                    <p className="mt-2 text-sm font-dmsans text-white">
                                        This action cannot be undone. All records inside this Collection will also be deleted.
                                    </p>

                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            onClick={() => setDeleteCollectionModal(null)}
                                            className="px-4 py-2 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition cursor-pointer"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            onClick={() => deleteCollection(deleteCollectionModal)}
                                            disabled={deletingCollectionId === deleteCollectionModal}
                                            className="px-4 py-2 rounded-xl bg-white text-[#415A77] hover:bg-white/80 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            {deletingCollectionId === deleteCollectionModal
                                                ? "Deleting..."
                                                : "Delete Collection"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Floating Selected Records Modal */}
                    <SelectedRecordsModal
                        open={selectedRecordIds.size > 0}
                        selectedCount={selectedRecordIds.size}
                        onDelete={deleteSelectedRecords}
                        onCancel={() => setSelectedRecordIds(new Set())}
                        deleting={deletingRecords}
                    />
                </div>
            </section>
        </>
    );
}