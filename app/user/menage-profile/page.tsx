"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@heroui/react";
import { getUser, AuthUser } from "@/lib/auth";
import {
    HiOutlineUser,
    HiOutlineEnvelope,
    HiOutlineIdentification,
    HiOutlineKey,
    HiOutlineClipboardDocument,
    HiOutlineArrowPath,
    HiOutlineCheck,
} from "react-icons/hi2";
import UserSidebar from "@/components/userSidebar";
import { apiRequest } from "@/lib/api";

export default function UserPage() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [apiKeyLoading, setApiKeyLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setUser(getUser());
        fetchApiKey();
    }, []);

    const fetchApiKey = async () => {
        try {
            const res = await apiRequest("/api/api-key");
            const data = await res.json();
            setApiKey(data.apiKey || null);
        } catch {
            setApiKey(null);
        }
    };

    const handleChangeKey = async () => {
        setApiKeyLoading(true);
        try {
            const res = await apiRequest("/api/api-key/generate", {
                method: "POST",
            });
            const data = await res.json();
            setApiKey(data.apiKey || null);
        } catch {
            console.error("Failed to change API key");
        } finally {
            setApiKeyLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!apiKey) return;
        try {
            await navigator.clipboard.writeText(apiKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            console.error("Failed to copy");
        }
    };

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

                        {/* API Key Section */}
                        <div className="border-t border-slate-200 pt-7 mt-8">
                            <div className="flex items-center gap-2 mb-1">
                                <HiOutlineKey className="w-4 h-4 text-slate-700" />
                                <h3 className="text-sm font-medium text-slate-900 font-dmsans">
                                    API Key
                                </h3>
                            </div>

                            <p className="text-xs text-slate-500 font-dmsans mb-5">
                                Use this permanent global key to access your CRM data via external applications. Keep it secret — treat it like a password.
                            </p>

                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">

                                {/* Key display */}
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            readOnly
                                            value={apiKey || "Loading API Key..."}
                                            className="w-full px-3 py-2.5 pr-10 rounded-md border border-slate-200 bg-white text-sm text-slate-800 font-mono tracking-tight focus:outline-none cursor-default select-all"
                                        />
                                    </div>

                                    {/* Copy button */}
                                    {apiKey && (
                                        <button
                                            onClick={handleCopy}
                                            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors font-dmsans shrink-0"
                                            title="Copy to clipboard"
                                        >
                                            {copied ? (
                                                <>
                                                    <HiOutlineCheck className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-emerald-600">Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <HiOutlineClipboardDocument className="w-4 h-4" />
                                                    <span>Copy</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Action button */}
                                <div className="flex items-center gap-2 mt-4">
                                    <button
                                        onClick={handleChangeKey}
                                        disabled={apiKeyLoading}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-dmsans"
                                    >
                                        <HiOutlineArrowPath
                                            className={`w-4 h-4 ${apiKeyLoading ? "animate-spin" : ""}`}
                                        />
                                        Change
                                    </button>
                                </div>

                                <p className="text-xs text-slate-400 font-dmsans mt-3">
                                    Changing your key will immediately invalidate the previous key.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}