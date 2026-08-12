"use client";

import { useEffect, useRef, useState } from "react";
import { getUser, AuthUser } from "@/lib/auth";
import ThemeButton from "./ui/buttons/themebutton";
import Link from "next/link";
import { profileLinks } from "@/data/data";
import { HiOutlineArrowRightOnRectangle, HiOutlineClipboard, HiCheck } from "react-icons/hi2";

import userAsset from "@/app/assets/user.png";

interface ProfileDropdownProps {
    open?: boolean;
    setOpen?: (open: boolean) => void;
    onLogout?: () => void;
    profileImage?: string;
    userName?: string;
}

export default function ProfileDropdown({
    open: externalOpen,
    setOpen: externalSetOpen,
    onLogout,
    profileImage,
    userName,
}: ProfileDropdownProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [internalOpen, setInternalOpen] = useState(false);
    const [copying, setCopying] = useState(false);
    const [copied, setCopied] = useState(false);

    const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
    const setIsOpen = externalSetOpen || setInternalOpen;

    useEffect(() => {
        setUser(getUser());
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [setIsOpen]);

    const handleCopyUid = async () => {
        const uid = user?.id;
        if (!uid) return;
        setCopying(true);
        try {
            await navigator.clipboard.writeText(uid);
            setCopying(false);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopying(false);
        }
    };

    const displayImage = profileImage || userAsset.src;
    const displayName = userName || user?.firstName || "User";

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-xl overflow-hidden cursor-pointer w-8 h-8 mt-1"
            >
                <img
                    src={displayImage}
                    alt={displayName}
                    className="w-full h-full rounded-full object-cover"
                />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-82 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">

                    <div className="py-2 border-b pl-5 flex items-center justify-between w-full">
                        <div className="flex items-center gap-3 w-full">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold font-google-sans truncate text-slate-800">
                                    {displayName}
                                </h3>

                                <p className="text-xs text-gray-500 font-google-sans truncate">
                                    {user?.email}
                                </p>

                                {user?.id && (
                                    <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 font-google-sans">
                                        <span className="truncate max-w-[140px]" title={user.id}>
                                            ID: {user.id}
                                        </span>
                                        <button
                                            onClick={handleCopyUid}
                                            disabled={copying}
                                            title="Copy UID"
                                            className="p-1 rounded hover:bg-gray-100 text-gray-600 transition cursor-pointer flex items-center justify-center disabled:opacity-50"
                                        >
                                            {copying ? (
                                                <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                            ) : copied ? (
                                                <HiCheck className="w-3.5 h-3.5 text-green-600" />
                                            ) : (
                                                <HiOutlineClipboard className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="ml-auto mr-3 flex-shrink-0">
                                <button
                                     onClick={() => {
                                         onLogout?.();
                                         setIsOpen(false);
                                     }}
                                     className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition cursor-pointer"
                                 >
                                     <HiOutlineArrowRightOnRectangle size={20} />
                                 </button>
                            </div>
                        </div>
                    </div>

                    <main className="grid grid-cols-2">

                        <div className="flex flex-col px-3 py-2 font-google-sans text-sm ">
                            {profileLinks.map((link) => (
                                <Link
                                    href={link.url}
                                    key={link.id}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50 transition"
                                >
                                    {link.icon}
                                    <span>{link.name}</span>
                                </Link>
                            ))}
                        </div>

                        <div className="px-2 py-2">
                            <ThemeButton />
                        </div>

                    </main>
                </div>
            )}
        </div>
    );
}
