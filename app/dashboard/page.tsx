"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import {
    HiOutlinePlus,
    HiOutlineMagnifyingGlass,
    HiOutlineSquares2X2,
    HiOutlineListBullet,
    HiOutlineEllipsisVertical,
    HiOutlineTrash,
    HiOutlineArrowTopRightOnSquare,
    HiOutlineFolderOpen,
    HiOutlineExclamationTriangle,
    HiOutlineXMark,
    HiOutlineRectangleGroup,
} from "react-icons/hi2";
import { RiHome9Fill } from "react-icons/ri";
import { TbHomeQuestion, TbHomeSpark } from "react-icons/tb";

interface Workspace {
    _id: string;
    name: string;
}

type ViewMode = "grid" | "list";

// Monday-style board colors — deterministic per workspace id so a card's
// color never changes across reloads.
const PALETTE = [
    { bg: "#FFEEEB", accent: "#FF6B6B" },
    { bg: "#E9FBF6", accent: "#00B894" },
    { bg: "#FFF4E5", accent: "#FF9F43" },
    { bg: "#EFEBFF", accent: "#6C5CE7" },
    { bg: "#E8F8ED", accent: "#20BF6B" },
    { bg: "#FFEBF7", accent: "#F368C4" },
    { bg: "#E8F1FF", accent: "#4D96FF" },
    { bg: "#FDF0E8", accent: "#E8590C" },
];

function colorFor(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return PALETTE[Math.abs(hash) % PALETTE.length];
}

export default function DashboardPage() {
    const router = useRouter();

    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [workspaceName, setWorkspaceName] = useState("");
    const [error, setError] = useState("");
    const [creating, setCreating] = useState(false);

    const [search, setSearch] = useState("");
    const [view, setView] = useState<ViewMode>("grid");
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const menuRef = useRef<HTMLDivElement | null>(null);

    const getWorkspaces = async () => {
        try {
            const response = await apiRequest("/api/workspaces", { method: "GET" });
            const data = await response.json();

            if (response.ok) {
                setWorkspaces(data.workspaces.map((item: any) => item.workspace));
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const createWorkspace = async () => {
        if (!workspaceName.trim()) {
            setError("Workspace name is required");
            return;
        }

        try {
            setCreating(true);
            setError("");

            const response = await apiRequest("/api/workspaces", {
                method: "POST",
                body: JSON.stringify({ name: workspaceName }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Workspace creation failed");
                return;
            }

            setWorkspaceName("");
            setShowModal(false);
            getWorkspaces();
        } catch (error) {
            setError("Something went wrong");
        } finally {
            setCreating(false);
        }
    };

    const deleteWorkspace = async (id: string) => {
        setOpenMenuId(null);

        if (!confirm("Are you sure you want to delete this workspace? This action cannot be undone.")) {
            return;
        }

        try {
            const response = await apiRequest(`/api/workspaces/${id}`, { method: "DELETE" });

            if (response.ok) {
                getWorkspaces();
            } else {
                const data = await response.json();
                alert(data.message || "Failed to delete workspace");
            }
        } catch (error) {
            console.error("Delete workspace error:", error);
            alert("Something went wrong while deleting workspace");
        }
    };

    useEffect(() => {
        getWorkspaces();
    }, []);

    // Close the open action menu on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const filteredWorkspaces = useMemo(
        () =>
            workspaces.filter((w) =>
                w.name.toLowerCase().includes(search.trim().toLowerCase())
            ),
        [workspaces, search]
    );

    return (
        <div className="min-h-screen bg-[#E0E1DD]">
            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex flex-col gap-1 mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded bg-[#415A77] flex items-center justify-center text-white">
                            <RiHome9Fill className="h-4 w-4" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#172B4D] font-dmsans ">
                            Workspaces
                        </h1>
                    </div>
                    <p className="text-sm text-slate-500 ml-11 font-dmsans">
                        {workspaces.length} {workspaces.length === 1 ? "workspace" : "workspaces"}
                    </p>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                    <div className="relative flex-1">
                        <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search workspaces..."
                            className="w-full font-dmsans bg-white border border-slate-200 rounded pl-9 pr-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#415A77] transition"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white border border-slate-200 rounded p-1">
                            <button
                                onClick={() => setView("grid")}
                                aria-label="Grid view"
                                className={`p-1.5 rounded transition cursor-pointer ${
                                    view === "grid"
                                        ? "bg-[#415A77] text-white"
                                        : "text-[#415A77] hover:text-slate-600"
                                }`}
                            >
                                <HiOutlineSquares2X2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setView("list")}
                                aria-label="List view"
                                className={`p-1.5 rounded transition cursor-pointer ${
                                    view === "list"
                                        ? "bg-[#415A77] text-white"
                                        : "text-[#415A77] hover:text-slate-600"
                                }`}
                            >
                                <HiOutlineListBullet className="w-4 h-4" />
                            </button>
                        </div>

                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-1.5 bg-[#415A77] cursor-pointer text-white px-4 py-2.5 rounded text-sm font-medium hover:bg-[#415A77]/80 transition whitespace-nowrap"
                        >
                            <TbHomeSpark className="w-4 h-4" />
                            New Workspace
                        </button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className={view === "grid" ? "grid md:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className="bg-white border border-slate-200 rounded p-5 animate-pulse h-[104px]"
                            />
                        ))}
                    </div>
                ) : filteredWorkspaces.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded p-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-[#415A77] flex items-center justify-center mx-auto mb-3">
                            <TbHomeQuestion className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-base font-semibold text-[#172B4D] font-dmsans">
                            {search ? "No matching workspaces" : "No workspaces"}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1 font-dmsans">
                            {search
                                ? "Try a different search term."
                                : "Create your first CRM workspace to get started."}
                        </p>
                        {!search && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="mt-4 inline-flex items-center gap-1.5 bg-[#415A77] cursor-pointer text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#415A77]/80 transition"
                            >
                                <TbHomeSpark className="w-4 h-4" />
                                New Workspace
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={view === "grid" ? "grid md:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
                        {filteredWorkspaces.map((workspace) => {
                            const color = colorFor(workspace._id);
                            const initial = workspace.name.trim().charAt(0).toUpperCase() || "?";

                            return (
                                <div
                                    key={workspace._id}
                                    onClick={() => router.push(`/workspace/${workspace._id}`)}
                                    className={`group relative bg-white border border-slate-200 rounded hover:shadow-md hover:border-slate-300 transition cursor-pointer ${
                                        view === "grid" ? "p-5" : "p-4 flex items-center gap-4"
                                    }`}
                                >
                                    <div
                                        className={`flex items-center justify-center rounded font-semibold shrink-0 ${
                                            view === "grid" ? "w-11 h-11 text-lg mb-3" : "w-10 h-10 text-base"
                                        }`}
                                        style={{ backgroundColor: color.bg, color: color.accent }}
                                    >
                                        {initial}
                                    </div>

                                    <div className={view === "list" ? "flex-1 min-w-0" : ""}>
                                        <h3 className="text-base font-semibold text-[#172B4D] truncate pr-6">
                                            {workspace.name}
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                                            <span
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{ backgroundColor: color.accent }}
                                            />
                                            CRM Workspace
                                        </p>
                                    </div>

                                    {/* Action menu */}
                                    <div
                                        className={`absolute ${
                                            view === "grid" ? "top-4 right-4" : "top-1/2 right-4 -translate-y-1/2"
                                        }`}
                                        ref={openMenuId === workspace._id ? menuRef : undefined}
                                    >
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(openMenuId === workspace._id ? null : workspace._id);
                                            }}
                                            className="p-1.5 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                            aria-label="Workspace options"
                                        >
                                            <HiOutlineEllipsisVertical className="w-4 h-4" />
                                        </button>

                                        {openMenuId === workspace._id && (
                                            <div
                                                onClick={(e) => e.stopPropagation()}
                                                className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded shadow-lg  z-10"
                                            >
                                                <button
                                                    onClick={() => router.push(`/workspace/${workspace._id}`)}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
                                                >
                                                    <HiOutlineArrowTopRightOnSquare className="w-4 h-4" />
                                                    Open
                                                </button>
                                                <button
                                                    onClick={() => deleteWorkspace(workspace._id)}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                                                >
                                                    <HiOutlineTrash className="w-4 h-4" />
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create workspace modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-5 z-50">
                    <div className="bg-white w-full max-w-md rounded p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-[#172B4D]">
                                Create Workspace
                            </h2>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setError("");
                                    setWorkspaceName("");
                                }}
                                className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                aria-label="Close"
                            >
                                <HiOutlineXMark className="w-5 h-5" />
                            </button>
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 bg-red-50 text-red-600 text-sm p-3 rounded mb-4">
                                <HiOutlineExclamationTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                {error}
                            </div>
                        )}

                        <label className="text-xs font-medium text-slate-500 mb-1.5 block">
                            Workspace name
                        </label>
                        <input
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                            placeholder="e.g. Sales Pipeline"
                            autoFocus
                            className="w-full border border-slate-200 rounded px-3 py-2.5 text-sm text-slate-800 mb-4 outline-none focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15 transition"
                        />

                        <button
                            onClick={createWorkspace}
                            disabled={creating}
                            className="w-full bg-[#6C5CE7] text-white py-2.5 rounded text-sm font-medium hover:bg-[#5b4bd6] disabled:opacity-60 transition"
                        >
                            {creating ? "Creating..." : "Create Workspace"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}