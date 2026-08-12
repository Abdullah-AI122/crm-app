"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useWorkspace } from "@/context/WorkspaceContext";
import { getUser, logout, AuthUser } from "@/lib/auth";
import { RiAddLine } from "react-icons/ri";
import {
    HiOutlineXMark, HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import { BsCheck } from "react-icons/bs";
import { TbCards } from "react-icons/tb";
import Image from "next/image";
import logo from "@/app/assets/Logo.png";
import { FaChevronDown } from "react-icons/fa";


import { Blocks, Building2 } from "lucide-react";
import Link from "next/link";
interface Workspace {
    _id: string;
    name: string;
    totalModules?: number;
}
interface Module {
    _id: string;
    name: string;
}

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();

    const { workspaceId, setWorkspaceId } = useWorkspace();

    const [user, setUser] = useState<AuthUser | null>(null);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
    const [loadingModules, setLoadingModules] = useState(false);
    // New UI state for create workspace modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    const [openModule, setOpenModule] = useState(true);

    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setUser(getUser());
        }
    }, []);

    useEffect(() => {
        loadWorkspaces();
    }, [pathname]);

    useEffect(() => {
        if (workspaceId) {
            loadModules(workspaceId);
        } else {
            setModules([]);
        }
    }, [workspaceId, pathname]);

    async function loadWorkspaces() {
        try {
            setLoadingWorkspaces(true);

            const response = await apiRequest("/api/workspaces", { method: "GET" });
            const data = await response.json();

            if (response.ok && data.workspaces) {
                const list = data.workspaces
                    .map((item: any) => item.workspace)
                    .filter(Boolean)
                    .map((ws: any) => ({
                        _id: ws._id,
                        name: ws.name,
                        totalModules: ws.totalModules ?? 0,
                    }));
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

    async function loadModules(id: string) {
        try {
            setLoadingModules(true);

            const response = await apiRequest(`/api/modules/${id}`, { method: "GET" });
            const data = await response.json();

            if (response.ok && data.modules) {
                const list: Module[] = data.modules
                    .map((m: any) => {
                        if (!m) return null;
                        const _id = m._id || m.id;
                        const name = m.name || "Untitled Module";
                        return _id ? { _id: String(_id), name: String(name) } : null;
                    })
                    .filter(Boolean);

                setModules(list);
            } else {
                setModules([]);
            }
        } catch (err) {
            console.log("Error loading modules:", err);
            setModules([]);
        } finally {
            setLoadingModules(false);
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


    return (
        <aside className="w-82 h-screen bg-white flex flex-col flex-shrink-0 sticky top-0 ">
            <div className="px-5 pt-5 pb-2">
                <div
                    onClick={() => router.push("/Home")}
                    className="flex items-center gap-2 mb-4 cursor-pointer group"
                >
                    <div className="flex gap-4 items-center">
                        <div className="bg-white shadow-sm border border-zinc-300 p-2 rounded-xl w-15 h-15 flex justify-center items-center">
                            <Image src={logo} alt="Logo" priority />
                        </div>
                        <div>
                            <p className="text-[#000000] text-lg font-bold font-google-sans flex items-center gap-1">
                                Collaborate
                                <span className="bg-gradient-to-r from-[#6C5CE7] via-[#00CEC9] to-[#FF7675] bg-clip-text text-transparent font-extrabold text-xl">
                                    X
                                </span>
                            </p>
                            <p className="text-xs font-google-sans">
                                Modern CRM For Agile Teams
                            </p>
                        </div>
                    </div>

                </div>
                <div className="flex items-center justify-between py-2">
                    <Link href="/Apps"
                        className="flex items-center gap-2 cursor-pointer"
                    >
                        <div className="p-1 bg-[#6C5CE7] rounded-md">
                            <Blocks size={22} className="text-white" />
                        </div>

                        <span className="text-sm font-bold text-black font-google-sans text-zinc-800">
                            Apps
                        </span>
                    </Link>

                </div>
                <label className="flex items-center justify-between">
                    <button
                        onClick={() => setOpen(!open)}
                        className="flex items-center gap-2 cursor-pointer"
                    >
                        <div className="p-1 bg-[#FF7675] rounded-md">
                            <Building2 size={22} className="text-white" />
                        </div>

                        <span className="text-sm font-bold text-black font-google-sans text-zinc-800">
                            WorkSpaces
                        </span>

                        <FaChevronDown
                            className={`w-3 h-3 text-black transition-transform ${open ? "rotate-180" : ""
                                }`}
                        />
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        className="p-0.5 rounded-sm hover:bg-zinc-100 transition cursor-pointer"
                    >
                        <RiAddLine size={20} />
                    </button>
                </label>

                {loadingWorkspaces ? (
                    <div className="h-9 rounded bg-white/10 shimmer" />
                ) : workspaces.length === 0 ? (
                    <div className="text-sm text-slate-400 py-2 font-google-sans">
                        No workspace
                    </div>
                ) : (
                    open && (
                        <div className=" ml-8">
                            {workspaces.map((workspace) => (
                                <button
                                    key={workspace._id}
                                    onClick={() => handleWorkspaceChange(workspace._id)}
                                    className={`w-full flex items-center justify-between px-2 py-0.5 transition cursor-pointer ${workspace._id === workspaceId
                                        ? "text-black font-bold font-google-sans"
                                        : "text-gray-500 hover:text-black font-google-sans text-sm"
                                        }`}
                                >
                                    <span className="truncate font-google-sans text-sm">
                                        {workspace.name}
                                    </span>

                                    {/* Module count */}
                                    <span className="text-xs">
                                        {workspace.totalModules ?? 0}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )
                )}
            </div>

            <div className="px-3 pb-3 flex-1 overflow-y-auto">
                <div className="flex items-center gap-1.5 px-2">
                    <button className="flex gap-1 items-center cursor-pointer" onClick={() => setOpenModule(!openModule)}>
                        <div className="bg-[#00B894] p-1 rounded-md">
                            <TbCards className="text-white " size={22} />
                        </div>
                        <h3 className="text-sm text-[#0D1B2A] font-bold tracking-wider font-google-sans">
                            Modules
                        </h3>
                        <FaChevronDown
                            className={`w-3 h-3 text-black transition-transform ${openModule ? "rotate-180" : ""
                                }`}
                        />
                    </button>
                </div>

                {showCreateModal && createPortal(
                    <div
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
                        onClick={() => {
                            setShowCreateModal(false);
                            setCreateError("");
                            setNewWorkspaceName("");
                        }}
                    >
                        <div
                            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200"
                            onClick={(e) => e.stopPropagation()}
                        >

                            {/* Header */}
                            <div className="flex items-center justify-between mb-5 ">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 font-google-sans leading-snug">
                                        Create Workspace
                                    </h2>
                                    <p className="text-xs text-zinc-500 font-medium mt-0.5">
                                        Set up a new space to organize modules and team projects.
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setCreateError("");
                                        setNewWorkspaceName("");
                                    }}
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-slate-100 transition cursor-pointer"
                                    aria-label="Close"
                                >
                                    <HiOutlineXMark className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Error Banner */}
                            {createError && (
                                <div className="flex items-start gap-2.5 bg-red-50/80 border border-red-100 text-red-600 text-xs font-medium p-3 rounded-xl mb-4">
                                    <HiOutlineExclamationTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                                    <span>{createError}</span>
                                </div>
                            )}

                            {/* Input Field */}
                            <div className="mb-6">
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Workspace Name
                                </label>
                                <input
                                    type="text"
                                    value={newWorkspaceName}
                                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                                    placeholder="e.g. Sales & Marketing"
                                    autoFocus
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-zinc-400 outline-none focus:bg-white focus:border-[#6C5CE7] focus:ring-4 focus:ring-[#6C5CE7]/10 transition font-medium"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-2.5">
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setCreateError("");
                                        setNewWorkspaceName("");
                                    }}
                                    className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 rounded-xl transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateWorkspace}
                                    disabled={creating || !newWorkspaceName.trim()}
                                    className="px-4 py-2 text-sm font-semibold bg-[#6C5CE7] hover:bg-[#5b4cc4] text-white rounded-xl shadow-sm shadow-[#6C5CE7]/20 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                    {creating ? "Creating..." : "Create Workspace"}
                                </button>
                            </div>

                        </div>
                    </div>,
                    document.body
                )}

                {openModule && (
                    <>
                        {loadingModules ? (
                            <div className="space-y-1.5">
                                {[...Array(3)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="relative h-8 overflow-hidden rounded bg-white/10 shimmer"
                                    />
                                ))}
                            </div>
                        ) : modules.length === 0 ? (
                            <div className="text-sm text-slate-400 py-2 ml-12 font-dmsans">No Module available</div>
                        ) : (
                            <div className="space-y-0.5 ml-5">
                                {modules.map((moduleItem) => {
                                    const active = pathname.includes(`/module/${moduleItem._id}`);

                                    return (
                                        <button
                                            key={moduleItem._id}
                                            onClick={() =>
                                                router.push(`/workspace/${workspaceId}/module/${moduleItem._id}`)
                                            }
                                            className={`flex items-center justify-between gap-2 w-full rounded px-3 py-2 text-sm transition-colors cursor-pointer ${active
                                                ? "font-bold font-google-sans"
                                                : "text-gray-500 hover:text-black font-google-sans text-sm"
                                                }`}
                                        >

                                            <div className="flex items-center justify-center gap-1 pl-4 font-dmsans">
                                                <span className="truncate">{moduleItem.name}</span>

                                            </div>
                                            <span className="flex justify-center">
                                                {active && <BsCheck className="w-4 h-4 " />}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>


        </aside>
    );
}