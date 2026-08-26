"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
    HiChevronRight,
    HiOutlineEllipsisVertical,
    HiOutlineEnvelope,
    HiOutlineLink,
    HiOutlineLockClosed,
    HiOutlinePlus,
    HiOutlineTag,
    HiOutlineTrash,
    HiOutlineXMark,
    HiCheck
} from "react-icons/hi2";

import PresenceDot from "@/components/ui/helpers/presenceDot";
import { presenceOption } from "@/lib/presence";
import { exactTime, timeAgo } from "@/lib/relativeTime";
import { STATUS_SWATCHES } from "@/data/data";
import userAsset from "@/app/assets/user.png";
import type { Module, ModuleTag } from "@/store/types";

/**
 * One module, as a table row.
 *
 * NOT A GRID. A grid spread its fixed columns evenly across the full width, so
 * on a wide screen the metadata floated in the middle of an empty row with the
 * name marooned on the left. The name now GROWS and everything else is a
 * fixed-width cluster pinned to the right edge, which is how a list reads: one
 * thing you scan down the left, a set of facts squared up on the right.
 *
 * COLUMN WIDTHS LIVE IN THESE CONSTANTS and the header uses the same ones — a
 * header whose columns are declared separately from its rows drifts the first
 * time either is edited, and the drift is invisible until someone notices a
 * heading sitting over the wrong column.
 */
export const ROW_SHELL = "flex items-center gap-4 px-4";

const COL_BY = "w-8 shrink-0";
const COL_DATE = "w-20 shrink-0 text-right";
const COL_RECORDS = "w-12 shrink-0 text-right";
const COL_TAGS = "w-56 shrink-0";
const COL_ACTIONS = "w-14 shrink-0";

/** Popovers are portalled, so their widths are needed for viewport clamping. */
const MENU_WIDTH = 190;
const INFO_WIDTH = 256;
const DATE_WIDTH = 256;
const TAGS_WIDTH = 268;

type Popover = "menu" | "creator" | "created" | "updated" | "tags" | null;

export function ModuleRowHeader() {
    return (
        <div
            className={`${ROW_SHELL} border-b border-gray-200/40 bg-control/40 py-2.5 font-dmsans`}
        >
            <span className="min-w-0 flex-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                Module
            </span>

            <span className={`${COL_BY} text-[10px] font-semibold uppercase tracking-wide text-muted`}>
                By
            </span>

            <span className={`${COL_DATE} text-[10px] font-semibold uppercase tracking-wide text-muted`}>
                Created
            </span>

            <span className={`${COL_DATE} text-[10px] font-semibold uppercase tracking-wide text-muted`}>
                Updated
            </span>

            <span className={`${COL_RECORDS} text-[10px] font-semibold uppercase tracking-wide text-muted`}>
                Records
            </span>

            <span className={`${COL_TAGS} text-[10px] font-semibold uppercase tracking-wide text-muted`}>
                Tags
            </span>

            <span className={COL_ACTIONS} />
        </div>
    );
}

export default function ModuleRow({
    module,
    workspaceId,
    onDelete,
    onSaveTags,
    knownTags,
    deleting
}: {
    module: Module;
    workspaceId: string;
    onDelete: (moduleId: string) => void;
    /** Replaces the module's whole tag set. */
    onSaveTags: (moduleId: string, tags: ModuleTag[], note: string) => void;
    /**
     * Every tag already in use anywhere in this workspace.
     *
     * Tags are only useful when the SAME tag lands on several modules, and
     * retyping "client" on each one guarantees drift — a stray capital or a
     * different colour and the grouping quietly splits in two. Picking from
     * what exists is what keeps them one tag.
     */
    knownTags: ModuleTag[];
    deleting: boolean;
}) {
    const router = useRouter();

    /**
     * ONE popover at a time (LAYOUT.md §8) — five triggers on a row, and two
     * open at once would overlap each other in a short strip.
     */
    const [popover, setPopover] = useState<Popover>(null);
    const [at, setAt] = useState<{ top: number; left: number } | null>(null);

    const [copied, setCopied] = useState<string | null>(null);
    const [draftTag, setDraftTag] = useState("");
    const [draftColor, setDraftColor] = useState(STATUS_SWATCHES[0]);

    const rootRef = useRef<HTMLDivElement>(null);
    const layerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!popover) return;

        const onPointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (rootRef.current?.contains(target)) return;
            if (layerRef.current?.contains(target)) return;
            setPopover(null);
        };

        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setPopover(null);
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKey);

        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [popover]);

    const records = module.totalRecords ?? 0;
    const tags = module.tags ?? [];

    const creator = module.createdBy;
    const creatorName = creator
        ? `${creator.firstName ?? ""} ${creator.lastName ?? ""}`.trim() ||
        creator.email ||
        "Someone"
        : "Someone";

    const open = () => router.push(`/workspace/${workspaceId}/module/${module._id}`);

    /** Anchors a popover under its trigger, clamped inside the viewport. */
    const openAt = (event: React.MouseEvent, which: Popover, width: number) => {
        event.stopPropagation();

        if (popover === which) {
            setPopover(null);
            return;
        }

        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        setAt({
            top: rect.bottom + 6,
            left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))
        });
        setPopover(which);
    };

    /** Same feedback shape as the copy-UID control in components/Profile.tsx. */
    const copy = async (value: string | undefined, mark: string) => {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(value);
            setCopied(mark);
            setTimeout(() => setCopied(null), 1500);
        } catch {
            // A refused clipboard is not worth interrupting anyone over.
        }
    };

    const addTag = () => {
        const label = draftTag.trim().replace(/\s+/g, " ").slice(0, 24);
        if (!label) return;

        // Case-insensitive, matching the server's own normalisation.
        if (tags.some((t) => t.label.toLowerCase() === label.toLowerCase())) {
            setDraftTag("");
            return;
        }

        onSaveTags(module._id, [...tags, { label, color: draftColor }], `Tag "${label}" added`);
        setDraftTag("");
    };

    const removeTag = (label: string) =>
        onSaveTags(
            module._id,
            tags.filter((t) => t.label !== label),
            `Tag "${label}" removed`
        );

    /** Workspace tags this module does not already carry. */
    const suggestions = knownTags.filter(
        (known) => !tags.some((t) => t.label.toLowerCase() === known.label.toLowerCase())
    );

    /** Applies an existing tag WITH ITS COLOUR, so one tag looks the same everywhere. */
    const applyTag = (tag: ModuleTag) =>
        onSaveTags(module._id, [...tags, tag], `Tag "${tag.label}" added`);

    /** Shared frame for every floating layer on this row (LAYOUT.md §7). */
    const layer = (width: number, children: React.ReactNode) =>
        typeof document !== "undefined" && at
            ? createPortal(
                <div
                    ref={layerRef}
                    onClick={(e) => e.stopPropagation()}
                    style={{ top: at.top, left: at.left, width }}
                    className="fixed z-50 rounded-xl border border-gray-200 bg-card p-3 text-xs text-gray-700 shadow-lg font-dmsans animate-in fade-in zoom-in-95 duration-100"
                >
                    {children}
                </div>,
                document.body
            )
            : null;

    /** The Created / Updated popover — one shape, two tints (LAYOUT.md §4.4). */
    const datePanel = (
        title: string,
        iso: string | undefined,
        tint: "created" | "updated"
    ) => (
        <>
            <div className="mb-1 flex items-center justify-between border-b border-gray-200 pb-1 font-semibold text-gray-900">
                <span>{title}</span>
                <span
                    className={`rounded border px-1.5 py-0.5 text-[10px] ${tint === "created"
                        ? "border-blue-100 bg-blue-50 text-blue-600"
                        : "border-emerald-100 bg-emerald-50 text-emerald-600"
                        }`}
                >
                    {tint === "created" ? "Created" : "Updated"}
                </span>
            </div>
            <p className="pt-1.5 font-medium text-gray-800">{exactTime(iso)}</p>
            <p className="pb-1 text-[11px] text-gray-500">{timeAgo(iso)}</p>
        </>
    );

    /**
     * A tag pill: the chosen colour SOLID, with themed ink on top.
     *
     * The ink is `text-tag-ink`, not a hardcoded white — a tag's fill is a
     * saturated hue the user picked, so the label must contrast with THAT
     * rather than with the page, and the token inverts in .dark where the same
     * fill sits far brighter than everything around it. See globals.css.
     */
    const tagPill = (tag: ModuleTag, onRemove?: () => void) => (
        <span
            key={tag.label}
            style={{ backgroundColor: tag.color }}
            className="flex max-w-[96px] shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-tag-ink"
        >
            <span className="truncate">{tag.label}</span>
            {onRemove && (
                <button
                    onClick={onRemove}
                    aria-label={`Remove ${tag.label}`}
                    className="opacity-60 transition hover:opacity-100 cursor-pointer"
                >
                    <HiOutlineXMark className="h-3 w-3" />
                </button>
            )}
        </span>
    );

    return (
        <div
            ref={rootRef}
            onClick={open}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                /**
                 * ONLY when the row itself has focus.
                 *
                 * React bubbles events through the REACT tree, not the DOM one —
                 * so a keystroke in the tag input, which is portalled to
                 * document.body, still arrives here. Without this guard typing a
                 * space into a tag name navigated into the module.
                 */
                if (e.target !== e.currentTarget) return;

                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    open();
                }
            }}
            className={`group ${ROW_SHELL} border-b border-gray-200/30 py-2.5 transition last:border-b-0 hover:bg-control/60 cursor-pointer font-dmsans ${deleting ? "pointer-events-none opacity-50" : ""
                }`}
        >
            {/* Module — the only thing that grows. */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-slate-900">
                        {module.name}
                    </span>

                    {module.visibility === "private" && (
                        <HiOutlineLockClosed
                            title="Private — only people it is shared with"
                            className="h-3 w-3 shrink-0 text-muted"
                        />
                    )}
                </div>

                {module.description && (
                    <p className="truncate text-[11px] text-muted">{module.description}</p>
                )}
            </div>

            {/* Created by — the avatar alone. The name was a second column of
                text repeating what the card already says, and it crowded out
                the tags. No hover treatment: this opens on CLICK only, so a
                pointer crossing the row must not suggest otherwise. */}
            <button
                onClick={(e) => openAt(e, "creator", INFO_WIDTH)}
                title={creatorName}
                aria-label={`About ${creatorName}`}
                className={`${COL_BY} relative h-7 cursor-pointer`}
            >
                <span className="block h-7 w-7 overflow-hidden rounded-full border border-slate-200">
                    <img
                        src={creator?.avatar || userAsset.src}
                        alt={creatorName}
                        className="h-full w-full object-cover"
                    />
                </span>

                {creator?.presence && (
                    <span className="pointer-events-none absolute -bottom-0.5 -right-0.5">
                        <PresenceDot status={creator.presence} size={9} ringColor="var(--card)" />
                    </span>
                )}
            </button>

            {/* Created / Updated — relative in the row, exact in their OWN
                popover, matching the workspace table on /Home. */}
            <button
                onClick={(e) => openAt(e, "created", DATE_WIDTH)}
                title={exactTime(module.createdAt)}
                className={`${COL_DATE} text-xs font-medium text-slate-700 transition hover:underline cursor-pointer`}
            >
                {timeAgo(module.createdAt) || "—"}
            </button>

            <button
                onClick={(e) => openAt(e, "updated", DATE_WIDTH)}
                title={exactTime(module.updatedAt)}
                className={`${COL_DATE} text-xs font-medium text-slate-700 transition hover:underline cursor-pointer`}
            >
                {timeAgo(module.updatedAt) || "—"}
            </button>

            {/* Records — the COUNT, not a fraction. "0/3" was read as a score
                and answered a question nobody asked. Zero is muted, as on /Home. */}
            <span
                className={`${COL_RECORDS} text-sm font-bold tabular-nums ${records > 0 ? "text-slate-800" : "font-normal text-muted"
                    }`}
            >
                {records}
            </span>

            {/* Tags — their own column, and the place tags are ADDED from. The
                ⋮ menu still offers it, but a label belongs next to the labels,
                not two clicks inside a menu. */}
            <div className={`${COL_TAGS} flex items-center gap-1 overflow-hidden`}>
                {tags.slice(0, 2).map((tag) => tagPill(tag))}

                {tags.length > 2 && (
                    <span className="shrink-0 text-[10px] font-medium text-muted">
                        +{tags.length - 2}
                    </span>
                )}

                <button
                    onClick={(e) => {
                        setDraftTag("");
                        openAt(e, "tags", TAGS_WIDTH);
                    }}
                    title="Add a tag"
                    aria-label={`Add a tag to ${module.name}`}
                    className="flex h-5 items-center gap-0.5 rounded border border-dashed border-slate-400 px-1.5 text-[10px] font-semibold text-muted opacity-0 transition hover:border-accent hover:text-accent focus:opacity-100 group-hover:opacity-100 cursor-pointer"
                >
                    <HiOutlinePlus className="h-2.5 w-2.5" />
                    Tag
                </button>
            </div>

            <div className={`${COL_ACTIONS} flex items-center justify-end gap-1`}>
                <button
                    onClick={(e) => openAt(e, "menu", MENU_WIDTH)}
                    aria-label={`Actions for ${module.name}`}
                    className="rounded-lg p-1.5 text-muted opacity-0 transition hover:bg-control hover:text-slate-900 focus:opacity-100 group-hover:opacity-100 cursor-pointer"
                >
                    <HiOutlineEllipsisVertical className="h-4 w-4" />
                </button>

                <HiChevronRight className="h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" />
            </div>

            {popover === "creator" &&
                layer(
                    INFO_WIDTH,
                    <>
                        <div className="flex items-center gap-2.5 border-b border-gray-200 pb-2.5">
                            <span className="block h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-200">
                                <img
                                    src={creator?.avatar || userAsset.src}
                                    alt={creatorName}
                                    className="h-full w-full object-cover"
                                />
                            </span>

                            <span className="min-w-0">
                                <span className="block truncate text-xs font-semibold text-slate-900">
                                    {creatorName}
                                </span>
                                {creator?.presence && (
                                    <span className="mt-0.5 flex items-center gap-1.5">
                                        <PresenceDot status={creator.presence} size={8} ring={0} />
                                        <span className="text-[11px] text-gray-500">
                                            {presenceOption(creator.presence).label}
                                        </span>
                                    </span>
                                )}
                            </span>
                        </div>

                        {creator?.email && (
                            <p className="truncate pt-2 text-[11px] text-gray-500">
                                {creator.email}
                            </p>
                        )}

                        <div className="mt-2 space-y-1">
                            <button
                                onClick={() => copy(creator?.email, "email")}
                                disabled={!creator?.email}
                                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-slate-700 transition hover:bg-control disabled:opacity-40 cursor-pointer"
                            >
                                {copied === "email" ? (
                                    <HiCheck className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                    <HiOutlineEnvelope className="h-3.5 w-3.5" />
                                )}
                                {copied === "email" ? "Copied" : "Copy email"}
                            </button>

                            <button
                                onClick={() => copy(creator?._id, "uid")}
                                disabled={!creator?._id}
                                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium text-slate-700 transition hover:bg-control disabled:opacity-40 cursor-pointer"
                            >
                                {copied === "uid" ? (
                                    <HiCheck className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                    <HiOutlineLink className="h-3.5 w-3.5" />
                                )}
                                {copied === "uid" ? "Copied" : "Copy user ID"}
                            </button>
                        </div>
                    </>
                )}

            {popover === "created" &&
                layer(DATE_WIDTH, datePanel("Exact Created Date", module.createdAt, "created"))}

            {popover === "updated" &&
                layer(DATE_WIDTH, datePanel("Exact Updated Date", module.updatedAt, "updated"))}

            {popover === "tags" &&
                layer(
                    TAGS_WIDTH,
                    <>
                        <p className="mb-2 border-b border-gray-200 pb-1 font-semibold text-gray-900">
                            Tags
                        </p>

                        {tags.length > 0 ? (
                            <div className="mb-2 flex flex-wrap gap-1">
                                {tags.map((tag) => tagPill(tag, () => removeTag(tag.label)))}
                            </div>
                        ) : (
                            <p className="mb-2 text-[11px] text-gray-500">
                                No tags yet. Add one to group this module however you think
                                about it.
                            </p>
                        )}

                        {/* Reuse before retyping. Applying one carries its
                            COLOUR across too, so a tag looks identical on every
                            module rather than depending on who typed it. */}
                        {suggestions.length > 0 && (
                            <div className="mb-2.5">
                                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                                    Used elsewhere
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {suggestions.slice(0, 10).map((tag) => (
                                        <button
                                            key={tag.label}
                                            onClick={() => applyTag(tag)}
                                            title={`Add "${tag.label}" to this module`}
                                            style={{ backgroundColor: tag.color }}
                                            className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-tag-ink opacity-70 transition hover:opacity-100 cursor-pointer"
                                        >
                                            {tag.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                addTag();
                            }}
                        >
                            <input
                            value={draftTag}
                            onChange={(e) => setDraftTag(e.target.value)}
                            /**
                             * Keystrokes stop here.
                             *
                             * This input is portalled, and React bubbles through
                             * the REACT tree — so without this, Space reached the
                             * row's key handler and opened the module mid-word.
                             * Enter is left to the form's own submit.
                             */
                            onKeyDown={(e) => e.stopPropagation()}
                            maxLength={24}
                            placeholder="Tag name"
                            autoFocus
                            className="w-full rounded-lg border border-hairline bg-card px-2.5 py-1.5 text-[11px] font-medium text-slate-800 outline-none transition focus:border-accent placeholder:text-muted"
                        />

                        {/* Colour is picked BEFORE adding, so the pill appears in
                            the column already coloured rather than needing a
                            second edit to fix. */}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {STATUS_SWATCHES.map((swatch: string) => (
                                <button
                                    key={swatch}
                                    /**
                                     * type="button" IS THE WHOLE FIX for two bugs
                                     * that looked unrelated.
                                     *
                                     * A <button> inside a <form> defaults to
                                     * type="submit". So picking a colour SUBMITTED
                                     * the form and created the tag on the spot —
                                     * and created it with the WRONG colour, because
                                     * setDraftColor only queues a re-render while
                                     * the submit handler that ran in the same event
                                     * still read the previous draftColor from its
                                     * closure. Hence "it picks the first colour and
                                     * then creates the tag".
                                     *
                                     * Every non-submitting button inside a form
                                     * needs this.
                                     */
                                    type="button"
                                    onClick={() => setDraftColor(swatch)}
                                    aria-label={`Use colour ${swatch}`}
                                    aria-pressed={swatch === draftColor}
                                    style={{ backgroundColor: swatch }}
                                    className={`h-5 w-5 rounded-full transition ${swatch === draftColor
                                        ? "ring-2 ring-slate-900 ring-offset-1 ring-offset-card"
                                        : "hover:scale-110"
                                        }`}
                                />
                            ))}
                        </div>

                            <button
                                type="submit"
                                disabled={!draftTag.trim()}
                                className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent py-1.5 text-[11px] font-semibold text-white transition hover:bg-accent-hover disabled:opacity-40 cursor-pointer"
                            >
                                <HiOutlinePlus className="h-3 w-3" />
                                Add tag
                            </button>
                        </form>

                        <p className="mt-1.5 text-[10px] text-gray-500">
                            Up to 12 tags. Duplicates are merged.
                        </p>
                    </>
                )}

            {popover === "menu" &&
                typeof document !== "undefined" &&
                at &&
                createPortal(
                    <div
                        ref={layerRef}
                        onClick={(e) => e.stopPropagation()}
                        style={{ top: at.top, left: at.left, width: MENU_WIDTH }}
                        className="fixed z-50 overflow-hidden rounded-xl border border-gray-200 bg-card py-1 shadow-lg font-dmsans"
                    >
                        <button
                            onClick={(e) => {
                                setDraftTag("");
                                openAt(e, "tags", TAGS_WIDTH);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-control cursor-pointer"
                        >
                            <HiOutlineTag className="h-3.5 w-3.5" />
                            Edit tags
                        </button>

                        <button
                            onClick={() => copy(module._id, "module")}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-control cursor-pointer"
                        >
                            {copied === "module" ? (
                                <HiCheck className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                                <HiOutlineLink className="h-3.5 w-3.5" />
                            )}
                            {copied === "module" ? "Copied" : "Copy module ID"}
                        </button>

                        <button
                            onClick={() => {
                                setPopover(null);
                                onDelete(module._id);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-red-600 transition hover:bg-red-50 cursor-pointer"
                        >
                            <HiOutlineTrash className="h-3.5 w-3.5" />
                            Delete module
                        </button>
                    </div>,
                    document.body
                )}
        </div>
    );
}
