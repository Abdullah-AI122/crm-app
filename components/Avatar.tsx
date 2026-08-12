"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@heroui/react";
import { HiOutlineCog6Tooth } from "react-icons/hi2";
import { getUser, AuthUser } from "@/lib/auth";

export default function UserAvatar() {
    const router = useRouter();

    const [user, setUser] = useState<AuthUser | null>(null);
    const [open, setOpen] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setUser(getUser());
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setOpen(!open)}
                className="cursor-pointer rounded-full"
            >
                <Avatar className="border border-slate-600">
                    <Avatar.Image
                        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 14.2a7.2 7.2 0 0 1-6-3.22c.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08a7.2 7.2 0 0 1-6 3.22z'/%3E%3C/svg%3E"
                        alt={user?.firstName || "User"}
                    />
                    <Avatar.Fallback>
                        {user?.firstName?.charAt(0).toUpperCase() || "U"}
                    </Avatar.Fallback>
                </Avatar>
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-700 bg-[#111727] shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-4 border-b border-slate-700">
                        <p className="text-white font-semibold font-dmsans">
                            {user?.firstName}
                        </p>
                        <p className="text-sm text-slate-400 truncate font-dmsans">
                            {user?.email}
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            router.push("/user");
                            setOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-slate-800 transition cursor-pointer font-dmsans"
                    >
                        <HiOutlineCog6Tooth className="w-5 h-5" />
                        Settings
                    </button>
                </div>
            )}
        </div>
    );
}