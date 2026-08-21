import { baseApi } from "../baseApi";
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
                { type: "RecordValue", id: `LIST-${recordId}` }
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
            }
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
                { type: "RecordValue", id: `LIST-${recordId}` }
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
