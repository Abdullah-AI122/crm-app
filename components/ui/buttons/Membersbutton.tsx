"use client";

import { useRouter } from "next/navigation";
import { HiOutlinePlus } from "react-icons/hi2";

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

    const visibleMembers = members.slice(0, 4);

    return (
        <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
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

                    {members.length > 4 && (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white bg-slate-800 text-[10px] font-medium text-slate-300">
                            +{members.length - 4}
                        </div>
                    )}
                </div>
            </button>

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