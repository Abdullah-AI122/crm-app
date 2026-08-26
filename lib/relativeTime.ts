/**
 * Relative and absolute time, in one place.
 *
 * Relative ("4m ago") is what a list wants: it answers "is this fresh?" at a
 * glance, which is the only question a row is asked. Absolute ("14 Aug 2026 at
 * 09:11") is what a person wants the moment they actually care, and it is the
 * only form that survives being read tomorrow — so anywhere the short form is
 * shown, the full one should be one click or one hover away.
 */

/** "just now" / "4m ago" / "3h ago" / "5d ago", then a date past a fortnight. */
export function timeAgo(iso?: string | null): string {
    if (!iso) return "";

    const then = new Date(iso).getTime();
    if (isNaN(then)) return "";

    const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 1209600) return `${Math.floor(seconds / 86400)}d ago`;

    return new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
    });
}

/**
 * The full stamp, in the reader's own locale and timezone.
 *
 * Deliberately not ISO: this is shown to a person, and 2026-08-14T09:11:00.000Z
 * asks them to do timezone arithmetic to answer "was that before lunch?".
 */
export function exactTime(iso?: string | null): string {
    if (!iso) return "Unknown";

    const date = new Date(iso);
    if (isNaN(date.getTime())) return "Unknown";

    return date.toLocaleString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}
