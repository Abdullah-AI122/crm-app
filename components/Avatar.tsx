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
                        src="https://iconape.com/wp-content/files/jh/12297/png/user-circle.png"
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