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
import { DEFAULT_STATUS_OPTIONS, STATUS_SWATCHES, COLUMN_TYPE_OPTIONS, COLLECTION_COLOR_PALETTE } from "@/data/data";
import { Button } from "@heroui/react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaChevronDown } from "react-icons/fa";
import { VscFileSubmodule } from "react-icons/vsc";
import UserAvatar from "@/components/Avatar";
import Sidebar from "@/components/Sidebar";
import CreateCollectionModal from "@/components/ui/modals/createCollectionModal";
import RenameColumnModal from "@/components/ui/modals/renameColumnModal";
import AddColumnModal from "@/components/ui/modals/addColumnModal";

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
            className={`shrink-0 px-3 py-2.5 border-r border-slate-300 text-sm font-google-sans flex items-center gap-2 sticky left-10 z-10 ${selected ? "bg-gray-00" : ""}`}
            style={{ width, borderLeft: `3px solid ${color}` }}
        >
            <span className="text-xs cursor-grab active:cursor-grabbing shrink-0"><CgMenuGridO /></span>
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
                    className="w-full bg-transparent border-none outline-none ring-0 text-sm text-white"
                />
            ) : (
                <span onClick={() => setEditing(true)} className="truncate cursor-text w-full">
                    {record.name}
                </span>
            )}
        </div>
    );
};

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

    if (editing) {
        return (
            <div
                className="shrink-0 h-10 border-r border-slate-300 flex items-center bg-white/5"
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
                    .filter((i) => i.group === collectionId || i.collection === collectionId)
                    .map((i) => i._id);

                setRecords((prev) => prev.filter((i) => (i.group || i.collection) !== collectionId));
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
                    ...prev.filter((i) => (i.group || i.collection) !== collectionId),
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
        const ids = records.filter((i) => (i.group || i.collection) === collectionId).map((i) => i._id);
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
        const targetCollectionId = targetRecord.group || targetRecord.collection;
        setRecords((prev) => {
            const next = [...prev];
            const from = next.findIndex((i) => i._id === source.id);
            if (from === -1) return prev;
            const [moved] = next.splice(from, 1);
            moved.group = targetCollectionId;
            moved.collection = targetCollectionId;
            const to = next.findIndex((i) => i._id === targetRecord._id);
            next.splice(to === -1 ? next.length : to, 0, moved);
            const collectionRecords = next.filter((i) => (i.group || i.collection) === targetCollectionId);
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
            const next = prev.map((i) => (i._id === source.id ? { ...i, group: targetCollectionId, collection: targetCollectionId } : i));
            const collectionRecords = next.filter((i) => (i.group || i.collection) === targetCollectionId);
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

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <>
            <section className="flex ">
                <Sidebar />
                <div className="min-h-screen w-full bg-[#D9D9D9] py-2">
                    <div className="bg-white ml-4 rounded-l-xl h-full">
                        {/* Page header */}
                        <div className="px-8 py-3 flex gap-2 items-center justify-end sticky top-0 z-20 ">
                            <button
                                onClick={openCollectionModal}
                                className="bg-white text-slate-800 px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition cursor-pointer font-dmsans flex items-center gap-2 border border-slate-300"
                            >
                                New Collection
                            </button>
                            <UserAvatar />
                            <div className="flex items-center gap-2">
                                {selectedRecordIds.size > 0 && (
                                    <div className="relative inline-block hover:cursor-pointer ">
                                        <Button
                                            isIconOnly
                                            onPress={deleteSelectedRecords}
                                            isDisabled={deletingRecords}
                                            className="bg-green-400 hover:bg-green-500 text-white"
                                        >
                                            <RiDeleteBin7Fill className="text-lg " />
                                        </Button>

                                        {!deletingRecords && (
                                            <span className="absolute -top-0 -right-0 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center">
                                                {selectedRecordIds.size}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Module content */}
                        <div className="px-8 py-6">
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
                                <div className="space-y-2">
                                    {collections.map((collection, collectionIndex) => {
                                        const color = getCollectionColor(collection, collectionIndex);
                                        const collectionRecords = records.filter(
                                            (record) => (record.group || record.collection) === collection._id
                                        );
                                        const isCollapsed = !!collapsed[collection._id];
                                        const allSelected =
                                            collectionRecords.length > 0 &&
                                            collectionRecords.every((i) => selectedRecordIds.has(i._id));

                                        return (
                                            <div
                                                key={collection._id}
                                                draggable
                                                onDragStart={() => (dragCollectionId.current = collection._id)}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={() => handleCollectionDrop(collection._id)}
                                            >
                                                {/* ── Collection header ───────────────────────── */}
                                                <div
                                                    className="flex items-center gap-1 mb-0 px-3 py-2 select-none "
                                                    style={{
                                                        backgroundColor: tint(color, 0.20),
                                                        borderRight: `3px solid ${color}`,
                                                        borderLeft: `3px solid ${color}`,
                                                    }}
                                                >
                                                    {/* Drag handle */}
                                                    <span className="cursor-grab active:cursor-grabbing text-sm leading-none" title="Drag collection">
                                                        <RxDragHandleDots2 />
                                                    </span>

                                                    {/* Collapse toggle */}
                                                    <button
                                                        onClick={() => toggleCollapsed(collection._id)}
                                                        className="w-5 h-5 flex items-center justify-center hover:bg-black/5 transition flex-shrink-0 group"
                                                    >
                                                        <span
                                                            className="text-xs inline-block transition-transform duration-200 group-hover:cursor-pointer"
                                                            style={{ transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
                                                        >
                                                            <FaChevronDown className=" group-hover:cursor-pointer cursor-pointer" />
                                                        </span>
                                                    </button>

                                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />

                                                    <span className="text-sm font-bold uppercase font-google-sans" style={{ color }}>
                                                        {collection.name}
                                                    </span>

                                                    <div className="ml-auto flex items-center">
                                                        {/* Delete collection */}
                                                        <button
                                                            onClick={() => setDeleteCollectionModal(collection._id)}
                                                            disabled={deletingCollectionId === collection._id}
                                                            className="text-xs bg-zinc-400 text-white px-2 py-1 rounded-lg transition cursor-pointer"
                                                            title="Delete collection"
                                                        >
                                                            {deletingCollectionId === collection._id ? "Deleting..." : "Delete"}
                                                        </button>
                                                        <span className="text-xs text-white bg-[#111727] px-2 py-0.5 rounded-md font-google-sans ml-1">
                                                            {collectionRecords.length}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* ── Collection table ─────────────────────────── */}
                                                {!isCollapsed && (
                                                    <div
                                                        className="overflow-auto border border-slate-300 border-t-0 shadow-sm rounded-b max-h-[480px] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
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
                                                        <div className="flex items-stretch border-b border-slate-300 min-w-max sticky top-0 z-10 bg-white">
                                                            {/* Checkbox */}
                                                            <div className="w-10 shrink-0 flex items-center justify-center p-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={allSelected}
                                                                    onChange={() => toggleSelectAllInCollection(collection._id)}
                                                                    className="w-3.5 h-3.5 accent-[#415A77] cursor-pointer"
                                                                />
                                                            </div>

                                                            {/* Record label — sticky, resizable */}
                                                            <div
                                                                className="relative shrink-0 px-3 py-2.5 border-r border-slate-300 text-[13px] tracking-wider flex items-center sticky left-10 font-google-sans bg-white"
                                                                style={{ width: getColWidth("recordName", 280), borderLeft: `3px solid ${color}` }}
                                                            >
                                                                Records
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
                                                            <div className="w-[120px] shrink-0 px-3 py-2.5 flex items-center justify-center bg-white">
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
                                                                <div className="w-10 shrink-0 flex items-center justify-center p-2">
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
                                                        <div className="flex items-center min-w-max py-1 px-3">
                                                            <div className="w-10 shrink-0" />
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedCollection(collection._id);
                                                                    setShowRecordModal(true);
                                                                }}
                                                                className="text-sm flex items-center gap-2 transition py-2 px-1 cursor-pointer"
                                                            >
                                                                <IoAddOutline size={18} className="text-zinc-400" />
                                                                <span className="font-google-sans text-zinc-400">Add Record</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
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
                </div>
            </section>
        </>
    );
}