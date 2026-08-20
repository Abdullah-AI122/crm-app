"use client";

import { useRouter } from "next/navigation";
import { HiOutlinePlus } from "react-icons/hi2";
import { getUser } from "@/lib/auth";

export interface MemberUser {
    _id?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
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
        <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
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

                            const avatar =
                                member.avatar || member.profileImage;

                            return (
                                <div
                                    key={member._id || index}
                                    title={memberName}
                                    className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-white bg-slate-200 shadow-sm"
                                >
                                    {avatar ? (
                                        <img
                                            src={avatar}
                                            alt={memberName}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-slate-700 text-[10px] font-semibold text-white">
                                            {memberName
                                                .split(" ")
                                                .filter(Boolean)
                                                .map(
                                                    (word: string) => word[0]
                                                )
                                                .join("")
                                                .slice(0, 2)
                                                .toUpperCase() || "M"}
                                        </div>
                                    )}
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