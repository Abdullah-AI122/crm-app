"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { RiArrowLeftDoubleLine, RiCheckLine, RiDeleteBin5Line } from "react-icons/ri";
import { ImUngroup } from "react-icons/im";
import { TbArrowBadgeDown } from "react-icons/tb";
import { RxDragHandleDots2 } from "react-icons/rx";
import { RiDeleteBin7Fill } from "react-icons/ri";
import { CgMenuGridO, CgRename } from "react-icons/cg";
import { IoAddOutline, IoCopyOutline } from "react-icons/io5";
import { HiOutlineDotsHorizontal, HiOutlineChevronDown } from "react-icons/hi";
import { HiOutlinePencil } from "react-icons/hi2";
import { DEFAULT_STATUS_OPTIONS, STATUS_SWATCHES, COLUMN_TYPE_OPTIONS, COLLECTION_COLOR_PALETTE } from "@/data/data";
import { Avatar, Button } from "@heroui/react";
import { AiOutlineDelete, AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaChevronDown, FaPlus } from "react-icons/fa";
import { TiPlus } from "react-icons/ti";
import { BiBorderLeft } from "react-icons/bi";
import UserAvatar from "@/components/Avatar";
import Sidebar from "@/components/Sidebar";
import { VscFileSubmodule } from "react-icons/vsc";

interface Group {
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
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
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

// ── Column type options (custom dropdown, replaces native <select>) ────────


function ColumnTypeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const selected = COLUMN_TYPE_OPTIONS.find((o) => o.value === value) || COLUMN_TYPE_OPTIONS[0];
    const SelectedIcon = selected.icon;

    return (
        <div className="relative font-dmsans" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`w-full flex items-center justify-between gap-2 border rounded px-4 py-2.5 text-sm text-slate-800 transition cursor-pointer ${open ? "border-[#415A77]" : "border-slate-200 hover:border-slate-300"
                    }`}
            >
                <span className="flex items-center gap-2">
                    <SelectedIcon className="w-4 h-4 text-slate-400" />
                    {selected.label}
                </span>
                <HiOutlineChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1.5  border border-slate-200 rounded shadow-lg py-1.5 max-h-64 overflow-y-auto">
                    {COLUMN_TYPE_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = opt.value === value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left transition cursor-pointer ${isSelected ? "bg-[#415A77]/10 text-[#415A77] font-medium" : "text-slate-700 hover:bg-slate-50"
                                    }`}
                            >
                                <Icon className={`w-4 h-4 ${isSelected ? "text-[#415A77]" : "text-slate-400"}`} />
                                {opt.label}
                                {isSelected && <RiCheckLine className="w-4 h-4 ml-auto text-[#415A77]" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

const getGroupColor = (group: Group, index: number) =>
    group.color || COLLECTION_COLOR_PALETTE[index % COLLECTION_COLOR_PALETTE.length];

const tint = (hex: string, alpha = 0.08) => {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const bigint = parseInt(full, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// ── Item name cell (click to edit, auto-save on blur) ──────────────────────
const ItemNameCell = ({ item, color, width, selected, onSave }: any) => {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(item.name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setValue(item.name);
    }, [item.name]);

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editing]);

    const commit = () => {
        setEditing(false);
        const trimmed = value.trim();
        if (trimmed && trimmed !== item.name) {
            onSave(item, trimmed);
        } else {
            setValue(item.name);
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
                        if (e.key === "Escape") { setValue(item.name); setEditing(false); }
                    }}
                    className="w-full bg-transparent border-none outline-none ring-0 text-sm text-white"
                />
            ) : (
                <span onClick={() => setEditing(true)} className="truncate cursor-text w-full">
                    {item.name}
                </span>
            )}
        </div>
    );
};

// ── Cell component ─────────────────────────────────────────────────────────
const Cell = ({ item, column, itemValue, onSave, onAddStatusOption, onUpdateStatusOptions, width }: any) => {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(itemValue?.value ?? "");
    const inputRef = useRef<HTMLInputElement>(null);

    // status dropdown state (declared unconditionally — a given Cell instance
    // always renders the same column.type, so this is safe w.r.t. hook order)
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
        setValue(itemValue?.value ?? "");
    }, [itemValue?.value]);

    useEffect(() => {
        if (editing && inputRef.current) inputRef.current.focus();
    }, [editing]);

    // Close the status popover on outside click. Since the popover is now
    // rendered through a portal, we check both the trigger button and the
    // portal panel refs (a plain "does the click live inside this div"
    // check would always fail for the button once the panel is portaled out).
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
        if (trimmed !== (itemValue?.value ?? "")) {
            onSave(item, column, trimmed, itemValue);
        }
    }, [value, itemValue, item, column, onSave]);

    if (column.type === "checkbox") {
        return (
            <div className="border-r border-slate-300 flex items-center justify-center p-2" style={{ width }}>
                <input
                    type="checkbox"
                    checked={value === "true" || value === true}
                    onChange={(e) => {
                        const val = String(e.target.checked);
                        setValue(val);
                        onSave(item, column, val, itemValue);
                    }}
                    className="w-4 h-4 accent-[#415A77] cursor-pointer"
                />
            </div>
        );
    }

    if (column.type === "status") {
        const options: { label: string; color: string }[] =
            column.statusOptions?.length ? column.statusOptions : DEFAULT_STATUS_OPTIONS;
        const current = options.find((o) => o.label === itemValue?.value);

        const openMenu = () => {
            const rect = btnRef.current?.getBoundingClientRect();
            if (rect) {
                setMenuPos({
                    top: rect.bottom + 4,
                    left: Math.min(rect.left, window.innerWidth - 232),
                });
            }
            setEditingIdx(null);
            setAddingStatus(false);
            setStatusOpen((v) => !v);
        };

        const startEditOption = (idx: number, opt: { label: string; color: string }) => {
            setEditingIdx(idx);
            setEditLabel(opt.label);
            setEditColor(opt.color);
            setAddingStatus(false);
        };

        const saveEditOption = () => {
            if (editingIdx === null || !editLabel.trim()) return;
            const oldLabel = options[editingIdx].label;
            const updated = options.map((o, i) =>
                i === editingIdx ? { label: editLabel.trim(), color: editColor } : o
            );
            onUpdateStatusOptions(column, updated);
            if (oldLabel === itemValue?.value && editLabel.trim() !== oldLabel) {
                onSave(item, column, editLabel.trim(), itemValue);
            }
            setEditingIdx(null);
        };

        const removeOption = (idx: number) => {
            const removed = options[idx];
            const updated = options.filter((_, i) => i !== idx);
            onUpdateStatusOptions(column, updated);
            if (removed.label === itemValue?.value) {
                onSave(item, column, "", itemValue);
            }
            if (editingIdx === idx) setEditingIdx(null);
        };

        return (
            <div className="shrink-0 border-r border-slate-300 relative" style={{ width }}>
                <button
                    ref={btnRef}
                    onClick={openMenu}
                    className="w-full h-full flex items-center justify-center px-2 py-2 cursor-pointer"
                >
                    {current ? (
                        <span
                            className="text-xs font-medium px-2.5 py-1 rounded w-full text-center truncate text-white"
                            style={{ backgroundColor: current.color }}
                        >
                            {current.label}
                        </span>
                    ) : (
                        <span className="text-xs text-slate-300  rounded px-2.5 py-1 w-full text-center">
                            Set status
                        </span>
                    )}
                </button>

                {statusOpen && menuPos && createPortal(
                    <div
                        ref={panelRef}
                        onClick={(e) => e.stopPropagation()}
                        className="fixed z-[100] w-56 bg-white border border-slate-300 rounded shadow-lg p-1.5"
                        style={{ top: menuPos.top, left: menuPos.left }}
                    >
                        {options.map((opt, idx) =>
                            editingIdx === idx ? (
                                <div key={opt.label + idx} className="p-1.5 space-y-1.5 bg-slate-50 rounded mb-1">
                                    <input
                                        autoFocus
                                        value={editLabel}
                                        onChange={(e) => setEditLabel(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && saveEditOption()}
                                        className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 outline-none focus:border-[#415A77]"
                                    />
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {STATUS_SWATCHES.map((c) => (
                                            <button
                                                key={c}
                                                onClick={() => setEditColor(c)}
                                                className="w-[18px] h-[18px] rounded-sm cursor-pointer"
                                                style={{
                                                    backgroundColor: c,
                                                    outline: editColor === c ? "2px solid #172B4D" : "1px solid transparent",
                                                    outlineOffset: "1px",
                                                }}
                                            />
                                        ))}
                                        {/* Full-spectrum picker for any custom color */}
                                        <input
                                            type="color"
                                            value={editColor}
                                            onChange={(e) => setEditColor(e.target.value)}
                                            className="w-[18px] h-[18px] p-0 border-0 rounded-sm cursor-pointer bg-transparent"
                                            title="Custom color"
                                        />
                                    </div>
                                    <div className="flex gap-1.5 pt-0.5">
                                        <button
                                            onClick={saveEditOption}
                                            className="flex-1 bg-[#415A77] text-white text-xs py-1.5 rounded hover:bg-[#415A77]/80 cursor-pointer transition"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setEditingIdx(null)}
                                            className="flex-1 border border-slate-200 text-xs py-1.5 rounded text-slate-500 hover:bg-slate-50 cursor-pointer transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    key={opt.label + idx}
                                    className="w-full flex items-center gap-1 px-1 py-0.5 rounded hover:bg-slate-50 group/opt"
                                >
                                    <button
                                        onClick={() => { onSave(item, column, opt.label, itemValue); setStatusOpen(false); }}
                                        className="flex-1 flex items-center gap-2 px-1.5 py-1.5 text-left cursor-pointer"
                                    >
                                        <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: opt.color }} />
                                        <span className="text-sm text-slate-700 truncate">{opt.label}</span>
                                    </button>
                                    <button
                                        onClick={() => startEditOption(idx, opt)}
                                        className="opacity-0 group-hover/opt:opacity-100 text-slate-400 hover:text-[#415A77] p-1 cursor-pointer transition shrink-0"
                                        title="Edit status"
                                    >
                                        <HiOutlinePencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => removeOption(idx)}
                                        className="opacity-0 group-hover/opt:opacity-100 text-slate-400 hover:text-red-500 p-1 cursor-pointer transition shrink-0"
                                        title="Delete status"
                                    >
                                        <RiDeleteBin5Line className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )
                        )}

                        <div className="border-t border-slate-300 mt-1 pt-1">
                            {addingStatus ? (
                                <div className="p-1.5 space-y-1.5">
                                    <input
                                        autoFocus
                                        value={newStatusLabel}
                                        onChange={(e) => setNewStatusLabel(e.target.value)}
                                        placeholder="Status name"
                                        className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 outline-none focus:border-[#415A77] transition"
                                    />
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {STATUS_SWATCHES.map((c) => (
                                            <button
                                                key={c}
                                                onClick={() => setNewStatusColor(c)}
                                                className="w-[18px] h-[18px] rounded-sm cursor-pointer"
                                                style={{
                                                    backgroundColor: c,
                                                    outline: newStatusColor === c ? "2px solid #172B4D" : "1px solid transparent",
                                                    outlineOffset: "1px",
                                                }}
                                            />
                                        ))}
                                        <input
                                            type="color"
                                            value={newStatusColor}
                                            onChange={(e) => setNewStatusColor(e.target.value)}
                                            className="w-[18px] h-[18px] p-0 border-0 rounded-sm cursor-pointer bg-transparent"
                                            title="Custom color"
                                        />
                                    </div>
                                    <div className="flex gap-1.5 pt-0.5">
                                        <button
                                            onClick={() => {
                                                if (!newStatusLabel.trim()) return;
                                                onAddStatusOption(column, { label: newStatusLabel.trim(), color: newStatusColor });
                                                onSave(item, column, newStatusLabel.trim(), itemValue);
                                                setNewStatusLabel("");
                                                setAddingStatus(false);
                                                setStatusOpen(false);
                                            }}
                                            className="flex-1 bg-[#415A77] text-white text-xs py-1.5 rounded hover:bg-[#415A77]/80 cursor-pointer transition"
                                        >
                                            Add
                                        </button>
                                        <button
                                            onClick={() => setAddingStatus(false)}
                                            className="flex-1 border border-slate-200 text-xs py-1.5 rounded text-slate-500 hover:bg-slate-50 cursor-pointer transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setAddingStatus(true)}
                                    className="w-full text-left px-2 py-1.5 text-xs text-[#415A77] hover:bg-slate-50 rounded cursor-pointer transition"
                                >
                                    + Add custom status
                                </button>
                            )}
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        );
    }

    if (editing) {
        return (
            <div
                className="shrink-0 h-10 border-r border-slate-300 flex items-center  focus-within:ring-inset"
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
                            setValue(itemValue?.value ?? "");
                            setEditing(false);
                        }
                    }}
                    className="w-full h-full px-3 text-sm text-white/90  bg-transparent border-none outline-none ring-0 focus:outline-none "
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
            {itemValue?.value ? (
                <span className="truncate w-full">{itemValue.value}</span>
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

    // Group state
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedGroupColor, setSelectedGroupColor] = useState(COLLECTION_COLOR_PALETTE[0]);
    const [creating, setCreating] = useState(false);
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

    // Column state
    const [columns, setColumns] = useState<any[]>([]);
    const [showColumnModal, setShowColumnModal] = useState(false);
    const [columnName, setColumnName] = useState("");
    const [columnType, setColumnType] = useState("text");
    const [creatingColumn, setCreatingColumn] = useState(false);

    // Column widths (resizable) — keyed by column id, plus a special
    // "itemName" key for the frozen item column.
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({ itemName: 280 });
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

    // Item state
    const [items, setItems] = useState<any[]>([]);
    const [showItemModal, setShowItemModal] = useState(false);
    const [itemName, setItemName] = useState("");
    const [selectedGroup, setSelectedGroup] = useState("");
    const [creatingItem, setCreatingItem] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
    const [deletingItems, setDeletingItems] = useState(false);

    const [copyingId, setCopyingId] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    // ItemValue state
    const [itemValues, setItemValues] = useState<any[]>([]);
    const [deleteGroupModal, setDeleteGroupModal] = useState<string | null>(null);

    // Drag refs
    const dragGroupId = useRef<string | null>(null);
    const dragColumnId = useRef<string | null>(null);
    const dragItem = useRef<{ id: string; group: string } | null>(null);
    const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);

    // ── Close context menu on click outside ──────────────────────────────
    useEffect(() => {
        const handler = () => setColMenu(null);
        window.addEventListener("click", handler);
        return () => window.removeEventListener("click", handler);
    }, []);

    // ── Fetch Collections (Groups) ─────────────────────────────────────────
    const getGroups = async () => {
        try {
            const res = await apiRequest(`/api/collections/${moduleId}`, { method: "GET" });
            const data = await res.json();
            if (res.ok) setGroups(data.collections || []);
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
    // ── Create Group (Collection) ─────────────────────────────────────────
    const openGroupModal = () => {
        setSelectedGroupColor(COLLECTION_COLOR_PALETTE[groups.length % COLLECTION_COLOR_PALETTE.length]);
        setShowGroupModal(true);
    };

    const createGroup = async () => {
        if (!groupName.trim()) return;
        try {
            setCreating(true);
            const res = await apiRequest(`/api/collections/${moduleId}`, {
                method: "POST",
                body: JSON.stringify({ name: groupName, color: selectedGroupColor }),
            });
            if (res.ok) { setGroupName(""); setShowGroupModal(false); getGroups(); }
        } catch (e) { console.log(e); } finally { setCreating(false); }
    };

    // ── Delete Group (Collection) ─────────────────────────────────────────
    const deleteGroup = async (groupId: string) => {
        try {
            setDeletingGroupId(groupId);

            const res = await apiRequest(`/api/collections/${groupId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setGroups((prev) => prev.filter((g) => g._id !== groupId));

                const groupItemIds = items
                    .filter((i) => i.group === groupId)
                    .map((i) => i._id);

                setItems((prev) => prev.filter((i) => i.group !== groupId));
                setItemValues((prev) =>
                    prev.filter((v) => !groupItemIds.includes(v.item))
                );
            }
        } catch (e) {
            console.log(e);
        } finally {
            setDeletingGroupId(null);
            setDeleteGroupModal(null);
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
                setItemValues((prev) => prev.filter((v) => (v.column?._id || v.column) !== columnId));
            }
        } catch (e) { console.log(e); } finally { setDeletingColumnId(null); }
    };

    // ── Fetch Items (Records) ──────────────────────────────────────────────
    const getItems = async (groupId: string) => {
        try {
            const res = await apiRequest(`/api/records/${groupId}`, { method: "GET" });
            const data = await res.json();
            if (res.ok) {
                const recordsList = data.records || data.items || [];
                setItems((prev) => [...prev.filter((i) => i.group !== groupId), ...recordsList]);
                for (const item of recordsList) getItemValues(item._id);
            }
        } catch (e) { console.log(e); }
    };

    const getItemValues = async (itemId: string) => {
        try {
            const res = await apiRequest(`/api/record-values/${itemId}`, { method: "GET" });
            const data = await res.json();
            if (res.ok) setItemValues((prev) => [...prev.filter((v) => v.item !== itemId), ...data.values]);
        } catch (e) { console.log(e); }
    };

    const saveItemValue = async (item: any, column: any, value: any, existingItemValue: any) => {
        try {
            const tempId = existingItemValue?._id || Math.random().toString();
            setItemValues((prev) => {
                const filtered = prev.filter((v) => !(v.item === item._id && (v.column?._id || v.column) === column._id));
                return [...filtered, { _id: tempId, item: item._id, column: column._id, value }];
            });
            if (existingItemValue) {
                await apiRequest(`/api/record-values/${existingItemValue._id}`, { method: "PUT", body: JSON.stringify({ value }) });
            } else {
                const res = await apiRequest(`/api/record-values`, {
                    method: "POST",
                    body: JSON.stringify({ workspace: item.workspace, module: item.module || moduleId, collectionName: item.group || item.collectionName, record: item._id, column: column._id, value }),
                });
                if (res.ok) {
                    const data = await res.json();
                    const returnedVal = data.recordValue || data.itemValue;
                    setItemValues((prev) => {
                        const filtered = prev.filter((v) => !(v.item === item._id && (v.column?._id || v.column) === column._id));
                        return [...filtered, returnedVal];
                    });
                }
            }
        } catch (e) { console.log(e); }
    };

    // ── Rename item (inline edit, auto-save) ────────────────────────────────
    const renameItem = async (item: any, name: string) => {
        setItems((prev) => prev.map((i) => (i._id === item._id ? { ...i, name } : i)));
        try {
            await apiRequest(`/api/records/${item._id}`, { method: "PUT", body: JSON.stringify({ name }) });
        } catch (e) { console.log(e); }
    };

    // ── Create Item ───────────────────────────────────────────────────────
    const createItem = async () => {
        if (!itemName.trim()) return;
        try {
            setCreatingItem(true);
            const res = await apiRequest(`/api/records/${selectedGroup}`, {
                method: "POST",
                body: JSON.stringify({ name: itemName }),
            });
            if (res.ok) { setShowItemModal(false); setItemName(""); getItems(selectedGroup); }
        } catch (e) { console.log(e); } finally { setCreatingItem(false); }
    };

    // ── Delete items ──────────────────────────────────────────────────────
    const toggleItemSelected = (itemId: string) => {
        setSelectedItemIds((prev) => { const n = new Set(prev); n.has(itemId) ? n.delete(itemId) : n.add(itemId); return n; });
    };

    const toggleSelectAllInGroup = (groupId: string) => {
        const ids = items.filter((i) => i.group === groupId).map((i) => i._id);
        const allSelected = ids.every((id) => selectedItemIds.has(id));
        setSelectedItemIds((prev) => { const n = new Set(prev); ids.forEach((id) => allSelected ? n.delete(id) : n.add(id)); return n; });
    };

    const deleteSelectedItems = async () => {
        if (selectedItemIds.size === 0) return;
        try {
            setDeletingItems(true);
            const ids = Array.from(selectedItemIds);
            await Promise.all(ids.map((id) => apiRequest(`/api/records/${id}`, { method: "DELETE" }).catch(console.log)));
            setItems((prev) => prev.filter((i) => !selectedItemIds.has(i._id)));
            setItemValues((prev) => prev.filter((v) => !selectedItemIds.has(v.item)));
            setSelectedItemIds(new Set());
        } catch (e) { console.log(e); } finally { setDeletingItems(false); }
    };

    // ── Collapse / expand ─────────────────────────────────────────────────
    const toggleCollapsed = (groupId: string) => setCollapsed((prev) => ({ ...prev, [groupId]: !prev[groupId] }));

    // ── Drag & drop: groups ───────────────────────────────────────────────
    const persistGroupOrder = async (ordered: Group[]) => {
        await Promise.all(ordered.map((g, idx) =>
            apiRequest(`/api/collections/${g._id}`, { method: "PUT", body: JSON.stringify({ position: idx }) }).catch(console.log)
        ));
    };

    const handleGroupDrop = (targetGroupId: string) => {
        const sourceId = dragGroupId.current; dragGroupId.current = null;
        if (!sourceId || sourceId === targetGroupId) return;
        setGroups((prev) => {
            const next = [...prev];
            const from = next.findIndex((g) => g._id === sourceId);
            const to = next.findIndex((g) => g._id === targetGroupId);
            if (from === -1 || to === -1) return prev;
            const [moved] = next.splice(from, 1); next.splice(to, 0, moved);
            persistGroupOrder(next);
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
        const sourceId = dragColumnId.current; dragColumnId.current = null;
        if (!sourceId || sourceId === targetColumnId) return;
        setColumns((prev) => {
            const next = [...prev];
            const from = next.findIndex((c) => c._id === sourceId);
            const to = next.findIndex((c) => c._id === targetColumnId);
            if (from === -1 || to === -1) return prev;
            const [moved] = next.splice(from, 1); next.splice(to, 0, moved);
            persistColumnOrder(next);
            return next;
        });
    };

    // ── Drag & drop: items ────────────────────────────────────────────────
    const persistItemMove = async (itemId: string, groupId: string, position: number) => {
        await apiRequest(`/api/records/${itemId}`, { method: "PUT", body: JSON.stringify({ collectionName: groupId, position }) }).catch(console.log);
    };

    const handleItemDropOnItem = (targetItem: any) => {
        const source = dragItem.current; dragItem.current = null; setDragOverGroupId(null);
        if (!source || source.id === targetItem._id) return;
        setItems((prev) => {
            const next = [...prev];
            const from = next.findIndex((i) => i._id === source.id);
            if (from === -1) return prev;
            const [moved] = next.splice(from, 1);
            moved.group = targetItem.group;
            const to = next.findIndex((i) => i._id === targetItem._id);
            next.splice(to === -1 ? next.length : to, 0, moved);
            const groupItems = next.filter((i) => i.group === targetItem.group);
            persistItemMove(moved._id, targetItem.group, groupItems.findIndex((i) => i._id === moved._id));
            return next;
        });
    };

    const handleItemDropOnGroup = (targetGroupId: string) => {
        const source = dragItem.current; dragItem.current = null; setDragOverGroupId(null);
        if (!source || source.group === targetGroupId) return;
        setItems((prev) => {
            const next = prev.map((i) => i._id === source.id ? { ...i, group: targetGroupId } : i);
            const groupItems = next.filter((i) => i.group === targetGroupId);
            persistItemMove(source.id, targetGroupId, groupItems.length - 1);
            return next;
        });
    };

    // ── Effects ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (moduleId) { getGroups(); getColumns(); }
    }, [moduleId]);

    useEffect(() => {
        if (groups.length > 0) {
            groups.forEach((g) => getItems(g._id));
        }
    }, [groups.length]);

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
                                onClick={openGroupModal}
                                className="bg-white text-slate-800 px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition cursor-pointer font-dmsans flex items-center gap-2"
                            >
                                New Collection
                            </button>
                            <UserAvatar />
                            <div className="flex items-center gap-2">
                                {selectedItemIds.size > 0 && (
                                    <div className="relative inline-block hover:cursor-pointer ">
                                        <Button
                                            isIconOnly
                                            onPress={deleteSelectedItems}
                                            isDisabled={deletingItems}
                                            className="bg-green-400 hover:bg-green-500 text-white"
                                        >
                                            <RiDeleteBin7Fill className="text-lg " />
                                        </Button>

                                        {!deletingItems && (
                                            <span className="absolute -top-0 -right-0 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center">
                                                {selectedItemIds.size}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* <button
                        onClick={openGroupModal}
                        className="flex items-center gap-1.5 bg-[#415A77] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#586D88] transition cursor-pointer font-dmsans"
                    >
                        + Add Group
                    </button> */}
                            </div>
                        </div>
                        {/* Board content */}
                        <div className="px-8 py-6">
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-32 rounded bg-white/5 shimmer" />
                                    ))}

                                </div>
                            ) : groups.length === 0 ? (
                                <div className="border border-dashed border-slate-500 rounded p-16 text-center flex items-center justify-center flex-col">
                                    <div className="text-4xl mb-4 inline-block "><VscFileSubmodule className="" /></div>
                                    <h2 className="text-lg font-semibold mb-1 font-google-sans text-black ">Empty Module</h2>
                                    <p className="mb-5 text-sm font-google-sans text-black">Create your first Collection to start organizing work</p>

                                </div>
                            ) : (
                                <div className="space-y-2">

                                    {groups.map((group, groupIndex) => {
                                        const color = getGroupColor(group, groupIndex);
                                        const groupItems = items.filter((item) => item.group === group._id);
                                        const isCollapsed = !!collapsed[group._id];
                                        const allSelected = groupItems.length > 0 && groupItems.every((i) => selectedItemIds.has(i._id));

                                        return (
                                            <div
                                                key={group._id}
                                                draggable
                                                onDragStart={() => (dragGroupId.current = group._id)}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={() => handleGroupDrop(group._id)}
                                            >
                                                {/* ── Group header ───────────────────────── */}
                                                <div
                                                    className="flex items-center gap-1 mb-0 px-3 py-2 select-none "
                                                    style={{ backgroundColor: tint(color, 0.20), borderRight: `3px solid ${color}`, borderLeft: `3px solid ${color}` }}
                                                >
                                                    {/* Drag handle */}
                                                    <span className="cursor-grab active:cursor-grabbing text-sm leading-none" title="Drag group"><RxDragHandleDots2 /></span>

                                                    {/* Collapse toggle */}
                                                    <button
                                                        onClick={() => toggleCollapsed(group._id)}
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
                                                        {group.name}
                                                    </span>


                                                    <div className="ml-auto flex items-center">


                                                        {/* Delete group */}
                                                        <button
                                                            onClick={() => setDeleteGroupModal(group._id)}
                                                            disabled={deletingGroupId === group._id}
                                                            className="text-xs bg-zinc-400 text-white px-2 py-1 rounded-lg transition cursor-pointer"
                                                            title="Delete group"
                                                        >
                                                            {deletingGroupId === group._id ? "Deleting..." : "Delete"}
                                                        </button>
                                                        <span className="text-xs text-white bg-[#111727] px-2 py-0.5 rounded-md font-google-sans ml-1">
                                                            {groupItems.length} {groupItems.length === 1 ? "" : ""}
                                                        </span>

                                                    </div>
                                                </div>

                                                {/* ── Group table ─────────────────────────── */}
                                                {/*
                                        The scroll happens INSIDE this div (both axes), which is
                                        also why it needs its own explicit max-height — sticky
                                        headers stick to their nearest scrolling ancestor, and
                                        popovers previously rendered inline here got clipped by
                                        this same overflow. Status dropdowns are portaled out to
                                        <body> now, so that clipping no longer applies to them.
                                    */}
                                                {!isCollapsed && (
                                                    <div
                                                        className="overflow-auto border border-slate-300 border-t-0 shadow-sm rounded-b max-h-[480px] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
                                                        onDragOver={(e) => { e.preventDefault(); setDragOverGroupId(group._id); }}
                                                        onDrop={() => handleItemDropOnGroup(group._id)}
                                                        style={{
                                                            outline: dragOverGroupId === group._id ? `2px solid ${color}33` : "none",
                                                        }}
                                                    >
                                                        {/* Header row */}
                                                        <div className="flex items-stretch border-b border-slate-300 min-w-max sticky top-0 z-10">
                                                            {/* Checkbox */}
                                                            <div className="w-10 shrink-0  flex items-center justify-center p-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={allSelected}
                                                                    onChange={() => toggleSelectAllInGroup(group._id)}
                                                                    className="w-3.5 h-3.5 accent-[#415A77] cursor-pointer"
                                                                />
                                                            </div>


                                                            {/* Item label — sticky, resizable */}
                                                            <div
                                                                className="relative shrink-0 px-3 py-2.5 border-r border-slate-300 text-[13px] tracking-wider flex items-center sticky left-10 font-google-sans"
                                                                style={{ width: getColWidth("itemName", 280), borderLeft: `3px solid ${color}` }}
                                                            >
                                                                Records
                                                                <ResizeHandle onResize={(d) => resizeColumn("itemName", d, 280)} />
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
                                                                    className="relative shrink-0 px-3 py-2.5 border-r border-slate-300 tracking-wider font-google-sans flex items-center justify-center cursor-grab active:cursor-grabbing bg-transparent transition select-none text-[13px]"
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
                                                            <div className="w-[120px] shrink-0 px-3 py-2.5 flex items-center justify-center ">
                                                                <button
                                                                    onClick={() => setShowColumnModal(true)}
                                                                    className="text-xs text-zinc-500 font-google-sans font-bold transition whitespace-nowrap cursor-pointer "
                                                                >
                                                                    + Column
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Item rows */}
                                                        {groupItems.map((item) => (
                                                            <div
                                                                key={item._id}
                                                                draggable
                                                                onDragStart={() => (dragItem.current = { id: item._id, group: item.group })}
                                                                onDragOver={(e) => e.preventDefault()}
                                                                onDrop={(e) => { e.stopPropagation(); handleItemDropOnItem(item); }}
                                                                className={`flex items-center min-w-max border-b border-slate-300 group transition-colors ${selectedItemIds.has(item._id) ? "bg-slate-100/60" : "hover:bg-zinc-600/5"}`}
                                                            >
                                                                {/* Checkbox */}
                                                                <div className="w-10 shrink-0  flex items-center justify-center p-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedItemIds.has(item._id)}
                                                                        onChange={() => toggleItemSelected(item._id)}
                                                                        className="w-3.5 h-3.5 accent-[#415A77] cursor-pointer font-dmsans"
                                                                    />
                                                                </div>

                                                                {/* Item name — sticky, click-to-edit, auto-saves on blur */}
                                                                <ItemNameCell
                                                                    item={item}
                                                                    color={color}
                                                                    width={getColWidth("itemName", 280)}
                                                                    selected={selectedItemIds.has(item._id)}
                                                                    onSave={renameItem}
                                                                />

                                                                {/* Cells */}
                                                                {columns.map((column) => {
                                                                    const iv = itemValues.find(
                                                                        (v) => v.item === item._id && (v.column?._id || v.column) === column._id
                                                                    );
                                                                    return (
                                                                        <Cell
                                                                            key={column._id}
                                                                            item={item}
                                                                            column={column}
                                                                            itemValue={iv}
                                                                            width={getColWidth(column._id)}
                                                                            onSave={saveItemValue}
                                                                            onAddStatusOption={addStatusOption}
                                                                            onUpdateStatusOptions={updateColumnStatusOptions}
                                                                        />
                                                                    );
                                                                })}

                                                                {/* Trailing spacer */}
                                                                <div className="w-[120px] shrink-0" />
                                                            </div>
                                                        ))}

                                                        {/* Add item row */}
                                                        <div className="flex items-center min-w-max py-1 px-3">
                                                            <div className="w-10 shrink-0" />
                                                            <button
                                                                onClick={() => { setSelectedGroup(group._id); setShowItemModal(true); }}
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
                    {/* ── Column context menu ────────────────────────────────────── */}
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

                    {/* ── Rename column modal ────────────────────────────────────── */}
                    {renameModal && (
                        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-5">
                            <div className="bg-white rounded p-6 w-full max-w-md shadow-2xl">
                                <h2 className="text-lg font-semibold text-[#172B4D] mb-4 font-dmsans">Rename Column</h2>

                                {/* Column ID display */}
                                <div className="flex items-center gap-2 mb-4 p-3 bg-slate-50 rounded border border-slate-300">
                                    <span className="text-xs text-slate-400 font-medium">ID:</span>
                                    <span className="text-xs font-mono text-slate-600 flex-1 truncate">{renameModal.id}</span>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(renameModal.id);
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                        }}
                                        className="text-xs bg-white border border-slate-200 px-2.5 py-1 rounded hover:bg-slate-100 transition text-slate-500 shrink-0 cursor-pointer"
                                    >
                                        {copied ? "✓ Copied" : "Copy"}
                                    </button>
                                </div>

                                <label className="text-xs font-medium text-slate-500 mb-1.5 block font-dmsans">
                                    Column name
                                </label>
                                <input
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && renameColumn()}
                                    placeholder="Column name"
                                    className="w-full text-slate-800 border border-slate-200 rounded px-4 py-2.5 mb-4 text-sm outline-none focus:border-[#415A77] transition"
                                />

                                <div className="flex gap-3">
                                    <button
                                        onClick={renameColumn}
                                        disabled={renamingColumn}
                                        className="flex-1 bg-[#415A77] text-white py-2.5 rounded text-sm font-medium hover:bg-[#415A77]/80 transition cursor-pointer disabled:opacity-60"
                                    >
                                        {renamingColumn ? "Saving…" : "Save"}
                                    </button>
                                    <button
                                        onClick={() => setRenameModal(null)}
                                        className="flex-1 border border-slate-200 py-2.5 rounded text-sm text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Create Group Modal ─────────────────────────────────────── */}
                    {showGroupModal && (
                        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-5 backdrop-blur-sm">
                            <div className="bg-[#111727] rounded-xl px-6 w-full max-w-md shadow-2xl py-8">
                                <h2 className="text-lg font-semibold text-white mb-4 font-dmsans">Create Collection</h2>

                                <label className="text-xs text-white mb-1.5 block font-dmsans">
                                    Collection name
                                </label>
                                <input
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && createGroup()}
                                    placeholder="e.g. In Progress"
                                    autoFocus
                                    className="w-full text-slate-800 border font-dmsans border-slate-800 rounded-xl px-4 py-2.5 mb-4 text-sm outline-none focus:border-[#415A77] transition text-white"
                                />

                                <label className="text-xs text-white mb-2 block font-dmsans">
                                    Group color
                                </label>
                                <div className="flex items-center gap-2 flex-wrap mb-5">
                                    {COLLECTION_COLOR_PALETTE.map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setSelectedGroupColor(c)}
                                            className="w-6 h-6 rounded-xl cursor-pointer transition"
                                            style={{
                                                backgroundColor: c,
                                                outline: selectedGroupColor === c ? "1px solid #fff" : "1px solid transparent",
                                                outlineOffset: "1px",
                                            }}
                                            aria-label={`Choose color ${c}`}
                                        />
                                    ))}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={createGroup}
                                        disabled={creating}
                                        className="flex-1 bg-white text-slate-800 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer disabled:opacity-60"
                                    >
                                        {creating ? "Creating…" : "Create Collection"}
                                    </button>
                                    <button onClick={() => setShowGroupModal(false)} className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl text-sm font-medium transition cursor-pointer disabled:opacity-60">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Create Column Modal ────────────────────────────────────── */}
                    {showColumnModal && (
                        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-5">
                            <div className="bg-white rounded p-6 w-full max-w-md shadow-2xl">
                                <h2 className="text-lg font-semibold text-[#172B4D] mb-4 font-dmsans">Add Column</h2>

                                <label className="text-xs font-medium text-slate-500 mb-1.5 block font-dmsans">
                                    Column name
                                </label>
                                <input
                                    value={columnName}
                                    onChange={(e) => setColumnName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && createColumn()}
                                    placeholder="Column name"
                                    autoFocus
                                    className="w-full text-slate-800 border border-slate-200 font-dmsans rounded px-4 py-2.5 mb-3 text-sm outline-none focus:border-[#415A77] transition"
                                />

                                <label className="text-xs font-medium text-slate-500 mb-1.5 block font-dmsans">
                                    Column type
                                </label>
                                <ColumnTypeSelect value={columnType} onChange={setColumnType} />

                                {columnType === "status" && (
                                    <div className="mb-1 mt-3 p-3 bg-slate-50 rounded border border-slate-200">
                                        <p className="text-xs text-slate-500 mb-2 font-dmsans">Starts with these statuses — add your own from any cell later:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {DEFAULT_STATUS_OPTIONS.map((opt) => (
                                                <span
                                                    key={opt.label}
                                                    className="text-xs font-medium px-2 py-1 rounded text-white"
                                                    style={{ backgroundColor: opt.color }}
                                                >
                                                    {opt.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={createColumn}
                                        disabled={creatingColumn}
                                        className="flex-1 bg-[#415A77] text-white py-2.5 rounded text-sm font-medium hover:bg-[#415A77]/80 transition cursor-pointer disabled:opacity-60 font-dmsans"
                                    >
                                        {creatingColumn ? "Creating…" : "Add Column"}
                                    </button>
                                    <button onClick={() => setShowColumnModal(false)} className="flex-1 border border-slate-200 py-2.5 rounded text-sm cursor-pointer text-slate-600 hover:bg-slate-50 transition font-dmsans">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Create Item Modal ──────────────────────────────────────── */}
                    {showItemModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-5">
                            <div className="bg-[#0D1B2A] rounded-xl p-6 w-full max-w-md shadow-2xl">
                                <h2 className="text-lg font-bold text-white mb-4 font-dmsans">Add Item</h2>

                                <label className="text-xs font-medium text-white mb-1.5 block font-dmsans">
                                    Item name
                                </label>
                                <input
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && createItem()}
                                    placeholder="Item Name"
                                    autoFocus
                                    className="w-full text-white border font-dmsans border-slate-700 rounded-xl px-4 py-2.5 mb-4 text-sm outline-none focus:border-[#415A77] transition"
                                />

                                <div className="flex gap-3">
                                    <button
                                        onClick={createItem}
                                        disabled={creatingItem}
                                        className="flex-1 bg-white text-black py-2.5 rounded text-sm font-medium hover:bg-gray-100 transition cursor-pointer disabled:opacity-60 font-dmsans"
                                    >
                                        {creatingItem ? "Creating…" : "Add Item"}
                                    </button>
                                    <button onClick={() => setShowItemModal(false)} className="flex-1 bg-slate-700 border border-slate-700 py-2.5 rounded text-sm text-white hover:bg-slate-700 transition cursor-pointer font-dmsans">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {deleteGroupModal && (
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
                                        This action cannot be undone. All items inside this Collection
                                        will also be deleted.
                                    </p>

                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            onClick={() => setDeleteGroupModal(null)}
                                            className="px-4 py-2 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition cursor-pointer"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            onClick={() => deleteGroup(deleteGroupModal)}
                                            disabled={deletingGroupId === deleteGroupModal}
                                            className="px-4 py-2 rounded-xl bg-white text-[#415A77] hover:bg-white/80 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            {deletingGroupId === deleteGroupModal
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