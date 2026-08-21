import { baseApi } from "../baseApi";
import type { RecordItem } from "../types";

export const recordsApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getRecords: build.query<RecordItem[], string>({
            query: (collectionId) => `/records/${collectionId}`,
            transformResponse: (response: { records?: RecordItem[] }) =>
                (response.records ?? []).filter(Boolean),
            providesTags: (result, _error, collectionId) => [
                { type: "Record" as const, id: `LIST-${collectionId}` },
                ...(result ?? []).map((r) => ({ type: "Record" as const, id: r._id }))
            ]
        }),

        createRecord: build.mutation<
            RecordItem,
            { collectionId: string; name: string }
        >({
            query: ({ collectionId, ...body }) => ({
                url: `/records/${collectionId}`,
                method: "POST",
                body
            }),
            transformResponse: (response: { record: RecordItem }) => response.record,
            // The bare Module tag marks the workspace card stats stale. Nothing is
            // subscribed to that list from here, so it costs no request now — it
            // just stops the cards showing a stale count on the way back.
            invalidatesTags: (_result, _error, { collectionId }) => [
                { type: "Record", id: `LIST-${collectionId}` },
                { type: "Module", id: "LIST" }
            ]
        }),

        updateRecord: build.mutation<
            RecordItem,
            {
                recordId: string;
                collectionId: string;
                name?: string;
                position?: number;
                /** Target collection id when the record is moved between groups. */
                collectionName?: string;
            }
        >({
            query: ({ recordId, collectionId: _collectionId, ...body }) => ({
                url: `/records/${recordId}`,
                method: "PUT",
                body
            }),
            async onQueryStarted(
                { recordId, collectionId, collectionName, ...patch },
                { dispatch, queryFulfilled }
            ) {
                // Only patch in place for same-collection edits; a move changes two lists.
                if (collectionName && collectionName !== collectionId) {
                    return;
                }
                const patchResult = dispatch(
                    recordsApi.util.updateQueryData("getRecords", collectionId, (draft) => {
                        const target = draft.find((r) => r._id === recordId);
                        if (target) Object.assign(target, patch);
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
            invalidatesTags: (_result, _error, { collectionId, collectionName }) =>
                collectionName && collectionName !== collectionId
                    ? [
                        { type: "Record" as const, id: `LIST-${collectionId}` },
                        { type: "Record" as const, id: `LIST-${collectionName}` }
                    ]
                    : []
        }),

        deleteRecord: build.mutation<
            { message: string },
            { recordId: string; collectionId: string }
        >({
            query: ({ recordId }) => ({ url: `/records/${recordId}`, method: "DELETE" }),
            invalidatesTags: (_result, _error, { recordId, collectionId }) => [
                { type: "Record", id: recordId },
                { type: "Record", id: `LIST-${collectionId}` },
                { type: "Module", id: "LIST" }
            ]
        })
    })
});

export const {
    useGetRecordsQuery,
    useCreateRecordMutation,
    useUpdateRecordMutation,
    useDeleteRecordMutation
} = recordsApi;
