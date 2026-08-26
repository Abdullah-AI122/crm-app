import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import env from "@/config/env";
import { getToken } from "@/lib/auth";

/**
 * Every mutation that the server audits must carry this tag, otherwise the
 * activity feed keeps serving a cached page and only a hard refresh shows the
 * new entries. It is a bare LIST id so one tag covers every workspace.
 */
export const ACTIVITY_TAG = { type: "Activity" as const, id: "LIST" };

/**
 * The single shared cache instance. Every resource file injects its endpoints
 * here, so two components asking for the same data share one request.
 */
export const baseApi = createApi({
    reducerPath: "api",

    baseQuery: fetchBaseQuery({
        baseUrl: (env.NEXT_PUBLIC_API_URL ?? "http://localhost:4040/api").replace(/\/$/, ""),
        prepareHeaders: (headers) => {
            const token = getToken();
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            return headers;
        }
    }),

    tagTypes: [
        "Workspace",
        "Member",
        "Module",
        "Collection",
        "Column",
        "Record",
        "RecordValue",
        "Amendment",
        "Activity",
        "Automation",
        "ModuleAccess"
    ],

    keepUnusedDataFor: 120,        // seconds a cache entry survives with no subscriber
    refetchOnMountOrArgChange: 60, // only refetch when data is older than 60s
    refetchOnReconnect: true,

    endpoints: () => ({})
});
