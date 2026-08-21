"use client";

import { useRouter } from "next/navigation";
import { HiOutlinePlus } from "react-icons/hi2";
import { getUser } from "@/lib/auth";

import userAsset from "@/app/assets/user.png";

export interface MemberUser {
    _id?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    avatar?: string;
    profileImage?: string;
}

export interface Member {
    _id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    avatar?: string;
    profileImage?: string;
    user?: MemberUser;
}

interface MembersButtonProps {
    members: Member[] | any[];
    onInvite?: () => void;
}

export default function MembersButton({
    members,
    onInvite,
}: MembersButtonProps) {
    const router = useRouter();
    const currentUser = getUser();

    // Filter out the current logged in user from members list
    const otherMembers = (members || []).filter((member: any) => {
        const rawUser = member.user || member;
        const memberId = rawUser?._id || rawUser?.id || member._id || member.id;
        const memberEmail = rawUser?.email || member.email;

        if (currentUser?.id && memberId && String(memberId) === String(currentUser.id)) {
            return false;
        }
        if (currentUser?.email && memberEmail && memberEmail.toLowerCase() === currentUser.email.toLowerCase()) {
            return false;
        }
        return true;
    });

    const visibleMembers = otherMembers.slice(0, 4);
    const hasMembers = visibleMembers.length > 0;

    return (
        <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-300 bg-card shadow-sm">
            {hasMembers && (
                <button
                    type="button"
                    onClick={() => router.push("/members")}
                    className="flex items-center gap-1.5 border-r border-slate-300 px-3 py-1.5 transition hover:bg-slate-50 cursor-pointer"
                    title="View all members"
                >
                    <div className="flex items-center -space-x-2">
                        {visibleMembers.map((member: any, index: number) => {
                            const rawUser = member.user || member;

                            const memberName =
                                member.name ||
                                rawUser?.name ||
                                `${rawUser?.firstName || ""} ${
                                    rawUser?.lastName || ""
                                }`.trim() ||
                                "Member";

                            // The API nests the picture under `user`, so read the
                            // populated user first; the bundled asset stands in for
                            // anyone who has not uploaded one.
                            const avatar =
                                rawUser?.avatar ||
                                rawUser?.profileImage ||
                                member.avatar ||
                                member.profileImage ||
                                userAsset.src;

                            return (
                                <div
                                    key={member._id || index}
                                    title={memberName}
                                    className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-white bg-slate-200 shadow-sm"
                                >
                                    <img
                                        src={avatar}
                                        alt={memberName}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            );
                        })}

                        {otherMembers.length > 4 && (
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white bg-slate-800 text-[10px] font-medium text-slate-300">
                                +{otherMembers.length - 4}
                            </div>
                        )}
                    </div>
                </button>
            )}

            <button
                type="button"
                onClick={onInvite}
                title="Invite Member"
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 font-dmsans text-xs font-medium text-[#FB923C] transition hover:text-[#EA580C] cursor-pointer"
            >
                <HiOutlinePlus size={15} strokeWidth={2.5} />
                <span>Invite</span>
            </button>
        </div>
    );
}