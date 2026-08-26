"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    HiOutlineXMark,
    HiOutlinePaperAirplane,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineArrowUturnLeft,
    HiOutlineChatBubbleLeftEllipsis,
    HiOutlineLink,
    HiCheck
} from "react-icons/hi2";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

import {
    useGetRecordAmendmentsQuery,
    useCreateAmendmentMutation,
    useUpdateAmendmentMutation,
    useDeleteAmendmentMutation
} from "@/store/api/amendments.api";
import { useGetMembersQuery } from "@/store/api/members.api";
import { PersonAvatar, memberUserId } from "@/components/ui/helpers/personCell";
import { canManageRoles } from "@/lib/roles";
import { getUser } from "@/lib/auth";
import { toast } from "@/components/ui/toast";
import type { RecordAmendment, RecordItem } from "@/store/types";

/**
 * The amendments panel: what people have SAID about one record.
 *
 * Deliberately separate from the activity drawer, which is what the server
 * recorded about what changed. Both are per-record histories and they are read
 * for different reasons — "why is this stuck" is answered here, "who moved it"
 * is answered there.
 *
 * Nothing is fetched until a record is actually passed in: the panel is gated
 * on `record`, which starts null, so a board draws its bubbles from the count
 * already on each row and pays for nothing else.
 */

interface RecordAmendmentsPanelProps {
    /**
     * The record whose amendments to show — null keeps the panel closed. The
     * caller keys this component on the record id, so every draft below is
     * re-seeded by the remount rather than by an effect.
     */
    record: RecordItem | null;
    workspaceId: string;
    /** The row's collection, so posting can patch its count without a refetch. */
    collectionId?: string;
    onClose: () => void;
}

/** "2m ago" / "3h ago" / "5d ago", falling back to a date past a fortnight. */
function timeAgo(iso: string): string {
    const then = new Date(iso).getTime();
    if (isNaN(then)) return "";

    const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 1209600) return `${Math.floor(seconds / 86400)}d ago`;

    return new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
    });
}

/**
 * RTK Query rejects with the server's body under `data`. Every failure here is
 * REPORTED with the server's own wording rather than a guess, because "you can
 * only edit your own amendments" and "the module is gone" need different reactions.
 */
function serverMessage(error: unknown, fallback: string): string {
    const data = (error as { data?: { message?: string } } | null)?.data;
    return typeof data?.message === "string" ? data.message : fallback;
}

function authorName(amendment: RecordAmendment): string {
    const user = amendment.user;
    if (!user) return "Deleted amendment";
    return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
}

/** A textarea that grows with its content — an amendment is not a single line. */
function GrowingTextarea({
    value,
    onChange,
    onSubmit,
    placeholder,
    autoFocus = false,
    rows = 2
}: {
    value: string;
    onChange: (next: string) => void;
    onSubmit: () => void;
    placeholder: string;
    autoFocus?: boolean;
    rows?: number;
}) {
    const ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (autoFocus) ref.current?.focus();
    }, [autoFocus]);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;
        node.style.height = "auto";
        node.style.height = `${Math.min(node.scrollHeight, 200)}px`;
    }, [value]);

    return (
        <textarea
            ref={ref}
            rows={rows}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
                // Enter alone inserts a newline: an amendment is prose, and losing
                // a half-written paragraph to a stray keypress is unforgivable.
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    onSubmit();
                }
            }}
            className="w-full resize-none rounded-lg border border-slate-300 bg-card px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-accent"
        />
    );
}

export default function RecordAmendmentsPanel({
    record,
    workspaceId,
    collectionId,
    onClose
}: RecordAmendmentsPanelProps) {
    const recordId = record?._id;

    /**
     * Set when this row is a sub-record. Its count lives in
     * getSubRecords(parent), not in the collection list, so every write below
     * has to say which cache entry to patch — see patchCount in the api file.
     */
    const parentRecordId = record?.parentRecord ?? null;

    const { data: amendments = [], isLoading, isFetching } = useGetRecordAmendmentsQuery(
        recordId as string,
        { skip: !recordId }
    );

    // Already in cache on every board page — this costs no extra request and is
    // only read to decide whether to OFFER moderation. The server re-checks.
    const { data: members = [] } = useGetMembersQuery(workspaceId, { skip: !recordId });

    const [createAmendment, { isLoading: posting }] = useCreateAmendmentMutation();
    const [updateAmendment] = useUpdateAmendmentMutation();
    const [deleteAmendment] = useDeleteAmendmentMutation();

    const [draft, setDraft] = useState("");
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [replyDraft, setReplyDraft] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState("");
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const currentUserId = getUser()?.id;

    const canModerate = canManageRoles(
        members.find((m) => memberUserId(m) === currentUserId)?.role
    );

    useEffect(() => {
        if (!recordId) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [recordId, onClose]);

    /**
     * Top-level amendments, each carrying its own replies in order. Written as a
     * plain derivation on purpose: the React Compiler handles the memoisation,
     * and hand-rolled useMemo over values it cannot prove stable is what the
     * board's other helpers were rewritten to avoid.
     */
    const repliesByParent = new Map<string, RecordAmendment[]>();

    for (const amendment of amendments) {
        if (!amendment.parentComment) continue;
        const key = String(amendment.parentComment);
        repliesByParent.set(key, [...(repliesByParent.get(key) ?? []), amendment]);
    }

    const threads = amendments
        .filter((c) => !c.parentComment)
        .map((root) => ({ root, replies: repliesByParent.get(root._id) ?? [] }));

    const post = async (message: string, parentComment?: string) => {
        const text = message.trim();
        if (!text || !recordId) return false;

        try {
            await createAmendment({
                recordId,
                message: text,
                parentComment,
                collectionId,
                parentRecordId
            }).unwrap();
            return true;
        } catch (error) {
            toast.error(
                "Could not post that amendment",
                serverMessage(error, "The server rejected the write.")
            );
            return false;
        }
    };

    const submitDraft = async () => {
        if (await post(draft)) setDraft("");
    };

    const submitReply = async (parentId: string) => {
        if (await post(replyDraft, parentId)) {
            setReplyDraft("");
            setReplyTo(null);
        }
    };

    const saveEdit = async (amendment: RecordAmendment) => {
        const text = editDraft.trim();

        if (!text || !recordId) return;

        if (text === amendment.message) {
            setEditingId(null);
            return;
        }

        try {
            await updateAmendment({
                amendmentId: amendment._id,
                recordId,
                message: text
            }).unwrap();
            setEditingId(null);
        } catch (error) {
            toast.error(
                "Could not save that edit",
                serverMessage(error, "The server rejected the write.")
            );
        }
    };

    const remove = async (amendment: RecordAmendment) => {
        if (!recordId) return;

        try {
            await deleteAmendment({
                amendmentId: amendment._id,
                recordId,
                collectionId,
                parentRecordId
            }).unwrap();

            setConfirmingId(null);

            // Replies are left standing — they are someone else's words, and a
            // thread with its opening line removed still reads.
            toast.success("Amendment deleted");
        } catch (error) {
            setConfirmingId(null);
            toast.error(
                "Could not delete that amendment",
                serverMessage(error, "The server rejected the write.")
            );
        }
    };

    /**
     * The panel's own URL. The board puts /Record/<id> in the address bar when
     * it opens one, so this is simply wherever we already are — no id has to be
     * threaded down here, and what gets copied is exactly what the user sees.
     */
    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            // Denied clipboard permission, or an insecure origin. Say so rather
            // than leaving a button that silently does nothing.
            toast.error(
                "Could not copy the link",
                "Copy it from the address bar instead."
            );
        }
    };

    if (!record || typeof document === "undefined") return null;

    const total = amendments.filter((c) => !c.isDeleted).length;

    const renderAmendment = (amendment: RecordAmendment, replyCount: number, isReply: boolean) => {
        const mine = amendment.user?._id === currentUserId;
        const editing = editingId === amendment._id;

        if (amendment.isDeleted) {
            return (
                <div
                    key={amendment._id}
                    className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs italic text-muted"
                >
                    This amendment was deleted.
                </div>
            );
        }

        return (
            <div key={amendment._id} className="group/amendment">
                <div className="flex items-start gap-2.5">
                    <PersonAvatar
                        member={{ user: amendment.user ?? undefined }}
                        size={isReply ? 24 : 30}
                        ring={false}
                    />

                    <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                            <span className="truncate text-sm font-bold text-slate-900">
                                {authorName(amendment)}
                            </span>
                            <span className="shrink-0 text-[11px] text-muted">
                                {timeAgo(amendment.createdAt)}
                                {amendment.edited ? " · edited" : ""}
                            </span>
                        </div>

                        {editing ? (
                            <div className="mt-1.5 space-y-2">
                                <GrowingTextarea
                                    value={editDraft}
                                    onChange={setEditDraft}
                                    onSubmit={() => saveEdit(amendment)}
                                    placeholder="Edit your amendment"
                                    autoFocus
                                />
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => saveEdit(amendment)}
                                        className="cursor-pointer rounded-md bg-accent px-2.5 py-1 text-xs font-bold text-white transition hover:bg-accent-hover"
                                    >
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingId(null)}
                                        className="cursor-pointer text-xs font-semibold text-muted transition hover:text-slate-700"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                                {amendment.message}
                            </p>
                        )}

                        {!editing && (
                            <div className="mt-1 flex items-center gap-3 opacity-0 transition group-hover/amendment:opacity-100 focus-within:opacity-100">
                                {!isReply && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setReplyTo(replyTo === amendment._id ? null : amendment._id);
                                            setReplyDraft("");
                                        }}
                                        className="flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-muted transition hover:text-accent"
                                    >
                                        <HiOutlineArrowUturnLeft className="h-3 w-3" />
                                        Reply
                                    </button>
                                )}

                                {mine && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingId(amendment._id);
                                            setEditDraft(amendment.message);
                                        }}
                                        className="flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-muted transition hover:text-accent"
                                    >
                                        <HiOutlinePencil className="h-3 w-3" />
                                        Edit
                                    </button>
                                )}

                                {(mine || canModerate) && (
                                    confirmingId === amendment._id ? (
                                        <span className="flex items-center gap-2 text-[11px] font-semibold">
                                            <button
                                                type="button"
                                                onClick={() => remove(amendment)}
                                                className="cursor-pointer text-red-600 transition hover:text-red-700"
                                            >
                                                {replyCount
                                                    ? "Delete, keep replies"
                                                    : "Confirm delete"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setConfirmingId(null)}
                                                className="cursor-pointer text-muted transition hover:text-slate-700"
                                            >
                                                Cancel
                                            </button>
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setConfirmingId(amendment._id)}
                                            className="flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-muted transition hover:text-red-600"
                                        >
                                            <HiOutlineTrash className="h-3 w-3" />
                                            Delete
                                        </button>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex justify-end font-google-sans">

            {/* Scrim — clicking outside closes, matching the activity drawer */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />

            <aside
                className="relative flex h-full w-[460px] max-w-[94vw] flex-col border-l border-slate-200 bg-card shadow-2xl"
                role="dialog"
                aria-label={`Amendments on ${record.name}`}
            >
                {/* Header — h-16 matches the page headers it sits beside */}
                <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-4">
                    <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                            <HiOutlineChatBubbleLeftEllipsis className="h-4 w-4" />
                        </span>

                        <span className="min-w-0">
                            <span className="block truncate text-sm font-bold leading-tight text-slate-900">
                                {record.name}
                            </span>
                            <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
                                {total === 0
                                    ? "Amendments"
                                    : `${total} amendment${total === 1 ? "" : "s"}`}
                            </span>
                        </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">

                    <button
                        type="button"
                        onClick={copyLink}
                        aria-label="Copy link to this record"
                        title={copied ? "Link copied" : "Copy link to this record"}
                        className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition hover:bg-slate-100 ${copied ? "text-emerald-600" : "text-muted hover:text-slate-700"}`}
                    >
                        {copied ? (
                            <HiCheck className="h-4 w-4" />
                        ) : (
                            <HiOutlineLink className="h-4 w-4" />
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close amendments"
                        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <HiOutlineXMark className="h-4 w-4" />
                    </button>

                    </div>
                </div>

                {/* Thread */}
                <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted">
                            <AiOutlineLoading3Quarters className="h-3.5 w-3.5 animate-spin" />
                            Loading amendments
                        </div>
                    ) : threads.length === 0 ? (
                        <div className="flex flex-col items-center gap-1 py-12 text-center">
                            <HiOutlineChatBubbleLeftEllipsis className="h-7 w-7 text-slate-300" />
                            <p className="text-sm font-bold text-slate-700">No amendments yet</p>
                            <p className="max-w-[24ch] text-xs text-muted">
                                Write the first one — what changed, what is blocked, what comes next.
                            </p>
                        </div>
                    ) : (
                        threads.map(({ root, replies }) => (
                            <div key={root._id} className="space-y-3">
                                {renderAmendment(root, replies.length, false)}

                                {replies.length > 0 && (
                                    <div className="ml-4 space-y-3 border-l border-slate-200 pl-4">
                                        {replies.map((reply) => renderAmendment(reply, 0, true))}
                                    </div>
                                )}

                                {replyTo === root._id && (
                                    <div className="ml-4 space-y-2 border-l border-slate-200 pl-4">
                                        <GrowingTextarea
                                            value={replyDraft}
                                            onChange={setReplyDraft}
                                            onSubmit={() => submitReply(root._id)}
                                            placeholder={`Reply to ${authorName(root)}`}
                                            autoFocus
                                            rows={1}
                                        />
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                disabled={!replyDraft.trim() || posting}
                                                onClick={() => submitReply(root._id)}
                                                className="cursor-pointer rounded-md bg-accent px-2.5 py-1 text-xs font-bold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Reply
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setReplyTo(null)}
                                                className="cursor-pointer text-xs font-semibold text-muted transition hover:text-slate-700"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Composer */}
                <div className="shrink-0 border-t border-slate-200 px-4 py-3">
                    <GrowingTextarea
                        value={draft}
                        onChange={setDraft}
                        onSubmit={submitDraft}
                        placeholder="Write an amendment…"
                    />

                    <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-muted">
                            {isFetching && !isLoading ? "Refreshing…" : "Ctrl + Enter to post"}
                        </span>

                        <button
                            type="button"
                            disabled={!draft.trim() || posting}
                            onClick={submitDraft}
                            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {posting ? (
                                <AiOutlineLoading3Quarters className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <HiOutlinePaperAirplane className="h-3.5 w-3.5" />
                            )}
                            Post
                        </button>
                    </div>
                </div>
            </aside>
        </div>,
        document.body
    );
}
