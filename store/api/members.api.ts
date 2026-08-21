import { baseApi } from "../baseApi";
import type { Member } from "../types";

export const membersApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getMembers: build.query<Member[], string>({
            query: (workspaceId) => `/workspace-members/${workspaceId}`,
            transformResponse: (response: { members?: Member[] }) =>
                (response.members ?? []).filter(Boolean),
            providesTags: (result, _error, workspaceId) => [
                // The bare LIST tag lets a change that affects every workspace at
                // once (an avatar upload) invalidate all member lists in one go.
                { type: "Member" as const, id: "LIST" },
                { type: "Member" as const, id: `LIST-${workspaceId}` },
                ...(result ?? []).map((m) => ({ type: "Member" as const, id: m._id }))
            ]
        }),

        addMember: build.mutation<
            Member,
            { workspaceId: string; userId: string; role: string }
        >({
            query: ({ workspaceId, ...body }) => ({
                url: `/workspace-members/${workspaceId}`,
                method: "POST",
                body
            }),
            invalidatesTags: (_result, _error, { workspaceId }) => [
                { type: "Member", id: `LIST-${workspaceId}` }
            ]
        }),

        removeMember: build.mutation<
            { message: string },
            { workspaceId: string; memberUserId: string }
        >({
            query: ({ workspaceId, memberUserId }) => ({
                url: `/workspace-members/${workspaceId}/${memberUserId}`,
                method: "DELETE"
            }),
            invalidatesTags: (_result, _error, { workspaceId }) => [
                { type: "Member", id: `LIST-${workspaceId}` }
            ]
        })
    })
});

export const {
    useGetMembersQuery,
    useAddMemberMutation,
    useRemoveMemberMutation
} = membersApi;
