import { baseApi } from "../baseApi";
import type { UserStatus } from "@/lib/presence";

export interface PresenceResponse {
    message?: string;
    /** What the user picked. */
    status: UserStatus;
    /** What everyone else sees — the pick, only while the heartbeat is fresh. */
    presence: UserStatus;
    lastSeen?: string;
}

export const presenceApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        updateStatus: build.mutation<PresenceResponse, UserStatus>({
            query: (status) => ({
                url: "/auth/status",
                method: "PATCH",
                body: { status }
            }),
            // The roster renders everyone's dot, so a pick has to reach it.
            invalidatesTags: [{ type: "Member", id: "LIST" }]
        }),

        /**
         * Doubles as the poll for *other* people's presence: there is no socket
         * layer, so the minute-ly beat also refreshes every mounted member list.
         */
        sendHeartbeat: build.mutation<PresenceResponse, void>({
            query: () => ({ url: "/auth/heartbeat", method: "POST" }),
            invalidatesTags: [{ type: "Member", id: "LIST" }]
        })
    })
});

export const { useUpdateStatusMutation, useSendHeartbeatMutation } = presenceApi;
