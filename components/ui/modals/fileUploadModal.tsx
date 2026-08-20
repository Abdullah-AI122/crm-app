"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HiOutlineXMark, HiOutlineCloudArrowUp, HiOutlineDocumentText, HiOutlineTrash } from "react-icons/hi2";

export interface FileData {
    name: string;
    size?: string;
    type?: string;
    url: string;
}

interface FileUploadModalProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    currentFiles?: FileData[] | FileData | null;
    onSaveFiles: (files: FileData[]) => void;
}

export default function FileUploadModal({
    open,
    setOpen,
    currentFiles,
    onSaveFiles,
}: FileUploadModalProps) {
    const [fileList, setFileList] = useState<FileData[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!currentFiles) {
            setFileList([]);
        } else if (Array.isArray(currentFiles)) {
            setFileList(currentFiles);
        } else {
            setFileList([currentFiles]);
        }
    }, [currentFiles, open]);

    if (!open || !mounted) return null;

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const processFiles = (files: FileList | File[]) => {
        const fileArray = Array.from(files);
        if (fileArray.length === 0) return;

        const newFileDataList: FileData[] = [];
        let processedCount = 0;

        fileArray.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                newFileDataList.push({
                    name: file.name,
                    size: formatBytes(file.size),
                    type: file.type,
                    url: dataUrl,
                });
                processedCount++;
                if (processedCount === fileArray.length) {
                    setFileList((prev) => [...prev, ...newFileDataList]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
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
            processFiles(e.dataTransfer.files);
        }
    };

    const handleRemoveFile = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setFileList((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSaveFiles(fileList);
        setOpen(false);
    };

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        setOpen(false);
    };

    return createPortal(
        <div
            onClick={handleClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5 backdrop-blur-[2px]"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl font-dmsans"
            >
                <div className="mb-4 flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Manage & Upload Files
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Upload single or multiple images/documents for this record
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
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
                    className="hidden"
                    onChange={handleFileChange}
                />

                {/* Upload dropzone area */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`mb-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
                        isDragging
                            ? "border-[#FB923C] bg-[#FB923C]/5"
                            : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
                    }`}
                >
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#FB923C]/10 text-[#FB923C]">
                        <HiOutlineCloudArrowUp size={22} />
                    </div>
                    <p className="text-sm font-medium text-slate-800">
                        Click to upload <span className="font-normal text-slate-500">or drag and drop multiple files</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                        Select one or more images/documents (PNG, JPG, PDF, etc.)
                    </p>
                </div>

                {/* List of current files */}
                {fileList.length > 0 && (
                    <div className="mb-4 max-h-48 overflow-y-auto space-y-2 pr-1">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Attached Files ({fileList.length})
                        </div>
                        {fileList.map((file, idx) => {
                            const isImg = file?.url?.startsWith("data:image/") ||
                                file?.type?.startsWith("image/") ||
                                /\.(jpg|jpeg|png|gif|webp|svg|jfif|bmp)($|\?)/i.test(file?.url || "") ||
                                /\.(jpg|jpeg|png|gif|webp|svg|jfif|bmp)($|\?)/i.test(file?.name || "");

                            return (
                                <div key={idx} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs">
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
                                            {file.size && <p className="text-[10px] text-slate-400">{file.size}</p>}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => handleRemoveFile(idx, e)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer shrink-0"
                                        title="Remove file"
                                    >
                                        <HiOutlineTrash size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleSave}
                        className="flex-1 cursor-pointer rounded-xl bg-[#FB923C] py-2.5 text-sm font-medium text-white transition hover:bg-[#F97316]"
                    >
                        Save ({fileList.length} {fileList.length === 1 ? "file" : "files"})
                    </button>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 cursor-pointer rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
