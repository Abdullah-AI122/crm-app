"use client";

import { createPortal } from "react-dom";
import { Trash2, X, Loader2, TriangleAlert } from "lucide-react";

import type { Workspace } from "@/store/types";

interface DeleteWorkspaceProps {
    workspace: Workspace | null;
    deleting: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
}

/**
 * Deleting a workspace takes everything in it — modules, collections, records,
 * cells. That cascade is the whole reason this modal exists, so it says what
 * will actually be lost rather than asking a vague "are you sure?".
 *
 * There is no undo: hard deletes are not revertible in this system.
 */
export default function DeleteWorkspace({
    workspace,
    deleting,
    onClose,
    onConfirm,
}: DeleteWorkspaceProps) {
    if (!workspace || typeof document === "undefined") return null;

    const moduleCount = workspace.totalModules ?? 0;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-card p-6 shadow-2xl font-dmsans">
                <div className="mb-5 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50/80 text-red-600">
                            <Trash2 className="h-5 w-5" />
                        </span>

                        <div className="min-w-0">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Delete {workspace.name}?
                            </h2>
                            <p className="mt-0.5 text-xs text-muted">
                                This can&apos;t be undone.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Name the cascade — "are you sure?" is not information. */}
                <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50/80 px-4 py-3 text-xs leading-relaxed text-red-600">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                        {moduleCount > 0 ? (
                            <>
                                Its {moduleCount} module{moduleCount === 1 ? "" : "s"} go
                                with it, along with every collection, record and value
                                inside them.
                            </>
                        ) : (
                            <>
                                This workspace is empty, but removing it also removes its
                                members and history.
                            </>
                        )}
                    </span>
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={deleting}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                    >
                        {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                        {deleting ? "Deleting..." : "Delete workspace"}
                    </button>

                    <button
                        onClick={onClose}
                        disabled={deleting}
                        className="flex-1 rounded-xl border border-slate-300 bg-card py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
