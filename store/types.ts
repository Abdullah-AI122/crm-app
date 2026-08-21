// Shared server-entity shapes. One definition per resource, imported by the
// endpoint files and the components that render them.

export interface Workspace {
    _id: string;
    name: string;
    slug?: string;
    description?: string;
    logo?: string;
    createdAt: string;
    updatedAt: string;
    totalModules: number;
}

export interface MemberUser {
    _id: string;
    firstName: string;
    lastName?: string;
    email: string;
    avatar?: string;
}

export interface Member {
    _id: string;
    role: "owner" | "admin" | "member" | "guest";
    status: "active" | "pending" | "inactive";
    user: MemberUser;
}

export interface Module {
    _id: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    visibility?: "private" | "workspace" | "public";
    createdAt?: string;
    updatedAt?: string;
    createdBy?: MemberUser;

    // Derived server-side by one aggregation across the whole workspace —
    // see buildModuleStats in backend/controllers/module.controller.ts.
    totalRecords?: number;
    completedRecords?: number;
    /** Share of records marked complete, 0-100. */
    performance?: number;
    /** One point per day for the last 16 days. */
    graphData?: { day: string; value: number }[];
}

export interface Collection {
    _id: string;
    name: string;
    color?: string;
    position: number;
    isCollapsed?: boolean;
}

export interface StatusOption {
    label: string;
    color: string;
}

export interface Column {
    _id: string;
    name: string;
    label?: string;
    type?: string;
    color?: string;
    width?: number;
    position: number;
    isRequired?: boolean;
    isHidden?: boolean;
    options?: string[];
    statusOptions?: StatusOption[];
}

export interface RecordItem {
    _id: string;
    name: string;
    position: number;
    collectionName: string;
    module?: string;
    workspace?: string;
    isCompleted?: boolean;
    isArchived?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface RecordValue {
    _id: string;
    record: string;
    column: Column | string;
    value: unknown;
    createdAt?: string;
    updatedAt?: string;
}
