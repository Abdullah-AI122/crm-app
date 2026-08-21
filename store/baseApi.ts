import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import env from "@/config/env";
import { getToken } from "@/lib/auth";

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
        "RecordValue"
    ],

    keepUnusedDataFor: 120,        // seconds a cache entry survives with no subscriber
    refetchOnMountOrArgChange: 60, // only refetch when data is older than 60s
    refetchOnReconnect: true,

    endpoints: () => ({})
});
