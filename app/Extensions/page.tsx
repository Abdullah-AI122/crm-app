"use client";

import { useState } from "react";
import { TbPlug, TbCode, TbRocket, TbPuzzle } from "react-icons/tb";

import ProfileDropdown from "@/components/Profile";
import BackButton from "@/components/ui/buttons/backButton";

/**
 * Extensions — where a team will build and deploy its own apps onto the CRM.
 *
 * The sidebar has linked here since before the route existed, so until today
 * the entry point 404'd. This page is deliberately an honest placeholder: it
 * says what the section is for and that it is not built yet, and it lists
 * NOTHING. A grid of plausible-looking extensions would be a lie the moment
 * anyone clicked one, and an empty grid with a working "New extension" button
 * would be worse — it promises a flow that does not exist.
 *
 * When the real thing lands it replaces the panel below; the shell, the route
 * and the sidebar entry are already correct.
 */

/** What the section is being built to do — kept short and concrete. */
const PLANNED = [
    {
        icon: TbCode,
        title: "Build",
        body: "Write an extension against your workspace's own modules, collections and records.",
    },
    {
        icon: TbRocket,
        title: "Deploy",
        body: "Publish it to this workspace, with the same access rules the rest of the CRM follows.",
    },
    {
        icon: TbPuzzle,
        title: "Reuse",
        body: "Share what you have built across workspaces instead of rebuilding it each time.",
    },
];

export default function ExtensionsPage() {
    const [profileOpen, setProfileOpen] = useState(false);

    return (
        <section className="flex h-full w-full">
            <div className="h-screen w-full overflow-y-auto bg-canvas">
                <div className="mx-auto flex h-full w-full flex-col gap-3 py-1 pl-3">

                    {/* Header — the same bar every top-level page carries */}
                    <div className="flex items-center justify-between pr-2">
                        <div className="flex items-center gap-2.5 py-2">
                            {/* No sidebar on this page, so the header carries the
                                way out. Home is the fallback for a pasted link. */}
                            <BackButton fallbackHref="/Home" />

                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                                <TbPlug className="h-[18px] w-[18px]" />
                            </span>

                            <span>
                                <h1 className="font-google-sans text-[15px] font-bold leading-none text-slate-900">
                                    Extensions
                                </h1>
                                <p className="mt-1 font-google-sans text-[11px] font-medium text-muted">
                                    Custom apps built on your own data
                                </p>
                            </span>
                        </div>

                        <ProfileDropdown open={profileOpen} setOpen={setProfileOpen} />
                    </div>

                    {/* Body */}
                    <div className="flex flex-1 items-start justify-center pr-3 pt-10">
                        <div className="w-full max-w-2xl rounded-2xl border border-hairline bg-card p-8 font-google-sans shadow-sm">

                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                                <TbPlug className="h-6 w-6" />
                            </span>

                            <h2 className="mt-4 text-lg font-bold text-slate-900">
                                Nothing here yet
                            </h2>

                            <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted">
                                This is where your team will build its own apps on top of the
                                CRM and deploy them into a workspace. The section exists so the
                                place is settled — the builder itself is still to come.
                            </p>

                            <div className="mt-7 grid gap-4 sm:grid-cols-3">
                                {PLANNED.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <div
                                            key={item.title}
                                            className="rounded-xl border border-hairline bg-control/30 p-4"
                                        >
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-card text-slate-600">
                                                <Icon className="h-4 w-4" />
                                            </span>

                                            <h3 className="mt-2.5 text-[13px] font-bold text-slate-900">
                                                {item.title}
                                            </h3>

                                            <p className="mt-1 text-[11px] leading-relaxed text-muted">
                                                {item.body}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Disabled on purpose — see the note at the top of the file. */}
                            <div className="mt-7 flex items-center gap-3">
                                <button
                                    type="button"
                                    disabled
                                    title="The extension builder is not available yet"
                                    className="cursor-not-allowed rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white opacity-50"
                                >
                                    New extension
                                </button>

                                <span className="rounded-full bg-control px-2.5 py-1 text-[11px] font-semibold text-muted">
                                    Coming soon
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
