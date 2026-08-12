"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@heroui/react";
import { getUser, AuthUser } from "@/lib/auth";
import {
    HiOutlineUser,
    HiOutlineEnvelope,
    HiOutlineIdentification,
} from "react-icons/hi2";
import UserSidebar from "@/components/userSidebar";

export default function UserPage() {
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        setUser(getUser());
    }, []);

    return (
        <div className="min-h-screen bg-[#0F172A] p-8">
            <div className=" flex gap-8">

                <UserSidebar />

                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-white font-dmsans mb-8">
                        User Profile
                    </h1>

                    <div className="bg-[#111727] border border-slate-700 rounded-2xl p-8">

                        <div className="flex items-center gap-6">
                            <Avatar className="w-24 h-24 text-3xl border-2 border-slate-600">
                                <Avatar.Image src="https://iconape.com/wp-content/files/jh/12297/png/user-circle.png" />
                                <Avatar.Fallback>
                                    {user?.firstName?.[0]?.toUpperCase() || "U"}
                                </Avatar.Fallback>
                            </Avatar>

                            <div>
                                <h2 className="text-2xl font-semibold text-white font-dmsans">
                                    {user?.firstName || "User"}
                                </h2>

                                <p className="text-slate-400 font-dmsans">
                                    {user?.email}
                                </p>
                            </div>
                        </div>

                        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div className="bg-[#1E293B] rounded-xl border border-slate-700 p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <HiOutlineUser className="w-5 h-5 text-slate-300" />
                                    <span className="text-sm text-slate-400">
                                        First Name
                                    </span>
                                </div>

                                <p className="text-white font-medium">
                                    {user?.firstName || "-"}
                                </p>
                            </div>

                            <div className="bg-[#1E293B] rounded-xl border border-slate-700 p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <HiOutlineEnvelope className="w-5 h-5 text-slate-300" />
                                    <span className="text-sm text-slate-400">
                                        Email Address
                                    </span>
                                </div>

                                <p className="text-white font-medium break-all">
                                    {user?.email || "-"}
                                </p>
                            </div>

                            <div className="bg-[#1E293B] rounded-xl border border-slate-700 p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <HiOutlineIdentification className="w-5 h-5 text-slate-300" />
                                    <span className="text-sm text-slate-400">
                                        User ID
                                    </span>
                                </div>

                                <p className="text-white font-medium break-all">
                                    {user?.id || "-"}
                                </p>
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}