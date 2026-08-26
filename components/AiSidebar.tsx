"use client";

import { useEffect, useState } from "react";
import { TbLayoutBoard, TbRoute, TbSparkles } from "react-icons/tb";
import { HiOutlineXMark } from "react-icons/hi2";
import AgentChat from "./ai/AgentChat";
import WorkflowAgent from "./ai/WorkflowAgent";

/**
 * The right rail. Pure chrome: it opens, closes, and renders whichever agent
 * the current page asked for.
 *
 * There is deliberately no agent switcher — the page decides. Automations get
 * Relay; everything else (workspace, board) gets Atlas. A user picking the
 * wrong agent for the page they are on could only ever produce a dead end.
 */

const PANEL_KEY = "crm_ai_panel_open";

/** A page can ask the rail to open — see the automation page's empty state. */
export const OPEN_AGENT_EVENT = "crm:open-agent";

export type AgentKind = "atlas" | "relay";

const AGENT_META: Record<AgentKind, { name: string; role: string; icon: typeof TbRoute }> = {
    atlas: { name: "Atlas", role: "CRM Agent", icon: TbLayoutBoard },
    relay: { name: "Relay", role: "Workflow Agent", icon: TbRoute }
};

interface AiSidebarProps {
    /** Which agent this page runs. */
    agent: AgentKind;
    /** Workspace or board name the agent is pointed at. */
    context?: string;
    /** Ids Atlas resolves "here" and "this board" against. */
    workspaceId?: string;
    moduleId?: string;
}

export default function AiSidebar({ agent, context, workspaceId, moduleId }: AiSidebarProps) {
    // Closed on the server, corrected from localStorage after mount so the
    // markup cannot mismatch during hydration.
    const [open, setOpen] = useState(false);

    useEffect(() => {
        try {
            setOpen(localStorage.getItem(PANEL_KEY) === "1");
        } catch {
            /* private mode — stay closed */
        }

        const onOpenRequest = () => setOpen(true);
        window.addEventListener(OPEN_AGENT_EVENT, onOpenRequest);
        return () => window.removeEventListener(OPEN_AGENT_EVENT, onOpenRequest);
    }, []);

    const toggle = () => {
        setOpen((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(PANEL_KEY, next ? "1" : "0");
            } catch {
                /* not persisting is survivable */
            }
            return next;
        });
    };

    const meta = AGENT_META[agent];
    const Icon = meta.icon;

    // Closed: a small launcher pinned to the right edge.
    if (!open) {
        return (
            <button
                type="button"
                onClick={toggle}
                title={`Ask ${meta.name}`}
                aria-label={`Ask ${meta.name}`}
                className="fixed right-4 bottom-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white shadow-lg transition hover:bg-accent-hover cursor-pointer"
            >
                <TbSparkles className="h-5 w-5" />
            </button>
        );
    }

    return (
        <aside className="flex h-screen w-96 shrink-0 flex-col sticky top-0 border-l border-slate-200 bg-card font-google-sans">

            {/* ── Header ────────────────────────────────────────────
                 Names the agent this page runs, rather than offering a choice.
                 h-16 matches the page header next to it so the two bottom
                 borders form one continuous rule across the window. */}
            <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-3">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                        <Icon className="h-4 w-4" />
                    </span>

                    <span className="min-w-0">
                        <span className="block truncate text-sm font-bold leading-tight text-slate-900">
                            {meta.name}
                        </span>
                        <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
                            {meta.role}
                        </span>
                    </span>
                </div>

                <button
                    type="button"
                    onClick={toggle}
                    title="Close panel"
                    aria-label="Close panel"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-control hover:text-slate-900 cursor-pointer"
                >
                    <HiOutlineXMark className="h-4 w-4" />
                </button>
            </div>

            {agent === "relay" ? (
                <WorkflowAgent context={context} />
            ) : (
                <AgentChat context={context} workspaceId={workspaceId} moduleId={moduleId} />
            )}
        </aside>
    );
}
