import { ACTIVITY_TAG, baseApi } from "../baseApi";
import type { RecordValue } from "../types";

export const recordValuesApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getRecordValues: build.query<RecordValue[], string>({
            query: (recordId) => `/record-values/${recordId}`,
            transformResponse: (response: { values?: RecordValue[] }) =>
                (response.values ?? []).filter(Boolean),
            providesTags: (result, _error, recordId) => [
                { type: "RecordValue" as const, id: `LIST-${recordId}` },
                ...(result ?? []).map((v) => ({ type: "RecordValue" as const, id: v._id }))
            ]
        }),

        createRecordValue: build.mutation<
            RecordValue,
            {
                recordId: string;
                columnId: string;
                collectionId: string;
                moduleId: string;
                workspaceId: string;
                value: unknown;
            }
        >({
            query: ({ recordId, columnId, collectionId, moduleId, workspaceId, value }) => ({
                url: "/record-values",
                method: "POST",
                body: {
                    record: recordId,
                    column: columnId,
                    collectionName: collectionId,
                    module: moduleId,
                    workspace: workspaceId,
                    value
                }
            }),
            invalidatesTags: (_result, _error, { recordId }) => [
                // Reference columns are derived from cells like this one.
                { type: "RecordValue" as const, id: "LIST" },
                { type: "RecordValue", id: `LIST-${recordId}` },
                ACTIVITY_TAG
            ]
        }),

        // Cell edits are the hottest path in the grid: apply locally, roll back on failure.
        updateRecordValue: build.mutation<
            RecordValue,
            { recordValueId: string; recordId: string; value: unknown }
        >({
            query: ({ recordValueId, value }) => ({
                url: `/record-values/${recordValueId}`,
                method: "PUT",
                body: { value }
            }),
            async onQueryStarted(
                { recordValueId, recordId, value },
                { dispatch, queryFulfilled }
            ) {
                const patchResult = dispatch(
                    recordValuesApi.util.updateQueryData(
                        "getRecordValues",
                        recordId,
                        (draft) => {
                            const cell = draft.find((v) => v._id === recordValueId);
                            if (cell) cell.value = value;
                        }
                    )
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },

            /**
             * The optimistic patch above fixes THIS cell, and for a plain text
             * or number cell that is the whole story — which is why this
             * mutation had no tags at all.
             *
             * A mirror is different: its value is derived from this cell by the
             * server, so patching one row locally leaves every row that mirrors
             * it stale until a manual reload. The bare LIST tag is provided only
             * by getModuleReferences, so this re-resolves the whole board's
             * mirrors in ONE request and touches nothing else — the per-record
             * cell lists keep their own `LIST-<recordId>` tags and are left
             * alone, so the hot path stays as cheap as it was.
             */
            invalidatesTags: [
                { type: "RecordValue" as const, id: "LIST" },
                ACTIVITY_TAG
            ]
        }),

        deleteRecordValue: build.mutation<
            { message: string },
            { recordValueId: string; recordId: string }
        >({
            query: ({ recordValueId }) => ({
                url: `/record-values/${recordValueId}`,
                method: "DELETE"
            }),
            invalidatesTags: (_result, _error, { recordId }) => [
                // Reference columns are derived from cells like this one.
                { type: "RecordValue" as const, id: "LIST" },
                { type: "RecordValue", id: `LIST-${recordId}` },
                ACTIVITY_TAG
            ]
        })
    })
});

export const {
    useGetRecordValuesQuery,
    useCreateRecordValueMutation,
    useUpdateRecordValueMutation,
    useDeleteRecordValueMutation
} = recordValuesApi;
