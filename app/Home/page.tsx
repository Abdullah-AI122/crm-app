"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { notifications } from "@/data/data";
import Sidebar from "@/components/Sidebar";
import NotificationDropdown from "@/components/notifications";
import WorkspaceSections from "@/components/homesection";
import ProfileDropdown from "@/components/Profile";
import CreateWorkspace from "@/components/ui/modals/createWorkspace";
import SearchBar from "@/components/searchBar";
import WorkspaceLoader from "@/components/WorkspaceLoader";
import AiSidebar from "@/components/AiSidebar";
import {
    useGetWorkspacesQuery,
    useCreateWorkspaceMutation
} from "@/store/api/workspaces.api";

export default function DashboardPage() {
    const router = useRouter();
    const [profileOpen, setProfileOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [workspaceName, setWorkspaceName] = useState("");
    const [error, setError] = useState("");
    const [notification, setNotification] = useState(false);
    const [search, setSearch] = useState("");

    // Same cache entry the Sidebar and the workspace table subscribe to.
    const { isLoading } = useGetWorkspacesQuery();
    const [createWorkspaceMutation, { isLoading: creating }] = useCreateWorkspaceMutation();

    const createWorkspace = async () => {
        if (!workspaceName.trim()) {
            setError("Workspace name is required");
            return;
        }

        try {
            setError("");
            // The Workspace:LIST tag refreshes every subscriber — no manual refetch.
            await createWorkspaceMutation({ name: workspaceName }).unwrap();
            setWorkspaceName("");
            setShowModal(false);
        } catch {
            setError("Workspace creation failed");
        }
    };

    if (isLoading) {
        return <WorkspaceLoader />;
    }

    return (
        <section className="w-full flex w-full h-full" >
            <Sidebar />
            <div className="h-screen bg-canvas w-full">
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

            {/* Right rail — Atlas, scoped to every workspace from here */}
            <AiSidebar agent="atlas" context="all workspaces" />
        </section>
    );
}