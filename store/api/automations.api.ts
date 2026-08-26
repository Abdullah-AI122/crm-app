import { baseApi } from "../baseApi";
import type { MemberUser } from "../types";

/**
 * Automation recipes. Mirrors backend/models/Automation.ts — the unions below
 * must stay in step with the enums there, since the server rejects anything
 * outside them.
 *
 * SCOPE is the thing to understand before reading the rest. A recipe is either
 * pinned to one module (and names that module's columns by ID) or scoped to the
 * whole workspace (and names columns by NAME, resolved per module as events
 * arrive). The two addressing modes cannot be mixed, and scope is fixed at
 * creation — see the model for why.
 */

export type TriggerType =
    /* record lifecycle */
    | "record_created"
    | "record_moved"
    | "record_renamed"
    | "record_completed"
    | "record_uncompleted"
    | "record_archived"
    /* cells */
    | "column_changed"
    | "column_changed_to"
    /* sub-records */
    | "subrecord_created"
    | "subrecord_column_changed"
    | "subrecord_column_changed_to"
    | "subrecord_completed"
    | "all_subrecords_completed"
    /* conversation */
    | "amendment_posted";

export type ConditionOp =
    | "is"
    | "is_not"
    | "is_empty"
    | "is_not_empty"
    | "contains"
    | "not_contains"
    | "starts_with"
    | "greater_than"
    | "less_than";

export type ConditionSource = "column" | "record";

export type RecordField =
    | "name"
    | "collection"
    | "is_completed"
    | "is_archived"
    | "subrecord_count"
    | "amendment_count";

export type ActionType =
    /* this record */
    | "set_column_value"
    | "clear_column_value"
    | "move_to_collection"
    | "archive_record"
    | "set_completed"
    | "rename_record"
    /* sub-records */
    | "create_subrecord"
    | "complete_all_subrecords"
    | "archive_all_subrecords"
    /* the parent, from a sub-record trigger */
    | "set_parent_column_value"
    | "set_parent_completed"
    | "move_parent_to_collection"
    /* elsewhere */
    | "create_record"
    /* conversation */
    | "post_amendment";

export type AutomationScope = "module" | "workspace";
export type MatchMode = "all" | "any";

export interface AutomationCondition {
    source: ConditionSource;
    /** Module scope addresses the column by id… */
    column?: string;
    /** …workspace scope by name. Never both. */
    columnName?: string;
    /** Which record field, when source is "record". */
    field?: RecordField;
    op: ConditionOp;
    value?: string;
}

export interface AutomationAction {
    type: ActionType;
    column?: string;
    columnName?: string;
    collectionName?: string;
    targetModule?: string;
    targetCollection?: string;
    value?: string;
}

export interface AutomationTrigger {
    type: TriggerType;
    column?: string;
    columnName?: string;
    value?: string;
}

export interface Automation {
    _id: string;
    workspace: string;
    /** Null for a workspace-scoped recipe. */
    module: string | null;
    scope: AutomationScope;
    name: string;
    trigger: AutomationTrigger;
    conditions: AutomationCondition[];
    /** Whether every condition must hold, or just one of them. */
    match: MatchMode;
    actions: AutomationAction[];
    isActive: boolean;
    runCount: number;
    lastRunAt?: string | null;
    lastError?: string;
    createdBy?: MemberUser;
    createdAt: string;
}

/** The recipe body a create/update sends. */
export interface AutomationDraft {
    name: string;
    trigger: AutomationTrigger;
    conditions: AutomationCondition[];
    match: MatchMode;
    actions: AutomationAction[];
    isActive?: boolean;
}

/**
 * Where a write has to invalidate. A recipe belongs to exactly one of these
 * lists, but a caller editing from the page may not know which — passing both
 * is cheap (an unsubscribed tag costs nothing) and passing the wrong one alone
 * leaves a stale card on screen.
 */
interface ListScope {
    moduleId?: string;
    workspaceId?: string;
}

const listTags = ({ moduleId, workspaceId }: ListScope) => [
    ...(moduleId ? [{ type: "Automation" as const, id: `LIST-${moduleId}` }] : []),
    ...(workspaceId ? [{ type: "Automation" as const, id: `WS-${workspaceId}` }] : [])
];

export const automationsApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getAutomations: build.query<Automation[], string>({
            query: (moduleId) => `/automations/${moduleId}`,
            transformResponse: (response: { automations?: Automation[] }) =>
                (response.automations ?? []).filter(Boolean),
            providesTags: (result, _error, moduleId) => [
                { type: "Automation" as const, id: `LIST-${moduleId}` },
                ...(result ?? []).map((a) => ({ type: "Automation" as const, id: a._id }))
            ]
        }),

        /**
         * Recipes that watch every module in the workspace. A separate cache
         * entry rather than a flag on getAutomations, because the two lists are
         * shown side by side and one must not evict the other.
         */
        getWorkspaceAutomations: build.query<Automation[], string>({
            query: (workspaceId) => `/automations/workspace/${workspaceId}`,
            transformResponse: (response: { automations?: Automation[] }) =>
                (response.automations ?? []).filter(Boolean),
            providesTags: (result, _error, workspaceId) => [
                { type: "Automation" as const, id: `WS-${workspaceId}` },
                ...(result ?? []).map((a) => ({ type: "Automation" as const, id: a._id }))
            ]
        }),

        createAutomation: build.mutation<
            { message: string; automation: Automation },
            { moduleId: string; body: AutomationDraft }
        >({
            query: ({ moduleId, body }) => ({
                url: `/automations/${moduleId}`,
                method: "POST",
                body
            }),
            invalidatesTags: (_r, _e, { moduleId }) => listTags({ moduleId })
        }),

        createWorkspaceAutomation: build.mutation<
            { message: string; automation: Automation },
            { workspaceId: string; body: AutomationDraft }
        >({
            query: ({ workspaceId, body }) => ({
                url: `/automations/workspace/${workspaceId}`,
                method: "POST",
                body
            }),
            invalidatesTags: (_r, _e, { workspaceId }) => listTags({ workspaceId })
        }),

        updateAutomation: build.mutation<
            { message: string; automation: Automation },
            ListScope & { automationId: string; body: Partial<AutomationDraft> }
        >({
            query: ({ automationId, body }) => ({
                url: `/automations/${automationId}`,
                method: "PUT",
                body
            }),
            invalidatesTags: (_r, _e, { automationId, ...scope }) => [
                { type: "Automation", id: automationId },
                ...listTags(scope)
            ]
        }),

        deleteAutomation: build.mutation<
            { message: string },
            ListScope & { automationId: string }
        >({
            query: ({ automationId }) => ({
                url: `/automations/${automationId}`,
                method: "DELETE"
            }),
            invalidatesTags: (_r, _e, { automationId, ...scope }) => [
                { type: "Automation", id: automationId },
                ...listTags(scope)
            ]
        })
    })
});

export const {
    useGetAutomationsQuery,
    useGetWorkspaceAutomationsQuery,
    useCreateAutomationMutation,
    useCreateWorkspaceAutomationMutation,
    useUpdateAutomationMutation,
    useDeleteAutomationMutation
} = automationsApi;
