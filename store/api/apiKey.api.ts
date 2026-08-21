import { baseApi } from "../baseApi";

export const apiKeyApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getApiKey: build.query<string | null, void>({
            query: () => "/api-key",
            transformResponse: (response: { apiKey?: string | null }) =>
                response.apiKey ?? null
        }),

        generateApiKey: build.mutation<string | null, void>({
            query: () => ({ url: "/api-key/generate", method: "POST" }),
            transformResponse: (response: { apiKey?: string | null }) =>
                response.apiKey ?? null,
            // Write the new key straight into the cache — no follow-up GET.
            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(
                        apiKeyApi.util.updateQueryData("getApiKey", undefined, () => data)
                    );
                } catch {
                    // the mutation hook surfaces the error to the caller
                }
            }
        })
    })
});

export const { useGetApiKeyQuery, useGenerateApiKeyMutation } = apiKeyApi;
