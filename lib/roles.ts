// lib/roles.ts

import { ROLE_COLORS } from "@/data/data";

/**
 * Mirrors MEMBER_ROLES in backend/models/WorkspaceMember.ts — change both
 * together.
 *
 * The predicates below are a COPY of the server's rules, used only to disable
 * controls the user cannot use. The server re-checks every one of them; never
 * treat a `true` here as permission.
 */
export const MEMBER_ROLES = ["guest", "member", "admin", "owner"] as const;

export type MemberRole = (typeof MEMBER_ROLES)[number];

export interface RoleOption {
    value: MemberRole;
    label: string;
    hint: string;
    color: string;
}

/** Dropdown order: most privileged first, the way an org chart reads. */
export const ROLE_OPTIONS: RoleOption[] = [
    {
        value: "owner",
        label: "Owner",
        hint: "Full control of the workspace, including who else owns it",
        color: ROLE_COLORS.owner,
    },
    {
        value: "admin",
        label: "Admin",
        hint: "Manage boards, columns and members",
        color: ROLE_COLORS.admin,
    },
    {
        value: "member",
        label: "Member",
        hint: "Work on the boards they belong to",
        color: ROLE_COLORS.member,
    },
    {
        value: "guest",
        label: "Guest",
        hint: "Only the boards shared with them",
        color: ROLE_COLORS.guest,
    },
];

const FALLBACK = ROLE_OPTIONS[2];

export const roleOption = (role?: string | null): RoleOption =>
    ROLE_OPTIONS.find((option) => option.value === role) ?? FALLBACK;

export const roleLabel = (role?: string | null) => roleOption(role).label;

export const roleColor = (role?: string | null) => roleOption(role).color;

/** Owners and admins are the only ones who can touch roles at all. */
export const canManageRoles = (actorRole?: MemberRole | string | null) =>
    actorRole === "owner" || actorRole === "admin";

/**
 * Whether `actorRole` may move a member from `currentRole` to `nextRole`.
 * Ownership is the sharp edge: only an owner can grant it or take it away.
 */
export const canAssignRole = (
    actorRole: MemberRole | string | null | undefined,
    currentRole: MemberRole | string,
    nextRole: MemberRole
) => {
    if (!canManageRoles(actorRole)) return false;
    if ((nextRole === "owner" || currentRole === "owner") && actorRole !== "owner") {
        return false;
    }
    return true;
};

/** A workspace must keep at least one owner, so the last one is frozen. */
export const isLastOwner = (currentRole: MemberRole | string, ownerCount: number) =>
    currentRole === "owner" && ownerCount <= 1;
