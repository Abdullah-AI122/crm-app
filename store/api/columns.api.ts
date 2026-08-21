import { baseApi } from "../baseApi";
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

        createColumn: build.mutation<
            Column,
            { moduleId: string; name: string; type: string }
        >({
            query: ({ moduleId, ...body }) => ({
                url: `/columns/${moduleId}`,
                method: "POST",
                body
            }),
            invalidatesTags: (_result, _error, { moduleId }) => [
                { type: "Column", id: `LIST-${moduleId}` }
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
            }
        >({
            query: ({ columnId, moduleId: _moduleId, ...body }) => ({
                url: `/columns/${columnId}`,
                method: "PUT",
                body
            }),
            async onQueryStarted(
                { columnId, moduleId, ...patch },
                { dispatch, queryFulfilled }
            ) {
                const patchResult = dispatch(
                    columnsApi.util.updateQueryData("getColumns", moduleId, (draft) => {
                        const target = draft.find((c) => c._id === columnId);
                        if (target) Object.assign(target, patch);
                    })
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
            { columnId: string; moduleId: string }
        >({
            query: ({ columnId }) => ({ url: `/columns/${columnId}`, method: "DELETE" }),
            invalidatesTags: (_result, _error, { columnId, moduleId }) => [
                { type: "Column", id: columnId },
                { type: "Column", id: `LIST-${moduleId}` }
            ]
        })
    })
});

export const {
    useGetColumnsQuery,
    useCreateColumnMutation,
    useUpdateColumnMutation,
    useDeleteColumnMutation
} = columnsApi;
