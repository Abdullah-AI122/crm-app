"use client";

import { useState } from "react";
import {
    HiOutlineArrowRight,
    HiOutlineClock,
    HiOutlineArrowUturnLeft,
    HiOutlineBolt
} from "react-icons/hi2";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

import { timeAgo } from "@/lib/relativeTime";
import {
    useGetActivityQuery,
    useRevertActivityMutation,
    type ActivityEntry
} from "@/store/api/activity.api";

/**
 * The audit trail, rendered. Every row answers four questions: who changed it,
 * what changed, where it lives, and when — plus the from → to pair when the
 * change had a previous value.
 */

interface ActivityFeedProps {
    workspaceId: string;
    /** Narrow to one board or one record. */
    moduleId?: string;
    recordId?: string;
    limit?: number;
}

/**
 * What the Automation bot is called on screen.
 *
 * Mirrors SYSTEM_USER_PROFILES.automation.firstName in
 * backend/utils/systemUsers.ts. It is duplicated rather than read off the row
 * on purpose: rows written BEFORE the bot existed still store the person who
 * triggered them as their actor, and the name in bold must say "a bot did
 * this" for those too. Whether the row happens to carry the bot as its user is
 * a storage detail; being an automated row is the thing the reader needs.
 */
const AUTOMATION_ACTOR = "Automation";

function actorName(user: ActivityEntry["user"]): string {
    if (!user) return "Someone";
    const full = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
    return full || user.email || "Someone";
}

function initialOf(value: string): string {
    return (value || "?").trim().charAt(0).toUpperCase();
}

/** A bare Mongo id — meaningful to the database, noise to a reader. */
const OBJECT_ID = /^[0-9a-f]{24}$/i;

/**
 * Cell values arrive as unknown — render something readable or nothing.
 *
 * A move stores collection IDs in before/after (revert needs them, so the data
 * must stay), but "6a8cbd99… -> 6a8cbd99…" tells a person nothing. The row's
 * own breadcrumb already names the collection it ended up in, so an id here is
 * dropped rather than shown.
 */
function renderValue(value: unknown): string | null {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "string") return OBJECT_ID.test(value.trim()) ? null : value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return null;
}

/**
 * Fired after a successful revert. The drawer refreshes through RTK Query's
 * tag invalidation, but the full page keeps its own accumulated list, so it
 * needs an explicit nudge.
 */
export const ACTIVITY_REVERTED_EVENT = "crm:activity-reverted";

/** Module › Collection › Record — the "where". */
function breadcrumb(entry: ActivityEntry): string {
    return [entry.module?.name, entry.collectionName?.name, entry.record?.name]
        .filter(Boolean)
        .join(" › ");
}

/**
 * A single row. Exported so the drawer and the full activity page render
 * identical entries without duplicating this markup.
 */
export function ActivityRow({
    entry,
    workspaceId
}: {
    entry: ActivityEntry;
    /** Omit to hide the revert control (read-only contexts). */
    workspaceId?: string;
}) {
    const [revert, { isLoading: reverting }] = useRevertActivityMutation();
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reverted = Boolean(entry.revertedAt);
    const showRevert = Boolean(workspaceId) && entry.canRevert === true && !reverted;

    const handleRevert = async () => {
        if (!workspaceId) return;
        setError(null);

        try {
            await revert({
                workspaceId,
                activityId: entry._id,
                recordId: entry.record?._id,
                collectionId: entry.collectionName?._id,
                moduleId: entry.module?._id
            }).unwrap();
            setConfirming(false);
            window.dispatchEvent(new CustomEvent(ACTIVITY_REVERTED_EVENT));
        } catch (err: unknown) {
            setError(
                (err as { data?: { message?: string } })?.data?.message ??
                "Could not revert this change"
            );
            setConfirming(false);
        }
    };

    /**
     * An automated row is always shown as done BY the bot, whatever its stored
     * actor says — see AUTOMATION_ACTOR. The person is not lost: they move to
     * the "triggered by" line, falling back to the stored user for the old
     * rows that have no metadata.triggeredBy because they predate it.
     */
    const automated = Boolean(entry.automation);
    const who = automated ? AUTOMATION_ACTOR : actorName(entry.user);
    const trigger = entry.triggeredBy ?? entry.user;
    const where = breadcrumb(entry);
    const before = renderValue(entry.before);
    const after = renderValue(entry.after);
    const showTransition = before !== null || after !== null;

    return (
        <div className={`group/row flex gap-2.5 px-4 py-2.5 ${reverted ? "opacity-60" : ""}`}>

            {/* Who — avatar, falling back to an initial.

                An automated row is acted by the Automation bot, which has no
                picture and never will; a bolt says what it is faster than the
                letter "A" in a circle. */}
            <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-bold text-white ${entry.automation ? "bg-accent/15 text-accent" : "bg-accent"
                    }`}
            >
                {entry.automation ? (
                    <HiOutlineBolt className="h-3.5 w-3.5" />
                ) : entry.user?.avatar ? (
                    <img
                        src={entry.user.avatar}
                        alt={who}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    initialOf(who)
                )}
            </span>

            <div className="min-w-0 flex-1">

                {/*
                    What — "Abdullah changed Status from … to …".

                    An AUTOMATED row is attributed to the person whose edit set
                    the recipe off, which is truthful but reads as though they
                    did it by hand. The badge is what separates the two, and it
                    names the recipe so "why did this move?" is answerable from
                    the feed alone. The server already stripped the recipe name
                    off the front of `message`, so it is not said twice.
                */}
                <p className="text-[11px] leading-snug text-slate-700">
                    <span className="font-semibold text-slate-900">{who}</span>{" "}
                    {entry.message}
                </p>

                {entry.automation && (
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span
                            title={`Done automatically by "${entry.automation.name}"`}
                            className="inline-flex max-w-full items-center gap-1 rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent"
                        >
                            <HiOutlineBolt className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{entry.automation.name}</span>
                        </span>

                        {/* Who set it off. Secondary on purpose — they did cause
                            it, but they did not do it. */}
                        {trigger && (
                            <span className="text-[10px] text-muted">
                                triggered by {actorName(trigger)}
                            </span>
                        )}
                    </span>
                )}

                {/* From → to, when the change had two ends */}
                {showTransition && (
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                        <span className="max-w-[140px] truncate rounded bg-control px-1.5 py-0.5 text-[10px] font-medium text-muted line-through decoration-muted/50">
                            {before ?? "empty"}
                        </span>

                        <HiOutlineArrowRight className="h-2.5 w-2.5 shrink-0 text-muted" />

                        <span className="max-w-[140px] truncate rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                            {after ?? "empty"}
                        </span>
                    </div>
                )}

                {/* Where + when */}
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted">
                    {where && (
                        <>
                            <span className="truncate" title={where}>
                                {where}
                            </span>
                            <span aria-hidden>·</span>
                        </>
                    )}

                    <span
                        className="flex shrink-0 items-center gap-0.5"
                        title={new Date(entry.createdAt).toLocaleString()}
                    >
                        <HiOutlineClock className="h-2.5 w-2.5" />
                        {timeAgo(entry.createdAt)}
                    </span>

                    {reverted && (
                        <>
                            <span aria-hidden>·</span>
                            <span className="shrink-0 font-medium text-muted">reverted</span>
                        </>
                    )}

                    {/* Revert — two-step, because this rewrites live data and the
                        row sits in a scrolling list where a stray click is easy. */}
                    {showRevert && (
                        <span className="ml-auto flex shrink-0 items-center gap-1">
                            {confirming ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleRevert}
                                        disabled={reverting}
                                        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-accent transition hover:bg-accent/10 disabled:opacity-50 cursor-pointer"
                                    >
                                        {reverting && (
                                            <AiOutlineLoading3Quarters className="h-2.5 w-2.5 animate-spin" />
                                        )}
                                        Confirm
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirming(false)}
                                        disabled={reverting}
                                        className="rounded px-1.5 py-0.5 text-[10px] font-medium text-muted transition hover:text-slate-700 disabled:opacity-50 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setConfirming(true)}
                                    title="Undo this change"
                                    className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted opacity-0 transition hover:bg-control hover:text-slate-900 group-hover/row:opacity-100 focus:opacity-100 cursor-pointer"
                                >
                                    <HiOutlineArrowUturnLeft className="h-2.5 w-2.5" />
                                    Revert
                                </button>
                            )}
                        </span>
                    )}

                    {/* Why a row cannot be undone, on hover of the muted marker */}
                    {!showRevert && !reverted && entry.revertBlocker && (
                        <span
                            className="ml-auto shrink-0 cursor-help text-muted/60"
                            title={entry.revertBlocker}
                        >
                            —
                        </span>
                    )}
                </div>

                {error && (
                    <p className="mt-1 text-[10px] font-medium text-red-600">{error}</p>
                )}
            </div>
        </div>
    );
}

/** Self-fetching feed for the drawer. The full page paginates its own list. */
export default function ActivityFeed({
    workspaceId,
    moduleId,
    recordId,
    limit = 10
}: ActivityFeedProps) {
    const { data, isLoading, isError } = useGetActivityQuery(
        { workspaceId, moduleId, recordId, limit },
        { skip: !workspaceId }
    );

    if (!workspaceId) {
        return (
            <p className="px-4 py-6 text-center text-[11px] text-muted">
                Open a workspace to see its activity.
            </p>
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-2 px-4 py-3">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="h-10 rounded-lg bg-control animate-pulse"
                        style={{ animationDelay: `${i * 100}ms` }}
                    />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <p className="px-4 py-6 text-center text-[11px] text-muted">
                Could not load activity.
            </p>
        );
    }

    const entries = data?.activities ?? [];

    if (entries.length === 0) {
        return (
            <p className="px-4 py-6 text-center text-[11px] text-muted">
                No activity yet — changes you make will show up here.
            </p>
        );
    }

    return (
        <div className="divide-y divide-hairline">
            {entries.map((entry) => (
                <ActivityRow key={entry._id} entry={entry} workspaceId={workspaceId} />
            ))}

            {data?.retentionDays ? (
                <p className="px-4 py-2 text-center text-[10px] text-muted">
                    History is kept for {data.retentionDays} days
                </p>
            ) : null}
        </div>
    );
}
