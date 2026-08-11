"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import {
    HiOutlinePlus,
    HiOutlineChevronDown,
    HiOutlineViewColumns,
    HiOutlineUsers,
    HiOutlineXMark,
    HiOutlineTrash,
} from "react-icons/hi2";
import { RiArrowLeftDoubleLine } from "react-icons/ri";
import { TbClipboardFilled } from "react-icons/tb";
import { ImUngroup } from "react-icons/im";
import { FaPlus } from "react-icons/fa";
import Sidebar from "@/components/Sidebar";
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

const ROLE_COLORS: Record<string, string> = {
    owner: "#A78BFA",
    admin: "#60A5FA",
    member: "#94A3B8",
    guest: "#FB923C",
};

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
    const [boards, setBoards] = useState<any[]>([]);
    const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);
    const [deleteBoardModal, setDeleteBoardModal] = useState<string | null>(null);
    const [showBoardModal, setShowBoardModal] = useState(false);
    const [boardName, setBoardName] = useState("");
    const [boardDescription, setBoardDescription] = useState("");
    const [creatingBoard, setCreatingBoard] = useState(false);

    const [showCreateMenu, setShowCreateMenu] = useState(false);
    const createMenuRef = useRef<HTMLDivElement | null>(null);

    // ── Fetch Workspace ────────────────────────────────────────────
    const getWorkspace = async () => {
        try {
            const response = await apiRequest(`/api/workspaces/${workspaceId}`, { method: "GET" });
            const data = await response.json();
            if (response.ok) setWorkspace(data.workspace || data);
        } catch (error) { console.log(error); }
    };

    // ── Fetch Members ──────────────────────────────────────────────
    const getMembers = async () => {
        try {
            const response = await apiRequest(`/api/workspace-members/${workspaceId}`, { method: "GET" });
            const data = await response.json();
            if (response.ok) setMembers(data.members || data);
        } catch (error) { console.log(error); } finally { setLoading(false); }
    };

    // ── Invite Member ──────────────────────────────────────────────
    const inviteMember = async () => {
        if (!userId.trim()) return;
        try {
            setAdding(true);
            const response = await apiRequest(`/api/workspace-members/${workspaceId}`, {
                method: "POST",
                body: JSON.stringify({ userId, role }),
            });
            const data = await response.json();
            if (response.ok) { setUserId(""); setRole("member"); setShowInvite(false); getMembers(); }
            else console.log(data.message);
        } catch (error) { console.log(error); } finally { setAdding(false); }
    };

    // ── Remove Member ──────────────────────────────────────────────
    const removeMember = async (memberUserId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return;
        try {
            const response = await apiRequest(`/api/workspace-members/${workspaceId}/${memberUserId}`, { method: "DELETE" });
            if (response.ok) getMembers();
            else { const data = await response.json(); console.error(data.message); }
        } catch (error) { console.error(error); }
    };

    // ── Fetch Boards ───────────────────────────────────────────────
    const getBoards = async () => {
        try {
            const response = await apiRequest(`/api/boards/${workspaceId}`, { method: "GET" });
            const data = await response.json();
            if (response.ok) setBoards(data.boards || []);
        } catch (error) { console.log(error); }
    };

    // ── Create Board ───────────────────────────────────────────────
    const createBoard = async () => {
        if (!boardName.trim()) return;
        try {
            setCreatingBoard(true);
            const response = await apiRequest(`/api/boards/${workspaceId}`, {
                method: "POST",
                body: JSON.stringify({ name: boardName, description: boardDescription, visibility: "workspace" }),
            });
            if (response.ok) { setBoardName(""); setBoardDescription(""); setShowBoardModal(false); getBoards(); }
        } catch (error) { console.log(error); } finally { setCreatingBoard(false); }
    };

    // ── Delete Board ───────────────────────────────────────────────
    const deleteBoard = async (boardId: string) => {
        try {
            setDeletingBoardId(boardId);
            const response = await apiRequest(`/api/boards/${boardId}`, { method: "DELETE" });
            if (response.ok) setBoards((prev) => prev.filter((b) => b._id !== boardId));
            else { const data = await response.json(); console.error(data.message); }
        } catch (error) { console.error(error); } finally { setDeletingBoardId(null); setDeleteBoardModal(null); }
    };

    // ── Effects ────────────────────────────────────────────────────
    useEffect(() => {
        if (workspaceId) { getWorkspace(); getMembers(); getBoards(); }
    }, [workspaceId]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) setShowCreateMenu(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const workspaceColor = colorFor(String(workspaceId));
    const workspaceInitial = (workspace?.name || "W").trim().charAt(0).toUpperCase();

    // ── Render ─────────────────────────────────────────────────────
    return (
        <>
            <section className="flex">
                <Sidebar />
                <div className="min-h-screen w-full" style={{ background: "#0D1B2A" }}>



                    {/* ── Top navbar ──────────────────────────────────── */}
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
                                        {boards.length} boards · {members.length} members
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <div className="relative" ref={createMenuRef}>
                                    <button
                                        onClick={() => setShowCreateMenu((v) => !v)}
                                        className="flex items-center gap-1.5 bg-[#415A77] text-white px-3.5 py-1.5 rounded-lg text-sm font-medium hover:bg-[#39526b] transition cursor-pointer font-dmsans"
                                    >
                                        <HiOutlinePlus className="w-4 h-4" />
                                        Create
                                        <HiOutlineChevronDown className={`w-3.5 h-3.5 transition-transform ${showCreateMenu ? "rotate-180" : ""}`} />
                                    </button>

                                    {showCreateMenu && (
                                        <div className="absolute right-0 mt-1.5 w-48 border border-slate-700 rounded-xl shadow-xl py-1.5 z-30" style={{ background: "#111727" }}>
                                            <button
                                                onClick={() => { setShowCreateMenu(false); setShowBoardModal(true); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/50 cursor-pointer font-dmsans transition rounded-lg mx-auto"
                                            >
                                                <HiOutlineViewColumns className="w-4 h-4 text-slate-400" />
                                                New Board
                                            </button>
                                            <button
                                                onClick={() => { setShowCreateMenu(false); setShowInvite(true); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/50 cursor-pointer font-dmsans transition rounded-lg mx-auto"
                                            >
                                                <HiOutlineUsers className="w-4 h-4 text-slate-400" />
                                                Invite Member
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Content ──────────────────────────────────────── */}
                    <div className="max-w-6xl mx-auto px-6 py-8">

                        {/* Boards section */}
                        <div className="mb-10">
                            <div className="flex items-center gap-2 mb-4">
                                <TbClipboardFilled className="w-4 h-4 text-slate-400" />
                                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-dmsans">
                                    Boards
                                </h2>
                            </div>

                            {boards.length === 0 ? (
                                <div className="border border-dashed border-slate-600 rounded-xl p-16 text-center flex items-center justify-center flex-col" style={{ background: "#111727" }}>
                                    <div className="text-4xl mb-4 inline-block">
                                        <ImUngroup className="text-slate-500" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-white mb-1 font-dmsans">No boards yet</h2>
                                    <p className="text-slate-400 mb-5 text-sm font-dmsans">Create your first board to start organizing work</p>
                                    <button
                                        onClick={() => setShowBoardModal(true)}
                                        className="bg-white text-slate-800 px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition cursor-pointer font-dmsans flex items-center gap-2"
                                    >
                                        <FaPlus className="text-slate-600" /> Create Board
                                    </button>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-3 gap-4">
                                    {boards.map((board) => {
                                        const color = colorFor(String(board._id));
                                        return (
                                            <div
                                                key={board._id}
                                                onClick={() => router.push(`/workspace/${workspaceId}/board/${board._id}`)}
                                                className="border border-slate-700 p-5 rounded-xl hover:border-slate-500 hover:shadow-lg transition cursor-pointer group relative"
                                                style={{ background: "#111727" }}
                                            >
                                                {/* Delete button */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setDeleteBoardModal(board._id); }}
                                                    disabled={deletingBoardId === board._id}
                                                    className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition cursor-pointer disabled:opacity-40"
                                                    aria-label="Delete board"
                                                    title="Delete board"
                                                >
                                                    <HiOutlineTrash className="w-4 h-4" />
                                                </button>

                                                <div
                                                    className="w-10 h-10 flex items-center justify-center text-xl mb-3 rounded-lg"
                                                    style={{ backgroundColor: color.accent + "22" }}
                                                >
                                                    {board.icon || <HiOutlineViewColumns className="w-5 h-5" style={{ color: color.accent }} />}
                                                </div>
                                                <h3 className="font-semibold text-white truncate font-dmsans capitalize group-hover:text-slate-100">
                                                    {board.name}
                                                </h3>
                                                {board.description && (
                                                    <p className="text-sm text-slate-400 mt-1 line-clamp-2 font-dmsans capitalize">
                                                        {board.description}
                                                    </p>
                                                )}
                                                <span
                                                    className="inline-block mt-3 text-xs font-medium px-2.5 py-1 rounded-lg font-dmsans capitalize"
                                                    style={{ backgroundColor: color.accent + "22", color: color.accent }}
                                                >
                                                    {board.visibility}
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
                                            const roleColor = ROLE_COLORS[member.role] || ROLE_COLORS.member;
                                            const initials = `${member.user.firstName?.[0] || ""}${member.user.lastName?.[0] || ""}`.toUpperCase();

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
                                                                {member.user.firstName} {member.user.lastName}
                                                            </p>
                                                            <p className="text-xs text-slate-400 truncate font-dmsans">
                                                                {member.user.email}
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
                                                                onClick={() => removeMember(member.user._id)}
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

                    {/* ── Invite Member Modal ───────────────────────────── */}
                    {showInvite && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-5 z-50 backdrop-blur-sm">
                            <div className="rounded-xl px-6 py-8 w-full max-w-md shadow-2xl border border-slate-700" style={{ background: "#111727" }}>
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="text-lg font-semibold text-white font-dmsans">Invite Member</h2>
                                    <button
                                        onClick={() => setShowInvite(false)}
                                        className="p-1 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-slate-200 cursor-pointer transition"
                                        aria-label="Close"
                                    >
                                        <HiOutlineXMark className="w-5 h-5" />
                                    </button>
                                </div>

                                <label className="text-xs text-slate-400 mb-1.5 block font-dmsans">User ID</label>
                                <input
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    placeholder="Enter User ID"
                                    className="w-full border border-slate-700 rounded-xl px-4 py-2.5 mb-4 text-sm text-white outline-none focus:border-[#415A77] transition font-dmsans"
                                    style={{ background: "#0D1B2A" }}
                                />

                                <label className="text-xs text-slate-400 mb-1.5 block font-dmsans">Role</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full border border-slate-700 rounded-xl px-4 py-2.5 mb-6 text-sm text-white outline-none focus:border-[#415A77] transition cursor-pointer font-dmsans"
                                    style={{ background: "#0D1B2A" }}
                                >
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                    <option value="guest">Guest</option>
                                </select>

                                <div className="flex gap-3">
                                    <button
                                        onClick={inviteMember}
                                        disabled={adding}
                                        className="flex-1 bg-white text-slate-800 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-100 disabled:opacity-60 transition cursor-pointer font-dmsans"
                                    >
                                        {adding ? "Adding..." : "Add Member"}
                                    </button>
                                    <button
                                        onClick={() => setShowInvite(false)}
                                        className="flex-1 bg-slate-700 text-white py-2.5 rounded-xl text-sm font-medium transition cursor-pointer font-dmsans"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>

                        </div>
                    )}


                    {/* ── Create Board Modal ────────────────────────────── */}
                    {showBoardModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-5 z-50 backdrop-blur-sm">
                            <div className="rounded-xl px-6 py-8 w-full max-w-md shadow-2xl border border-slate-700" style={{ background: "#111727" }}>
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="text-lg font-semibold text-white font-dmsans">Create Board</h2>
                                    <button
                                        onClick={() => setShowBoardModal(false)}
                                        className="p-1 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-slate-200 cursor-pointer transition"
                                        aria-label="Close"
                                    >
                                        <HiOutlineXMark className="w-5 h-5" />
                                    </button>
                                </div>

                                <label className="text-xs text-slate-400 mb-1.5 block font-dmsans capitalize">Board name</label>
                                <input
                                    value={boardName}
                                    onChange={(e) => setBoardName(e.target.value)}
                                    placeholder="e.g. Product Launch"
                                    autoFocus
                                    className="w-full border border-slate-700 rounded-xl px-4 py-2.5 mb-4 text-sm text-white outline-none focus:border-[#415A77] transition font-dmsans"
                                    style={{ background: "#0D1B2A" }}
                                />

                                <label className="text-xs text-slate-400 mb-1.5 block font-dmsans capitalize">Description</label>
                                <textarea
                                    value={boardDescription}
                                    onChange={(e) => setBoardDescription(e.target.value)}
                                    placeholder="What's this board for?"
                                    className="w-full border border-slate-700 rounded-xl px-4 py-2.5 mb-6 h-28 text-sm text-white outline-none focus:border-[#415A77] transition resize-none font-dmsans"
                                    style={{ background: "#0D1B2A" }}
                                />

                                <div className="flex gap-3">
                                    <button
                                        onClick={createBoard}
                                        disabled={creatingBoard}
                                        className="flex-1 bg-white text-slate-800 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-100 disabled:opacity-60 transition cursor-pointer font-dmsans capitalize"
                                    >
                                        {creatingBoard ? "Creating..." : "Create Board"}
                                    </button>
                                    <button
                                        onClick={() => setShowBoardModal(false)}
                                        className="flex-1 bg-slate-700 text-white py-2.5 rounded-xl text-sm font-medium transition cursor-pointer font-dmsans"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Delete Board Confirmation Modal ───────────────── */}
                {deleteBoardModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-5 z-50 backdrop-blur-sm">
                        <div className="rounded-xl px-6 py-8 w-full max-w-sm shadow-2xl border border-slate-700" style={{ background: "#111727" }}>
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10 mb-4 mx-auto">
                                <HiOutlineTrash className="w-6 h-6 text-red-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-white text-center mb-1 font-dmsans">Delete Board</h2>
                            <p className="text-sm text-slate-400 text-center mb-6 font-dmsans">
                                This will permanently delete{" "}
                                <span className="text-white font-medium">
                                    {boards.find((b) => b._id === deleteBoardModal)?.name || "this board"}
                                </span>{" "}
                                and all its data. This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => deleteBoard(deleteBoardModal)}
                                    disabled={deletingBoardId === deleteBoardModal}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-60 transition cursor-pointer font-dmsans"
                                >
                                    {deletingBoardId === deleteBoardModal ? "Deleting..." : "Delete Board"}
                                </button>
                                <button
                                    onClick={() => setDeleteBoardModal(null)}
                                    disabled={!!deletingBoardId}
                                    className="flex-1 bg-slate-700 text-white py-2.5 rounded-xl text-sm font-medium transition cursor-pointer font-dmsans disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>

        </>
    );
}