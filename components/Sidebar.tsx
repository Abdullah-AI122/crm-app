"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getUser, logout, AuthUser } from "@/lib/auth";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActiveWorkspaceId } from "@/store/slices/ui.slice";
import { selectActiveWorkspaceId } from "@/store/selectors/workspace.selectors";
import {
    useGetWorkspacesQuery,
    useCreateWorkspaceMutation
} from "@/store/api/workspaces.api";
import { useGetModulesQuery } from "@/store/api/modules.api";
import { RiAddLine } from "react-icons/ri";
import {
    HiOutlineXMark,
    HiOutlineExclamationTriangle,
    HiOutlineSquares2X2,
    HiOutlineBuildingOffice2,
    HiOutlineChevronRight,
    HiOutlineArrowRightOnRectangle
} from "react-icons/hi2";
import { BsCheck2 } from "react-icons/bs";
import { TbCards } from "react-icons/tb";
import logo from "@/app/assets/Logo.png";
import { PALETTE } from "@/data/data";
import type { Workspace } from "@/store/types";

/** Stable per-entity tint pair, hashed from the id (LAYOUT.md §4.5). */
function colorFor(id: string): { bg: string; accent: string } {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initialsOf(value: string): string {
    return (value || "?").trim().charAt(0).toUpperCase();
}

/** Collapsible section header: coloured icon chip, label, count, optional action. */
function SectionHeader({
    icon,
    tint,
    label,
    count,
    open,
    onToggle,
    action
}: {
    icon: React.ReactNode;
    tint: string;
    label: string;
    count?: number;
    open: boolean;
    onToggle: () => void;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-2 pr-1">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                className="group flex flex-1 items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-gray-200/40 cursor-pointer"
            >
                <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white"
                    style={{ backgroundColor: tint }}
                >
                    {icon}
                </span>

                <span className="text-sm font-bold font-google-sans text-slate-800">
                    {label}
                </span>

                {typeof count === "number" && (
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                        {count}
                    </span>
                )}

                <HiOutlineChevronRight
                    className={`ml-auto h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${open ? "rotate-90" : ""
                        }`}
                />
            </button>

            {action}
        </div>
    );
}

function RowSkeleton({ rows = 3 }: { rows?: number }) {
    return (
        <div className="space-y-1.5 px-2 py-1">
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="h-8 rounded-lg bg-gray-200/70 animate-pulse"
                    style={{ width: `${72 + ((i * 13) % 28)}%`, animationDelay: `${i * 80}ms` }}
                />
            ))}
        </div>
    );
}

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();

    const dispatch = useAppDispatch();
    const workspaceId = useAppSelector(selectActiveWorkspaceId);

    const [user, setUser] = useState<AuthUser | null>(null);

    // Cached and shared: navigating between routes no longer refetches either list.
    const { data: workspaces = [], isLoading: loadingWorkspaces } = useGetWorkspacesQuery();
    const { data: modules = [], isLoading: loadingModules } = useGetModulesQuery(
        workspaceId,
        { skip: !workspaceId }
    );

    const [createWorkspaceMutation, { isLoading: creating }] = useCreateWorkspaceMutation();

    // New UI state for create workspace modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState("");
    const [createError, setCreateError] = useState("");

    const [openModule, setOpenModule] = useState(true);

    const [open, setOpen] = useState(true);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setUser(getUser());
        }
    }, []);

    // Pick a default workspace once the list arrives (or when the saved one disappears).
    useEffect(() => {
        if (workspaces.length === 0) return;
        const stillExists = workspaces.some((w: Workspace) => w._id === workspaceId);
        if (!workspaceId || !stillExists) {
            dispatch(setActiveWorkspaceId(workspaces[0]._id));
        }
    }, [workspaces, workspaceId, dispatch]);

    const handleWorkspaceChange = (newId: string) => {
        dispatch(setActiveWorkspaceId(newId));
        if (newId) {
            router.push(`/workspace/${newId}`);
        }
    };

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    // Create new workspace
    async function handleCreateWorkspace() {
        if (!newWorkspaceName.trim()) {
            setCreateError("Workspace name cannot be empty");
            return;
        }
        try {
            setCreateError("");
            // Invalidating Workspace:LIST refreshes this list and the dashboard at once.
            await createWorkspaceMutation({ name: newWorkspaceName }).unwrap();
            setShowCreateModal(false);
            setNewWorkspaceName("");
        } catch {
            setCreateError("Failed to create workspace");
        }
    }

    const closeCreateModal = () => {
        setShowCreateModal(false);
        setCreateError("");
        setNewWorkspaceName("");
    };

    const isAppsActive = pathname.startsWith("/Apps");

    return (
        <aside className="w-82 h-screen bg-card border-r border-slate-200 flex flex-col flex-shrink-0 sticky top-0">
            {/* ── Brand ─────────────────────────────────────────────── */}
            <div className="px-5 pt-5 pb-4">
                <button
                    type="button"
                    onClick={() => router.push("/Home")}
                    className="group flex w-full items-center gap-3 rounded-xl p-1 text-left transition hover:bg-gray-200/40 cursor-pointer"
                >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-card shadow-sm transition group-hover:shadow-md">
                        <Image src={logo} alt="Logo" priority className="h-8 w-8 object-contain" />
                    </span>

                    <span className="min-w-0">
                        <span className="flex items-center gap-1 text-lg font-bold font-google-sans text-slate-900 leading-tight">
                            Collaborate
                            <span className="bg-gradient-to-r from-[#6C5CE7] via-[#00CEC9] to-accent bg-clip-text text-xl font-extrabold text-transparent">
                                X
                            </span>
                        </span>
                        <span className="block truncate text-[11px] font-medium text-slate-400 font-google-sans">
                            Modern CRM for agile teams
                        </span>
                    </span>
                </button>
            </div>

            {/* ── Navigation ────────────────────────────────────────── */}
            <nav className="flex-1 overflow-y-auto px-3 pb-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                {/* Apps */}
                <Link
                    href="/Apps"
                    className={`flex items-center gap-2.5 rounded-lg px-2 py-2 transition cursor-pointer ${isAppsActive ? "bg-[#6C5CE7]/10" : "hover:bg-gray-200/40"
                        }`}
                >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#6C5CE7] text-white">
                        <HiOutlineSquares2X2 className="h-4 w-4" />
                    </span>
                    <span
                        className={`text-sm font-bold font-google-sans ${isAppsActive ? "text-[#6C5CE7]" : "text-slate-800"
                            }`}
                    >
                        Apps
                    </span>
                </Link>

                {/* Workspaces */}
                <div className="mt-1">
                    <SectionHeader
                        icon={<HiOutlineBuildingOffice2 className="h-4 w-4" />}
                        tint="var(--accent)"
                        label="Workspaces"
                        count={workspaces.length}
                        open={open}
                        onToggle={() => setOpen(!open)}
                        action={
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(true)}
                                aria-label="Create workspace"
                                title="Create workspace"
                                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-gray-300/50 hover:text-slate-800 cursor-pointer"
                            >
                                <RiAddLine className="h-4 w-4" />
                            </button>
                        }
                    />

                    {open && (
                        <div className="mt-0.5 space-y-0.5 pl-3">
                            {loadingWorkspaces ? (
                                <RowSkeleton rows={3} />
                            ) : workspaces.length === 0 ? (
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(true)}
                                    className="flex w-full items-center gap-2 rounded-lg border border-dashed border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-400 transition hover:border-accent/40 hover:text-accent cursor-pointer font-google-sans"
                                >
                                    <RiAddLine className="h-4 w-4" />
                                    Create your first workspace
                                </button>
                            ) : (
                                workspaces.map((workspace: Workspace) => {
                                    const active = workspace._id === workspaceId;
                                    const accent = colorFor(workspace._id);

                                    return (
                                        <button
                                            key={workspace._id}
                                            onClick={() => handleWorkspaceChange(workspace._id)}
                                            title={workspace.name}
                                            className={`group relative flex w-full items-center gap-2.5 rounded-lg py-1.5 pl-3 pr-2 transition cursor-pointer ${active ? "bg-accent/10" : "hover:bg-gray-200/40"
                                                }`}
                                        >
                                            {active && (
                                                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-accent" />
                                            )}

                                            <span
                                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold"
                                                style={{
                                                    backgroundColor: accent.bg,
                                                    color: accent.accent
                                                }}
                                            >
                                                {initialsOf(workspace.name)}
                                            </span>

                                            <span
                                                className={`truncate text-sm font-google-sans ${active
                                                    ? "font-bold text-slate-900"
                                                    : "font-medium text-slate-500 group-hover:text-slate-800"
                                                    }`}
                                            >
                                                {workspace.name}
                                            </span>

                                            <span
                                                className={`ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${active
                                                    ? "bg-accent/15 text-accent"
                                                    : "bg-slate-100 text-slate-400"
                                                    }`}
                                            >
                                                {workspace.totalModules ?? 0}
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>

                {/* Modules */}
                <div className="mt-3 border-t border-slate-100 pt-3">
                    <SectionHeader
                        icon={<TbCards className="h-4 w-4" />}
                        tint="#00B894"
                        label="Modules"
                        count={modules.length}
                        open={openModule}
                        onToggle={() => setOpenModule(!openModule)}
                    />

                    {openModule && (
                        <div className="mt-0.5 space-y-0.5 pl-3">
                            {loadingModules ? (
                                <RowSkeleton rows={4} />
                            ) : modules.length === 0 ? (
                                <p className="px-3 py-2.5 text-xs font-medium text-slate-400 font-google-sans">
                                    No modules in this workspace yet
                                </p>
                            ) : (
                                modules.map((moduleItem) => {
                                    const active = pathname.includes(`/module/${moduleItem._id}`);

                                    return (
                                        <button
                                            key={moduleItem._id}
                                            onClick={() =>
                                                router.push(
                                                    `/workspace/${workspaceId}/module/${moduleItem._id}`
                                                )
                                            }
                                            title={moduleItem.name}
                                            className={`group relative flex w-full items-center gap-2.5 rounded-lg py-2 pl-3 pr-2 transition cursor-pointer ${active ? "bg-[#00B894]/10" : "hover:bg-gray-200/40"
                                                }`}
                                        >
                                            {active && (
                                                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-[#00B894]" />
                                            )}

                                            <span
                                                className={`h-1.5 w-1.5 shrink-0 rounded-full transition ${active
                                                    ? "bg-[#00B894]"
                                                    : "bg-slate-300 group-hover:bg-slate-400"
                                                    }`}
                                            />

                                            <span
                                                className={`truncate text-sm font-google-sans ${active
                                                    ? "font-bold text-slate-900"
                                                    : "font-medium text-slate-500 group-hover:text-slate-800"
                                                    }`}
                                            >
                                                {moduleItem.name}
                                            </span>

                                            {active && (
                                                <BsCheck2 className="ml-auto h-4 w-4 shrink-0 text-[#00B894]" />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </nav>

            {/* ── User ──────────────────────────────────────────────── */}
            <div className="border-t border-slate-200 p-3">
                <div className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition hover:bg-gray-200/40">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6C5CE7] text-sm font-bold text-white">
                        {initialsOf(user?.firstName || user?.email || "U")}
                    </span>

                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-slate-800 font-google-sans">
                            {user?.firstName || "Signed in"}
                        </span>
                        <span className="block truncate text-[11px] font-medium text-slate-400">
                            {user?.email || "—"}
                        </span>
                    </span>

                    <button
                        type="button"
                        onClick={handleLogout}
                        aria-label="Log out"
                        title="Log out"
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-accent/10 hover:text-accent cursor-pointer"
                    >
                        <HiOutlineArrowRightOnRectangle className="h-4.5 w-4.5" />
                    </button>
                </div>
            </div>

            {/* ── Create workspace modal ────────────────────────────── */}
            {showCreateModal && createPortal(
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
                    onClick={closeCreateModal}
                >
                    <div
                        className="w-full max-w-md rounded-2xl border border-slate-200 bg-card p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="mb-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                                    <HiOutlineBuildingOffice2 className="h-5 w-5" />
                                </span>
                                <div>
                                    <h2 className="text-lg font-bold leading-snug text-slate-900 font-google-sans">
                                        Create Workspace
                                    </h2>
                                    <p className="mt-0.5 text-xs font-medium text-zinc-500">
                                        Set up a new space to organize modules and team projects.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={closeCreateModal}
                                className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-slate-100 hover:text-zinc-600 cursor-pointer"
                                aria-label="Close"
                            >
                                <HiOutlineXMark className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Error Banner */}
                        {createError && (
                            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50/80 p-3 text-xs font-medium text-red-600">
                                <HiOutlineExclamationTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                                <span>{createError}</span>
                            </div>
                        )}

                        {/* Input Field */}
                        <div className="mb-6">
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                Workspace Name
                            </label>
                            <input
                                type="text"
                                value={newWorkspaceName}
                                onChange={(e) => setNewWorkspaceName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleCreateWorkspace();
                                    if (e.key === "Escape") closeCreateModal();
                                }}
                                placeholder="e.g. Sales & Marketing"
                                autoFocus
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition placeholder:text-zinc-400 focus:border-[#6C5CE7] focus:bg-card focus:ring-4 focus:ring-[#6C5CE7]/10"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-2.5">
                            <button
                                onClick={closeCreateModal}
                                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-slate-200/70 hover:text-slate-900 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateWorkspace}
                                disabled={creating || !newWorkspaceName.trim()}
                                className="rounded-xl bg-[#6C5CE7] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[#6C5CE7]/20 transition hover:bg-[#5b4cc4] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                            >
                                {creating ? "Creating..." : "Create Workspace"}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </aside>
    );
}
