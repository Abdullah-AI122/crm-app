"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { notifications, PALETTE } from "@/data/data";
import Sidebar from "@/components/Sidebar";
import { IoIosSearch } from "react-icons/io";
import NotificationDropdown from "@/components/notifications";
import WorkspaceSections from "@/components/homesection";
import ProfileDropdown from "@/components/Profile";
import CreateWorkspace from "@/components/ui/modals/createWorkspace";
import SearchBar from "@/components/searchBar";

interface Workspace {
    _id: string;
    name: string;
}

type ViewMode = "grid" | "list";

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
                <div className="w-full flex flex-col gap-3 mx-auto pl-3 py-1  h-full">
                    {/* Header */}
                    <div className="flex justify-between items-center pr-2">

                        <SearchBar value={search} onChange={setSearch} />
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
                                onLogout={() => console.log("Logout")}
                            />
                        </div>
                    </div>
                    <WorkspaceSections searchQuery={search} />
                </div>

                {/* Create workspace modal */}
                {showModal && (
                    <CreateWorkspace
                        open={showModal}
                        setOpen={setShowModal}
                        workspaceName={workspaceName}
                        setWorkspaceName={setWorkspaceName}
                        error={error}
                        creating={creating}
                        createWorkspace={createWorkspace}
                    />
                )}
            </div>
        </section>
    );
}