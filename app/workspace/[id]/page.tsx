"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ImUngroup } from "react-icons/im";
import { FaPlus } from "react-icons/fa";

import Sidebar from "@/components/Sidebar";
import MemberInvite from "@/components/ui/modals/memberInvite";
import CreateModule from "@/components/ui/modals/createModule";
import DeleteModuleModal from "@/components/ui/modals/deleteModuleConfermation";
import ProfileDropdown from "@/components/Profile";
import MembersButton from "@/components/ui/buttons/Membersbutton";

import { PALETTE } from "@/data/data";
import ModuleCard from "@/components/ui/cards/moduleCard";
import { useGetWorkspaceQuery } from "@/store/api/workspaces.api";
import { useGetMembersQuery, useAddMemberMutation, useRemoveMemberMutation } from "@/store/api/members.api";
import { useGetModulesQuery, useCreateModuleMutation, useDeleteModuleMutation } from "@/store/api/modules.api";


function colorFor(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return PALETTE[Math.abs(hash) % PALETTE.length];
}


export default function WorkspacePage() {
    const params = useParams();
    const workspaceId = params.id as string;

    const [showInvite, setShowInvite] = useState(false);
    const [userId, setUserId] = useState("");
    const [role, setRole] = useState("member");

    const [deleteModuleModal, setDeleteModuleModal] = useState<string | null>(null);
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [moduleName, setModuleName] = useState("");
    const [moduleDescription, setModuleDescription] = useState("");

    // Three cached queries. `modules` is the same cache entry the Sidebar reads,
    // so this route no longer double-fetches it.
    const { data: workspace } = useGetWorkspaceQuery(workspaceId, { skip: !workspaceId });
    const { data: members = [] } = useGetMembersQuery(workspaceId, { skip: !workspaceId });
    const { data: modules = [] } = useGetModulesQuery(workspaceId, { skip: !workspaceId });

    const [addMember, { isLoading: adding }] = useAddMemberMutation();
    const [removeMemberMutation] = useRemoveMemberMutation();
    const [createModuleMutation, { isLoading: creatingModule }] = useCreateModuleMutation();
    const [deleteModuleMutation] = useDeleteModuleMutation();

    const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null);

    const handleInviteMember = async () => {
        if (!userId.trim()) return;
        try {
            await addMember({ workspaceId, userId, role }).unwrap();
            setUserId("");
            setRole("member");
            setShowInvite(false);
        } catch (error) {
            console.error("Invite member failed:", error);
        }
    };

    const handleRemoveMember = async (memberUserId: string) => {
        try {
            await removeMemberMutation({ workspaceId, memberUserId }).unwrap();
        } catch (error) {
            console.error("Remove member failed:", error);
        }
    };

    const handleCreateModule = async () => {
        if (!moduleName.trim()) return;
        try {
            await createModuleMutation({
                workspaceId,
                name: moduleName,
                description: moduleDescription
            }).unwrap();
            setModuleName("");
            setModuleDescription("");
            setShowModuleModal(false);
        } catch (error) {
            console.error("Create module failed:", error);
        }
    };

    const handleDeleteModule = async (moduleId: string) => {
        setDeletingModuleId(moduleId);
        try {
            await deleteModuleMutation({ moduleId, workspaceId }).unwrap();
            setDeleteModuleModal(null);
        } catch (error) {
            console.error("Delete module failed:", error);
        } finally {
            setDeletingModuleId(null);
        }
    };

    const workspaceColor = colorFor(String(workspaceId));
    const workspaceInitial = (workspace?.name || "W").trim().charAt(0).toUpperCase();

    const moduleCount = modules.length;
    const memberCount = members.length;

    // Render
    return (
        <>
            <section className="flex bg-canvas">
                <Sidebar />

                {/* Shell card — the frame every page sits in (LAYOUT.md §7) */}
                <div className="min-h-screen w-full flex flex-col bg-panel rounded-l-2xl overflow-hidden shadow-sm">

                    {/* Top navbar */}
                    <header className="sticky top-0 z-20 bg-panel border-b border-slate-200">
                        <div className="w-full mx-auto px-6 h-16 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">

                                {/* Workspace tile — colour hashed from the id (LAYOUT.md §4.5) */}
                                <div
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm font-dmsans"
                                    style={{
                                        backgroundColor: workspaceColor.bg,
                                        color: workspaceColor.accent,
                                    }}
                                >
                                    {workspaceInitial}
                                </div>

                                <div className="min-w-0">
                                    <h1 className="text-sm font-semibold text-slate-900 truncate font-dmsans">
                                        {workspace?.name || "Workspace"}
                                    </h1>
                                    <p className="text-[11px] text-muted truncate font-dmsans">
                                        {moduleCount} {moduleCount === 1 ? "module" : "modules"}
                                        {" · "}
                                        {memberCount} {memberCount === 1 ? "member" : "members"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <MembersButton
                                    members={members}
                                    onInvite={() => setShowInvite(true)}
                                />

                                <ProfileDropdown />
                            </div>
                        </div>
                    </header>

                    {/* Content */}
                    <div className="flex-1 px-6 py-6">

                        {/* Modules section */}
                        <div className="mb-10">

                            {/* Section header. Creating happens from the add tile at the
                                end of the grid, so there is no button up here. */}
                            <div className="mb-5 min-w-0">
                                <h2 className="text-lg font-semibold text-slate-900 font-dmsans">
                                    Modules
                                </h2>
                                <p className="mt-0.5 text-xs text-muted font-dmsans">
                                    {moduleCount === 0
                                        ? "Nothing here yet"
                                        : "Open a module to work on its board"}
                                </p>
                            </div>

                            {moduleCount === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-300 bg-card/60 px-6 py-20 text-center">
                                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
                                        <ImUngroup size={24} />
                                    </div>

                                    <h3 className="text-lg font-semibold text-slate-900 font-dmsans">
                                        No modules yet
                                    </h3>

                                    <p className="mt-1 text-sm text-muted font-dmsans">
                                        Create your first module to start organizing work
                                    </p>

                                    <button
                                        onClick={() => setShowModuleModal(true)}
                                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover cursor-pointer font-dmsans"
                                    >
                                        <FaPlus size={11} />
                                        Create Module
                                    </button>
                                </div>
                            ) : (
                                // auto-fill tracks capped at the card's own 360px width, so
                                // cards pack from the left with only gap-5 between them.
                                // Equal 1/3 columns left a wide gap beside a 360px card.
                                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,360px))] gap-5">
                                    {modules.map((module) => (
                                        <ModuleCard
                                            key={module._id}
                                            module={module}
                                            workspaceId={workspaceId}
                                            onDelete={(moduleId) => {
                                                setDeleteModuleModal(moduleId);
                                            }}
                                            deletingModuleId={deletingModuleId}
                                        />
                                    ))}

                                    {/* Add tile — keeps the create action next to the
                                        cards, where the eye already is. */}
                                    <button
                                        onClick={() => setShowModuleModal(true)}
                                        className="group flex min-h-[220px] w-full max-w-[360px] flex-col items-center justify-center gap-3 rounded-[22px] border border-dashed border-slate-300 bg-card/40 transition hover:border-accent hover:bg-card/70 cursor-pointer"
                                    >
                                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent transition group-hover:bg-accent group-hover:text-white">
                                            <FaPlus size={14} />
                                        </span>
                                        <span className="text-sm font-semibold text-slate-700 font-dmsans">
                                            New Module
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Invite Member Modal */}
                    <MemberInvite
                        open={showInvite}
                        setOpen={setShowInvite}
                        userId={userId}
                        setUserId={setUserId}
                        role={role}
                        setRole={setRole}
                        adding={adding}
                        inviteMember={handleInviteMember}
                    />

                    {/* Create Module Modal */}
                    <CreateModule
                        open={showModuleModal}
                        setOpen={setShowModuleModal}
                        moduleName={moduleName}
                        setModuleName={setModuleName}
                        moduleDescription={moduleDescription}
                        setModuleDescription={setModuleDescription}
                        creatingModule={creatingModule}
                        createModule={handleCreateModule}
                    />

                    {/* Delete Module Confirmation Modal */}
                    <DeleteModuleModal
                        deleteModuleModal={deleteModuleModal}
                        modules={modules}
                        deleteModule={handleDeleteModule}
                        deletingModuleId={deletingModuleId}
                        setDeleteModuleModal={setDeleteModuleModal}
                    />
                </div>
            </section>
        </>
    );
}
