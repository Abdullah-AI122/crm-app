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
    HiOutlineBell,
} from "react-icons/hi2";
import { TbBrandGoogleHome, TbHomeQuestion, TbHomeSpark } from "react-icons/tb";
import { notifications, PALETTE } from "@/data/data";
import Sidebar from "@/components/Sidebar";
import { FaSearch } from "react-icons/fa";
import { IoIosSearch } from "react-icons/io";
import NotificationDropdown from "@/components/notifications";
import WorkspaceSections from "@/components/homesection";
import ProfileDropdown from "@/components/Profile";

interface Workspace {
    _id: string;
    name: string;
}

type ViewMode = "grid" | "list";

// Monday-style board colors — deterministic per workspace id so a card's
// color never changes across reloads.


function colorFor(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return PALETTE[Math.abs(hash) % PALETTE.length];
}

export default function DashboardPage() {
    const router = useRouter();

    const [profileOpen, setProfileOpen] = useState(false);
    const [developerMode, setDeveloperMode] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [workspaceName, setWorkspaceName] = useState("");
    const [error, setError] = useState("");
    const [creating, setCreating] = useState(false);
    const [notification, setNotification] = useState(false);
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
        <section className="w-full flex w-full h-full" >
            <Sidebar />
            <div className="h-screen bg-[#D9D9D9] w-full">
                <div className="w-full flex flex-col gap-3 mx-auto px-2 pt-6 pb-3 h-full">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">

                            <div className="bg-white w-120 px-4 py-2 rounded-xl">
                                <input type="text" className="text-xs focus:outline-none w-full " placeholder="Search For Anything..." />
                            </div>
                            <button className="bg-white p-3 rounded-xl cursor-pointer">
                                <IoIosSearch size={18} />
                            </button>

                        </div>

                        <div className="flex items-center gap-2 ">
                            <NotificationDropdown
                                open={notification}
                                setOpen={setNotification}
                                notifications={notifications}
                                onViewAll={() => router.push("/notifications")}
                            />

                            <ProfileDropdown
                                open={profileOpen}
                                setOpen={setProfileOpen}
                                developerMode={developerMode}
                                darkMode={darkMode}
                                onToggleDeveloperMode={() =>
                                    setDeveloperMode(!developerMode)
                                }
                                onToggleDarkMode={() =>
                                    setDarkMode(!darkMode)
                                }
                                onProfile={() => router.push("/profile")}
                                onSettings={() => router.push("/settings")}
                                onNotifications={() => router.push("/notifications")}
                                onLogout={() => console.log("Logout")}
                            />
                        </div>
                    </div>
                    <WorkspaceSections />

                </div>

                {/* Create workspace modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-5 z-90">
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



        </section>
    );
}