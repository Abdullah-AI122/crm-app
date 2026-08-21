import { baseApi } from "../baseApi";
import type { Module } from "../types";

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

        createModule: build.mutation<
            Module,
            { workspaceId: string; name: string; description?: string }
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
                { type: "Workspace", id: "LIST" }
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
                { type: "Workspace", id: "LIST" }
            ]
        })
    })
});

export const {
    useGetModulesQuery,
    useCreateModuleMutation,
    useDeleteModuleMutation
} = modulesApi;
