"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    LayoutGrid,
    ChevronDown,
    Lock,
    Globe,
    Check,
    Loader2,
} from "lucide-react";

import {
    useGetModuleAccessQuery,
    useSetModuleAccessMutation,
    type ModuleAccessRow,
} from "@/store/api/moduleAccess.api";

interface BoardAccessMenuProps {
    workspaceId: string;
    userId: string;
    /** Only an owner or admin of this workspace may open it. */
    disabled?: boolean;
    disabledReason?: string;
    onError: (message: string) => void;
}

const MENU_WIDTH = 300;

const messageFrom = (error: unknown): string => {
    const data = (error as { data?: { message?: string } })?.data;
    return data?.message || "Could not change module access. Please try again.";
};

/**
 * The modules one person can open, as a dropdown on their row.
 *
 * Nothing is fetched until the menu is first opened — a workspace with twenty
 * members would otherwise fire twenty requests to render a closed menu. After
 * that the subscription stays, so the trigger can show the live count.
 *
 * Each click saves immediately. The API takes the whole grant set, so the click
 * sends every currently-ticked module, which also carries across grants on rows
 * this menu does not expose.
 */
export default function BoardAccessMenu({
    workspaceId,
    userId,
    disabled,
    disabledReason,
    onError,
}: BoardAccessMenuProps) {
    const [open, setOpen] = useState(false);
    const [everOpened, setEverOpened] = useState(false);
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
    const [savingId, setSavingId] = useState<string | null>(null);

    const anchorRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const { data, isFetching } = useGetModuleAccessQuery(
        { workspaceId, userId },
        { skip: !everOpened || !workspaceId || !userId }
    );

    const [setModuleAccess] = useSetModuleAccessMutation();

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (anchorRef.current?.contains(target)) return;
            if (menuRef.current?.contains(target)) return;
            setOpen(false);
        };

        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKey);

        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const rows = data?.modules ?? [];

    const openCount = rows.filter((row) => row.canAccess).length;

    const toggleMenu = () => {
        if (disabled) return;

        if (!open && anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 6,
                left: Math.max(12, Math.min(rect.left, window.innerWidth - MENU_WIDTH - 12)),
            });
        }

        setEverOpened(true);
        setOpen((value) => !value);
    };

    const toggleBoard = async (row: ModuleAccessRow) => {
        if (row.openToRole) return;

        const next = rows
            .filter((item) =>
                item._id === row._id ? !item.granted : item.granted
            )
            .map((item) => item._id);

        setSavingId(row._id);

        try {
            await setModuleAccess({ workspaceId, userId, moduleIds: next }).unwrap();
        } catch (error) {
            onError(messageFrom(error));
        } finally {
            setSavingId(null);
        }
    };

    return (
        <>
            <button
                ref={anchorRef}
                type="button"
                onClick={toggleMenu}
                disabled={disabled}
                title={disabled ? disabledReason : "Choose which modules they can open"}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-card px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            >
                <LayoutGrid className="h-3.5 w-3.5" />

                <span>
                    {data ? `${openCount} of ${rows.length} modules` : "Module access"}
                </span>

                <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 transition ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open &&
                position &&
                typeof document !== "undefined" &&
                createPortal(
                    <div
                        ref={menuRef}
                        style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
                        className="fixed z-20 overflow-hidden rounded-xl border border-gray-200 bg-card shadow-lg font-dmsans"
                    >
                        <div className="border-b border-slate-200 px-3 py-2">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                Modules in this workspace
                            </p>
                        </div>

                        <div className="max-h-72 overflow-y-auto py-1">
                            {isFetching && rows.length === 0 ? (
                                <p className="px-3 py-6 text-center text-xs text-muted">
                                    Loading modules…
                                </p>
                            ) : rows.length === 0 ? (
                                <p className="px-3 py-6 text-center text-xs text-muted">
                                    This workspace has no modules yet.
                                </p>
                            ) : (
                                rows.map((row) => {
                                    const locked = row.openToRole;
                                    const checked = row.canAccess;
                                    const saving = savingId === row._id;

                                    return (
                                        <button
                                            key={row._id}
                                            type="button"
                                            onClick={() => toggleBoard(row)}
                                            disabled={locked || saving}
                                            title={
                                                locked
                                                    ? "Shared with the whole workspace — make the module private to restrict it"
                                                    : undefined
                                            }
                                            className={`flex w-full items-start gap-2.5 px-3 py-2 text-left transition ${locked
                                                ? "cursor-default opacity-70"
                                                : "hover:bg-gray-200/40 cursor-pointer"
                                                }`}
                                        >
                                            <span
                                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${checked
                                                    ? "border-accent bg-accent text-white"
                                                    : "border-slate-300 bg-card"
                                                    }`}
                                            >
                                                {saving ? (
                                                    <Loader2 className="h-2.5 w-2.5 animate-spin text-slate-500" />
                                                ) : checked ? (
                                                    <Check className="h-3 w-3" strokeWidth={3} />
                                                ) : null}
                                            </span>

                                            <span className="min-w-0 flex-1">
                                                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-800">
                                                    <LayoutGrid
                                                        className="h-3 w-3 shrink-0 text-slate-400"
                                                        aria-hidden
                                                    />
                                                    <span className="truncate">{row.name}</span>
                                                </span>

                                                <span className="mt-0.5 flex items-center gap-1 text-[10px] text-muted">
                                                    {row.visibility === "private" ? (
                                                        <>
                                                            <Lock className="h-2.5 w-2.5" />
                                                            Private
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Globe className="h-2.5 w-2.5" />
                                                            {locked ? "Open to all members" : "Shared"}
                                                        </>
                                                    )}
                                                </span>
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {rows.some((row) => row.openToRole) && (
                            <p className="border-t border-slate-200 px-3 py-2 text-[10px] leading-relaxed text-muted">
                                Modules shared with the workspace cannot be restricted per
                                person — set the module to private first.
                            </p>
                        )}
                    </div>,
                    document.body
                )}
        </>
    );
}
