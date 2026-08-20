"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TbClipboardFilled } from "react-icons/tb";
import { ImUngroup } from "react-icons/im";
import { FaPlus } from "react-icons/fa";

import Sidebar from "@/components/Sidebar";
import MemberInvite from "@/components/ui/modals/memberInvite";
import CreateModule from "@/components/ui/modals/createModule";
import DeleteModuleModal from "@/components/ui/modals/deleteModuleConfermation";
import ProfileDropdown from "@/components/Profile";
import MembersButton from "@/components/ui/buttons/Membersbutton";

import { getWorkspace } from "@/data/Workspaces.data";
import { getMembers, inviteMember, removeMember } from "@/data/Members.data";
import { getModules, createModule, deleteModule } from "@/data/Modules.data";
import { PALETTE, ROLE_COLORS } from "@/data/data";
import ModuleCard from "@/components/ui/cards/moduleCard";

interface Member {
    _id: string;
    role: string;
    status: string;
    user: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

interface WorkspaceDetails {
    _id: string;
    name: string;
}


function colorFor(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return PALETTE[Math.abs(hash) % PALETTE.length];
}


export default function WorkspacePage() {
    const params = useParams();
    const router = useRouter();
    const workspaceId = params.id as string;

    const [workspace, setWorkspace] = useState<WorkspaceDetails | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);
    const [userId, setUserId] = useState("");
    const [role, setRole] = useState("member");
    const [adding, setAdding] = useState(false);

    const [modules, setModules] = useState<any[]>([]);
    const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null);
    const [deleteModuleModal, setDeleteModuleModal] = useState<string | null>(null);
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [moduleName, setModuleName] = useState("");
    const [moduleDescription, setModuleDescription] = useState("");
    const [creatingModule, setCreatingModule] = useState(false);

    // Helper Callers
    const fetchWorkspaceData = () => getWorkspace(workspaceId, setWorkspace);
    const fetchMembersData = () => getMembers(workspaceId, setMembers, setLoading);
    const fetchModulesData = () => getModules(workspaceId, setModules);

    const handleInviteMember = () =>
        inviteMember({
            workspaceId,
            userId,
            role,
            setAdding,
            setUserId,
            setRole,
            setShowInvite,
            getMembersData: fetchMembersData,
        });

    const handleRemoveMember = (memberUserId: string) =>
        removeMember({
            workspaceId,
            memberUserId,
            getMembersData: fetchMembersData,
        });

    const handleCreateModule = () =>
        createModule({
            workspaceId,
            moduleName,
            moduleDescription,
            setCreatingModule,
            setModuleName,
            setModuleDescription,
            setShowModuleModal,
            getModulesData: fetchModulesData,
        });

    const handleDeleteModule = (moduleId: string) =>
        deleteModule({
            moduleId,
            setDeletingModuleId,
            setModules,
            setDeleteModuleModal,
        });

    // Effects
    useEffect(() => {
        if (workspaceId) {
            fetchWorkspaceData();
            fetchMembersData();
            fetchModulesData();
        }
    }, [workspaceId]);

    const workspaceColor = colorFor(String(workspaceId));
    const workspaceInitial = (workspace?.name || "W").trim().charAt(0).toUpperCase();

    // Render
    return (
        <>
            <section className="flex">
                <Sidebar />
                <div className="min-h-screen w-full" >

                    {/* Top navbar */}
                    <div className="sticky top-0 z-20">
                        <div className="w-full mx-auto px-6 h-14 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="min-w-0">
                                    <h1 className="text-sm font-semibold truncate font-dmsans">
                                        {workspace?.name || "Workspace"}
                                    </h1>
                                    <p className="text-[11px] text-slate-400 truncate font-dmsans">
                                        {modules.length} modules · {members.length} members
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
                    </div>

                    {/* Content */}
                    <div className=" mx-auto px-6 py-8">

                        {/* Modules section */}
                        <div className="mb-10">
                            {modules.length === 0 ? (
                                <div className="border border-dashed border-slate-600 rounded-xl p-16 text-center flex items-center justify-center flex-col" style={{ background: "#111727" }}>
                                    <div className="text-4xl mb-4 inline-block">
                                        <ImUngroup className="text-slate-500" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-white mb-1 font-dmsans">No modules yet</h2>
                                    <p className="text-slate-400 mb-5 text-sm font-dmsans">Create your first module to start organizing work</p>
                                    <button
                                        onClick={() => setShowModuleModal(true)}
                                        className="bg-white text-slate-800 px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition cursor-pointer font-dmsans flex items-center gap-2"
                                    >
                                        <FaPlus className="text-slate-600" /> Create Module
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {modules.map((module) => {
                                        const color = colorFor(String(module._id));

                                        return (
                                            <ModuleCard
                                                key={module._id}
                                                module={module}
                                                workspaceId={workspaceId}
                                                onDelete={(moduleId) => {
                                                    setDeleteModuleModal(moduleId);
                                                }}
                                                deletingModuleId={deletingModuleId}
                                            />
                                        );
                                    })}
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