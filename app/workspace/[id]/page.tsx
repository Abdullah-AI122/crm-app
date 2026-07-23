"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import {
    HiOutlinePlus,
    HiOutlineChevronDown,
    HiOutlineUserPlus,
    HiOutlineSquares2X2,
    HiOutlineViewColumns,
    HiOutlineUsers,
    HiOutlineXMark,
    HiOutlineTrash,
    HiOutlineArrowLeft,
} from "react-icons/hi2";
import { RiArrowLeftDoubleLine } from "react-icons/ri";
import { TbClipboardFilled } from "react-icons/tb";

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

// Same deterministic palette used on the dashboard, so boards feel
// like the same product as workspace tiles.
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

const ROLE_STYLES: Record<string, { bg: string; text: string }> = {
    owner: { bg: "#EFEBFF", text: "#6C5CE7" },
    admin: { bg: "#E8F1FF", text: "#4D96FF" },
    member: { bg: "#F1F5F9", text: "#475569" },
    guest: { bg: "#FFF4E5", text: "#E8590C" },
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
    const [showBoardModal, setShowBoardModal] = useState(false);
    const [boardName, setBoardName] = useState("");
    const [boardDescription, setBoardDescription] = useState("");
    const [creatingBoard, setCreatingBoard] = useState(false);

    const [showCreateMenu, setShowCreateMenu] = useState(false);
    const createMenuRef = useRef<HTMLDivElement | null>(null);

    // ── Fetch Workspace ────────────────────────────────────────────
    const getWorkspace = async () => {
        try {
            const response = await apiRequest(`/api/workspaces/${workspaceId}`, {
                method: "GET",
            });
            const data = await response.json();
            if (response.ok) {
                setWorkspace(data.workspace || data);
            }
        } catch (error) {
            console.log(error);
        }
    };

    // ── Fetch Members ──────────────────────────────────────────────
    const getMembers = async () => {
        try {
            const response = await apiRequest(
                `/api/workspace-members/${workspaceId}`,
                { method: "GET" }
            );
            const data = await response.json();
            if (response.ok) {
                setMembers(data.members || data);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    // ── Invite Member ──────────────────────────────────────────────
    const inviteMember = async () => {
        if (!userId.trim()) return;
        try {
            setAdding(true);
            const response = await apiRequest(
                `/api/workspace-members/${workspaceId}`,
                {
                    method: "POST",
                    body: JSON.stringify({ userId, role }),
                }
            );
            const data = await response.json();
            if (response.ok) {
                setUserId("");
                setRole("member");
                setShowInvite(false);
                getMembers();
            } else {
                console.log(data.message);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setAdding(false);
        }
    };

    // ── Remove Member ──────────────────────────────────────────────
    const removeMember = async (memberUserId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return;
        try {
            const response = await apiRequest(
                `/api/workspace-members/${workspaceId}/${memberUserId}`,
                { method: "DELETE" }
            );
            if (response.ok) {
                getMembers();
            } else {
                const data = await response.json();
                console.error(data.message);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // ── Fetch Boards ───────────────────────────────────────────────
    const getBoards = async () => {
        try {
            const response = await apiRequest(
                `/api/boards/${workspaceId}`,
                { method: "GET" }
            );
            const data = await response.json();
            if (response.ok) {
                setBoards(data.boards || []);
            }
        } catch (error) {
            console.log(error);
        }
    };

    // ── Create Board ───────────────────────────────────────────────
    const createBoard = async () => {
        if (!boardName.trim()) return;
        try {
            setCreatingBoard(true);
            const response = await apiRequest(`/api/boards/${workspaceId}`, {
                method: "POST",
                body: JSON.stringify({
                    name: boardName,
                    description: boardDescription,
                    visibility: "workspace",
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setBoardName("");
                setBoardDescription("");
                setShowBoardModal(false);
                getBoards();
            }
        } catch (error) {
            console.log(error);
        } finally {
            setCreatingBoard(false);
        }
    };

    // ── Effects ────────────────────────────────────────────────────
    useEffect(() => {
        if (workspaceId) {
            getWorkspace();
            getMembers();
            getBoards();
        }
    }, [workspaceId]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
                setShowCreateMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const workspaceColor = colorFor(String(workspaceId));
    const workspaceInitial = (workspace?.name || "W").trim().charAt(0).toUpperCase();

    // ── Render ─────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#F6F7FB]">
            {/* Top navbar */}
            <div className="sticky top-0 z-20 bg-white border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="p-1.5 rounded text-white bg-[#415A77] hover:bg-[#39526b] transition shrink-0 cursor-pointer font-dmsans"
                            aria-label="Back to all workspaces"
                        >
                            <RiArrowLeftDoubleLine />
                        </button>

                        <div
                            className="w-9 h-9 rounded flex items-center justify-center font-semibold text-base shrink-0 font-dmsans"
                            style={{ backgroundColor: workspaceColor.bg, color: workspaceColor.accent }}
                        >
                            {workspaceInitial}
                        </div>

                        <div className="min-w-0">
                            <h1 className="text-[15px] font-semibold text-[#172B4D] truncate font-dmsans">
                                {workspace?.name || "Workspace"}
                            </h1>
                            <p className="text-xs text-slate-400 truncate font-dmsans">
                                {boards.length} boards · {members.length} members
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative" ref={createMenuRef}>
                            <button
                                onClick={() => setShowCreateMenu((v) => !v)}
                                className="flex items-center gap-1.5 bg-[#415A77] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#39526b] transition cursor-pointer font-dmsans"
                            >
                                <HiOutlinePlus className="w-4 h-4" />
                                Create
                                <HiOutlineChevronDown
                                    className={`w-3.5 h-3.5 transition-transform ${showCreateMenu ? "rotate-180" : ""}`}
                                />
                            </button>

                            {showCreateMenu && (
                                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded shadow-lg py-1 z-30">
                                    <button
                                        onClick={() => {
                                            setShowCreateMenu(false);
                                            setShowBoardModal(true);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer font-dmsans"
                                    >
                                        <HiOutlineViewColumns className="w-4 h-4 text-slate-400" />
                                        New Board
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowCreateMenu(false);
                                            setShowInvite(true);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer font-dmsans"
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

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Boards section */}
                <div className="mb-8">
                    <div className="flex items-center gap-1.5 mb-4">
                       <TbClipboardFilled className="w-4 h-4 text-slate-400" />
                        <h2 className="text-sm font-semibold text-slate-500 tracking-wide font-dmsans">
                            Boards
                        </h2>
                    </div>

                    {boards.length === 0 ? (
                        <div className="bg-white border border-dashed border-slate-300 rounded p-10 text-center">
                            <p className="text-sm text-slate-500 mb-3">No boards created yet</p>
                            <button
                                onClick={() => setShowBoardModal(true)}
                                className="inline-flex items-center gap-1.5 bg-[#6C5CE7] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#5b4bd6] transition cursor-pointer"
                            >
                                <HiOutlinePlus className="w-4 h-4" />
                                Create Board
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
                                        className="bg-white border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition cursor-pointer"
                                    >
                                        <div
                                            className="w-10 h-10 flex items-center justify-center text-lg mb-3"
                                            style={{ backgroundColor: color.bg }}
                                        >
                                            {board.icon}
                                        </div>
                                        <h3 className="font-semibold text-[#172B4D] truncate font-dmsans capitalize">
                                            {board.name}
                                        </h3>
                                        {board.description && (
                                            <p className="text-sm text-slate-500 mt-1 line-clamp-2 font-dmsans capitalize">
                                                {board.description}
                                            </p>
                                        )}
                                        <span
                                            className="inline-block mt-3 text-xs font-medium px-2.5 py-1 font-dmsans capitalize "
                                            style={{ backgroundColor: color.bg, color: color.accent }}
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
                    <div className="flex items-center gap-1.5 mb-4">
                        <HiOutlineUsers className="w-4 h-4 text-slate-500" />
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide font-dmsans">
                            Members
                        </h2>
                    </div>

                    <div className="bg-white border border-slate-200 rounded overflow-hidden">
                        {loading ? (
                            <div className="p-5 space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-12 rounded bg-slate-100 animate-pulse" />
                                ))}
                            </div>
                        ) : members.length === 0 ? (
                            <p className="text-slate-500 text-sm p-6 text-center font-dmsans">No members found</p>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {members.map((member) => {
                                    const roleStyle = ROLE_STYLES[member.role] || ROLE_STYLES.member;
                                    const initials = `${member.user.firstName?.[0] || ""}${member.user.lastName?.[0] || ""}`.toUpperCase();

                                    return (
                                        <div
                                            key={member._id}
                                            className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/60 transition"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-full font-dmsans bg-slate-100 text-slate-600 flex items-center justify-center font-semibold text-xs shrink-0">
                                                    {initials || "?"}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-[#172B4D] truncate font-dmsans">
                                                        {member.user.firstName} {member.user.lastName}
                                                    </p>
                                                    <p className="text-xs  text-slate-400 truncate font-dmsans">
                                                        {member.user.email}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0">
                                                <div className="text-right">
                                                    <span
                                                        className="text-xs font-dmsans capitalize font-medium px-2.5 py-1 rounded"
                                                        style={{ backgroundColor: roleStyle.bg, color: roleStyle.text }}
                                                    >
                                                        {member.role}
                                                    </span>
                                                    <p className="text-[11px]  text-slate-400 mt-1 capitalize font-dmsans">
                                                        {member.status}
                                                    </p>
                                                </div>

                                                {member.role !== "owner" && (
                                                    <button
                                                        onClick={() => removeMember(member.user._id)}
                                                        className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
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
            {showInvite && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-5 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold text-black">Invite Member</h2>
                            <button
                                onClick={() => setShowInvite(false)}
                                className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                                aria-label="Close"
                            >
                                <HiOutlineXMark className="w-5 h-5" />
                            </button>
                        </div>

                        <label className="text-xs font-medium text-black mb-1.5 block">User ID</label>
                        <input
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            placeholder="Enter User ID"
                            className="w-full border border-slate-200 rounded p-3 mb-4 text-sm text-black outline-none focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15 transition"
                        />

                        <label className="text-xs font-medium text-black mb-1.5 block">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full border border-slate-200 rounded p-3 mb-5 text-sm text-black outline-none focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/15 transition cursor-pointer"
                        >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                            <option value="guest">Guest</option>
                        </select>

                        <button
                            onClick={inviteMember}
                            disabled={adding}
                            className="w-full bg-[#6C5CE7]  text-white py-3 rounded text-sm font-medium hover:bg-[#5b4bd6] disabled:opacity-60 transition"
                        >
                            {adding ? "Adding..." : "Add Member"}
                        </button>
                    </div>
                </div>
            )}

            {/* Create Board Modal */}
            {showBoardModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-5 z-50">
                    <div className="bg-white rounded p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold text-black font-dmsans">Create Board</h2>
                            <button
                                onClick={() => setShowBoardModal(false)}
                                className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                                aria-label="Close"
                            >
                                <HiOutlineXMark className="w-5 h-5" />
                            </button>
                        </div>

                        <label className="text-xs font-medium text-black mb-1.5 block font-dmsans capitalize">Board name</label>
                        <input
                            value={boardName}
                            onChange={(e) => setBoardName(e.target.value)}
                            placeholder="e.g. Product Launch"
                            autoFocus
                            className="w-full border text-black border-slate-200 rounded p-3 mb-4 text-sm outline-none focus:border-[#415A77] transition font-dmsans"
                        />

                        <label className="text-xs font-medium text-black mb-1.5 block font-dmsans capitalize">Description</label>
                        <textarea
                            value={boardDescription}
                            onChange={(e) => setBoardDescription(e.target.value)}
                            placeholder="What's this board for?"
                            className="w-full border text-black border-slate-200 rounded p-3 mb-5 h-28 text-sm outline-none focus:border-[#415A77] transition resize-none font-dmsans"
                        />

                        <button
                            onClick={createBoard}
                            disabled={creatingBoard}
                            className="w-full bg-[#415A77] cursor-pointer text-white font-dmsans py-3 rounded text-sm font-medium disabled:opacity-60 transition capitalize"
                        >
                            {creatingBoard ? "Creating..." : "Create Board"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}