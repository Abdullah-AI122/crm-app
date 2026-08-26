// lib/dataConsole.ts

/**
 * The catalog behind /developer/data-console.
 *
 * It describes the public REST surface the way the docs would: what each
 * endpoint returns, which id it hangs off, and which query params it actually
 * honours. The console builds every request from this — so a param can only
 * appear in the UI (and in the copied snippet) if the server really reads it.
 *
 * Read-only on purpose. This runs against live CRM data with a key that has
 * full account access; a stray click must never be able to delete a module.
 */

/** Which id the endpoint hangs off — the console resolves it with a picker. */
export type ParamKind = "workspace" | "module" | "collection" | "record";

export interface QueryParamDef {
    name: string;
    label: string;
    type: "number" | "text" | "select";
    placeholder?: string;
    options?: { value: string; label: string }[];
    help?: string;
}

export interface EndpointDef {
    id: string;
    group: string;
    name: string;
    summary: string;
    /** With `:param` still in it — the console substitutes the picked id. */
    path: string;
    requires?: ParamKind;
    /** The key holding the payload in the JSON response. */
    resultKey: string;
    /** True when resultKey holds a single object rather than an array. */
    single?: boolean;
    query: QueryParamDef[];
}

const LIMIT: QueryParamDef = {
    name: "limit",
    label: "limit",
    type: "number",
    placeholder: "50",
    help: "1-200. Sending it switches the response to a page."
};

const PAGE: QueryParamDef = {
    name: "page",
    label: "page",
    type: "number",
    placeholder: "1",
    help: "1-based. Comes back as pagination.page."
};

const ORDER: QueryParamDef = {
    name: "order",
    label: "order",
    type: "select",
    options: [
        { value: "asc", label: "asc" },
        { value: "desc", label: "desc" }
    ]
};

const sortBy = (...fields: string[]): QueryParamDef => ({
    name: "sort",
    label: "sort",
    type: "select",
    options: fields.map((field) => ({ value: field, label: field })),
    help: "Anything outside this list is ignored, not guessed."
});

export const ENDPOINTS: EndpointDef[] = [
    {
        id: "workspaces.list",
        group: "Workspaces",
        name: "List workspaces",
        summary: "Every workspace you belong to, wrapped in its membership row.",
        path: "/workspaces",
        resultKey: "workspaces",
        query: [LIMIT, PAGE]
    },
    {
        id: "workspaces.get",
        group: "Workspaces",
        name: "Get workspace",
        summary: "One workspace by id.",
        path: "/workspaces/:workspaceId",
        requires: "workspace",
        resultKey: "workspace",
        single: true,
        query: []
    },
    {
        id: "members.list",
        group: "Workspaces",
        name: "List members",
        summary: "Roster with role, membership status and live presence.",
        path: "/workspace-members/:workspaceId",
        requires: "workspace",
        resultKey: "members",
        query: [LIMIT, PAGE]
    },
    {
        id: "modules.list",
        group: "Modules",
        name: "List modules",
        summary: "Modules in a workspace, each with its record stats.",
        path: "/modules/:workspaceId",
        requires: "workspace",
        resultKey: "modules",
        query: [LIMIT, PAGE, sortBy("name", "createdAt", "updatedAt"), ORDER]
    },
    {
        id: "collections.list",
        group: "Modules",
        name: "List collections",
        summary: "Collections inside a module, in module order.",
        path: "/collections/:moduleId",
        requires: "module",
        resultKey: "collections",
        query: [LIMIT, PAGE, sortBy("position", "name", "createdAt", "updatedAt"), ORDER]
    },
    {
        id: "columns.list",
        group: "Modules",
        name: "List columns",
        summary: "Column definitions for a module - types, options, widths.",
        path: "/columns/:moduleId",
        requires: "module",
        resultKey: "columns",
        query: [
            {
                name: "scope",
                label: "scope",
                type: "select",
                options: [{ value: "subrecord", label: "subrecord" }],
                help: "A module carries two column sets. The default is the module's own; subrecord returns the ones its sub-records are shown with."
            },
            LIMIT,
            PAGE,
            sortBy("position", "name", "type", "createdAt"),
            ORDER
        ]
    },
    {
        id: "automations.list",
        group: "Modules",
        name: "List automations",
        summary: "Recipes on a module, with run counts and the last error.",
        path: "/automations/:moduleId",
        requires: "module",
        resultKey: "automations",
        query: [LIMIT, PAGE]
    },
    {
        id: "records.list",
        group: "Records",
        name: "List records",
        summary:
            "Top-level records in a collection. Archived rows and sub-records are excluded; each row carries subRecordCount.",
        path: "/records/:collectionId",
        requires: "collection",
        resultKey: "records",
        query: [LIMIT, PAGE, sortBy("position", "name", "createdAt", "updatedAt"), ORDER]
    },
    {
        id: "records.subRecords",
        group: "Records",
        name: "List sub-records",
        summary:
            "The sub-records of one record, in their own order. They carry the module's subrecord-scoped columns, not the board's.",
        path: "/records/:recordId/sub-records",
        requires: "record",
        resultKey: "records",
        query: []
    },
    {
        id: "recordValues.list",
        group: "Records",
        name: "List record values",
        summary: "The values of one record, each with its column populated.",
        path: "/record-values/:recordId",
        requires: "record",
        resultKey: "values",
        query: [LIMIT, PAGE]
    },
    {
        id: "activity.list",
        group: "Activity",
        name: "List activity",
        summary:
            "Audit feed for a workspace. Cursor-paged rather than offset-paged, so rows landing on top cannot shift a page.",
        path: "/activity/:workspaceId",
        requires: "workspace",
        resultKey: "activities",
        query: [
            LIMIT,
            { name: "moduleId", label: "moduleId", type: "text", placeholder: "ObjectId" },
            { name: "recordId", label: "recordId", type: "text", placeholder: "ObjectId" },
            { name: "userId", label: "userId", type: "text", placeholder: "ObjectId" },
            {
                name: "action",
                label: "action",
                type: "text",
                placeholder: "cell_updated,record_created",
                help: "Comma-separated."
            },
            {
                name: "before",
                label: "before",
                type: "text",
                placeholder: "ISO date from nextCursor",
                help: "Keyset cursor - pass back the nextCursor you got."
            }
        ]
    }
];

export const ENDPOINT_GROUPS = Array.from(
    new Set(ENDPOINTS.map((endpoint) => endpoint.group))
);

/** The picker chain each path param sits at the end of. */
export const PARAM_CHAIN: ParamKind[] = ["workspace", "module", "collection", "record"];

export const chainUpTo = (kind?: ParamKind): ParamKind[] =>
    kind ? PARAM_CHAIN.slice(0, PARAM_CHAIN.indexOf(kind) + 1) : [];

export const apiBaseUrl = (raw?: string) =>
    (raw || "http://localhost:4040/api").replace(/\/$/, "");

export const resolvePath = (
    endpoint: EndpointDef,
    ids: Partial<Record<ParamKind, string>>
) =>
    endpoint.path
        .replace(":workspaceId", ids.workspace || "")
        .replace(":moduleId", ids.module || "")
        .replace(":collectionId", ids.collection || "")
        .replace(":recordId", ids.record || "");

export const buildQueryString = (params: Record<string, string>) => {
    const search = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== "") {
            search.set(key, String(value).trim());
        }
    });

    const query = search.toString();
    return query ? `?${query}` : "";
};

export const buildRequestUrl = (
    baseUrl: string,
    endpoint: EndpointDef,
    ids: Partial<Record<ParamKind, string>>,
    params: Record<string, string>
) => `${baseUrl}${resolvePath(endpoint, ids)}${buildQueryString(params)}`;

/** Enough of the key to recognise it, never enough to use it. */
export const maskKey = (key?: string | null) =>
    key ? `${key.slice(0, 8)}${"•".repeat(12)}${key.slice(-4)}` : "";

export const toCurl = (url: string, apiKey: string) =>
    `curl '${url}' \\\n  -H 'x-api-key: ${apiKey}'`;

export const toFetchSnippet = (url: string, apiKey: string) =>
    [
        `const response = await fetch(`,
        `  "${url}",`,
        `  { headers: { "x-api-key": "${apiKey}" } }`,
        `);`,
        ``,
        `const data = await response.json();`,
        `console.log(data);`
    ].join("\n");

/**
 * Column names for the table view. Union of the keys present across the page,
 * ordered by how often they appear so the shared fields land on the left.
 */
export const inferColumns = (rows: Record<string, unknown>[], max = 8) => {
    const counts = new Map<string, number>();

    rows.forEach((row) => {
        Object.keys(row ?? {}).forEach((key) => {
            counts.set(key, (counts.get(key) ?? 0) + 1);
        });
    });

    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, max)
        .map(([key]) => key);
};

export const formatCell = (value: unknown): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (typeof value === "boolean") return value ? "true" : "false";
    if (Array.isArray(value)) return `[${value.length}]`;

    const nested = value as Record<string, unknown>;
    return String(nested.name ?? nested.firstName ?? nested._id ?? "{...}");
};

export const formatBytes = (bytes: number) =>
    bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
