import { baseApi } from "../baseApi";

/** One linked record and what it holds for the referenced column. */
export interface ReferenceItem {
    recordId: string;
    name: string;
    value: string;
}

export interface ResolvedReference {
    items: ReferenceItem[];
    /** Ready to render — the client never re-derives it. */
    display: string;
    numeric?: number;
}

/** recordId -> columnId -> resolved */
export type ReferenceMap = Record<string, Record<string, ResolvedReference>>;

export const referencesApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        /**
         * Every reference column on a module, resolved for every record in one
         * request. Per-record would be four queries times the rows on screen.
         *
         * Tagged with RecordValue so it re-resolves whenever a cell changes:
         * a reference is derived from other people's values, and the only
         * signal it has is that one of them moved.
         */
        getModuleReferences: build.query<ReferenceMap, string>({
            query: (moduleId) => `/record-values/references/${moduleId}`,
            transformResponse: (response: { references?: ReferenceMap }) =>
                response.references ?? {},
            providesTags: (_result, _error, moduleId) => [
                { type: "RecordValue" as const, id: `REFS-${moduleId}` },
                { type: "RecordValue" as const, id: "LIST" }
            ]
        })
    })
});

export const { useGetModuleReferencesQuery } = referencesApi;
