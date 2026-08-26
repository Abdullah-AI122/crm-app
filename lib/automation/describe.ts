import type {
    Automation,
    AutomationAction,
    AutomationCondition,
    AutomationDraft
} from "@/store/api/automations.api";
import {
    actionSpec,
    columnScopeFor,
    opSpec,
    recordFieldSpec,
    triggerSpec,
    type ColumnScope
} from "./catalog";

/**
 * Turning a stored recipe back into a sentence.
 *
 * Every card and the builder's own preview read from here, so a recipe is
 * described one way and one way only. The alternative — each surface writing
 * its own switch — is how "when Status becomes Done" and "when Status is Done"
 * end up on screen at the same time describing the same rule.
 *
 * Names are resolved through a Lexicon supplied by the caller, because the
 * ids in a recipe mean nothing without the module's own columns and
 * collections loaded. A name that cannot be resolved degrades to a readable
 * placeholder rather than an id — a card showing "a column" is honest, one
 * showing 6a8cba… is not.
 */

export interface Lexicon {
    column(ref: { column?: string; columnName?: string }, scope: ColumnScope): string;
    collection(id?: string): string;
    module(id?: string): string;
}

/** A recipe as the describers need it — an Automation or an unsaved draft. */
type Describable = Pick<
    Automation,
    "trigger" | "conditions" | "actions" | "match"
> &
    Partial<Pick<Automation, "scope">>;

export type { Describable };

const quoted = (value?: string) => `"${(value ?? "").trim() || "…"}"`;

/* ------------------------------------------------------------------ *
 * Trigger
 * ------------------------------------------------------------------ */

export function describeTrigger(recipe: Describable, lex: Lexicon): string {
    const { type, value } = recipe.trigger;
    const spec = triggerSpec(type);
    const scope: ColumnScope = spec?.column ?? "record";
    const column = () => lex.column(recipe.trigger, scope);

    switch (type) {
        case "column_changed_to":
            return `When ${column()} becomes ${quoted(value)}`;
        case "column_changed":
            return `When ${column()} changes`;
        case "record_created":
            return "When a record is created";
        case "record_moved":
            return "When a record is moved";
        case "record_renamed":
            return "When a record is renamed";
        case "record_completed":
            return "When a record is marked complete";
        case "record_uncompleted":
            return "When a record is marked incomplete";
        case "record_archived":
            return "When a record is archived";
        case "subrecord_created":
            return "When a sub-record is created";
        case "subrecord_column_changed_to":
            return `When a sub-record's ${column()} becomes ${quoted(value)}`;
        case "subrecord_column_changed":
            return `When a sub-record's ${column()} changes`;
        case "subrecord_completed":
            return "When a sub-record is marked complete";
        case "all_subrecords_completed":
            return "When every sub-record is complete";
        case "amendment_posted":
            return "When an amendment is posted";
        default:
            return "When something happens";
    }
}

/* ------------------------------------------------------------------ *
 * Conditions
 * ------------------------------------------------------------------ */

function describeCondition(
    condition: AutomationCondition,
    recipe: Describable,
    lex: Lexicon
): string {
    const op = opSpec(condition.op);
    const opLabel = op?.label ?? condition.op;

    const subject =
        condition.source === "record"
            ? recordFieldSpec(condition.field)?.label ?? "a field"
            : lex.column(condition, triggerSpec(recipe.trigger.type)?.column ?? "record");

    if (!op?.needsValue) return `${subject} ${opLabel}`;

    // The collection field stores an id, so it has to be looked up like one.
    const value =
        condition.source === "record" && condition.field === "collection"
            ? lex.collection(condition.value)
            : (condition.value ?? "").trim() || "…";

    return `${subject} ${opLabel} ${quoted(value)}`;
}

/** "Status is Done and Owner is not empty", or the any-variant. */
export function describeConditions(recipe: Describable, lex: Lexicon): string {
    const list = recipe.conditions ?? [];
    if (list.length === 0) return "";

    const joiner = recipe.match === "any" ? " or " : " and ";
    return list.map((c) => describeCondition(c, recipe, lex)).join(joiner);
}

/* ------------------------------------------------------------------ *
 * Actions
 * ------------------------------------------------------------------ */

export function describeAction(
    action: AutomationAction,
    recipe: Describable,
    lex: Lexicon
): string {
    const spec = actionSpec(action.type);
    const scope = spec ? columnScopeFor(spec, recipe.trigger.type) : "record";
    const column = () => lex.column(action, scope);

    const complete = (value?: string) =>
        String(value).toLowerCase() === "false" ? "incomplete" : "complete";

    switch (action.type) {
        case "move_to_collection":
            return `move it to ${lex.collection(action.collectionName)}`;
        case "set_column_value":
            return `set ${column()} to ${quoted(action.value)}`;
        case "clear_column_value":
            return `clear ${column()}`;
        case "archive_record":
            return "archive it";
        case "set_completed":
            return `mark it ${complete(action.value)}`;
        case "rename_record":
            return `rename it to ${quoted(action.value)}`;

        case "create_subrecord":
            return `add the sub-record ${quoted(action.value)}`;
        case "complete_all_subrecords":
            return "mark every sub-record complete";
        case "archive_all_subrecords":
            return "archive every sub-record";

        case "set_parent_completed":
            return `mark the parent ${complete(action.value)}`;
        case "set_parent_column_value":
            return `set the parent's ${column()} to ${quoted(action.value)}`;
        case "move_parent_to_collection":
            return `move the parent to ${lex.collection(action.collectionName)}`;

        case "create_record":
            return `create ${quoted(action.value)} in ${lex.collection(action.targetCollection)}`;
        case "post_amendment":
            return `post the amendment ${quoted(action.value)}`;

        default:
            return "do something";
    }
}

export function describeActions(recipe: Describable, lex: Lexicon): string {
    const list = recipe.actions ?? [];
    if (list.length === 0) return "do nothing yet";
    return list.map((a) => describeAction(a, recipe, lex)).join(", then ");
}

/* ------------------------------------------------------------------ *
 * The whole thing
 * ------------------------------------------------------------------ */

export interface RecipeSentence {
    when: string;
    /** Empty when the recipe has no conditions. */
    onlyIf: string;
    then: string;
}

export function describeRecipe(recipe: Describable, lex: Lexicon): RecipeSentence {
    return {
        when: describeTrigger(recipe, lex),
        onlyIf: describeConditions(recipe, lex),
        then: describeActions(recipe, lex)
    };
}

/* ------------------------------------------------------------------ *
 * Building a Lexicon
 * ------------------------------------------------------------------ */

interface Named {
    _id: string;
    name: string;
}

/**
 * The usual Lexicon: module columns, sub-record columns, collections, modules.
 *
 * A WORKSPACE recipe stores column NAMES rather than ids, and those need no
 * lookup at all — which is why `column` takes the whole reference rather than
 * an id, and answers from columnName whenever one is present.
 */
export function buildLexicon(input: {
    columns: Named[];
    subColumns: Named[];
    collections: Named[];
    modules: Named[];
}): Lexicon {
    const find = (list: Named[], id?: string, fallback = "a column") =>
        list.find((entry) => entry._id === id)?.name ?? fallback;

    return {
        column: (ref, scope) => {
            if (ref.columnName) return ref.columnName;
            const list = scope === "subrecord" ? input.subColumns : input.columns;
            return find(list, ref.column);
        },
        collection: (id) => find(input.collections, id, "a collection"),
        module: (id) => find(input.modules, id, "another module")
    };
}

/** A draft carries no scope until it is saved; describers do not need one. */
export const asDescribable = (draft: AutomationDraft): Describable => draft;
