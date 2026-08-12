"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineClipboardDocument, HiOutlineEllipsisVertical, HiOutlinePencilSquare, HiOutlineTrash } from "react-icons/hi2";
import { apiRequest } from "@/lib/api";
import { MdOutlineEditNote } from "react-icons/md";
import { FiEdit2 } from "react-icons/fi";

interface WorkspaceData {
    _id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    totalBoards: number;
}

function formatDate(dateStr: string): string {
    if (!dateStr) return "-";
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSeconds < 60) {
            return "Just now";
        }
        if (diffMinutes < 60) {
            return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
        }
        if (diffHours < 24 && now.getDate() === date.getDate()) {
            return `Today, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
        }

        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (yesterday.getDate() === date.getDate() && yesterday.getMonth() === date.getMonth() && yesterday.getFullYear() === date.getFullYear()) {
            return `Yesterday, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
        }

        if (diffDays < 30) {
            return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
        }

        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths < 12) {
            const remainingDays = diffDays % 30;
            if (remainingDays > 0) {
                return `${diffMonths} ${diffMonths === 1 ? "month" : "months"} and ${remainingDays} ${remainingDays === 1 ? "day" : "days"} ago`;
            }
            return `${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
        }

        const diffYears = Math.floor(diffDays / 365);
        return `${diffYears} ${diffYears === 1 ? "year" : "years"} ago`;
    } catch {
        return dateStr;
    }
}

function formatExactDate(dateStr: string): string {
    if (!dateStr) return "-";
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
        });
    } catch {
        return dateStr;
    }
}

export default function WorkspaceTable() {
    const router = useRouter();
    const tabs = ["WorkSpaces", "Recently Visited", "New Modules"];

    const [activeTab, setActiveTab] = useState("WorkSpaces");
    const [currentPage, setCurrentPage] = useState(1);
    const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [openDatePopover, setOpenDatePopover] = useState<string | null>(null);
    const [copyingId, setCopyingId] = useState<string | null>(null);

    const itemsPerPage = 10;

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    async function fetchWorkspaces() {
        try {
            setLoading(true);
            setError("");

            const response = await apiRequest("/api/workspaces", { method: "GET" });
            const data = await response.json();

            if (response.ok && data.workspaces) {
                const list: WorkspaceData[] = data.workspaces
                    .map((item: any) => item.workspace)
                    .filter(Boolean)
                    .map((ws: any) => ({
                        _id: ws._id,
                        name: ws.name,
                        createdAt: ws.createdAt,
                        updatedAt: ws.updatedAt,
                        totalBoards: ws.totalBoards ?? 0,
                    }));
                setWorkspaces(list);
            } else {
                setWorkspaces([]);
            }
        } catch (err: any) {
            console.error("Error fetching workspaces:", err);
            setError("Failed to load workspaces");
            setWorkspaces([]);
        } finally {
            setLoading(false);
        }
    }

    // Change these later when you have separate data
    const currentData =
        activeTab === "Spaces"
            ? workspaces
            : activeTab === "Recently Visited"
                ? workspaces
                : workspaces;

    const totalPages = Math.ceil(currentData.length / itemsPerPage);

    const currentItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return currentData.slice(start, start + itemsPerPage);
    }, [currentData, currentPage]);

    const startItem =
        currentData.length === 0
            ? 0
            : (currentPage - 1) * itemsPerPage + 1;

    const endItem = Math.min(
        currentPage * itemsPerPage,
        currentData.length
    );

    return (
        <div
            className="bg-white rounded-xl overflow-hidden h-full flex flex-col"
            onClick={() => {
                setOpenDatePopover(null);
                setOpenMenu(null);
            }}
        >

            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-6">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            setActiveTab(tab);
                            setCurrentPage(1);
                        }}
                        className={`px-5 py-3 text-sm font-medium font-google-sans transition cursor-pointer ${activeTab === tab
                            ? "border-b-1 border-black text-black"
                            : "text-gray-500 hover:text-black"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="p-6 space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className="h-10 rounded-lg bg-gray-100 animate-pulse"
                            />
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-20 text-red-400 text-sm">
                        {error}
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-sm text-black font-google-sans">
                                <th className="px-11 py-1">Workspace ID</th>
                                <th className="px-6 py-1">Title</th>
                                <th className="px-6 py-1">Created</th>
                                <th className="px-6 py-1">Updated</th>
                                <th className="px-6 py-1">Total Boards</th>
                                <th className="px-6 py-1 text-center">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {currentItems.length > 0 ? (
                                currentItems.map((workspace) => (
                                    <tr
                                        key={workspace._id}
                                        onClick={() => router.push(`/workspace/${workspace._id}`)}
                                        className="hover:bg-gray-50 transition cursor-pointer"
                                    >
                                        <td className="px-11 text-sm font-google-sans">
                                            {workspace._id.slice(0, 12)}
                                        </td>

                                        <td className="px-6 text-sm font-google-sans">
                                            {workspace.name}
                                        </td>

                                        <td className="px-3 relative">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const key = `created-${workspace._id}`;
                                                    setOpenDatePopover(openDatePopover === key ? null : key);
                                                    setOpenMenu(null);
                                                }}
                                                className="inline-flex items-center  px-3 py-1 text-xs font-medium font-google-sans transition cursor-pointer"
                                            >
                                                {formatDate(workspace.createdAt)}
                                            </button>

                                            {openDatePopover === `created-${workspace._id}` && (
                                                <div
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="absolute left-3 top-10 z-20 w-64 bg-white rounded-xl shadow-lg border border-gray-200 p-3 text-xs text-gray-700 font-google-sans animate-in fade-in zoom-in-95 duration-100"
                                                >
                                                    <div className="font-semibold text-gray-900 mb-1 border-b pb-1 flex items-center justify-between">
                                                        <span>Exact Created Date</span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">Created</span>
                                                    </div>
                                                    <p className="text-gray-800 font-medium py-1">
                                                        {formatExactDate(workspace.createdAt)}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-1">
                                                        Relative: {formatDate(workspace.createdAt)}
                                                    </p>
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-3 relative">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const key = `updated-${workspace._id}`;
                                                    setOpenDatePopover(openDatePopover === key ? null : key);
                                                    setOpenMenu(null);
                                                }}
                                                className="inline-flex items-center px-3 py-1 text-xs font-medium font-google-sans  transition cursor-pointer"
                                            >
                                                {formatDate(workspace.updatedAt)}
                                            </button>

                                            {openDatePopover === `updated-${workspace._id}` && (
                                                <div
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="absolute left-3 top-10 z-20 w-64 bg-white rounded-xl shadow-lg border border-gray-200 p-3 text-xs text-gray-700 font-google-sans animate-in fade-in zoom-in-95 duration-100"
                                                >
                                                    <div className="font-semibold text-gray-900 mb-1 border-b pb-1 flex items-center justify-between">
                                                        <span>Exact Updated Date</span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">Updated</span>
                                                    </div>
                                                    <p className="text-gray-800 font-medium py-1">
                                                        {formatExactDate(workspace.updatedAt)}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-1">
                                                        Relative: {formatDate(workspace.updatedAt)}
                                                    </p>
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-6 text-sm font-google-sans">
                                            {workspace.totalBoards > 0 ? (
                                                <span className="font-semibold text-slate-700 ">{workspace.totalBoards}</span>
                                            ) : (
                                                <span className="inline-flex items-center  py-0.5 rounded-md text-xs font-medium  text-zinc-400">
                                                    No Modules
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-6 text-sm">
                                            <div className="relative flex justify-center items-center gap-1">

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenu(openMenu === workspace._id ? null : workspace._id);
                                                    }}
                                                    className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                                                >
                                                    <HiOutlineEllipsisVertical />
                                                </button>

                                                {openMenu === workspace._id && (
                                                    <div
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="absolute top-10 right-0 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-2 overflow-hidden"
                                                    >

                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    setCopyingId(workspace._id);

                                                                    await navigator.clipboard.writeText(workspace._id);

                                                                    // Show loader for 800ms
                                                                    setTimeout(() => {
                                                                        setCopyingId(null);
                                                                        setOpenMenu(null);
                                                                    }, 800);
                                                                } catch (err) {
                                                                    setCopyingId(null);
                                                                }
                                                            }}
                                                            disabled={copyingId === workspace._id}
                                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition cursor-pointer disabled:cursor-not-allowed"
                                                        >
                                                            {copyingId === workspace._id ? (
                                                                <>
                                                                    <svg
                                                                        className="w-5 h-5 animate-spin text-gray-500"
                                                                        viewBox="0 0 24 24"
                                                                        fill="none"
                                                                    >
                                                                        <circle
                                                                            className="opacity-25"
                                                                            cx="12"
                                                                            cy="12"
                                                                            r="10"
                                                                            stroke="currentColor"
                                                                            strokeWidth="4"
                                                                        />
                                                                        <path
                                                                            className="opacity-75"
                                                                            fill="currentColor"
                                                                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                                                        />
                                                                    </svg>

                                                                    <span>Copying...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <HiOutlineClipboardDocument className="w-5 h-5 text-gray-500" />
                                                                    <span>Copy Workspace ID</span>
                                                                </>
                                                            )}
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                console.log("Rename", workspace._id);
                                                                setOpenMenu(null);
                                                            }}
                                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition"
                                                        >
                                                            <HiOutlinePencilSquare className="w-5 h-5 text-gray-500" />
                                                            <span>Rename Workspace</span>
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                console.log("Delete", workspace._id);
                                                                setOpenMenu(null);
                                                            }}
                                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 cursor-pointer transition"
                                                        >
                                                            <HiOutlineTrash className="w-5 h-5" />
                                                            <span>Delete Workspace</span>
                                                        </button>

                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="text-center py-20 text-gray-400"
                                    >
                                        No data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
            {/* Pagination */}
            <div className="border-t px-6 py-4">
                <div className="flex items-center justify-between">

                    {/* Left */}
                    <p className="text-sm text-gray-500 font-google-sans">
                        Showing <span className="text-black">{startItem}-{endItem}</span> of <span className="text-black">{currentData.length}</span>
                    </p>

                    {/* Right */}
                    <div className="flex items-center gap-2">

                        {/* Previous */}
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 flex items-center justify-center transition cursor-pointer"
                        >
                            &#8249;
                        </button>

                        {(() => {
                            const pages = [];

                            // Always show first 4 pages
                            for (let i = 1; i <= Math.min(4, totalPages); i++) {
                                pages.push(
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i)}
                                        className={`w-10 h-10 rounded-xl transition cursor-pointer font-google-sans ${currentPage === i
                                            ? "bg-[#D9D9D9] shadow-md"
                                            : "bg-gray-100 hover:bg-gray-200"
                                            }`}
                                    >
                                        {i}
                                    </button>
                                );
                            }

                            if (totalPages > 8) {
                                pages.push(
                                    <span
                                        key="dots"
                                        className="w-10 text-center text-gray-500 font-bold"
                                    >
                                        ...
                                    </span>
                                );
                            }

                            // Last 4 pages
                            const start = Math.max(5, totalPages - 3);

                            for (let i = start; i <= totalPages; i++) {
                                pages.push(
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i)}
                                        className={`w-10 h-10 rounded-xl transition cursor-pointer font-google-sans ${currentPage === i
                                            ? "bg-black text-white shadow-md"
                                            : "bg-gray-100 hover:bg-gray-200"
                                            }`}
                                    >
                                        {i}
                                    </button>
                                );
                            }

                            return pages;
                        })()}

                        {/* Next */}
                        <button
                            onClick={() =>
                                setCurrentPage((p) => Math.min(p + 1, totalPages))
                            }
                            disabled={currentPage === totalPages}
                            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 flex items-center justify-center transition cursor-pointer"
                        >
                            &#8250;
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}