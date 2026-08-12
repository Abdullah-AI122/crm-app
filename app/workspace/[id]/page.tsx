"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { HiOutlineViewColumns,HiOutlineUsers,HiOutlineTrash,} from "react-icons/hi2";
import { RiArrowLeftDoubleLine } from "react-icons/ri";
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
                <div className="min-h-screen w-full" style={{ background: "#0D1B2A" }}>

                    {/* Top navbar */}
                    <div className="sticky top-0 z-20 border-b border-slate-700" style={{ background: "#111727" }}>
                        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <button
                                    onClick={() => router.push("/dashboard")}
                                    className="p-1.5 rounded-lg text-white bg-[#415A77] hover:bg-[#39526b] transition shrink-0 cursor-pointer"
                                    aria-label="Back to all workspaces"
                                >
                                    <RiArrowLeftDoubleLine />
                                </button>

                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
                                    style={{ backgroundColor: workspaceColor.accent + "22", color: workspaceColor.accent }}
                                >
                                    {workspaceInitial}
                                </div>

                                <div className="min-w-0">
                                    <h1 className="text-sm font-semibold text-white truncate font-dmsans">
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
                    <div className="max-w-6xl mx-auto px-6 py-8">

                        {/* Modules section */}
                        <div className="mb-10">
                            <div className="flex items-center gap-2 mb-4">
                                <TbClipboardFilled className="w-4 h-4 text-slate-400" />
                                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-dmsans">
                                    Modules
                                </h2>
                            </div>

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
                                <div className="grid md:grid-cols-3 gap-4">
                                    {modules.map((module) => {
                                        const color = colorFor(String(module._id));
                                        return (
                                            <div
                                                key={module._id}
                                                onClick={() => router.push(`/workspace/${workspaceId}/module/${module._id}`)}
                                                className="border border-slate-700 p-5 rounded-xl hover:border-slate-500 hover:shadow-lg transition cursor-pointer group relative"
                                                style={{ background: "#111727" }}
                                            >
                                                {/* Delete button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteModuleModal(module._id);
                                                    }}
                                                    disabled={deletingModuleId === module._id}
                                                    className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition cursor-pointer disabled:opacity-40"
                                                    aria-label="Delete module"
                                                    title="Delete module"
                                                >
                                                    <HiOutlineTrash className="w-4 h-4" />
                                                </button>

                                                <div
                                                    className="w-10 h-10 flex items-center justify-center text-xl mb-3 rounded-lg"
                                                    style={{ backgroundColor: color.accent + "22" }}
                                                >
                                                    {module.icon || <HiOutlineViewColumns className="w-5 h-5" style={{ color: color.accent }} />}
                                                </div>
                                                <h3 className="font-semibold text-white truncate font-dmsans capitalize group-hover:text-slate-100">
                                                    {module.name}
                                                </h3>
                                                {module.description && (
                                                    <p className="text-sm text-slate-400 mt-1 line-clamp-2 font-dmsans capitalize">
                                                        {module.description}
                                                    </p>
                                                )}
                                                <span
                                                    className="inline-block mt-3 text-xs font-medium px-2.5 py-1 rounded-lg font-dmsans capitalize"
                                                    style={{ backgroundColor: color.accent + "22", color: color.accent }}
                                                >
                                                    {module.visibility}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Members section */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <HiOutlineUsers className="w-4 h-4 text-slate-400" />
                                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-dmsans">
                                    Members
                                </h2>
                            </div>

                            <div className="border border-slate-700 rounded-xl overflow-hidden" style={{ background: "#111727" }}>
                                {loading ? (
                                    <div className="p-5 space-y-3">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="h-12 rounded-lg bg-slate-700/40 animate-pulse" />
                                        ))}
                                    </div>
                                ) : members.length === 0 ? (
                                    <p className="text-slate-500 text-sm p-6 text-center font-dmsans">No members found</p>
                                ) : (
                                    <div className="divide-y divide-slate-700/60">
                                        {members.map((member) => {
                                            const roleColor = ROLE_COLORS[member.role as keyof typeof ROLE_COLORS] || ROLE_COLORS.member;
                                            const initials = `${member.user?.firstName?.[0] || ""}${member.user?.lastName?.[0] || ""}`.toUpperCase();

                                            return (
                                                <div
                                                    key={member._id}
                                                    className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-700/20 transition"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-9 h-9 rounded-full font-dmsans border border-slate-600 text-slate-300 flex items-center justify-center font-semibold text-xs shrink-0" style={{ background: "#1E2938" }}>
                                                            {initials || "?"}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-white truncate font-dmsans">
                                                                {member.user?.firstName} {member.user?.lastName}
                                                            </p>
                                                            <p className="text-xs text-slate-400 truncate font-dmsans">
                                                                {member.user?.email}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 shrink-0">
                                                        <div className="text-right">
                                                            <span
                                                                className="text-xs font-dmsans capitalize font-medium px-2.5 py-1 rounded-lg"
                                                                style={{ backgroundColor: roleColor + "22", color: roleColor }}
                                                            >
                                                                {member.role}
                                                            </span>
                                                            <p className="text-[11px] text-slate-500 mt-1 capitalize font-dmsans">
                                                                {member.status}
                                                            </p>
                                                        </div>

                                                        {member.role !== "owner" && (
                                                            <button
                                                                onClick={() => handleRemoveMember(member.user._id)}
                                                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                                                                aria-label="Remove member"
                                                            >
                                                                <HiOutlineTrash className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
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