"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    HiOutlineUser,
    HiOutlineCog6Tooth,
    HiOutlineBell,
    HiOutlineCodeBracket,
    HiOutlineMoon,
    HiOutlineArrowRightOnRectangle,
} from "react-icons/hi2";
import { getUser, AuthUser } from "@/lib/auth";

interface ProfileDropdownProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    developerMode?: boolean;
    darkMode?: boolean;
    onToggleDeveloperMode?: () => void;
    onToggleDarkMode?: () => void;
    onProfile?: () => void;
    onSettings?: () => void;
    onNotifications?: () => void;
    onLogout?: () => void;
}

export default function ProfileDropdown({
    open,
    setOpen,
    developerMode = false,
    darkMode = false,
    onToggleDeveloperMode,
    onToggleDarkMode,
    onProfile,
    onSettings,
    onNotifications,
    onLogout,
}: ProfileDropdownProps) {
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        setUser(getUser());
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [setOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setOpen(!open)}
                className="rounded-xl overflow-hidden cursor-pointer"
            >
                <img
                    src="https://cdn.pixabay.com/photo/2021/11/24/05/19/user-6820232_1280.png"
                    alt={user?.firstName || "User"}
                    className="w-11 h-11 object-cover rounded-xl mt-1"
                />
            </button>

            {open && (
                <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50">

                    {/* Header */}
                    <div className="px-5 py-4 border-b">
                        <div className="flex items-center gap-3">
                            <img
                                src="https://cdn.pixabay.com/photo/2021/11/24/05/19/user-6820232_1280.png"
                                alt={user?.firstName || "User"}
                                className="w-12 h-12 rounded-xl object-cover"
                            />

                            <div>
                                <h3 className="font-semibold font-google-sans">
                                    {user?.firstName}
                                </h3>

                                <p className="text-xs text-gray-500 font-google-sans">
                                    {user?.email}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Menu */}

                    <button
                        onClick={() => {
                            if (onProfile) {
                                onProfile();
                            } else {
                                router.push("/user");
                            }
                            setOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition cursor-pointer"
                    >
                        <HiOutlineUser size={20} />
                        <span>My Profile</span>
                    </button>

                    <button
                        onClick={() => {
                            if (onSettings) {
                                onSettings();
                            } else {
                                router.push("/settings");
                            }
                            setOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition cursor-pointer"
                    >
                        <HiOutlineCog6Tooth size={20} />
                        <span>Settings</span>
                    </button>

                    <button
                        onClick={() => {
                            onNotifications?.();
                            setOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition cursor-pointer"
                    >
                        <HiOutlineBell size={20} />
                        <span>Notifications</span>
                    </button>

                    <button
                        onClick={onToggleDeveloperMode}
                        className="w-full flex justify-between items-center px-5 py-3 hover:bg-gray-50 transition cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <HiOutlineCodeBracket size={20} />
                            <span>Developer Mode</span>
                        </div>

                        <input
                            type="checkbox"
                            checked={developerMode}
                            readOnly
                        />
                    </button>

                    <button
                        onClick={onToggleDarkMode}
                        className="w-full flex justify-between items-center px-5 py-3 hover:bg-gray-50 transition cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <HiOutlineMoon size={20} />
                            <span>Dark Mode</span>
                        </div>

                        <input
                            type="checkbox"
                            checked={darkMode}
                            readOnly
                        />
                    </button>

                    <div className="border-t" />

                    <button
                        onClick={() => {
                            onLogout?.();
                            setOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-5 py-3 text-red-600 hover:bg-red-50 transition cursor-pointer"
                    >
                        <HiOutlineArrowRightOnRectangle size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            )}
        </div>
    );
}