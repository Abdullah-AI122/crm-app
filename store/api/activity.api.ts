import { ACTIVITY_TAG, baseApi } from "../baseApi";

/** A populated reference — the server sends `{ _id, name }` for the breadcrumb. */
export interface ActivityRef {
    _id: string;
    name?: string;
    color?: string;
    type?: string;
}

export interface ActivityActor {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    avatar?: string;
}

export interface ActivityEntry {
    _id: string;
    action: string;
    message: string;
    targetName?: string;

    /** The from → to pair. `null` means the value was empty at that end. */
    before?: unknown;
    after?: unknown;

    user: ActivityActor | null;
    module?: ActivityRef | null;
    collectionName?: ActivityRef | null;
    record?: ActivityRef | null;
    column?: ActivityRef | null;

    createdAt: string;

    /**
     * Set when this row was written by the automation engine rather than by a
     * person acting directly. There is no separate run log — a run IS an
     * activity row, and this is the stamp that says so. `message` arrives with
     * the recipe's name already stripped off the front, because the name
     * belongs in the badge.
     */
    automation?: { _id: string; name: string } | null;

    /**
     * The person whose edit set the automation off. The ACTOR on an automated
     * row is the Automation bot, so this is how the trail still answers "why
     * did this happen now?" without that being the headline.
     */
    triggeredBy?: ActivityActor | null;

    /** Decided server-side — the client never guesses what is undoable. */
    canRevert?: boolean;
    /** Why not, when canRevert is false. Safe to show the user. */
    revertBlocker?: string | null;
    revertedAt?: string | null;
}

export interface ActivityPage {
    activities: ActivityEntry[];
    hasMore: boolean;
    nextCursor: string | null;
    /** 0 means history is kept forever. */
    retentionDays: number;
}

export interface ActivityQueryArgs {
    workspaceId: string;
    moduleId?: string;
    recordId?: string;
    userId?: string;
    /** "automation" = written by the engine, "person" = everything else. */
    source?: "automation" | "person";
    limit?: number;
    /** ISO timestamp — pass the previous page's nextCursor. */
    before?: string;
}

export const activityApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getActivity: build.query<ActivityPage, ActivityQueryArgs>({
            query: ({ workspaceId, ...params }) => ({
                url: `/activity/${workspaceId}`,
                params: Object.fromEntries(
                    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
                )
            }),
            // The bare LIST id is what every mutation invalidates (ACTIVITY_TAG),
            // so a cell write anywhere refreshes this without a page reload.
            providesTags: (_result, _error, { workspaceId }) => [
                { type: "Activity" as const, id: "LIST" },
                { type: "Activity" as const, id: `LIST-${workspaceId}` }
            ]
        }),

        revertActivity: build.mutation<
            { message: string },
            {
                workspaceId: string;
                activityId: string;
                /** Passed only so the right caches are dropped afterwards. */
                recordId?: string;
                collectionId?: string;
                moduleId?: string;
            }
        >({
            query: ({ workspaceId, activityId }) => ({
                url: `/activity/${workspaceId}/${activityId}/revert`,
                method: "POST"
            }),
            // A revert rewrites real data, so every view of that data has to go —
            // otherwise the board keeps showing the value that was just undone.
            invalidatesTags: (_result, _error, { recordId, collectionId, moduleId }) => [
                ACTIVITY_TAG,
                ...(recordId
                    ? [
                        { type: "RecordValue" as const, id: `LIST-${recordId}` },
                        { type: "Record" as const, id: recordId }
                    ]
                    : []),
                ...(collectionId
                    ? [{ type: "Record" as const, id: `LIST-${collectionId}` }]
                    : []),
                ...(moduleId
                    ? [
                        { type: "Collection" as const, id: `LIST-${moduleId}` },
                        { type: "Column" as const, id: `LIST-${moduleId}` }
                    ]
                    : [])
            ]
        })
    })
});

export const {
    useGetActivityQuery,
    useRevertActivityMutation,
    // The full page pages through cursors, so it drives the query itself.
    useLazyGetActivityQuery
} = activityApi;
