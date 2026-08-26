"use client";
import { useEffect, useRef, useState } from "react";
import { HiOutlineXMark } from "react-icons/hi2";
import { HiOutlineChevronDown, HiOutlineChevronRight } from "react-icons/hi";
import { RiCheckLine } from "react-icons/ri";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { COLUMN_TYPE_OPTIONS } from "@/data/data";
import { useGetModulesQuery } from "@/store/api/modules.api";
import { useGetColumnsQuery, useGetSubColumnsQuery } from "@/store/api/columns.api";
import { useGetCollectionsQuery } from "@/store/api/collections.api";
import { useModuleRecords } from "@/store/useModuleData";
import type { Column } from "@/store/types";

interface StatusOption {
    label: string;
    color: string;
}

/** Which module to mirror, which of its two column sets, and which column. */
export interface ColumnSettings {
    targetModule?: string;
    /** Whether displayField names a record column or a sub-record one. */
    targetScope?: "record" | "subrecord";
    displayField?: string;
    aggregate?: string;
}

/**
 * How several linked records collapse into one cell. `list` is the honest
 * default — it shows what is actually there; the rest only make sense on a
 * numeric column, and say so.
 */
const AGGREGATES = [
    { value: "list", label: "Show each value" },
    { value: "count", label: "Count linked records" },
    { value: "sum", label: "Sum (numbers)" },
    { value: "avg", label: "Average (numbers)" },
    { value: "min", label: "Lowest (numbers)" },
    { value: "max", label: "Highest (numbers)" },
];

const FIELD_CLASS =
    "w-full rounded-xl border border-slate-300 bg-card px-3 py-2.5 font-dmsans text-sm text-slate-800 outline-none transition hover:border-slate-400 focus:border-[#FB923C] cursor-pointer";

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

    /**
     * Which grid the new column joins. The board's columns and the sub-record
     * columns are two separate sets on the same module, so the modal says which
     * one it is filling in. Independent of which set it MIRRORS — a sub-record
     * column can mirror record columns and the other way round.
     */
    scope?: "record" | "subrecord";

    /** Needed by the relation picker. */
    workspaceId: string;
    moduleId: string;
    settings: ColumnSettings;
    setSettings: (settings: ColumnSettings) => void;
}

/** The board's own icon for a column type, so the picker reads familiarly. */
const iconForType = (type?: string) =>
    COLUMN_TYPE_OPTIONS.find((option) => option.value === type)?.icon ??
    COLUMN_TYPE_OPTIONS[0].icon;

/** RecordValue.column arrives populated on some routes and as an id on others. */
const valueColumnId = (value: { column: unknown }) => {
    const column = value.column;
    return typeof column === "string"
        ? column
        : (column as { _id?: string } | null)?._id ?? "";
};

/**
 * What a column actually holds, shown beside the picker so the choice is made
 * on the values rather than on a name alone.
 *
 * Mounted ONLY while its row is the active one, so hovering is what pays for
 * the lookup and merely opening the picker costs nothing. A status or dropdown
 * column answers from its own configured labels and costs nothing at all.
 */
function ColumnPreview({
    column,
    targetModuleId,
    scope,
}: {
    column: Column | null;
    targetModuleId: string;
    scope: "record" | "subrecord";
}) {
    const configured =
        column?.statusOptions?.map((option) => option.label) ??
        column?.options ??
        [];

    /**
     * Only a record-scoped column can be previewed against real rows. Listing
     * every sub-record of every record on the far module would be one request
     * per row, and a hover must not cost that.
     */
    const canReadRows =
        Boolean(column) && scope === "record" && configured.length === 0;

    const { data: collections = [] } = useGetCollectionsQuery(targetModuleId, {
        skip: !targetModuleId || !canReadRows,
    });

    const { records, recordValues } = useModuleRecords(
        canReadRows ? collections.map((collection) => collection._id) : []
    );

    if (!column) {
        return (
            <p className="px-3 py-2 font-dmsans text-[11px] leading-relaxed text-slate-400">
                Hover a column to see what it holds.
            </p>
        );
    }

    if (configured.length > 0) {
        return (
            <div className="space-y-1.5 px-3 py-2">
                <p className="font-dmsans text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Its options
                </p>

                <div className="flex flex-wrap gap-1">
                    {configured.slice(0, 12).map((label) => (
                        <span
                            key={label}
                            className="rounded-md bg-slate-100 px-1.5 py-0.5 font-dmsans text-[11px] text-slate-600"
                        >
                            {label}
                        </span>
                    ))}
                </div>
            </div>
        );
    }

    if (scope === "subrecord") {
        return (
            <p className="px-3 py-2 font-dmsans text-[11px] leading-relaxed text-slate-500">
                Each linked record contributes one value per sub-record it has, so
                how many land in the cell depends on the row. The summary below
                decides how several collapse.
            </p>
        );
    }

    if (records.length === 0) {
        return (
            <p className="flex items-center gap-1.5 px-3 py-2 font-dmsans text-[11px] text-slate-400">
                <AiOutlineLoading3Quarters className="h-3 w-3 animate-spin" />
                Reading values…
            </p>
        );
    }

    const rows = records.slice(0, 8).map((record) => {
        const hit = recordValues.find(
            (value) =>
                value.record === record._id && valueColumnId(value) === column._id
        );
        return {
            id: record._id,
            name: record.name,
            value: String(hit?.value ?? ""),
        };
    });

    return (
        <div className="space-y-1 px-3 py-2">
            <p className="font-dmsans text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                What rows hold
            </p>

            {rows.map((row) => (
                <div key={row.id} className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-dmsans text-[11px] text-slate-400">
                        {row.name}
                    </span>
                    <span className="shrink-0 truncate font-dmsans text-[11px] font-medium text-slate-700">
                        {row.value || "—"}
                    </span>
                </div>
            ))}

            {records.length > rows.length && (
                <p className="pt-0.5 font-dmsans text-[10px] text-slate-400">
                    +{records.length - rows.length} more
                </p>
            )}
        </div>
    );
}

/**
 * The column picker: the columns on the left, what the highlighted one contains
 * on the right.
 *
 * The preview is a DOCKED pane rather than a nested popup on purpose — the list
 * scrolls, and a submenu positioned inside a scrolling box gets clipped by it.
 * Docking keeps the two side by side at any list length, and the chevron on
 * each row still says "there is more to see here".
 */
function MirrorColumnPicker({
    columns,
    value,
    onChange,
    targetModuleId,
    scope,
    loading,
}: {
    columns: Column[];
    value: string;
    onChange: (columnId: string) => void;
    targetModuleId: string;
    scope: "record" | "subrecord";
    loading: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    /**
     * "Record name" is the fallback for a record-scoped mirror. A sub-record one
     * has no equivalent — there is no single name to fall back to — which is why
     * it must name a column before the column can be created.
     */
    const allowRecordName = scope === "record";

    const selected = columns.find((column) => column._id === value) ?? null;
    const active = columns.find((column) => column._id === activeId) ?? null;

    const label = selected
        ? selected.name
        : allowRecordName
            ? "Record name"
            : "Select a column…";

    return (
        <div className="relative font-dmsans" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((previous) => !previous)}
                className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-card px-3 py-2.5 text-sm text-slate-800 transition cursor-pointer ${open ? "border-[#FB923C]" : "border-slate-300 hover:border-slate-400"}`}
            >
                <span className="truncate">{label}</span>
                <HiOutlineChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <div className="absolute left-0 right-0 top-full z-40 mt-1.5 flex overflow-hidden rounded-xl border border-slate-200 bg-card shadow-lg">

                    {/* Left — the columns themselves */}
                    <div className="max-h-64 w-1/2 shrink-0 overflow-y-auto border-r border-slate-200 py-1.5">
                        {loading && (
                            <p className="px-3 py-2 font-dmsans text-[11px] text-slate-400">
                                Loading columns…
                            </p>
                        )}

                        {!loading && allowRecordName && (
                            <button
                                type="button"
                                onMouseEnter={() => setActiveId(null)}
                                onClick={() => {
                                    onChange("");
                                    setOpen(false);
                                }}
                                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition cursor-pointer ${!value
                                    ? "bg-[#FB923C]/10 font-medium text-[#FB923C]"
                                    : "text-slate-700 hover:bg-slate-50"}`}
                            >
                                <span className="truncate">Record name</span>
                                {!value && <RiCheckLine className="ml-auto h-4 w-4 shrink-0" />}
                            </button>
                        )}

                        {!loading && columns.length === 0 && (
                            <p className="px-3 py-2 font-dmsans text-[11px] leading-relaxed text-slate-400">
                                {scope === "subrecord"
                                    ? "That module has no sub-record columns yet."
                                    : "That module has no columns yet."}
                            </p>
                        )}

                        {columns.map((column) => {
                            const Icon = iconForType(column.type);
                            const isSelected = column._id === value;
                            const isActive = column._id === activeId;

                            return (
                                <button
                                    key={column._id}
                                    type="button"
                                    onMouseEnter={() => setActiveId(column._id)}
                                    onFocus={() => setActiveId(column._id)}
                                    onClick={() => {
                                        onChange(column._id);
                                        setOpen(false);
                                    }}
                                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition cursor-pointer ${isSelected
                                        ? "bg-[#FB923C]/10 font-medium text-[#FB923C]"
                                        : isActive
                                            ? "bg-slate-50 text-slate-700"
                                            : "text-slate-700 hover:bg-slate-50"}`}
                                >
                                    <Icon
                                        className={`h-4 w-4 shrink-0 ${isSelected ? "text-[#FB923C]" : "text-slate-400"}`}
                                    />

                                    <span className="min-w-0 flex-1 truncate">{column.name}</span>

                                    {isSelected && <RiCheckLine className="h-4 w-4 shrink-0" />}

                                    <HiOutlineChevronRight
                                        className={`h-4 w-4 shrink-0 transition ${isSelected
                                            ? "text-[#FB923C]"
                                            : isActive
                                                ? "text-slate-500"
                                                : "text-slate-300"}`}
                                    />
                                </button>
                            );
                        })}
                    </div>

                    {/* Right — what the highlighted column holds */}
                    <div className="max-h-64 min-w-0 flex-1 overflow-y-auto bg-slate-50/60">
                        <ColumnPreview
                            column={active}
                            targetModuleId={targetModuleId}
                            scope={scope}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Setting up a relation column, in the order the questions actually depend on
 * each other: which module, which of its two column sets, which column, and
 * only then how several values collapse.
 *
 * The value itself is never copied — it is derived on read, so editing the
 * source updates every row that mirrors it.
 */
function ColumnConfig({
    columnType,
    workspaceId,
    moduleId,
    settings,
    setSettings,
}: {
    columnType: string;
    workspaceId: string;
    moduleId: string;
    settings: ColumnSettings;
    setSettings: (settings: ColumnSettings) => void;
}) {
    const isRelation = columnType === "relation";

    const { data: modules = [] } = useGetModulesQuery(workspaceId, {
        skip: !workspaceId || !isRelation,
    });

    const targetModuleId = settings.targetModule ?? "";
    const targetScope = settings.targetScope ?? "record";

    // Both sets have their own cache entry; only the one on screen is ever
    // subscribed, because the other is skipped.
    const { data: recordColumns = [], isFetching: loadingRecord } =
        useGetColumnsQuery(targetModuleId, {
            skip: !targetModuleId || targetScope !== "record",
        });

    const { data: subColumns = [], isFetching: loadingSub } =
        useGetSubColumnsQuery(targetModuleId, {
            skip: !targetModuleId || targetScope !== "subrecord",
        });

    if (!isRelation) return null;

    // A mirror may not travel another mirror — that is how a cycle starts.
    const columns = (targetScope === "subrecord" ? subColumns : recordColumns).filter(
        (column) => column.type !== "relation"
    );

    const SCOPES: { value: "record" | "subrecord"; label: string; hint: string }[] = [
        {
            value: "record",
            label: "Records",
            hint: "Mirrors the linked record's own value.",
        },
        {
            value: "subrecord",
            label: "Sub-records",
            hint: "Mirrors the values on that record's sub-records — usually several per link.",
        },
    ];

    const activeScope = SCOPES.find((option) => option.value === targetScope);

    return (
        <div className="mb-5 space-y-3.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <p className="font-dmsans text-xs text-slate-500">
                Mirror a column from another module. Each row picks a record there,
                and the value it holds shows against this one.
            </p>

            {/* 1 — which module */}
            <label className="block">
                <span className="mb-1.5 block font-dmsans text-xs font-medium text-slate-700">
                    Mirror from module
                </span>

                <select
                    value={targetModuleId}
                    onChange={(event) =>
                        setSettings({
                            ...settings,
                            targetModule: event.target.value,
                            // Both answers below belonged to the previous module.
                            targetScope: "record",
                            displayField: "",
                        })
                    }
                    className={FIELD_CLASS}
                >
                    <option value="">Select a module...</option>
                    {modules.map((moduleItem) => (
                        <option key={moduleItem._id} value={moduleItem._id}>
                            {moduleItem.name}
                            {moduleItem._id === moduleId ? " (this one)" : ""}
                        </option>
                    ))}
                </select>
            </label>

            {/* 2 — which of its two column sets */}
            {targetModuleId && (
                <div>
                    <span className="mb-1.5 block font-dmsans text-xs font-medium text-slate-700">
                        Mirror columns of
                    </span>

                    <div
                        role="radiogroup"
                        aria-label="Which columns to mirror"
                        className="flex gap-1.5 rounded-xl border border-slate-300 bg-card p-1"
                    >
                        {SCOPES.map((option) => {
                            const checked = option.value === targetScope;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={checked}
                                    onClick={() =>
                                        setSettings({
                                            ...settings,
                                            targetScope: option.value,
                                            // The two sets share no column ids.
                                            displayField: "",
                                        })
                                    }
                                    className={`flex-1 rounded-lg px-3 py-1.5 font-dmsans text-xs font-medium transition cursor-pointer ${checked
                                        ? "bg-[#FB923C] text-white"
                                        : "text-slate-600 hover:bg-slate-100"}`}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>

                    <span className="mt-1.5 block font-dmsans text-[11px] text-slate-400">
                        {activeScope?.hint}
                    </span>
                </div>
            )}

            {/* 3 — which column */}
            {targetModuleId && (
                <div>
                    <span className="mb-1.5 block font-dmsans text-xs font-medium text-slate-700">
                        Column to mirror
                    </span>

                    <MirrorColumnPicker
                        columns={columns}
                        value={settings.displayField ?? ""}
                        onChange={(columnId) =>
                            setSettings({ ...settings, displayField: columnId })
                        }
                        targetModuleId={targetModuleId}
                        scope={targetScope}
                        loading={targetScope === "subrecord" ? loadingSub : loadingRecord}
                    />

                    <span className="mt-1.5 block font-dmsans text-[11px] text-slate-400">
                        Edited on the record it comes from, never here — that is what
                        keeps it in step.
                    </span>
                </div>
            )}

            {/* 4 — how several collapse */}
            {targetModuleId &&
                (settings.displayField || targetScope === "subrecord") && (
                    <label className="block">
                        <span className="mb-1.5 block font-dmsans text-xs font-medium text-slate-700">
                            When a row picks several
                        </span>

                        <select
                            value={settings.aggregate ?? "list"}
                            onChange={(event) =>
                                setSettings({ ...settings, aggregate: event.target.value })
                            }
                            className={FIELD_CLASS}
                        >
                            {AGGREGATES.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
        </div>
    );
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
                className={`w-full flex items-center justify-between gap-2 border rounded-xl px-4 py-2.5 text-sm text-slate-800 transition cursor-pointer ${open
                    ? "border-[#FB923C]"
                    : "border-slate-300 hover:border-slate-400"
                    }`}
            >
                <span className="flex items-center gap-2">
                    <SelectedIcon className="w-4 h-4 text-slate-400" />
                    {selected.label}
                </span>
                <HiOutlineChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""
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
                                className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left transition cursor-pointer ${isSelected
                                    ? "bg-[#FB923C]/10 text-[#FB923C] font-medium"
                                    : "text-slate-700 hover:bg-slate-50"
                                    }`}
                            >
                                <Icon
                                    className={`w-4 h-4 ${isSelected ? "text-[#FB923C]" : "text-slate-400"
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
    scope,
    workspaceId,
    moduleId,
    settings,
    setSettings,
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

    const isRelation = columnType === "relation";

    /**
     * A relation with no module to mirror renders blank forever, so the button
     * waits for one.
     *
     * Which column it mirrors is optional for a RECORD-scoped mirror — the
     * record name is a sensible default — but required for a sub-record one,
     * which has no name to fall back to and would resolve to nothing.
     */
    const isConfigured = !isRelation
        ? true
        : Boolean(settings.targetModule) &&
        (settings.targetScope !== "subrecord" || Boolean(settings.displayField));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5 backdrop-blur-[2px]">
            {/* A relation asks four questions and previews values beside them, so
                it gets more room than a plain column does. */}
            <div
                className={`w-full rounded-2xl border border-slate-200 bg-card p-6 shadow-2xl ${isRelation ? "max-w-xl" : "max-w-md"}`}
            >
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h2 className="font-dmsans text-lg font-semibold text-slate-900">
                            {scope === "subrecord" ? "Add Sub-record Column" : "Add Column"}
                        </h2>

                        <p className="mt-1 font-dmsans text-xs text-slate-500">
                            {scope === "subrecord"
                                ? "Shown on every sub-record in this module — not on the records above them"
                                : "Add a new column to this module"}
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
                                !creatingColumn &&
                                isConfigured
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

                <ColumnConfig
                    columnType={columnType}
                    workspaceId={workspaceId}
                    moduleId={moduleId}
                    settings={settings}
                    setSettings={setSettings}
                />

                <div className="mt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={createColumn}
                        disabled={creatingColumn || !isConfigured}
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
