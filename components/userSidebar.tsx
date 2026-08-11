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
        <aside className="w-72 bg-[#111727] border-r border-slate-700 rounded-2xl p-4 h-fit sticky top-6">
            <h2 className="text-xl font-semibold text-white font-dmsans mb-6">
                Account
            </h2>

            <div className="space-y-1">
                {menu.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;

                    return (
                        <button
                            key={item.href}
                            onClick={() => router.push(item.href)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition cursor-pointer ${
                                active
                                    ? "bg-[#1E293B] text-white"
                                    : "text-slate-400 hover:bg-[#1E293B] hover:text-white"
                            }`}
                        >
                            <Icon className="w-5 h-5" />

                            <span className="font-dmsans">
                                {item.title}
                            </span>
                        </button>
                    );
                })}
            </div>
        </aside>
    );
}