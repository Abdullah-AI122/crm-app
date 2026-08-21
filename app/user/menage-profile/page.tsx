"use client";

import { useEffect, useRef, useState } from "react";
import { getUser, updateUser, AuthUser } from "@/lib/auth";
import {
    HiOutlineUser,
    HiOutlineEnvelope,
    HiOutlineIdentification,
    HiOutlineCamera,
    HiOutlineTrash,
    HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import UserSidebar from "@/components/userSidebar";
import {
    useDeleteAvatarMutation,
    useUploadAvatarMutation,
} from "@/store/api/uploads.api";
import {
    UPLOAD_RULES,
    compressImage,
    formatBytes,
    previewUrl,
    validateFile,
} from "@/lib/imageCompression";

const RULES = UPLOAD_RULES.avatar;

export default function UserPage() {
    const [user, setUser] = useState<AuthUser | null>(null);

    // Set the moment a file is picked so the new picture appears before the
    // upload finishes; cleared once the Cloudinary URL lands.
    const [optimisticAvatar, setOptimisticAvatar] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const objectUrl = useRef<string | null>(null);

    const [uploadAvatar, { isLoading: uploading }] = useUploadAvatarMutation();
    const [deleteAvatar, { isLoading: removing }] = useDeleteAvatarMutation();

    useEffect(() => {
        setUser(getUser());
        return () => {
            if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
        };
    }, []);

    const busy = uploading || removing;
    const avatarSrc = optimisticAvatar || user?.avatar || "";
    const initial = user?.firstName?.[0]?.toUpperCase() || "U";

    const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        setError(null);
        setNotice(null);

        const check = validateFile(file, "avatar");
        if (!check.ok) {
            setError(check.error ?? "That file cannot be used");
            return;
        }

        // Square-ish and small: the server crops to 512x512 anyway.
        const compressed = await compressImage(file, "avatar");

        if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
        objectUrl.current = previewUrl(compressed);
        setOptimisticAvatar(objectUrl.current);

        try {
            const result = await uploadAvatar(compressed).unwrap();

            updateUser({ avatar: result.avatar });
            setUser(getUser());
            setOptimisticAvatar(null);
            setNotice(
                `Picture updated — ${formatBytes(file.size)} compressed to ${formatBytes(result.bytes)}`
            );
        } catch (err: unknown) {
            const message =
                (err as { data?: { message?: string } })?.data?.message ??
                "Could not upload your picture. Please try again.";
            setError(message);
            setOptimisticAvatar(null);
        }
    };

    const handleRemove = async () => {
        setError(null);
        setNotice(null);

        try {
            await deleteAvatar().unwrap();
            updateUser({ avatar: "" });
            setUser(getUser());
            setOptimisticAvatar(null);
            setNotice("Profile picture removed");
        } catch (err: unknown) {
            const message =
                (err as { data?: { message?: string } })?.data?.message ??
                "Could not remove your picture.";
            setError(message);
        }
    };

    return (
        <div className="min-h-screen bg-card">
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
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={RULES.accept}
                                className="hidden"
                                onChange={handlePick}
                            />

                            <button
                                type="button"
                                onClick={() => !busy && fileInputRef.current?.click()}
                                disabled={busy}
                                title="Change profile picture"
                                className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 transition cursor-pointer disabled:cursor-wait"
                            >
                                {avatarSrc ? (
                                    <img
                                        src={avatarSrc}
                                        alt={user?.firstName || "Profile picture"}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="flex h-full w-full items-center justify-center bg-slate-700 text-2xl font-semibold text-white font-dmsans">
                                        {initial}
                                    </span>
                                )}

                                <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition group-hover:opacity-100">
                                    {uploading ? (
                                        <AiOutlineLoading3Quarters size={20} className="animate-spin" />
                                    ) : (
                                        <HiOutlineCamera size={20} />
                                    )}
                                </span>

                                {uploading && (
                                    <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                                        <AiOutlineLoading3Quarters size={20} className="animate-spin" />
                                    </span>
                                )}
                            </button>

                            <div className="min-w-0">
                                <h2 className="text-xl font-semibold text-slate-900 font-dmsans">
                                    {user?.firstName || "User"}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500 font-dmsans">
                                    {user?.email || "-"}
                                </p>

                                <div className="mt-2 flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={busy}
                                        className="text-xs font-medium text-[#FB923C] transition hover:text-[#EA580C] font-dmsans cursor-pointer disabled:opacity-50"
                                    >
                                        {user?.avatar ? "Change picture" : "Upload picture"}
                                    </button>

                                    {user?.avatar && (
                                        <button
                                            type="button"
                                            onClick={handleRemove}
                                            disabled={busy}
                                            className="flex items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-red-600 font-dmsans cursor-pointer disabled:opacity-50"
                                        >
                                            <HiOutlineTrash size={13} />
                                            Remove
                                        </button>
                                    )}
                                </div>

                                <p className="mt-1.5 text-[11px] text-slate-400 font-dmsans">
                                    {RULES.hint} · resized and compressed automatically
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-6 flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 font-dmsans">
                                <HiOutlineExclamationTriangle size={14} className="mt-px shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {notice && !error && (
                            <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700 font-dmsans">
                                {notice}
                            </div>
                        )}

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
