"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { apiRequest } from "@/lib/api";
import { useWorkspace } from "@/context/WorkspaceContext";
import { getUser, logout, AuthUser } from "@/lib/auth";
import { RiAddLine, RiHome9Fill } from "react-icons/ri";
import {
    HiOutlineRectangleGroup,
    HiOutlineSquares2X2,
    HiOutlineChevronUpDown,
    HiOutlineArrowRightOnRectangle,
    HiOutlineXMark,
    HiOutlineExclamationTriangle,
    HiOutlineChevronDown,
} from "react-icons/hi2";
import { BsCheck, BsClipboardPulse, BsPersonWorkspace } from "react-icons/bs";
import { MdWorkspacesOutline } from "react-icons/md";
import { TbClipboardFilled, TbDoorExit } from "react-icons/tb";

interface Workspace {
    _id: string;
    name: string;
}

interface Board {
    _id: string;
    name: string;
}

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();

    const { workspaceId, setWorkspaceId } = useWorkspace();

    const [user, setUser] = useState<AuthUser | null>(null);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [boards, setBoards] = useState<Board[]>([]);
    const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
    const [loadingBoards, setLoadingBoards] = useState(false);
    // New UI state for create workspace modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    const [open, setOpen] = useState(false);

    const isAuthPage = pathname ? pathname.startsWith("/login") || pathname.startsWith("/register") : false;
    const isHomePage = pathname === "/";

    useEffect(() => {
        if (typeof window !== "undefined") {
            setUser(getUser());
        }
    }, []);

    useEffect(() => {
        if (!isAuthPage) {
            loadWorkspaces();
        }
    }, [pathname]);

    useEffect(() => {
        if (!isAuthPage && workspaceId) {
            loadBoards(workspaceId);
        } else {
            setBoards([]);
        }
    }, [workspaceId, pathname]);

    async function loadWorkspaces() {
        try {
            setLoadingWorkspaces(true);

            const response = await apiRequest("/api/workspaces", { method: "GET" });
            const data = await response.json();

            if (response.ok && data.workspaces) {
                const list = data.workspaces.map((item: any) => item.workspace).filter(Boolean);
                setWorkspaces(list);

                if (list.length > 0) {
                    const exists = list.some((w: Workspace) => w._id === workspaceId);
                    if (!workspaceId || !exists) {
                        setWorkspaceId(list[0]._id);
                    }
                }
            } else {
                setWorkspaces([]);
            }
        } catch (err) {
            console.log("Error loading workspaces:", err);
            setWorkspaces([]);
        } finally {
            setLoadingWorkspaces(false);
        }
    }

    async function loadBoards(id: string) {
        try {
            setLoadingBoards(true);

            const response = await apiRequest(`/api/boards/${id}`, { method: "GET" });
            const data = await response.json();

            if (response.ok && data.boards) {
                const list: Board[] = data.boards
                    .map((b: any) => {
                        if (!b) return null;
                        const _id = b._id || b.id;
                        const name = b.name || "Untitled Board";
                        return _id ? { _id: String(_id), name: String(name) } : null;
                    })
                    .filter(Boolean);

                setBoards(list);
            } else {
                setBoards([]);
            }
        } catch (err) {
            console.log("Error loading boards:", err);
            setBoards([]);
        } finally {
            setLoadingBoards(false);
        }
    }

    const handleWorkspaceChange = (newId: string) => {
        setWorkspaceId(newId);
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
            setCreating(true);
            setCreateError("");
            const response = await apiRequest("/api/workspaces", {
                method: "POST",
                body: JSON.stringify({ name: newWorkspaceName }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Failed to create workspace");
            }
            // Refresh workspace list
            await loadWorkspaces();
            setShowCreateModal(false);
            setNewWorkspaceName("");
        } catch (err: any) {
            setCreateError(err.message || "An error occurred");
        } finally {
            setCreating(false);
        }
    }

    if (isAuthPage || isHomePage) {
        return null;
    }

    return (
        <aside className="w-72 h-screen border-r border-slate-200 bg-[#0D1B2A] flex flex-col flex-shrink-0 sticky top-0">
            <div className="p-5 border-b border-slate-600">
                <div
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-2 mb-5 cursor-pointer group"
                >

                    <h2 className="font-semibold text-white transition-colors font-jost tracking-wider pb-2">
                        CRM
                    </h2>
                </div>

                <label className="block text-sm font-semibold  tracking-wider mb-2 font-dmsans flex items-center gap-2">
                    <RiHome9Fill className="h-4 w-4" />
                    Workspaces
                </label>

                {loadingWorkspaces ? (
                    <div className="h-9 rounded bg-slate-600 animate-pulse" />
                ) : workspaces.length === 0 ? (
                    <div className="text-sm text-slate-400 py-2 font-dmsans">No workspaces found</div>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <div className="relative flex-1">
                            <button
                                onClick={() => setOpen(!open)}
                                className="w-full flex items-center justify-between rounded border border-slate-600 text-white  px-4 py-2 transition cursor-pointer"
                            >
                                <span className="text-sm font-dmsans">
                                    {workspaces.find(w => w._id === workspaceId)?.name || "Select Workspace"}
                                </span>

                                <HiOutlineChevronDown
                                    className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""
                                        }`}
                                />
                            </button>

                            {open && (
                                <div className="absolute left-0 mt-1 w-full rounded bg-[#0D1B2A] border border-slate-800 shadow-lg z-50 overflow-hidden">
                                    {workspaces.map((workspace) => (
                                        <button
                                            key={workspace._id}
                                            onClick={() => {
                                                handleWorkspaceChange(workspace._id);
                                                setOpen(false);
                                            }}
                                            className={`w-full px-4 py-3 text-left text-sm  transition cursor-pointer ${workspace._id === workspaceId
                                                ? "text-white font-dmsans font-bold "
                                                : "text-white/70 font-dmsans "
                                                }`}
                                        >
                                            {workspace.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center justify-center w-9 h-9 rounded border border-slate-600  text-white transition cursor-pointer"
                            title="New Workspace"
                        >
                            <RiAddLine className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            <div className="px-3 pb-3 pt-4 flex-1 overflow-y-auto">
                <div className="flex items-center gap-1.5 px-3 mb-2">
                    <TbClipboardFilled className="w-4 h-4" />
                    <h3 className="text-md tracking-wider font-dmsans font-semibold">
                        Boards
                    </h3>
                </div>

                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-90 px-5">
                        <div className="bg-white rounded shadow-lg w-full max-w-sm p-6 border border-slate-200">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-semibold text-[#172B4D]">
                                    Create New Workspace
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setCreateError("");
                                        setNewWorkspaceName("");
                                    }}
                                    className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                                    aria-label="Close"
                                >
                                    <HiOutlineXMark className="w-5 h-5" />
                                </button>
                            </div>

                            {createError && (
                                <div className="flex items-start gap-2 bg-red-50 text-red-600 text-sm p-3 rounded mb-3">
                                    <HiOutlineExclamationTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                    {createError}
                                </div>
                            )}

                            <input
                                type="text"
                                value={newWorkspaceName}
                                onChange={(e) => setNewWorkspaceName(e.target.value)}
                                placeholder="Workspace name"
                                autoFocus
                                className="w-full border border-slate-200 rounded px-3 py-2.5 text-sm text-slate-800 mb-4 outline-none focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15 transition"
                            />

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setCreateError("");
                                        setNewWorkspaceName("");
                                    }}
                                    className="px-4 py-2 text-sm font-medium bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateWorkspace}
                                    disabled={creating}
                                    className="px-4 py-2 text-sm font-medium bg-[#6C5CE7] text-white rounded hover:bg-[#5b4bd6] disabled:opacity-50 transition cursor-pointer"
                                >
                                    {creating ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {loadingBoards ? (
                    <div className="space-y-1.5 px-1">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-8 rounded bg-slate-600 animate-pulse" />
                        ))}
                    </div>
                ) : boards.length === 0 ? (
                    <div className="text-sm text-slate-400 py-2 px-3 font-dmsans">No boards available</div>
                ) : (
                    <div className="space-y-0.5">
                        {boards.map((board) => {
                            const active = pathname.includes(`/board/${board._id}`);

                            return (
                                <button
                                    key={board._id}
                                    onClick={() =>
                                        router.push(`/workspace/${workspaceId}/board/${board._id}`)
                                    }
                                    className={`flex items-center gap-2 w-full rounded px-3 py-2 text-sm transition-colors cursor-pointer ${active
                                        ? "text-white font-bold"
                                        : "text-white/40 hover:bg-slate-600"
                                        }`}
                                >
                                    <span className="w-4 flex justify-center">
                                        {active && <BsCheck className="w-4 h-4 " />}
                                    </span>

                                    <span className="truncate">{board.name}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {user && (
                <div className="p-4 border-t border-slate-600 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#415A77] text-white flex font-dmsans items-center justify-center font-semibold text-sm flex-shrink-0">
                            {user.firstName ? user.firstName[0].toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white truncate font-dmsans">
                                {user.firstName}
                            </p>
                            <p className="text-xs text-white/70 truncate font-dmsans">
                                {user.email}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        title="Logout"
                        className="p-1.5 text-slate-400 hover:white hover:bg-slate-800 rounded cursor-pointer transition-colors flex-shrink-0"
                    >
                        <TbDoorExit className="w-4.5 h-4.5" />
                    </button>
                </div>
            )}
        </aside>
    );
}