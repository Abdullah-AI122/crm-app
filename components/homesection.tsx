"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineEllipsisVertical } from "react-icons/hi2";
import { motion } from "framer-motion";
import WorkspaceMenu from "./ui/modals/workspaceMenu";
import RenameWorkspace from "./ui/modals/renameWorkspace";
import DeleteWorkspace from "./ui/modals/deleteWorkspace";
import CollectionLoader from "./CollectionLoader";
import { toast } from "./ui/toast";
import {
    useGetWorkspacesQuery,
    useUpdateWorkspaceMutation,
    useDeleteWorkspaceMutation
} from "@/store/api/workspaces.api";
import { filterWorkspaces, paginate } from "@/store/selectors/workspace.selectors";
import type { Workspace as WorkspaceData } from "@/store/types";

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
/** Average month/year lengths — good enough for a "5 months ago" label. */
const MONTH = DAY * 30.44;
const YEAR = DAY * 365.25;

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"} ago`;

/**
 * Relative age for the table cell — days, weeks, months, years. The exact
 * timestamp stays one click away in the popover (and on hover via `title`),
 * because "3 weeks ago" is what you scan for and the date is what you verify.
 */
function formatRelative(dateStr: string): string {
    if (!dateStr) return "-";

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    // A clock skew between server and browser can push this negative.
    if (seconds < 0) return "Just now";

    if (seconds < MINUTE) return "Just now";
    if (seconds < HOUR) return plural(Math.floor(seconds / MINUTE), "minute");
    if (seconds < DAY) return plural(Math.floor(seconds / HOUR), "hour");

    const days = Math.floor(seconds / DAY);
    if (days === 1) return "Yesterday";
    if (seconds < WEEK) return plural(days, "day");

    if (seconds < MONTH) return plural(Math.floor(seconds / WEEK), "week");
    if (seconds < YEAR) return plural(Math.floor(seconds / MONTH), "month");

    return plural(Math.floor(seconds / YEAR), "year");
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

interface WorkspaceTableProps {
    searchQuery?: string;
}

export default function WorkspaceTable({ searchQuery = "" }: WorkspaceTableProps) {
    const router = useRouter();
    const tabs = ["Workspace", "Recently Visited", "New Modules"];

    const [activeTab, setActiveTab] = useState("Workspace");
    const [currentPage, setCurrentPage] = useState(1);
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [openDatePopover, setOpenDatePopover] = useState<string | null>(null);
    const [copyingId, setCopyingId] = useState<string | null>(null);
    const [workspaceToRename, setWorkspaceToRename] = useState<WorkspaceData | null>(null);
    const [workspaceToDelete, setWorkspaceToDelete] = useState<WorkspaceData | null>(null);

    const [updateWorkspace, { isLoading: renaming }] = useUpdateWorkspaceMutation();
    const [deleteWorkspace, { isLoading: deleting }] = useDeleteWorkspaceMutation();

    const itemsPerPage = 10;

    // Shared cache: the Sidebar and the dashboard read the same entry, one request total.
    const { data: workspaces = [], isLoading: loading, isError } = useGetWorkspacesQuery();
    const error = isError ? "Failed to load workspaces" : "";

    // Client-side filtering over cached data — never hits the backend.
    const currentData = useMemo(
        () => filterWorkspaces(workspaces, searchQuery),
        [workspaces, searchQuery]
    );

    const totalPages = Math.max(1, Math.ceil(currentData.length / itemsPerPage));

    // Clamp instead of resetting from an effect: a shrinking result set can leave
    // currentPage past the end, and this derives the fix during render.
    const safePage = Math.min(currentPage, totalPages);

    const currentItems = useMemo(
        () => paginate(currentData, safePage, itemsPerPage),
        [currentData, safePage]
    );

    const startItem =
        currentData.length === 0
            ? 0
            : (safePage - 1) * itemsPerPage + 1;

    const endItem = Math.min(
        safePage * itemsPerPage,
        currentData.length
    );

    /** The server owns validation; its message is shown verbatim. */
    const messageFrom = (error: unknown, fallback: string) => {
        const data = (error as { data?: { message?: string } })?.data;
        return data?.message || fallback;
    };

    const renameWorkspace = async (name: string) => {
        if (!workspaceToRename) return;

        const previous = workspaceToRename.name;

        try {
            await updateWorkspace({ id: workspaceToRename._id, name }).unwrap();
            setWorkspaceToRename(null);
            toast.success(`Renamed to ${name}`, `Was "${previous}"`);
        } catch (error) {
            toast.error(messageFrom(error, "Could not rename that workspace."));
        }
    };

    const removeWorkspace = async () => {
        if (!workspaceToDelete) return;

        const { name } = workspaceToDelete;

        try {
            await deleteWorkspace(workspaceToDelete._id).unwrap();
            setWorkspaceToDelete(null);
            toast.success(`Deleted ${name}`, "Everything inside it went with it");
        } catch (error) {
            toast.error(messageFrom(error, "Could not delete that workspace."));
        }
    };

    return (
        <div
            className="bg-panel rounded-l-2xl overflow-hidden h-full flex flex-col shadow-sm "
            onClick={() => {
                setOpenDatePopover(null);
                setOpenMenu(null);
            }}
        >
            {/* Header Tabs Container */}
            <div className="bg-accent pt-2.5 px-6 flex items-end min-h-[52px] gap-2 select-none relative">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                setCurrentPage(1);
                            }}
                            className="relative px-6 py-2.5 text-sm font-bold font-google-sans cursor-pointer transition-colors duration-200"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabBackground"
                                    className={
                                        "absolute inset-0 bg-panel rounded-t-[18px] z-0 " +
                                        "before:content-[''] before:absolute before:bottom-0 before:-left-3.5 before:w-3.5 before:h-3.5 before:rounded-br-[14px] before:[box-shadow:3px_3px_0_0_var(--panel)] before:pointer-events-none " +
                                        "after:content-[''] after:absolute after:bottom-0 after:-right-3.5 after:w-3.5 after:h-3.5 after:rounded-bl-[14px] after:[box-shadow:-3px_3px_0_0_var(--panel)] after:pointer-events-none"
                                    }
                                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                />
                            )}
                            <span className={`relative z-10 transition-colors duration-200 ${isActive ? "text-foreground font-bold" : "text-white/90 hover:text-white"}`}>
                                {tab}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Table Content Area */}
            <div className="flex-1 overflow-auto px-4 pt-2 pb-2">
                {loading ? (
                    <CollectionLoader rows={itemsPerPage} columns={6} />
                ) : error ? (
                    <div className="text-center py-20 text-red-400 text-sm font-medium">
                        {error}
                    </div>
                ) : (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="text-left text-sm text-muted font-bold font-google-sans border-b border-gray-200/40">
                                <th className="px-6 py-3 font-semibold">Workspaces ID</th>
                                <th className="px-6 py-3 font-semibold">Workspaces Name</th>
                                <th className="px-6 py-3 font-semibold">Created Date</th>
                                <th className="px-6 py-3 font-semibold">Updated Date</th>
                                <th className="px-6 py-3 font-semibold text-center">Total Modules</th>
                                <th className="px-6 py-3 font-semibold text-center">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200/30">
                            {currentItems.length > 0 ? (
                                currentItems.map((workspace) => (
                                    <tr
                                        key={workspace._id}
                                        onClick={() => router.push(`/workspace/${workspace._id}`)}
                                        className="hover:bg-gray-200/40 transition cursor-pointer text-slate-800"
                                    >
                                        <td className="px-6 py-2 text-sm font-google-sans font-medium text-slate-700">
                                            {workspace._id.length > 14
                                                ? `${workspace._id.slice(0, 12)}...`
                                                : workspace._id}
                                        </td>

                                        <td className="px-6 py-2 text-sm font-bold font-google-sans text-slate-900">
                                            {workspace.name}
                                        </td>

                                        <td className="px-6 py-2 text-sm font-medium font-google-sans text-slate-700 relative z-1">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const key = `created-${workspace._id}`;
                                                    setOpenDatePopover(openDatePopover === key ? null : key);
                                                    setOpenMenu(null);
                                                }}
                                                title={formatExactDate(workspace.createdAt)}
                                                className="hover:underline transition cursor-pointer text-slate-700"
                                            >
                                                {formatRelative(workspace.createdAt)}
                                            </button>

                                            {openDatePopover === `created-${workspace._id}` && (
                                                <div
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="absolute left-6 top-12 z-20 w-64 bg-card rounded-xl shadow-lg border border-gray-200 p-3 text-xs text-gray-700 font-google-sans animate-in fade-in zoom-in-95 duration-100"
                                                >
                                                    <div className="font-semibold text-gray-900 mb-1 border-b pb-1 flex items-center justify-between">
                                                        <span>Exact Created Date</span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">Created</span>
                                                    </div>
                                                    <p className="text-gray-800 font-medium pt-1.5">
                                                        {formatExactDate(workspace.createdAt)}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500 pb-1">
                                                        {formatRelative(workspace.createdAt)}
                                                    </p>
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-6 py-2 text-sm font-medium font-google-sans text-slate-700 relative">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const key = `updated-${workspace._id}`;
                                                    setOpenDatePopover(openDatePopover === key ? null : key);
                                                    setOpenMenu(null);
                                                }}
                                                title={formatExactDate(workspace.updatedAt)}
                                                className="hover:underline transition cursor-pointer text-slate-700"
                                            >
                                                {formatRelative(workspace.updatedAt)}
                                            </button>

                                            {openDatePopover === `updated-${workspace._id}` && (
                                                <div
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="absolute left-6 top-12 z-20 w-64 bg-card rounded-xl shadow-lg border border-gray-200 p-3 text-xs text-gray-700 font-google-sans animate-in fade-in zoom-in-95 duration-100"
                                                >
                                                    <div className="font-semibold text-gray-900 mb-1 border-b pb-1 flex items-center justify-between">
                                                        <span>Exact Updated Date</span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">Updated</span>
                                                    </div>
                                                    <p className="text-gray-800 font-medium pt-1.5">
                                                        {formatExactDate(workspace.updatedAt)}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500 pb-1">
                                                        {formatRelative(workspace.updatedAt)}
                                                    </p>
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-6 py-2 text-sm font-bold font-google-sans text-slate-800 text-center">
                                            {workspace.totalModules > 0 ? (
                                                <span>{workspace.totalModules}</span>
                                            ) : (
                                                <span className="text-zinc-400 font-normal">0</span>
                                            )}
                                        </td>

                                        <td className="px-6 py-2 text-sm text-center">
                                            <div className="relative inline-block text-left">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenu(openMenu === workspace._id ? null : workspace._id);
                                                    }}
                                                    className="p-1.5 rounded-lg hover:bg-gray-300/50 transition cursor-pointer text-slate-600"
                                                >
                                                    <HiOutlineEllipsisVertical className="w-5 h-5" />
                                                </button>

                                                {openMenu === workspace._id && (
                                                    <WorkspaceMenu
                                                        workspace={workspace}
                                                        copyingId={copyingId}
                                                        setCopyingId={setCopyingId}
                                                        setOpenMenu={setOpenMenu}
                                                        onRename={setWorkspaceToRename}
                                                        onDelete={setWorkspaceToDelete}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="text-center py-20 text-gray-400 font-google-sans"
                                    >
                                        No data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination Footer */}
            <div className="px-8 py-5">
                <div className="flex items-center justify-between">
                    {/* Showing Text */}
                    <p className="text-sm text-gray-500 font-google-sans">
                        Showing <span className="text-foreground font-bold">{startItem}-{endItem}</span> of <span className="text-foreground font-bold">{currentData.length}</span>
                    </p>

                    {/* Pagination Buttons */}
                    <div className="flex items-center gap-2">
                        {/* Prev Button */}
                        <button
                            onClick={() => setCurrentPage(Math.max(safePage - 1, 1))}
                            disabled={safePage === 1}
                            className="w-10 h-10 rounded-2xl bg-control hover:bg-gray-300 disabled:opacity-40 flex items-center justify-center font-bold text-slate-800 transition cursor-pointer"
                        >
                            &#8249;
                        </button>

                        {(() => {
                            const pages = [];
                            const maxVisible = 4;

                            for (let i = 1; i <= Math.min(maxVisible, totalPages); i++) {
                                pages.push(
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i)}
                                        className={`w-10 h-10 rounded-2xl transition cursor-pointer font-bold font-google-sans text-sm ${safePage === i
                                            ? "bg-black text-white"
                                            : "bg-control text-slate-800 hover:bg-gray-300"
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
                                        className="w-8 text-center text-slate-600 font-bold"
                                    >
                                        ...
                                    </span>
                                );
                            }

                            const start = Math.max(maxVisible + 1, totalPages - 3);

                            for (let i = start; i <= totalPages; i++) {
                                if (i > maxVisible) {
                                    pages.push(
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i)}
                                            className={`w-10 h-10 rounded-2xl transition cursor-pointer font-bold font-google-sans text-sm ${safePage === i
                                                ? "bg-black text-white"
                                                : "bg-control text-slate-800 hover:bg-gray-300"
                                                }`}
                                        >
                                            {i}
                                        </button>
                                    );
                                }
                            }

                            return pages;
                        })()}

                        {/* Next Button */}
                        <button
                            onClick={() =>
                                setCurrentPage(Math.min(safePage + 1, totalPages))
                            }
                            disabled={safePage === totalPages}
                            className="w-10 h-10 rounded-2xl bg-control hover:bg-gray-300 disabled:opacity-40 flex items-center justify-center font-bold text-slate-800 transition cursor-pointer"
                        >
                            &#8250;
                        </button>
                    </div>
                </div>
            </div>

            {/* Keyed on the workspace so the rename field re-seeds each time
                it is opened for a different row. */}
            <RenameWorkspace
                key={workspaceToRename?._id ?? "rename"}
                workspace={workspaceToRename}
                saving={renaming}
                onClose={() => setWorkspaceToRename(null)}
                onSave={renameWorkspace}
            />

            <DeleteWorkspace
                workspace={workspaceToDelete}
                deleting={deleting}
                onClose={() => setWorkspaceToDelete(null)}
                onConfirm={removeWorkspace}
            />
        </div>
    );
}