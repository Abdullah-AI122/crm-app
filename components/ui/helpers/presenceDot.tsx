"use client";

import { presenceOption } from "@/lib/presence";

interface PresenceDotProps {
    /** Render `presence` for other people, the picked `status` for yourself. */
    status?: string | null;
    size?: number;
    /** Halo that separates the dot from the avatar underneath; 0 removes it. */
    ring?: number;
    /** Token the halo paints with — match the surface the avatar sits on. */
    ringColor?: string;
    className?: string;
}

/**
 * The presence badge. Shapes carry the meaning as well as the colour, the way
 * Teams does it, so the states stay apart for anyone who cannot separate the
 * hues: filled for available/busy, barred for do-not-disturb, hollow for offline.
 */
export default function PresenceDot({
    status,
    size = 10,
    ring = 2,
    ringColor = "var(--card)",
    className = "",
}: PresenceDotProps) {
    const option = presenceOption(status);
    const isOffline = option.value === "offline";

    return (
        <span
            title={option.label}
            aria-label={option.label}
            className={`inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
            style={{
                width: size,
                height: size,
                backgroundColor: isOffline ? ringColor : option.color,
                border: isOffline
                    ? `${Math.max(1.5, size * 0.18)}px solid ${option.color}`
                    : "none",
                boxShadow: ring ? `0 0 0 ${ring}px ${ringColor}` : undefined,
            }}
        >
            {option.value === "dnd" && (
                <span
                    className="block rounded-full bg-white"
                    style={{
                        width: size * 0.5,
                        height: Math.max(1.5, size * 0.16),
                    }}
                />
            )}
        </span>
    );
}
