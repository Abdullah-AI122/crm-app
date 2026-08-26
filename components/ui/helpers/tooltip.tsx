"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * A hover/focus hint, wrapped around whatever it describes.
 *
 *   <Tooltip label="Invite member"><button>…</button></Tooltip>
 *
 * WHY NOT `title`. The native attribute is what most of this app uses, and it
 * has three problems worth replacing: the browser decides the delay (roughly a
 * second, and unconfigurable), it is styled by the OS rather than the theme, and
 * it never appears for keyboard users. This shows on FOCUS as well as hover, so
 * tabbing through a toolbar explains it the same way pointing does.
 *
 * PORTALLED and positioned from the trigger's own rect, so it escapes any
 * `overflow-hidden` ancestor — the members button lives inside exactly such a
 * pill, where an absolutely-positioned tip would be clipped in half.
 *
 * The hydration rule holds: the `typeof document` guard is only safe because
 * the render is ALSO gated on `open`, which starts false, so the server and the
 * first client render agree on producing nothing.
 */

type Side = "top" | "bottom" | "left" | "right";

/** Long enough not to flash while a pointer crosses the control. */
const OPEN_DELAY = 350;

/** Distance from the trigger, leaving room for the arrow. */
const OFFSET = 8;

export default function Tooltip({
    label,
    side = "top",
    children,
    disabled
}: {
    /** Empty or missing renders the child untouched — no empty bubble. */
    label?: ReactNode;
    side?: Side;
    children: ReactNode;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [at, setAt] = useState<{ top: number; left: number } | null>(null);

    const holderRef = useRef<HTMLSpanElement>(null);
    const tipRef = useRef<HTMLDivElement>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    /** Timers outlive the component if a pointer leaves during the delay. */
    useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current);
    }, []);

    /**
     * A fixed-position tip detaches from its trigger the moment anything
     * scrolls, so it closes instead of floating somewhere meaningless. Capture
     * phase, because the scroll may happen in a nested container.
     */
    useEffect(() => {
        if (!open) return;

        const close = () => setOpen(false);

        window.addEventListener("scroll", close, true);
        window.addEventListener("resize", close);

        return () => {
            window.removeEventListener("scroll", close, true);
            window.removeEventListener("resize", close);
        };
    }, [open]);

    const place = () => {
        const trigger = holderRef.current?.firstElementChild ?? holderRef.current;
        if (!trigger) return;

        const rect = trigger.getBoundingClientRect();

        // Measured after paint below; this is the pre-measurement guess, which
        // is corrected once the tip has a width.
        setAt({
            top: side === "bottom" ? rect.bottom + OFFSET : rect.top - OFFSET,
            left: rect.left + rect.width / 2
        });
    };

    const show = () => {
        if (disabled || !label) return;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            place();
            setOpen(true);
        }, OPEN_DELAY);
    };

    const hide = () => {
        if (timer.current) clearTimeout(timer.current);
        setOpen(false);
    };

    if (!label || disabled) return <>{children}</>;

    return (
        <>
            <span
                ref={holderRef}
                onMouseEnter={show}
                onMouseLeave={hide}
                onFocusCapture={show}
                onBlurCapture={hide}
                // Escape dismisses it the way it dismisses every other layer.
                onKeyDown={(e) => e.key === "Escape" && hide()}
                className="inline-flex"
            >
                {children}
            </span>

            {open &&
                at &&
                typeof document !== "undefined" &&
                createPortal(
                    <div
                        ref={tipRef}
                        role="tooltip"
                        style={{
                            top: at.top,
                            left: at.left,
                            // Centred on the trigger, and lifted above its own
                            // height when it sits on top. Transform rather than
                            // a measured offset, so it is correct on the first
                            // paint with no second render.
                            transform:
                                side === "bottom"
                                    ? "translate(-50%, 0)"
                                    : "translate(-50%, -100%)"
                        }}
                        className="pointer-events-none fixed z-[60] max-w-[220px] rounded-lg bg-foreground px-2 py-1 text-[11px] font-medium text-card shadow-lg font-dmsans animate-in fade-in zoom-in-95 duration-100"
                    >
                        {label}

                        {/* The arrow: one rotated square, tucked under the body
                            so only its point shows. */}
                        <span
                            className={`absolute left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-foreground ${side === "bottom" ? "-top-1" : "-bottom-1"
                                }`}
                        />
                    </div>,
                    document.body
                )}
        </>
    );
}
