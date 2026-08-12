"use client";

import { useEffect, useRef, useState } from "react";
import {
    HiOutlineXMark,
    HiOutlineChevronDown,
    HiOutlineCheck,
} from "react-icons/hi2";

interface MemberInviteProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    userId: string;
    setUserId: (value: string) => void;
    role: string;
    setRole: (value: string) => void;
    adding: boolean;
    inviteMember: () => void;
}

const roles = [
    {
        value: "member",
        label: "Member",
        description: "Can work inside the workspace",
    },
    {
        value: "admin",
        label: "Admin",
        description: "Can manage workspace members",
    },
    {
        value: "guest",
        label: "Guest",
        description: "Has limited workspace access",
    },
];

export default function MemberInvite({
    open,
    setOpen,
    userId,
    setUserId,
    role,
    setRole,
    adding,
    inviteMember,
}: MemberInviteProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    if (!open) return null;

    const selectedRole =
        roles.find((item) => item.value === role) || roles[0];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center px-5 z-50">
            <div className="rounded-2xl px-6 py-5 w-full max-w-md shadow-2xl bg-white border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold font-google-sans text-slate-900">
                            Invite Member
                        </h2>

                        <p className="text-xs text-slate-400 mt-1 font-dmsans">
                            Add a member to your workspace
                        </p>
                    </div>

                    <button
                        onClick={() => setOpen(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition"
                        aria-label="Close"
                    >
                        <HiOutlineXMark strokeWidth={2.5} size={17} />
                    </button>
                </div>

                <div className="mb-4">
                    <label className="text-xs mb-1.5 block font-google-sans text-slate-700">
                        User ID
                    </label>

                    <input
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="Enter User ID"
                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#415A77] focus:ring-2 focus:ring-[#415A77]/10 transition font-dmsans placeholder:text-slate-400"
                    />
                </div>

                <div className="mb-6">
                    <label className="text-xs mb-1.5 block font-google-sans text-slate-700">
                        Assign Role
                    </label>

                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition font-dmsans flex items-center justify-between text-left ${
                                dropdownOpen
                                    ? "border-[#415A77] ring-2 ring-[#415A77]/10"
                                    : "border-slate-300 hover:border-slate-400"
                            }`}
                        >
                            <div>
                                <div className="text-slate-800 font-medium">
                                    {selectedRole.label}
                                </div>

                                <div className="text-xs text-slate-400 mt-0.5">
                                    {selectedRole.description}
                                </div>
                            </div>

                            <HiOutlineChevronDown
                                size={17}
                                className={`text-slate-400 transition-transform ${
                                    dropdownOpen ? "rotate-180" : ""
                                }`}
                            />
                        </button>

                        {dropdownOpen && (
                            <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5">
                                {roles.map((item) => (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => {
                                            setRole(item.value);
                                            setDropdownOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-lg transition cursor-pointer ${
                                            role === item.value
                                                ? "bg-slate-100"
                                                : "hover:bg-slate-50"
                                        }`}
                                    >
                                        <div>
                                            <div className="text-sm font-medium text-slate-800 font-dmsans">
                                                {item.label}
                                            </div>

                                            <div className="text-xs text-slate-400 mt-0.5 font-dmsans">
                                                {item.description}
                                            </div>
                                        </div>

                                        {role === item.value && (
                                            <HiOutlineCheck
                                                size={17}
                                                strokeWidth={2.5}
                                                className="text-[#FB923C]"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={inviteMember}
                        disabled={adding}
                        className="flex-1 bg-[#FB923C] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#FB923C]/80 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer font-dmsans"
                    >
                        {adding ? "Adding..." : "Add Member"}
                    </button>

                    <button
                        onClick={() => setOpen(false)}
                        className="flex-1 bg-white border border-slate-300 text-slate-700 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition cursor-pointer font-dmsans"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}