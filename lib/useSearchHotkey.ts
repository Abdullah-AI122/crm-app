"use client";

import { useEffect, type RefObject } from "react";

/**
 * Ctrl/Cmd+K focuses a search box.
 *
 * Extracted so every search on the app answers the same key. A shortcut that
 * works on one page and silently does nothing on the next is worse than no
 * shortcut — people stop reaching for it entirely.
 *
 * The ref may point at nothing (a search box that is only rendered once there
 * is something to search), in which case the key is simply a no-op rather than
 * an error.
 */
export function useSearchHotkey(ref: RefObject<HTMLInputElement | null>) {
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            // Meta as well as Ctrl: the Windows key + K does not reach us, but
            // Cmd+K is what a Mac user will press.
            if (!(event.ctrlKey || event.metaKey)) return;
            if (event.key.toLowerCase() !== "k") return;

            // Chrome binds Ctrl+K to the address bar, so this has to win.
            event.preventDefault();
            ref.current?.focus();
            ref.current?.select();
        };

        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [ref]);
}
