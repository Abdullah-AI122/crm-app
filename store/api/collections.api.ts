import { baseApi } from "../baseApi";
import type { Collection } from "../types";

export const collectionsApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getCollections: build.query<Collection[], string>({
            query: (moduleId) => `/collections/${moduleId}`,
            transformResponse: (response: { collections?: Collection[] }) =>
                (response.collections ?? []).filter(Boolean),
            providesTags: (result, _error, moduleId) => [
                { type: "Collection" as const, id: `LIST-${moduleId}` },
                ...(result ?? []).map((c) => ({ type: "Collection" as const, id: c._id }))
            ]
        }),

        createCollection: build.mutation<
            Collection,
            { moduleId: string; name: string; color?: string; position?: number }
        >({
            query: ({ moduleId, ...body }) => ({
                url: `/collections/${moduleId}`,
                method: "POST",
                body
            }),
            invalidatesTags: (_result, _error, { moduleId }) => [
                { type: "Collection", id: `LIST-${moduleId}` }
            ]
        }),

        updateCollection: build.mutation<
            Collection,
            {
                collectionId: string;
                moduleId: string;
                name?: string;
                color?: string;
                position?: number;
                isCollapsed?: boolean;
            }
        >({
            query: ({ collectionId, moduleId: _moduleId, ...body }) => ({
                url: `/collections/${collectionId}`,
                method: "PUT",
                body
            }),
            // Rename / reorder / collapse feel instant; the request just persists it.
            async onQueryStarted(
                { collectionId, moduleId, ...patch },
                { dispatch, queryFulfilled }
            ) {
                const patchResult = dispatch(
                    collectionsApi.util.updateQueryData("getCollections", moduleId, (draft) => {
                        const target = draft.find((c) => c._id === collectionId);
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

        deleteCollection: build.mutation<
            { message: string },
            { collectionId: string; moduleId: string }
        >({
            query: ({ collectionId }) => ({
                url: `/collections/${collectionId}`,
                method: "DELETE"
            }),
            invalidatesTags: (_result, _error, { collectionId, moduleId }) => [
                { type: "Collection", id: collectionId },
                { type: "Collection", id: `LIST-${moduleId}` },
                { type: "Record", id: `LIST-${collectionId}` }
            ]
        })
    })
});

export const {
    useGetCollectionsQuery,
    useCreateCollectionMutation,
    useUpdateCollectionMutation,
    useDeleteCollectionMutation
} = collectionsApi;
