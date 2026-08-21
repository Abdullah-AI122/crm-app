"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    HiOutlineXMark,
    HiOutlineCloudArrowUp,
    HiOutlineDocumentText,
    HiOutlineTrash,
    HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useUploadWorkspaceFilesMutation } from "@/store/api/uploads.api";
import {
    UPLOAD_RULES,
    compressImage,
    formatBytes,
    previewUrl,
    validateFile,
} from "@/lib/imageCompression";

export interface FileData {
    name: string;
    size?: string;
    type?: string;
    url: string;
    publicId?: string;
    /** Present only while the row is a local, not-yet-uploaded placeholder. */
    pending?: boolean;
}

interface FileUploadModalProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    currentFiles?: FileData[] | FileData | null;
    onSaveFiles: (files: FileData[]) => void;
    workspaceId?: string;
    recordId?: string;
}

const RULES = UPLOAD_RULES.attachment;

export default function FileUploadModal({
    open,
    setOpen,
    currentFiles,
    onSaveFiles,
    workspaceId,
    recordId,
}: FileUploadModalProps) {
    const [fileList, setFileList] = useState<FileData[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [mounted, setMounted] = useState(false);

    // Object URLs created for optimistic previews, revoked when the modal closes.
    const objectUrls = useRef<string[]>([]);

    const [uploadFiles] = useUploadWorkspaceFilesMutation();

    useEffect(() => {
        setMounted(true);
        return () => {
            objectUrls.current.forEach(URL.revokeObjectURL);
            objectUrls.current = [];
        };
    }, []);

    useEffect(() => {
        if (!currentFiles) {
            setFileList([]);
        } else if (Array.isArray(currentFiles)) {
            setFileList(currentFiles);
        } else {
            setFileList([currentFiles]);
        }
        setErrors([]);
    }, [currentFiles, open]);

    if (!open || !mounted) return null;

    /**
     * Validate → compress → show an optimistic local row → upload → swap in the
     * Cloudinary URL. A failed upload drops its placeholder and reports why.
     */
    const processFiles = async (incoming: FileList | File[]) => {
        const picked = Array.from(incoming);
        if (picked.length === 0) return;

        setErrors([]);

        const room = RULES.maxFiles - fileList.length;
        const nextErrors: string[] = [];

        if (room <= 0) {
            setErrors([`You can attach at most ${RULES.maxFiles} files`]);
            return;
        }

        if (picked.length > room) {
            nextErrors.push(`Only the first ${room} of ${picked.length} files were added (max ${RULES.maxFiles})`);
        }

        const accepted: File[] = [];

        for (const file of picked.slice(0, room)) {
            const check = validateFile(file, "attachment");
            if (check.ok) {
                accepted.push(file);
            } else if (check.error) {
                nextErrors.push(check.error);
            }
        }

        setErrors(nextErrors);

        if (accepted.length === 0) return;

        setBusy(true);

        try {
            // Images shrink here so a 6 MB photo leaves the browser at ~200 KB.
            const compressed = await Promise.all(
                accepted.map((f) => compressImage(f, "attachment"))
            );

            const placeholders: FileData[] = compressed.map((file) => {
                const url = previewUrl(file);
                objectUrls.current.push(url);
                return {
                    name: file.name,
                    size: formatBytes(file.size),
                    type: file.type,
                    url,
                    pending: true,
                };
            });

            setFileList((prev) => [...prev, ...placeholders]);

            if (!workspaceId) {
                // No workspace context — keep the local preview but say it is not stored.
                setErrors((prev) => [...prev, "No workspace context: files were not uploaded"]);
                return;
            }

            const result = await uploadFiles({ workspaceId, files: compressed, recordId }).unwrap();

            setFileList((prev) => {
                const withoutPlaceholders = prev.filter((f) => !placeholders.includes(f));
                const uploaded: FileData[] = result.files.map((f) => ({
                    name: f.name,
                    size: formatBytes(f.bytes),
                    type: f.mimeType,
                    url: f.url,
                    publicId: f.publicId,
                }));
                return [...withoutPlaceholders, ...uploaded];
            });

        } catch (error: unknown) {
            const message =
                (error as { data?: { message?: string } })?.data?.message ??
                "Upload failed. Please try again.";
            setErrors((prev) => [...prev, message]);
            setFileList((prev) => prev.filter((f) => !f.pending));
        } finally {
            setBusy(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            void processFiles(e.target.files);
            e.target.value = "";
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            void processFiles(e.dataTransfer.files);
        }
    };

    const handleRemoveFile = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setFileList((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Placeholders are local blob: URLs — they must never reach the database.
        onSaveFiles(fileList.filter((f) => !f.pending));
        setOpen(false);
    };

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        setOpen(false);
    };

    const storedCount = fileList.filter((f) => !f.pending).length;

    return createPortal(
        <div
            onClick={handleClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5 backdrop-blur-[2px]"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-2xl border border-slate-200 bg-card p-6 shadow-2xl font-dmsans"
            >
                <div className="mb-4 flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Manage &amp; Upload Files
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Images are compressed before upload and stored on Cloudinary
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Close"
                    >
                        <HiOutlineXMark size={18} strokeWidth={2.5} />
                    </button>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={RULES.accept}
                    className="hidden"
                    onChange={handleFileChange}
                />

                {/* Upload dropzone area */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !busy && fileInputRef.current?.click()}
                    className={`mb-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${busy ? "cursor-wait opacity-70" : "cursor-pointer"} ${isDragging
                        ? "border-[#FB923C] bg-[#FB923C]/5"
                        : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
                        }`}
                >
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#FB923C]/10 text-[#FB923C]">
                        {busy ? (
                            <AiOutlineLoading3Quarters size={20} className="animate-spin" />
                        ) : (
                            <HiOutlineCloudArrowUp size={22} />
                        )}
                    </div>
                    <p className="text-sm font-medium text-slate-800">
                        {busy ? (
                            "Compressing and uploading…"
                        ) : (
                            <>
                                Click to upload{" "}
                                <span className="font-normal text-slate-500">or drag and drop</span>
                            </>
                        )}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">{RULES.hint}</p>
                </div>

                {errors.length > 0 && (
                    <div className="mb-4 space-y-1 rounded-lg border border-red-200 bg-red-50 p-2.5">
                        {errors.map((message, idx) => (
                            <p key={idx} className="flex items-start gap-1.5 text-[11px] text-red-700">
                                <HiOutlineExclamationTriangle size={13} className="mt-px shrink-0" />
                                <span>{message}</span>
                            </p>
                        ))}
                    </div>
                )}

                {/* List of current files */}
                {fileList.length > 0 && (
                    <div className="mb-4 max-h-48 overflow-y-auto space-y-2 pr-1">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Attached Files ({fileList.length})
                        </div>
                        {fileList.map((file, idx) => {
                            const isImg =
                                file?.type?.startsWith("image/") ||
                                file?.url?.startsWith("blob:") ||
                                /\.(jpg|jpeg|png|gif|webp|svg|jfif|bmp|avif)($|\?)/i.test(file?.url || "") ||
                                /\.(jpg|jpeg|png|gif|webp|svg|jfif|bmp|avif)($|\?)/i.test(file?.name || "");

                            return (
                                <div
                                    key={`${file.url}-${idx}`}
                                    className={`flex items-center justify-between gap-3 rounded-lg border p-2 text-xs transition ${file.pending
                                        ? "border-slate-200 bg-slate-50 opacity-60"
                                        : "border-slate-200 bg-slate-50"
                                        }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        {isImg ? (
                                            <img
                                                src={file.url}
                                                alt={file.name}
                                                className="h-9 w-9 rounded object-cover border border-slate-200 shrink-0"
                                            />
                                        ) : (
                                            <div className="flex h-9 w-9 items-center justify-center rounded bg-blue-100 text-blue-600 shrink-0">
                                                <HiOutlineDocumentText size={20} />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium text-slate-800">{file.name}</p>
                                            <p className="text-[10px] text-slate-400">
                                                {file.pending ? "Uploading…" : file.size}
                                            </p>
                                        </div>
                                    </div>

                                    {file.pending ? (
                                        <AiOutlineLoading3Quarters
                                            size={14}
                                            className="shrink-0 animate-spin text-slate-400"
                                        />
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={(e) => handleRemoveFile(idx, e)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer shrink-0"
                                            title="Remove file"
                                        >
                                            <HiOutlineTrash size={16} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={busy}
                        className="flex-1 cursor-pointer rounded-xl bg-[#FB923C] py-2.5 text-sm font-medium text-white transition hover:bg-[#F97316] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Save ({storedCount} {storedCount === 1 ? "file" : "files"})
                    </button>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 cursor-pointer rounded-xl border border-slate-300 bg-card py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
