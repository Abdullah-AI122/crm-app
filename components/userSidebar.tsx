"use client";

import { usePathname, useRouter } from "next/navigation";
import {
    HiOutlineUserCircle,
    HiOutlineKey,
    HiOutlineShieldCheck,
    HiOutlineBell,
    HiOutlineCog6Tooth,
} from "react-icons/hi2";

const menu = [
    {
        title: "Profile",
        icon: HiOutlineUserCircle,
        href: "/user",
    },
    {
        title: "API Tokens",
        icon: HiOutlineKey,
        href: "/user/api-tokens",
    },
    {
        title: "Security",
        icon: HiOutlineShieldCheck,
        href: "/user/security",
    },
    {
        title: "Notifications",
        icon: HiOutlineBell,
        href: "/user/notifications",
    },
    {
        title: "Preferences",
        icon: HiOutlineCog6Tooth,
        href: "/user/preferences",
    },
];

export default function UserSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <div className="min-h-screen  bg-[#0B1120] flex">
            <aside className="w-72 min-h-screen shrink-0 border-r border-slate-700/60 bg-[#111727] px-5 py-7">
                <div className="mb-10">
                    <h1 className="font-dmsans text-xl font-semibold text-white">
                        Account
                    </h1>

                    <p className="mt-1 font-dmsans text-xs text-slate-500">
                        Manage your account settings
                    </p>
                </div>

                <div className="space-y-1.5">
                    {menu.map((item) => {
                        const Icon = item.icon;
                        const active = pathname === item.href;

                        return (
                            <button
                                key={item.href}
                                type="button"
                                onClick={() => router.push(item.href)}
                                className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition ${
                                    active
                                        ? "bg-[#FB923C] text-white shadow-lg shadow-orange-500/10"
                                        : "text-slate-400 hover:bg-[#1E293B] hover:text-white"
                                }`}
                            >
                                <Icon
                                    className={`h-5 w-5 transition ${
                                        active
                                            ? "text-white"
                                            : "text-slate-500 group-hover:text-slate-300"
                                    }`}
                                />

                                <span className="font-dmsans text-sm font-medium">
                                    {item.title}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </aside>

        </div>
    );
}