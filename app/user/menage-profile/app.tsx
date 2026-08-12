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
        <div className="min-h-screen bg-white">
            <div className="flex">
                <UserSidebar />

                <div className="flex-1 px-8 py-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-semibold text-slate-900 font-dmsans">
                            User Profile
                        </h1>

                        <p className="mt-1 text-sm text-slate-500 font-dmsans">
                            View your account information
                        </p>
                    </div>

                    <div className="max-w-4xl">
                        <div className="flex items-center gap-5 mb-8">
                            <Avatar className="w-20 h-20 text-2xl border-2 border-slate-200">
                                <Avatar.Image src="https://iconape.com/wp-content/files/jh/12297/png/user-circle.png" />

                                <Avatar.Fallback>
                                    {user?.firstName?.[0]?.toUpperCase() ||
                                        "U"}
                                </Avatar.Fallback>
                            </Avatar>

                            <div>
                                <h2 className="text-xl font-semibold text-slate-900 font-dmsans">
                                    {user?.firstName || "User"}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500 font-dmsans">
                                    {user?.email || "-"}
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-slate-200 pt-7">
                            <h3 className="text-sm font-medium text-slate-900 font-dmsans mb-5">
                                Personal Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <HiOutlineUser className="w-4 h-4 text-slate-400" />

                                        <span className="text-xs text-slate-500 font-dmsans">
                                            First Name
                                        </span>
                                    </div>

                                    <p className="text-sm text-slate-800 font-dmsans">
                                        {user?.firstName || "-"}
                                    </p>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <HiOutlineEnvelope className="w-4 h-4 text-slate-400" />

                                        <span className="text-xs text-slate-500 font-dmsans">
                                            Email Address
                                        </span>
                                    </div>

                                    <p className="text-sm text-slate-800 font-dmsans break-all">
                                        {user?.email || "-"}
                                    </p>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <HiOutlineIdentification className="w-4 h-4 text-slate-400" />

                                        <span className="text-xs text-slate-500 font-dmsans">
                                            User ID
                                        </span>
                                    </div>

                                    <p className="text-sm text-slate-700 font-dmsans break-all">
                                        {user?.id || "-"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}