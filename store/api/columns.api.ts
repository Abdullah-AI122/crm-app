import { ACTIVITY_TAG, baseApi } from "../baseApi";
import type { Column, StatusOption } from "../types";

export const columnsApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getColumns: build.query<Column[], string>({
            query: (moduleId) => `/columns/${moduleId}`,
            transformResponse: (response: { columns?: Column[] }) =>
                (response.columns ?? []).filter(Boolean),
            providesTags: (result, _error, moduleId) => [
                { type: "Column" as const, id: `LIST-${moduleId}` },
                ...(result ?? []).map((c) => ({ type: "Column" as const, id: c._id }))
            ]
        }),

        /**
         * The sub-record grid's own columns. A separate endpoint rather than an
         * argument on getColumns, so the board's cache entry keeps its plain
         * `moduleId` key and every existing call site stays untouched.
         */
        getSubColumns: build.query<Column[], string>({
            query: (moduleId) => `/columns/${moduleId}?scope=subrecord`,
            transformResponse: (response: { columns?: Column[] }) =>
                (response.columns ?? []).filter(Boolean),
            providesTags: (result, _error, moduleId) => [
                { type: "Column" as const, id: `LIST-SUB-${moduleId}` },
                ...(result ?? []).map((c) => ({ type: "Column" as const, id: c._id }))
            ]
        }),

        createColumn: build.mutation<
            Column,
            {
                moduleId: string;
                name: string;
                type: string;
                /** relation: {targetModule} · reference: {via, field, aggregate} */
                settings?: {
                    targetModule?: string;
                    via?: string;
                    field?: string;
                    aggregate?: string;
                };
                /** Omitted for a board column; "subrecord" adds it to the sub-record grid. */
                scope?: "record" | "subrecord";
            }
        >({
            query: ({ moduleId, ...body }) => ({
                url: `/columns/${moduleId}`,
                method: "POST",
                body
            }),
            invalidatesTags: (_result, _error, { moduleId, scope }) => [
                {
                    type: "Column",
                    id: scope === "subrecord" ? `LIST-SUB-${moduleId}` : `LIST-${moduleId}`
                },
                ACTIVITY_TAG
            ]
        }),

        updateColumn: build.mutation<
            Column,
            {
                columnId: string;
                moduleId: string;
                name?: string;
                width?: number;
                position?: number;
                statusOptions?: StatusOption[];
                /** Which grid the column belongs to — decides the cache entry to patch. */
                scope?: "record" | "subrecord";
            }
        >({
            query: ({ columnId, moduleId: _moduleId, scope: _scope, ...body }) => ({
                url: `/columns/${columnId}`,
                method: "PUT",
                body
            }),
            async onQueryStarted(
                { columnId, moduleId, scope, ...patch },
                { dispatch, queryFulfilled }
            ) {
                const patchResult = dispatch(
                    columnsApi.util.updateQueryData(
                        scope === "subrecord" ? "getSubColumns" : "getColumns",
                        moduleId,
                        (draft) => {
                            const target = draft.find((c) => c._id === columnId);
                            if (target) Object.assign(target, patch);
                        }
                    )
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            }
        }),

        deleteColumn: build.mutation<
            { message: string },
            { columnId: string; moduleId: string; scope?: "record" | "subrecord" }
        >({
            query: ({ columnId }) => ({ url: `/columns/${columnId}`, method: "DELETE" }),
            invalidatesTags: (_result, _error, { columnId, moduleId, scope }) => [
                { type: "Column", id: columnId },
                {
                    type: "Column",
                    id: scope === "subrecord" ? `LIST-SUB-${moduleId}` : `LIST-${moduleId}`
                },
                ACTIVITY_TAG
            ]
        })
    })
});

export const {
    useGetColumnsQuery,
    useGetSubColumnsQuery,
    useCreateColumnMutation,
    useUpdateColumnMutation,
    useDeleteColumnMutation
} = columnsApi;
