import { ACTIVITY_TAG, baseApi } from "../baseApi";
import type { ModuleTag, Module } from "../types";

export const modulesApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getModules: build.query<Module[], string>({
            query: (workspaceId) => `/modules/${workspaceId}`,
            transformResponse: (response: { modules?: Module[] }) =>
                (response.modules ?? []).filter(Boolean),
            providesTags: (result, _error, workspaceId) => [
                // Bare LIST so a record write anywhere can mark the card stats stale
                // without having to know which workspace it belongs to.
                { type: "Module" as const, id: "LIST" },
                { type: "Module" as const, id: `LIST-${workspaceId}` },
                ...(result ?? []).map((m) => ({ type: "Module" as const, id: m._id }))
            ]
        }),

        /**
         * Board settings. `visibility` is the access lever — the server refuses
         * it for anyone who is not an owner or admin, and the client shows that
         * message verbatim.
         */
        updateModule: build.mutation<
            Module,
            {
                moduleId: string;
                workspaceId: string;
                name?: string;
                description?: string;
                icon?: string;
                color?: string;
                /** Replaces the whole set — send [] to clear. */
                tags?: ModuleTag[];
                visibility?: "private" | "workspace" | "public";
            }
        >({
            query: ({ moduleId, workspaceId: _workspaceId, ...body }) => ({
                url: `/modules/${moduleId}`,
                method: "PUT",
                body
            }),
            transformResponse: (response: { module: Module }) => response.module,
            invalidatesTags: (_result, _error, { workspaceId, moduleId }) => [
                { type: "Module", id: `LIST-${workspaceId}` },
                { type: "Module", id: moduleId },
                // Making a board private changes who may open it, so every
                // board-access panel for this workspace is now stale.
                { type: "ModuleAccess", id: "LIST" },
                ACTIVITY_TAG
            ]
        }),

        createModule: build.mutation<
            Module,
            { workspaceId: string; name: string; description?: string; tags?: ModuleTag[] }
        >({
            query: ({ workspaceId, ...body }) => ({
                url: `/modules/${workspaceId}`,
                method: "POST",
                body
            }),
            transformResponse: (response: { module: Module }) => response.module,
            invalidatesTags: (_result, _error, { workspaceId }) => [
                { type: "Module", id: `LIST-${workspaceId}` },
                // totalModules on the workspace row changes too
                { type: "Workspace", id: workspaceId },
                { type: "Workspace", id: "LIST" },
                ACTIVITY_TAG
            ]
        }),

        deleteModule: build.mutation<
            { message: string },
            { moduleId: string; workspaceId: string }
        >({
            query: ({ moduleId }) => ({ url: `/modules/${moduleId}`, method: "DELETE" }),
            invalidatesTags: (_result, _error, { moduleId, workspaceId }) => [
                { type: "Module", id: moduleId },
                { type: "Module", id: `LIST-${workspaceId}` },
                { type: "Workspace", id: workspaceId },
                { type: "Workspace", id: "LIST" },
                ACTIVITY_TAG
            ]
        })
    })
});

export const {
    useGetModulesQuery,
    useUpdateModuleMutation,
    useCreateModuleMutation,
    useDeleteModuleMutation
} = modulesApi;
