import type {
    ActionType,
    ConditionOp,
    RecordField,
    TriggerType
} from "@/store/api/automations.api";

/**
 * What every trigger and action needs in order to be filled in.
 *
 * This is the file the builder is driven BY. Without it each control ends up
 * as its own `triggerType === "x" || triggerType === "y"` test scattered
 * through the modal, and adding a trigger means hunting for all of them. Here,
 * adding one is a row in a table.
 *
 * Mirrors backend/models/Automation.ts. The server re-validates everything
 * below and its message is what the user sees — these specs decide what is
 * OFFERED, never what is allowed.
 */

/** Which kind of row a trigger fires on. Drives which actions make sense. */
export type Subject = "record" | "subrecord";

/** Which column set a control should list. */
export type ColumnScope = "record" | "subrecord";

export interface TriggerSpec {
    value: TriggerType;
    label: string;
    /**
     * How this reads inside the sentence, after "When". Shorter and lower-case
     * where `label` is a menu heading — "a record is created", not "A record is
     * created". The two differ because a menu is scanned and a sentence is read.
     */
    sentence: string;
    hint: string;
    group: string;
    subject: Subject;
    /** Needs a watched column, from this column set. */
    column?: ColumnScope;
    /** Needs the value that arms it. */
    needsValue?: boolean;
}

export const TRIGGER_GROUPS = [
    "Records",
    "Columns",
    "Sub-records",
    "Amendments"
] as const;

export const TRIGGERS: TriggerSpec[] = [
    /* --- Columns first: this is what most recipes watch --- */
    {
        value: "column_changed_to",
        sentence: "a column changes to a value",
        label: "A column changes to a value",
        hint: "e.g. Status becomes Done. Fires only on the change into that value, not on every re-save.",
        group: "Columns",
        subject: "record",
        column: "record",
        needsValue: true
    },
    {
        value: "column_changed",
        sentence: "a column changes at all",
        label: "A column changes at all",
        hint: "Any edit to that field, whatever it changes to.",
        group: "Columns",
        subject: "record",
        column: "record"
    },

    /* --- Record lifecycle --- */
    {
        value: "record_created",
        sentence: "a record is created",
        label: "A record is created",
        hint: "Anywhere on the module. Add a condition to narrow it to one collection.",
        group: "Records",
        subject: "record"
    },
    {
        value: "record_moved",
        sentence: "a record is moved",
        label: "A record is moved",
        hint: "Between collections. Use a condition on the collection to catch one in particular.",
        group: "Records",
        subject: "record"
    },
    {
        value: "record_renamed",
        sentence: "a record is renamed",
        label: "A record is renamed",
        hint: "Its name changed — not its columns.",
        group: "Records",
        subject: "record"
    },
    {
        value: "record_completed",
        sentence: "a record is marked complete",
        label: "A record is marked complete",
        hint: "The completion tick, not a status column.",
        group: "Records",
        subject: "record"
    },
    {
        value: "record_uncompleted",
        sentence: "a record is marked incomplete",
        label: "A record is marked incomplete",
        hint: "A completed record was un-ticked.",
        group: "Records",
        subject: "record"
    },
    {
        value: "record_archived",
        sentence: "a record is archived",
        label: "A record is archived",
        hint: "The soft delete the module performs. Its sub-records go with it.",
        group: "Records",
        subject: "record"
    },

    /* --- Sub-records --- */
    {
        value: "all_subrecords_completed",
        sentence: "every sub-record is complete",
        label: "Every sub-record is complete",
        hint: "Fires on the PARENT record when the last outstanding sub-record is finished. Never fires for a record that has none.",
        group: "Sub-records",
        subject: "record"
    },
    {
        value: "subrecord_created",
        sentence: "a sub-record is created",
        label: "A sub-record is created",
        hint: "Added under a record. Separate from 'a record is created', which never fires on one.",
        group: "Sub-records",
        subject: "subrecord"
    },
    {
        value: "subrecord_column_changed_to",
        sentence: "a sub-record column changes to a value",
        label: "A sub-record column changes to a value",
        hint: "Reads the sub-record column set, which is its own — not the module's.",
        group: "Sub-records",
        subject: "subrecord",
        column: "subrecord",
        needsValue: true
    },
    {
        value: "subrecord_column_changed",
        sentence: "a sub-record column changes at all",
        label: "A sub-record column changes at all",
        hint: "Any edit to that sub-record field.",
        group: "Sub-records",
        subject: "subrecord",
        column: "subrecord"
    },
    {
        value: "subrecord_completed",
        sentence: "a sub-record is marked complete",
        label: "A sub-record is marked complete",
        hint: "One line finished. Pair it with a parent action to roll the result up.",
        group: "Sub-records",
        subject: "subrecord"
    },

    /* --- Conversation --- */
    {
        value: "amendment_posted",
        sentence: "an amendment is posted",
        label: "An amendment is posted",
        hint: "Someone wrote a note on the record. Replies do not re-fire it.",
        group: "Amendments",
        subject: "record"
    }
];

/* ------------------------------------------------------------------ *
 * Actions
 * ------------------------------------------------------------------ */

/** How an action's `value` should be edited, if at all. */
export type ValueKind = "none" | "text" | "column-value" | "boolean";

export interface ActionSpec {
    value: ActionType;
    label: string;
    /** How this reads inside the sentence, after "Then". */
    sentence: string;
    hint?: string;
    group: string;
    /** Trigger subjects this action can run under. */
    subjects: Subject[];
    /**
     * "subject" follows the trigger (a sub-record trigger writes sub-record
     * columns); "record" always means the module's own column set, which is
     * what a parent write needs.
     */
    columnScope?: "subject" | "record";
    /** Needs a collection on this module. */
    collection?: boolean;
    /** Needs a module + collection to create into, possibly another module. */
    target?: boolean;
    valueKind: ValueKind;
    valuePlaceholder?: string;
    /** Meaningless at workspace scope — a collection belongs to one module. */
    moduleOnly?: boolean;
}

export const ACTION_GROUPS = [
    "This record",
    "Sub-records",
    "The parent record",
    "Elsewhere"
] as const;

export const ACTIONS: ActionSpec[] = [
    /* --- This record --- */
    {
        value: "move_to_collection",
        sentence: "move it to",
        label: "Move it to a collection",
        group: "This record",
        subjects: ["record"],
        collection: true,
        valueKind: "none",
        moduleOnly: true
    },
    {
        value: "set_column_value",
        sentence: "set",
        label: "Set a column's value",
        group: "This record",
        subjects: ["record", "subrecord"],
        columnScope: "subject",
        valueKind: "column-value"
    },
    {
        value: "clear_column_value",
        sentence: "clear",
        label: "Clear a column",
        group: "This record",
        subjects: ["record", "subrecord"],
        columnScope: "subject",
        valueKind: "none"
    },
    {
        value: "set_completed",
        sentence: "mark it",
        label: "Mark it complete / incomplete",
        group: "This record",
        subjects: ["record", "subrecord"],
        valueKind: "boolean"
    },
    {
        value: "rename_record",
        sentence: "rename it to",
        label: "Rename it",
        hint: "{record} is its current name, {value} is what fired the trigger.",
        group: "This record",
        subjects: ["record", "subrecord"],
        valueKind: "text",
        valuePlaceholder: "e.g. {record} — done"
    },
    {
        value: "archive_record",
        sentence: "archive it",
        label: "Archive it",
        group: "This record",
        subjects: ["record", "subrecord"],
        valueKind: "none"
    },

    /* --- Sub-records --- */
    {
        value: "create_subrecord",
        sentence: "add the sub-record",
        label: "Add a sub-record under it",
        hint: "Seeds the sub-record columns if this module has none yet.",
        group: "Sub-records",
        subjects: ["record"],
        valueKind: "text",
        valuePlaceholder: "e.g. Follow up with {record}"
    },
    {
        value: "complete_all_subrecords",
        sentence: "mark every sub-record complete",
        label: "Mark every sub-record complete",
        group: "Sub-records",
        subjects: ["record"],
        valueKind: "none"
    },
    {
        value: "archive_all_subrecords",
        sentence: "archive every sub-record",
        label: "Archive every sub-record",
        group: "Sub-records",
        subjects: ["record"],
        valueKind: "none"
    },

    /* --- The parent record (sub-record triggers only) --- */
    {
        value: "set_parent_completed",
        sentence: "mark the parent",
        label: "Mark the parent complete / incomplete",
        group: "The parent record",
        subjects: ["subrecord"],
        valueKind: "boolean"
    },
    {
        value: "set_parent_column_value",
        sentence: "set the parent's",
        label: "Set a column on the parent",
        hint: "Writes the module's own columns, not the sub-record ones.",
        group: "The parent record",
        subjects: ["subrecord"],
        columnScope: "record",
        valueKind: "column-value"
    },
    {
        value: "move_parent_to_collection",
        sentence: "move the parent to",
        label: "Move the parent to a collection",
        hint: "Its sub-records move with it.",
        group: "The parent record",
        subjects: ["subrecord"],
        collection: true,
        valueKind: "none",
        moduleOnly: true
    },

    /* --- Elsewhere --- */
    {
        value: "create_record",
        sentence: "create the record",
        label: "Create a record somewhere",
        hint: "Any module in this workspace.",
        group: "Elsewhere",
        subjects: ["record", "subrecord"],
        target: true,
        valueKind: "text",
        valuePlaceholder: "e.g. Kick off {record}"
    },
    {
        value: "post_amendment",
        sentence: "post the amendment",
        label: "Post an amendment on it",
        group: "Elsewhere",
        subjects: ["record", "subrecord"],
        valueKind: "text",
        valuePlaceholder: "e.g. Auto-flagged: {record} moved to {value}"
    }
];

/* ------------------------------------------------------------------ *
 * Conditions
 * ------------------------------------------------------------------ */

export interface OpSpec {
    value: ConditionOp;
    label: string;
    needsValue: boolean;
    /** Only offered where a number comparison means something. */
    numeric?: boolean;
}

export const OPS: OpSpec[] = [
    { value: "is", label: "is", needsValue: true },
    { value: "is_not", label: "is not", needsValue: true },
    { value: "contains", label: "contains", needsValue: true },
    { value: "not_contains", label: "does not contain", needsValue: true },
    { value: "starts_with", label: "starts with", needsValue: true },
    { value: "is_empty", label: "is empty", needsValue: false },
    { value: "is_not_empty", label: "is not empty", needsValue: false },
    { value: "greater_than", label: "is greater than", needsValue: true, numeric: true },
    { value: "less_than", label: "is less than", needsValue: true, numeric: true }
];

export interface RecordFieldSpec {
    value: RecordField;
    label: string;
    /** How its comparison value should be edited. */
    editor: "text" | "collection" | "boolean" | "number";
}

export const RECORD_FIELDS: RecordFieldSpec[] = [
    { value: "name", label: "Record name", editor: "text" },
    { value: "collection", label: "Collection", editor: "collection" },
    { value: "is_completed", label: "Completed", editor: "boolean" },
    { value: "is_archived", label: "Archived", editor: "boolean" },
    { value: "subrecord_count", label: "Number of sub-records", editor: "number" },
    { value: "amendment_count", label: "Number of amendments", editor: "number" }
];

/* ------------------------------------------------------------------ *
 * Lookups
 * ------------------------------------------------------------------ */

export const triggerSpec = (type: TriggerType): TriggerSpec | undefined =>
    TRIGGERS.find((t) => t.value === type);

export const actionSpec = (type: ActionType): ActionSpec | undefined =>
    ACTIONS.find((a) => a.value === type);

export const opSpec = (op: ConditionOp): OpSpec | undefined =>
    OPS.find((o) => o.value === op);

export const recordFieldSpec = (field?: RecordField): RecordFieldSpec | undefined =>
    RECORD_FIELDS.find((f) => f.value === field);

/** The subject a trigger fires on — what decides which actions are offered. */
export const subjectOf = (type: TriggerType): Subject =>
    triggerSpec(type)?.subject ?? "record";

/**
 * Which actions can follow this trigger, at this scope.
 *
 * Filtering here rather than greying options out: an action that cannot run is
 * not a disabled choice, it is a choice that was never on offer, and a list of
 * six things that work reads better than fourteen with eight crossed out.
 */
export function actionsFor(
    triggerType: TriggerType,
    scope: "module" | "workspace"
): ActionSpec[] {
    const subject = subjectOf(triggerType);

    return ACTIONS.filter(
        (action) =>
            action.subjects.includes(subject) &&
            !(scope === "workspace" && action.moduleOnly)
    );
}

/** The column set an action's column picker should list. */
export function columnScopeFor(
    action: ActionSpec,
    triggerType: TriggerType
): ColumnScope {
    if (action.columnScope === "record") return "record";
    return subjectOf(triggerType);
}
