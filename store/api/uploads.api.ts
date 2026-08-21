import { baseApi } from "../baseApi";

export interface UploadedFile {
    id: string;
    name: string;
    url: string;
    publicId: string;
    mimeType: string;
    bytes: number;
    width?: number;
    height?: number;
    resourceType: string;
}

export interface AvatarUploadResponse {
    message: string;
    avatar: string;
    bytes: number;
    user: {
        id: string;
        firstName: string;
        lastName?: string;
        email: string;
        avatar?: string;
        authProvider: string;
    };
}

/**
 * Upload endpoints send FormData, so no Content-Type header is set — the browser
 * has to add its own multipart boundary. fetchBaseQuery leaves FormData bodies
 * alone, and baseApi still attaches the Bearer token.
 */
export const uploadsApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        uploadAvatar: build.mutation<AvatarUploadResponse, File>({
            query: (file) => {
                const body = new FormData();
                body.append("file", file);
                return { url: "/uploads/avatar", method: "POST", body };
            },
            invalidatesTags: [{ type: "Member", id: "LIST" }]
        }),

        deleteAvatar: build.mutation<{ message: string; avatar: string }, void>({
            query: () => ({ url: "/uploads/avatar", method: "DELETE" }),
            invalidatesTags: [{ type: "Member", id: "LIST" }]
        }),

        uploadWorkspaceFiles: build.mutation<
            { message: string; files: UploadedFile[] },
            { workspaceId: string; files: File[]; recordId?: string }
        >({
            query: ({ workspaceId, files, recordId }) => {
                const body = new FormData();
                files.forEach((file) => body.append("files", file));
                if (recordId) body.append("recordId", recordId);
                return { url: `/uploads/workspace/${workspaceId}`, method: "POST", body };
            }
        }),

        deleteWorkspaceFile: build.mutation<
            { message: string },
            { workspaceId: string; publicId: string }
        >({
            query: ({ workspaceId, publicId }) => ({
                url: `/uploads/workspace/${workspaceId}`,
                method: "DELETE",
                body: { publicId }
            })
        })
    })
});

export const {
    useUploadAvatarMutation,
    useDeleteAvatarMutation,
    useUploadWorkspaceFilesMutation,
    useDeleteWorkspaceFileMutation
} = uploadsApi;
