import { ACTIVITY_TAG, baseApi } from "../baseApi";
import type { MemberRole } from "@/lib/roles";

/**
 * One row per module, with the decision already made server-side:
 *  - `granted`    a grant row exists for this person
 *  - `openToRole` their workspace role alone already opens it (no grant needed)
 *  - `canAccess`  what actually happens when they try to open it
 *
 * The panel renders these verbatim rather than re-deriving them, so it cannot
 * disagree with what the API will enforce.
 */
export interface ModuleAccessRow {
    _id: string;
    name: string;
    icon?: string;
    color?: string;
    visibility: "private" | "workspace" | "public";
    granted: boolean;
    openToRole: boolean;
    canAccess: boolean;
    isCreator: boolean;
}

export interface MemberBoardAccess {
    role: MemberRole;
    modules: ModuleAccessRow[];
}

interface AccessArgs {
    workspaceId: string;
    userId: string;
}

const accessTag = ({ workspaceId, userId }: AccessArgs) => ({
    type: "ModuleAccess" as const,
    id: `${workspaceId}:${userId}`
});

export const moduleAccessApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getModuleAccess: build.query<MemberBoardAccess, AccessArgs>({
            query: ({ workspaceId, userId }) =>
                `/module-access/${workspaceId}/${userId}`,
            providesTags: (_result, _error, args) => [
                accessTag(args),
                // Bare LIST so a module's visibility change can mark every
                // person's access stale in one go.
                { type: "ModuleAccess" as const, id: "LIST" }
            ]
        }),

        setModuleAccess: build.mutation<
            { message: string; moduleIds: string[] },
            AccessArgs & { moduleIds: string[] }
        >({
            query: ({ workspaceId, userId, moduleIds }) => ({
                url: `/module-access/${workspaceId}/${userId}`,
                method: "PUT",
                body: { moduleIds }
            }),
            invalidatesTags: (_result, _error, args) => [
                accessTag(args),
                // Granting yourself a module changes your own module list.
                { type: "Module" as const, id: `LIST-${args.workspaceId}` },
                ACTIVITY_TAG
            ]
        })
    })
});

export const { useGetModuleAccessQuery, useSetModuleAccessMutation } =
    moduleAccessApi;
