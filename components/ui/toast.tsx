"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

/**
 * App-wide toasts.
 *
 * Fired through a window event rather than a context, matching how the app
 * already signals across the tree (crm:user-updated, crm:activity-reverted), so
 * any module — hook, RTK callback, plain function — can raise one without being
 * wrapped in a provider or threading a prop down.
 *
 *   toast.success(`${name} is now a member`);
 *   toast.error(message);
 */

export const TOAST_EVENT = "crm:toast";

export type ToastKind = "success" | "error" | "info";

export interface ToastMessage {
    id: string;
    kind: ToastKind;
    text: string;
    /** Smaller line under the message — the "where" behind the "what". */
    detail?: string;
}

/** How long a toast stays up. Errors linger: they usually need reading twice. */
const LIFETIME: Record<ToastKind, number> = {
    success: 4000,
    error: 7000,
    info: 5000,
};

const STYLES: Record<
    ToastKind,
    { icon: typeof CheckCircle2; tint: string; ring: string }
> = {
    // The 50 / 600 / 100 triple from LAYOUT.md §4.4 — themed in dark via §10.2.
    success: {
        icon: CheckCircle2,
        tint: "bg-emerald-50 text-emerald-600",
        ring: "border-emerald-100",
    },
    error: {
        icon: AlertTriangle,
        tint: "bg-red-50/80 text-red-600",
        ring: "border-red-100",
    },
    info: {
        icon: Info,
        tint: "bg-blue-50 text-blue-600",
        ring: "border-blue-100",
    },
};

const emit = (kind: ToastKind, text: string, detail?: string) => {
    if (typeof window === "undefined" || !text) return;

    window.dispatchEvent(
        new CustomEvent<ToastMessage>(TOAST_EVENT, {
            detail: {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                kind,
                text,
                detail,
            },
        })
    );
};

export const toast = {
    success: (text: string, detail?: string) => emit("success", text, detail),
    error: (text: string, detail?: string) => emit("error", text, detail),
    info: (text: string, detail?: string) => emit("info", text, detail),
};

/** Mounted once in the root layout. */
export default function Toaster() {
    const [items, setItems] = useState<ToastMessage[]>([]);

    useEffect(() => {
        const onToast = (event: Event) => {
            const message = (event as CustomEvent<ToastMessage>).detail;
            if (!message?.text) return;

            // Three at a time; a burst of role changes should not cover the page.
            setItems((previous) => [...previous, message].slice(-3));

            window.setTimeout(() => {
                setItems((previous) => previous.filter((item) => item.id !== message.id));
            }, LIFETIME[message.kind] ?? LIFETIME.info);
        };

        window.addEventListener(TOAST_EVENT, onToast);
        return () => window.removeEventListener(TOAST_EVENT, onToast);
    }, []);

    /**
     * `typeof document === "undefined"` was a hydration bug: the server rendered
     * nothing while the very first client render produced the portal, so the
     * trees disagreed and React threw the whole tree away.
     *
     * useSyncExternalStore hands React a SERVER snapshot (false) that it also
     * uses for the hydrating render, then the client snapshot (true) once
     * hydration is done — so both passes agree and the portal appears after.
     * The subscribe callback never fires; this value only ever changes once.
     */
    const hydrated = useSyncExternalStore(
        () => () => { },
        () => true,
        () => false
    );

    if (!hydrated) return null;

    const dismiss = (id: string) =>
        setItems((previous) => previous.filter((item) => item.id !== id));

    return createPortal(
        <div
            className="pointer-events-none fixed top-5 left-1/2 z-50 flex w-[380px] max-w-[calc(100vw-2.5rem)] -translate-x-1/2 flex-col items-center gap-2"
            role="status"
            aria-live="polite"
        >
            <AnimatePresence initial={false}>
                {items.map((item) => {
                    const style = STYLES[item.kind] ?? STYLES.info;
                    const Icon = style.icon;

                    return (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: -14, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.97 }}
                            transition={{ type: "spring", stiffness: 450, damping: 35 }}
                            className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border ${style.ring} bg-card px-4 py-3 shadow-2xl font-dmsans`}
                        >
                            <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${style.tint}`}
                            >
                                <Icon className="h-4 w-4" strokeWidth={2.2} />
                            </span>

                            <div className="min-w-0 flex-1 pt-0.5">
                                <p className="text-sm font-medium leading-snug text-slate-900">
                                    {item.text}
                                </p>

                                {item.detail && (
                                    <p className="mt-0.5 truncate text-xs text-muted">
                                        {item.detail}
                                    </p>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => dismiss(item.id)}
                                aria-label="Dismiss"
                                className="rounded-lg p-1 text-slate-400 transition hover:bg-gray-300/50 hover:text-slate-700 cursor-pointer"
                            >
                                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>,
        document.body
    );
}
