"use client";

import Image from "next/image";
import Link from "next/link";
import { HiOutlineClock, HiOutlineCog6Tooth } from "react-icons/hi2";
import { BsRobot } from "react-icons/bs";

import MembersButton from "@/components/ui/buttons/Membersbutton";
import Tooltip from "@/components/ui/helpers/tooltip";
import cover from "@/app/assets/workspace-cover.svg";
import { WorkspaceIcon } from "@/lib/workspaceIcons";
import type { Member } from "@/store/types";

/**
 * The workspace's identity, as a profile header.
 *
 * Modelled on a LinkedIn profile: a coloured banner, the avatar breaking its
 * lower edge, and the name and figures sitting under it. The point is that the
 * page announces WHICH workspace you are in once, prominently, instead of
 * whispering it in a 11px line in the navbar — which is what it did before, and
 * why the navbar now just says "Workspace".
 *
 * The cover is a PLACEHOLDER IMAGE (app/assets/workspace-cover.svg), meant to
 * be replaced with real artwork — swapping that one file is the whole change.
 * It used to be a gradient built from a hue hashed off the workspace id; that
 * hue appeared nowhere else in the app, so it was decoration presenting itself
 * as information, and it fought whatever the icon and buttons in front of it
 * were doing.
 *
 * The avatar shows the workspace's CHOSEN ICON, not the first letter of its
 * name. A letter is not identity — two workspaces beginning with "N" drew the
 * same square — whereas the icon is picked deliberately when the workspace is
 * created. See lib/workspaceIcons.tsx.
 */

export default function WorkspaceBanner({
    name,
    icon,
    moduleCount,
    memberCount,
    members,
    workspaceId,
    onInvite
}: {
    name: string;
    /** Catalog key from lib/workspaceIcons.tsx. */
    icon?: string;
    moduleCount: number;
    memberCount: number;
    members: Member[];
    workspaceId: string;
    onInvite: () => void;
}) {
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-card font-dmsans">

            {/* Cover. `fill` + object-cover so the art crops rather than
                stretches at any width — the SVG is authored to survive that. */}
            <div className="relative h-28 w-full sm:h-32">
                <Image
                    src={cover}
                    alt=""
                    fill
                    priority
                    className="object-cover"
                />
            </div>

            <div className="px-5 pb-5 sm:px-6">

                {/*
                    Avatar on its own line, name STACKED beneath it — the real
                    LinkedIn arrangement.

                    It was side-by-side and bottom-aligned with the avatar, which
                    left the title jammed a few pixels under the cover with no
                    way to push it down: in a bottom-aligned row, padding-top on
                    the text grows the box upward and the text does not move.
                    Stacking is what makes the title's spacing an actual margin.
                */}
                {/*
                    relative z-10 is LOAD-BEARING. The cover uses <Image fill>,
                    which is position:absolute — so it paints above any static
                    sibling that follows it, and the negative margin below pulls
                    this row up into exactly that overlap. Without a stacking
                    context of its own the avatar's top half (and most of its
                    icon) rendered behind the cover art.
                */}
                <div className="relative z-10 -mt-10 flex flex-wrap items-end justify-between gap-4 sm:-mt-12">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-card text-accent shadow-md ring-4 ring-card sm:h-24 sm:w-24">
                        <WorkspaceIcon iconKey={icon} className="h-9 w-9 sm:h-11 sm:w-11" />
                    </div>

                    {/* Everything you can do TO the workspace, as opposed to
                        inside it. The module list below owns its own actions. */}
                    <div className="flex shrink-0 items-center gap-2 pb-1">
                        <MembersButton members={members} onInvite={onInvite} />

                        <Tooltip label="Automations" side="bottom">
                            <Link
                                href={`/workspace/${workspaceId}/automation`}
                                aria-label="Automations"
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-card text-muted transition hover:border-accent/50 hover:text-accent"
                            >
                                {/* Only this one changed for now — the bolt is
                                    still the automation glyph in the activity
                                    feed, the activity filter and the builder. */}
                                <BsRobot className="h-4 w-4" />
                            </Link>
                        </Tooltip>

                        <Tooltip label="Activity log" side="bottom">
                            <Link
                                href={`/workspace/${workspaceId}/activity`}
                                aria-label="Activity log"
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-card text-muted transition hover:border-accent/50 hover:text-accent"
                            >
                                <HiOutlineClock className="h-4 w-4" />
                            </Link>
                        </Tooltip>

                        <Tooltip label="People and module access" side="bottom">
                            <Link
                                href={`/members/${workspaceId}`}
                                aria-label="People and module access"
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-card text-muted transition hover:border-accent/50 hover:text-accent"
                            >
                                <HiOutlineCog6Tooth className="h-4 w-4" />
                            </Link>
                        </Tooltip>
                    </div>
                </div>

                {/* mt-4 is the title's breathing room, and it works here because
                    nothing is bottom-aligning it any more. */}
                <div className="mt-4 min-w-0">
                    <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">
                        {name}
                    </h1>
                    <p className="mt-1 text-xs text-muted">
                        {moduleCount} {moduleCount === 1 ? "module" : "modules"}
                        {" · "}
                        {memberCount} {memberCount === 1 ? "member" : "members"}
                    </p>
                </div>
            </div>
        </section>
    );
}
