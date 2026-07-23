"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { RiArrowLeftDoubleLine, RiCheckLine, RiDeleteBin5Line } from "react-icons/ri";
import { ImUngroup } from "react-icons/im";
import { TbArrowBadgeDown } from "react-icons/tb";
import { RxDragHandleDots2 } from "react-icons/rx";
import { RiDeleteBin7Fill } from "react-icons/ri";
import { CgRename } from "react-icons/cg";
import { IoCopyOutline } from "react-icons/io5";
import { HiOutlineDotsHorizontal, HiOutlineChevronDown } from "react-icons/hi";
import {
    HiOutlineDocumentText, HiOutlineHashtag, HiOutlineFlag, HiOutlineCalendarDays,
    HiOutlineUser, HiOutlineEnvelope, HiOutlinePhone, HiOutlineCheckCircle,
    HiOutlineChevronUpDown, HiOutlineLink, HiOutlinePaperClip, HiOutlineStar,
} from "react-icons/hi2";

interface Group {
    _id: string;
    name: string;
    color: string;
    position: number;
}

// ── Color palette ──────────────────────────────────────────────────────────
const GROUP_COLOR_PALETTE = [
    "#6366F1", // indigo
    "#F97362", // coral
    "#0EA5A4", // teal
    "#EAB308", // amber
    "#EC4899", // pink
    "#22C55E", // green
    "#8B5CF6", // violet
    "#F59E0B", // orange
    "#3B82F6", // blue
    "#14B8A6", // cyan
];

const STATUS_SWATCHES = [
    "#94A3B8", "#F59E0B", "#EF4444", "#22C55E", "#6366F1", "#EC4899", "#0EA5A4", "#8B5CF6", "#3B82F6", "#14B8A6",
];

const DEFAULT_STATUS_OPTIONS = [
    { label: "Not Started", color: "#94A3B8" },
    { label: "Working on it", color: "#F59E0B" },
    { label: "Stuck", color: "#EF4444" },
    { label: "Done", color: "#22C55E" },
];

// ── Column type options (custom dropdown, replaces native <select>) ────────
const COLUMN_TYPE_OPTIONS = [
    { value: "text", label: "Text", icon: HiOutlineDocumentText },
    { value: "number", label: "Number", icon: HiOutlineHashtag },
    { value: "status", label: "Status", icon: HiOutlineFlag },
    { value: "date", label: "Date", icon: HiOutlineCalendarDays },
    { value: "person", label: "Person", icon: HiOutlineUser },
    { value: "email", label: "Email", icon: HiOutlineEnvelope },
    { value: "phone", label: "Phone", icon: HiOutlinePhone },
    { value: "checkbox", label: "Checkbox", icon: HiOutlineCheckCircle },
    { value: "dropdown", label: "Dropdown", icon: HiOutlineChevronUpDown },
    { value: "link", label: "Link", icon: HiOutlineLink },
    { value: "file", label: "File", icon: HiOutlinePaperClip },
    { value: "rating", label: "Rating", icon: HiOutlineStar },
];

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
                className={`w-full flex items-center justify-between gap-2 border rounded px-4 py-2.5 text-sm text-slate-800 bg-white transition cursor-pointer ${
                    open ? "border-[#415A77]" : "border-slate-200 hover:border-slate-300"
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
                <div className="absolute z-30 top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded shadow-lg py-1.5 max-h-64 overflow-y-auto">
                    {COLUMN_TYPE_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = opt.value === value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left transition cursor-pointer ${
                                    isSelected ? "bg-[#415A77]/10 text-[#415A77] font-medium" : "text-slate-700 hover:bg-slate-50"
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
    group.color || GROUP_COLOR_PALETTE[index % GROUP_COLOR_PALETTE.length];

const tint = (hex: string, alpha = 0.08) => {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const bigint = parseInt(full, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// ── Cell component ─────────────────────────────────────────────────────────
const Cell = ({ item, column, itemValue, onSave, onAddStatusOption }: any) => {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(itemValue?.value ?? "");
    const inputRef = useRef<HTMLInputElement>(null);

    // status dropdown state
    const [statusOpen, setStatusOpen] = useState(false);
    const [addingStatus, setAddingStatus] = useState(false);
    const [newStatusLabel, setNewStatusLabel] = useState("");
    const [newStatusColor, setNewStatusColor] = useState(STATUS_SWATCHES[0]);
    const statusRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setValue(itemValue?.value ?? "");
    }, [itemValue?.value]);

    useEffect(() => {
        if (editing && inputRef.current) inputRef.current.focus();
    }, [editing]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
                setStatusOpen(false);
                setAddingStatus(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const commit = useCallback(() => {
        setEditing(false);
        const trimmed = typeof value === "string" ? value : String(value);
        if (trimmed !== (itemValue?.value ?? "")) {
            onSave(item, column, trimmed, itemValue);
        }
    }, [value, itemValue, item, column, onSave]);

    if (column.type === "checkbox") {
        return (
            <div className="w-[160px] shrink-0 border-r border-slate-100 flex items-center justify-center p-2">
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

        return (
            <div className="w-[160px] shrink-0 border-r border-slate-100 relative" ref={statusRef}>
                <button
                    onClick={() => setStatusOpen((v) => !v)}
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
                        <span className="text-xs text-slate-300 border border-dashed border-slate-200 rounded px-2.5 py-1 w-full text-center">
                            Set status
                        </span>
                    )}
                </button>

                {statusOpen && (
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute z-20 top-full left-0 mt-1 w-52 bg-white border border-slate-200 rounded shadow-lg p-1.5"
                    >
                        {options.map((opt) => (
                            <button
                                key={opt.label}
                                onClick={() => {
                                    onSave(item, column, opt.label, itemValue);
                                    setStatusOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 text-left cursor-pointer"
                            >
                                <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: opt.color }} />
                                <span className="text-sm text-slate-700 truncate">{opt.label}</span>
                            </button>
                        ))}

                        <div className="border-t border-slate-100 mt-1 pt-1">
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
                    </div>
                )}
            </div>
        );
    }

    if (editing) {
        return (
            <div className="w-[160px] shrink-0 border-r border-slate-100 bg-white flex items-center">
                <input
                    ref={inputRef}
                    type={column.type === "number" ? "number" : column.type === "date" ? "date" : column.type === "email" ? "email" : "text"}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={commit}
                    onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setValue(itemValue?.value ?? ""); setEditing(false); } }}
                    className="w-full h-full px-3 py-2 text-sm text-slate-700 bg-transparent border-none outline-none ring-0 focus:ring-0"
                    style={{ boxShadow: "none" }}
                />
            </div>
        );
    }

    return (
        <div
            onClick={() => setEditing(true)}
            className="w-[160px] shrink-0 border-r border-slate-100 px-3 py-2 cursor-text text-sm text-slate-700 text-center truncate hover:bg-slate-50 transition-colors select-none"
        >
            {itemValue?.value ? (
                <span>{itemValue.value}</span>
            ) : (
                <span className="text-slate-300  group-hover:text-slate-400"></span>
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

export default function BoardPage() {
    const params = useParams();
    const router = useRouter();
    const boardId = params.boardId as string;

    // Group state
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedGroupColor, setSelectedGroupColor] = useState(GROUP_COLOR_PALETTE[0]);
    const [creating, setCreating] = useState(false);
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

    // Column state
    const [columns, setColumns] = useState<any[]>([]);
    const [showColumnModal, setShowColumnModal] = useState(false);
    const [columnName, setColumnName] = useState("");
    const [columnType, setColumnType] = useState("text");
    const [creatingColumn, setCreatingColumn] = useState(false);

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

    const [copiedId, setCopiedId] = useState<string | null>(null);

    // ItemValue state
    const [itemValues, setItemValues] = useState<any[]>([]);

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

    // ── Fetch Groups ──────────────────────────────────────────────────────
    const getGroups = async () => {
        try {
            const res = await apiRequest(`/api/groups/${boardId}`, { method: "GET" });
            const data = await res.json();
            if (res.ok) setGroups(data.groups || []);
        } catch (e) { console.log(e); } finally { setLoading(false); }
    };
    const handleCopyColumnId = async (columnId: string) => {
        try {
            await navigator.clipboard.writeText(columnId);

            setCopiedId(columnId);

            setTimeout(() => {
                setCopiedId(null);
            }, 2000);
        } catch (error) {
            console.error(error);
        }
    };

    // ── Create Group ──────────────────────────────────────────────────────
    const openGroupModal = () => {
        setSelectedGroupColor(GROUP_COLOR_PALETTE[groups.length % GROUP_COLOR_PALETTE.length]);
        setShowGroupModal(true);
    };

    const createGroup = async () => {
        if (!groupName.trim()) return;
        try {
            setCreating(true);
            const res = await apiRequest(`/api/groups/${boardId}`, {
                method: "POST",
                body: JSON.stringify({ name: groupName, color: selectedGroupColor }),
            });
            if (res.ok) { setGroupName(""); setShowGroupModal(false); getGroups(); }
        } catch (e) { console.log(e); } finally { setCreating(false); }
    };

    // ── Delete Group ──────────────────────────────────────────────────────
    const deleteGroup = async (groupId: string) => {
        if (!confirm("Delete this group and all its items?")) return;
        try {
            setDeletingGroupId(groupId);
            const res = await apiRequest(`/api/groups/${groupId}`, { method: "DELETE" });
            if (res.ok) {
                setGroups((prev) => prev.filter((g) => g._id !== groupId));
                const groupItemIds = items.filter((i) => i.group === groupId).map((i) => i._id);
                setItems((prev) => prev.filter((i) => i.group !== groupId));
                setItemValues((prev) => prev.filter((v) => !groupItemIds.includes(v.item)));
            }
        } catch (e) { console.log(e); } finally { setDeletingGroupId(null); }
    };

    // ── Fetch Columns ─────────────────────────────────────────────────────
    const getColumns = async () => {
        try {
            const res = await apiRequest(`/api/columns/${boardId}`, { method: "GET" });
            const data = await res.json();
            if (res.ok) setColumns(data.columns || []);
        } catch (e) { console.log(e); }
    };

    // ── Create Column ─────────────────────────────────────────────────────
    const createColumn = async () => {
        if (!columnName.trim()) return;
        try {
            setCreatingColumn(true);
            const res = await apiRequest(`/api/columns/${boardId}`, {
                method: "POST",
                body: JSON.stringify({ name: columnName, type: columnType }),
            });
            if (res.ok) { setColumnName(""); setColumnType("text"); setShowColumnModal(false); getColumns(); }
        } catch (e) { console.log(e); } finally { setCreatingColumn(false); }
    };

    // ── Add custom status option ──────────────────────────────────────────
    const addStatusOption = async (column: any, option: { label: string; color: string }) => {
        const existing = column.statusOptions?.length ? column.statusOptions : DEFAULT_STATUS_OPTIONS;
        if (existing.some((o: any) => o.label === option.label)) return;
        const updated = [...existing, option];
        setColumns((prev) => prev.map((c) => (c._id === column._id ? { ...c, statusOptions: updated } : c)));
        try {
            await apiRequest(`/api/columns/${column._id}`, { method: "PUT", body: JSON.stringify({ statusOptions: updated }) });
        } catch (e) { console.log(e); }
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

    // ── Fetch Items ───────────────────────────────────────────────────────
    const getItems = async (groupId: string) => {
        try {
            const res = await apiRequest(`/api/items/${groupId}`, { method: "GET" });
            const data = await res.json();
            if (res.ok) {
                setItems((prev) => [...prev.filter((i) => i.group !== groupId), ...data.items]);
                for (const item of data.items) getItemValues(item._id);
            }
        } catch (e) { console.log(e); }
    };

    const getItemValues = async (itemId: string) => {
        try {
            const res = await apiRequest(`/api/item-values/${itemId}`, { method: "GET" });
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
                await apiRequest(`/api/item-values/${existingItemValue._id}`, { method: "PUT", body: JSON.stringify({ value }) });
            } else {
                const res = await apiRequest(`/api/item-values`, {
                    method: "POST",
                    body: JSON.stringify({ workspace: item.workspace, board: item.board, group: item.group, item: item._id, column: column._id, value }),
                });
                if (res.ok) {
                    const data = await res.json();
                    setItemValues((prev) => {
                        const filtered = prev.filter((v) => !(v.item === item._id && (v.column?._id || v.column) === column._id));
                        return [...filtered, data.itemValue];
                    });
                }
            }
        } catch (e) { console.log(e); }
    };

    // ── Create Item ───────────────────────────────────────────────────────
    const createItem = async () => {
        if (!itemName.trim()) return;
        try {
            setCreatingItem(true);
            const res = await apiRequest(`/api/items/${selectedGroup}`, {
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
            await Promise.all(ids.map((id) => apiRequest(`/api/items/${id}`, { method: "DELETE" }).catch(console.log)));
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
            apiRequest(`/api/groups/${g._id}`, { method: "PUT", body: JSON.stringify({ position: idx }) }).catch(console.log)
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
        await apiRequest(`/api/items/${itemId}`, { method: "PUT", body: JSON.stringify({ group: groupId, position }) }).catch(console.log);
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
        if (boardId) { getGroups(); getColumns(); }
    }, [boardId]);

    useEffect(() => {
        if (groups.length > 0) {
            groups.forEach((g) => getItems(g._id));
        }
    }, [groups.length]);

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#F8F9FA]">
            {/* Page header */}
            <div className="border-b border-black/20 px-8 py-3 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="w-8 h-8 flex items-center justify-center rounded bg-[#415A77] text-white transition text-black cursor-pointer hover:bg-[#586D88]"
                        title="Back"
                    >
                        <RiArrowLeftDoubleLine />
                    </button>
                    <div>
                        <h1 className="text-lg font-semibold text-black font-dmsans">Board</h1>
                        <p className="text-sm text-black font-dmsans">Manage groups &amp; items</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {selectedItemIds.size > 0 && (
                        <button
                            onClick={deleteSelectedItems}
                            disabled={deletingItems}
                            className="flex items-center gap-1 rounded bg-red-500 text-white px-4 py-2 cursor-pointer text-sm font-medium hover:bg-red-600 transition"
                        >
                            <span><RiDeleteBin7Fill /></span>
                            {deletingItems ? "Deleting…" : `${selectedItemIds.size}`}
                        </button>
                    )}
                    
                    <button
                        onClick={openGroupModal}
                        className="flex items-center gap-1.5 bg-[#415A77] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#586D88] transition cursor-pointer font-dmsans"
                    >
                        + Add Group
                    </button>
                </div>
            </div>

            {/* Board content */}
            <div className="px-8 py-6">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 rounded bg-white border border-slate-100 animate-pulse" />
                        ))}
                    </div>
                ) : groups.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-300 rounded p-16 text-center">
                        <div className="text-4xl mb-4 inline-block"><ImUngroup className="text-slate-400" /></div>
                        <h2 className="text-lg font-semibold text-slate-800 mb-1 font-dmsans">No groups</h2>
                        <p className="text-slate-400 mb-5 text-sm font-dmsans">Create your first group to start organizing work</p>
                        <button
                            onClick={openGroupModal}
                            className="bg-[#415A77] text-white px-6 py-2.5 rounded text-sm font-medium hover:bg-[#415A77]/80 transition cursor-pointer font-dmsans"
                        >
                            + Add Group
                        </button>
                    </div>
                ) : (
                    <div className="space-y-5">
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
                                        className="flex items-center gap-1 mb-0 px-3 py-2  select-none"
                                        style={{ backgroundColor: tint(color, 0.12), borderLeft: `3px solid ${color}` }}
                                    >
                                        {/* Drag handle */}
                                        <span className="text-slate-300 cursor-grab active:cursor-grabbing text-sm leading-none" title="Drag group"><RxDragHandleDots2 /></span>

                                        {/* Collapse toggle */}
                                        <button
                                            onClick={() => toggleCollapsed(group._id)}
                                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/5 transition flex-shrink-0 group"
                                        >
                                            <span
                                                className="text-slate-400 text-xs inline-block transition-transform duration-200 group-hover:cursor-pointer"
                                                style={{ transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
                                            >
                                                <TbArrowBadgeDown className="group-hover:text-slate-600 group-hover:border-slate-30 group-hover:cursor-pointer" />
                                            </span>
                                        </button>

                                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />

                                        <span className="text-sm font-semibold" style={{ color }}>
                                            {group.name}
                                        </span>

                                        <span className="text-xs text-slate-400 bg-white/70 px-2 py-0.5 rounded-full border border-slate-200 ml-1">
                                            {groupItems.length} {groupItems.length === 1 ? "item" : "items"}
                                        </span>

                                        <div className="ml-auto flex items-center gap-1">
                                            {/* Add item */}
                                            <button
                                                onClick={() => { setSelectedGroup(group._id); setShowItemModal(true); }}
                                                className="text-xs text-slate-400 px-2 py-1 rounded transition cursor-pointer hover:text-slate-600 hover:border-slate-300"
                                            >
                                                + Add Item
                                            </button>

                                            {/* Delete group */}
                                            <button
                                                onClick={() => deleteGroup(group._id)}
                                                disabled={deletingGroupId === group._id}
                                                className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition cursor-pointer"
                                                title="Delete group"
                                            >
                                                {deletingGroupId === group._id ? <HiOutlineDotsHorizontal className="" /> : <RiDeleteBin7Fill />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* ── Group table ─────────────────────────── */}
                                    {!isCollapsed && (
                                        <div
                                            className="overflow-x-auto  border border-slate-200 border-t-0 bg-white shadow-sm"
                                            onDragOver={(e) => { e.preventDefault(); setDragOverGroupId(group._id); }}
                                            onDrop={() => handleItemDropOnGroup(group._id)}
                                            style={{
                                                outline: dragOverGroupId === group._id ? `2px solid ${color}33` : "none",
                                                scrollbarWidth: "none",
                                            }}
                                        >
                                            {/* hide scrollbar for webkit */}
                                            <style>{`.no-sb::-webkit-scrollbar{display:none}`}</style>

                                            {/* Header row */}
                                            <div className="flex items-stretch border-b border-slate-100 bg-slate-50/60 min-w-max sticky top-0 z-10">
                                                {/* Checkbox */}
                                                <div className="w-10 shrink-0 border-r border-slate-100 flex items-center justify-center p-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={allSelected}
                                                        onChange={() => toggleSelectAllInGroup(group._id)}
                                                        className="w-3.5 h-3.5 accent-[#415A77] cursor-pointer"
                                                    />
                                                </div>

                                                {/* Item label — sticky */}
                                                <div
                                                    className="w-[280px] shrink-0 px-3 py-2.5 border-r border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center sticky left-10 bg-slate-50/95 z-10"
                                                    style={{ borderLeft: `3px solid ${color}` }}
                                                >
                                                    Item
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
                                                        className="w-[160px] shrink-0 px-3 py-2.5 border-r border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-slate-100/80 transition select-none"
                                                        title="Right-click to rename / delete"
                                                    >
                                                        {deletingColumnId === column._id ? (
                                                            <span className="text-red-300">…</span>
                                                        ) : column.name}
                                                    </div>
                                                ))}

                                                {/* Add column button at end */}
                                                <div className="w-[120px] shrink-0 px-3 py-2.5 flex items-center justify-center">
                                                    <button
                                                        onClick={() => setShowColumnModal(true)}
                                                        className="text-xs text-slate-400 hover:text-[#415A77] transition whitespace-nowrap cursor-pointer"
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
                                                    className={`flex items-center min-w-max border-b border-slate-100 group transition-colors ${selectedItemIds.has(item._id) ? "bg-slate-100/60" : "hover:bg-slate-50/70"}`}
                                                >
                                                    {/* Checkbox */}
                                                    <div className="w-10 shrink-0 border-r border-slate-100 flex items-center justify-center p-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedItemIds.has(item._id)}
                                                            onChange={() => toggleItemSelected(item._id)}
                                                            className="w-3.5 h-3.5 accent-[#415A77] cursor-pointer font-dmsans"
                                                        />
                                                    </div>

                                                    {/* Item name — sticky */}
                                                    <div
                                                        className={`w-[280px] shrink-0 px-3 py-2.5 border-r border-slate-100 font-medium text-sm text-slate-700 flex items-center gap-2 sticky left-10 z-10 ${selectedItemIds.has(item._id) ? "bg-slate-100/60" : "bg-white group-hover:bg-slate-50/70"}`}
                                                        style={{ borderLeft: `3px solid ${color}` }}
                                                    >
                                                        <span className="text-slate-200 text-xs cursor-grab active:cursor-grabbing">⠿</span>
                                                        <span className="truncate">{item.name}</span>
                                                    </div>

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
                                                                onSave={saveItemValue}
                                                                onAddStatusOption={addStatusOption}
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
                                                    className="text-sm text-slate-400 hover:text-[#415A77] transition py-2 px-1 cursor-pointer"
                                                >
                                                    + Add Item
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

            {/* ── Column context menu ────────────────────────────────────── */}
            {colMenu && (
                <div
                    className="fixed bg-white border border-slate-200 rounded  shadow-xl z-50 min-w-[180px]"
                    style={{ top: colMenu.y, left: colMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-4 py-2 text-xs text-slate-400 font-medium border-b border-slate-100 cursor-pointer">
                        {colMenu.columnName}
                    </div>
                    <button
                        onClick={() => handleCopyColumnId(colMenu.columnId)}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 cursor-pointer"
                    >
                        {copiedId === colMenu.columnId ? (
                            <RiCheckLine className="w-4 h-4 text-green-600" />
                        ) : (
                            <IoCopyOutline className="w-4 h-4" />
                        )}

                        {copiedId === colMenu.columnId ? "Copied" : "Copy Column ID"}
                    </button>
                    <button
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 cursor-pointer"
                        onClick={() => openRenameModal({ _id: colMenu.columnId, name: colMenu.columnName })}
                    >
                        <CgRename className="w-4 h-4" /> Rename column
                    </button>
                    <button
                        className="w-full text-left px-4 py-2 text-sm  text-red-600 hover:bg-red-50 transition flex items-center gap-2 cursor-pointer"
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
                        <div className="flex items-center gap-2 mb-4 p-3 bg-slate-50 rounded border border-slate-200">
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
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-5">
                    <div className="bg-white rounded p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-lg font-semibold text-[#172B4D] mb-4 font-dmsans">Create Group</h2>

                        <label className="text-xs font-medium text-slate-500 mb-1.5 block font-dmsans">
                            Group name
                        </label>
                        <input
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && createGroup()}
                            placeholder="e.g. In Progress"
                            autoFocus
                            className="w-full text-slate-800 border font-dmsans border-slate-200 rounded px-4 py-2.5 mb-4 text-sm outline-none focus:border-[#415A77] transition"
                        />

                        <label className="text-xs font-medium text-slate-500 mb-2 block font-dmsans">
                            Group color
                        </label>
                        <div className="flex items-center gap-2 flex-wrap mb-5">
                            {GROUP_COLOR_PALETTE.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setSelectedGroupColor(c)}
                                    className="w-6 h-6 rounded-full cursor-pointer transition"
                                    style={{
                                        backgroundColor: c,
                                        outline: selectedGroupColor === c ? "2px solid #172B4D" : "2px solid transparent",
                                        outlineOffset: "2px",
                                    }}
                                    aria-label={`Choose color ${c}`}
                                />
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={createGroup}
                                disabled={creating}
                                className="flex-1 bg-[#415A77] text-white py-2.5 rounded text-sm font-medium hover:bg-[#415A77]/80 transition cursor-pointer disabled:opacity-60"
                            >
                                {creating ? "Creating…" : "Create Group"}
                            </button>
                            <button onClick={() => setShowGroupModal(false)} className="flex-1 border border-slate-200 py-2.5 rounded text-sm text-slate-600 hover:bg-slate-50 transition cursor-pointer">
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
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-5">
                    <div className="bg-white rounded p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-lg font-semibold text-[#172B4D] mb-4 font-dmsans">Add Item</h2>

                        <label className="text-xs font-medium text-slate-500 mb-1.5 block font-dmsans">
                            Item name
                        </label>
                        <input
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && createItem()}
                            placeholder="Item name"
                            autoFocus
                            className="w-full text-slate-800 border font-dmsans border-slate-200 rounded px-4 py-2.5 mb-4 text-sm outline-none focus:border-[#415A77] transition"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={createItem}
                                disabled={creatingItem}
                                className="flex-1 bg-[#415A77] text-white py-2.5 rounded text-sm font-medium hover:bg-[#415A77]/80 transition cursor-pointer disabled:opacity-60 font-dmsans"
                            >
                                {creatingItem ? "Creating…" : "Add Item"}
                            </button>
                            <button onClick={() => setShowItemModal(false)} className="flex-1 border border-slate-200 py-2.5 rounded text-sm text-slate-600 hover:bg-slate-50 transition cursor-pointer font-dmsans">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}