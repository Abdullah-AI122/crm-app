"use client";

import { useRouter } from "next/navigation";
import { HiOutlineArrowLeft } from "react-icons/hi2";

/**
 * Back to wherever the user came from.
 *
 * Prefers real history, so it returns them to the exact page and scroll
 * position they left rather than to a guessed route. `fallbackHref` covers the
 * case where there is nothing to go back to — a pasted link, a new tab, or a
 * refresh — because router.back() there either does nothing at all or walks the
 * user straight out of the app, and a dead-looking button is the worse of the
 * two failures.
 *
 * `window.history.length` is the signal because Next's App Router exposes no
 * "can I go back" of its own, and document.referrer is useless here: it is not
 * updated by client-side navigation, so every soft route change inside the app
 * leaves it reading whatever loaded the tab. The length check is only wrong for
 * someone who arrived from another site in a fresh tab, which in an
 * authenticated app means they passed through /login first and so have history
 * anyway.
 */
export default function BackButton({
    fallbackHref,
    label = "Back",
    showLabel = false,
}: {
    /** Where to go when there is no history to return to. */
    fallbackHref: string;
    label?: string;
    /** Off by default — most headers only have room for the arrow. */
    showLabel?: boolean;
}) {
    const router = useRouter();

    const goBack = () => {
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
            return;
        }

        router.push(fallbackHref);
    };

    return (
        <button
            type="button"
            onClick={goBack}
            title={label}
            aria-label={label}
            className={`flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg text-muted transition hover:bg-control hover:text-slate-900 ${showLabel ? "px-2.5" : "w-9"}`}
        >
            <HiOutlineArrowLeft className="h-[18px] w-[18px] shrink-0" />

            {showLabel && (
                <span className="font-google-sans text-sm font-medium">{label}</span>
            )}
        </button>
    );
}
